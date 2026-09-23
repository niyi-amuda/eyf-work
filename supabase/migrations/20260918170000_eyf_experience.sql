-- EYF 2026 Experience additions.
-- This migration intentionally does not rename, delete, or alter the registration frontend tables.
-- It adds a short lived experience session layer, game events, and admin audit data.
-- Reward assignment is admin controlled; this build intentionally does not implement random prize drawing.

create table if not exists public.convention_experience_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  registration_id uuid not null references public.convention_registrations(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '8 hours'),
  last_seen_at timestamptz not null default now()
);

create index if not exists convention_experience_sessions_token_hash_idx
  on public.convention_experience_sessions(token_hash);
create index if not exists convention_experience_sessions_registration_id_idx
  on public.convention_experience_sessions(registration_id);
alter table public.convention_experience_sessions enable row level security;

create table if not exists public.convention_game_events (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.convention_registrations(id) on delete cascade,
  game text not null check (game in ('bible_quiz','tap_star')),
  points_awarded integer not null check (points_awarded in (0,10)),
  created_at timestamptz not null default now()
);
create index if not exists convention_game_events_registration_id_idx
  on public.convention_game_events(registration_id);
alter table public.convention_game_events enable row level security;

create table if not exists public.convention_reward_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references auth.users(id),
  action text not null check (action in ('reward_assigned','payment_verified','reward_claimed')),
  registration_id uuid references public.convention_registrations(id),
  reward_win_id uuid references public.convention_reward_wins(id),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists convention_reward_audit_log_created_at_idx
  on public.convention_reward_audit_log(created_at desc);
alter table public.convention_reward_audit_log enable row level security;

alter table public.convention_reward_wins
  add column if not exists claimed_by uuid references auth.users(id);

create or replace function public.eyf_experience_login(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  r public.convention_registrations%rowtype;
  raw_token text;
  token_hash text;
  session_id uuid;
begin
  select * into r
  from public.convention_registrations
  where upper(registration_no) = upper(trim(regexp_replace(p_code, '[[:space:]]+', '-', 'g')))
     or upper(registration_no) = upper(trim(p_code))
  limit 1;

  if r.id is null then
    return jsonb_build_object('ok',false,'message','EYF Code not found. Please check your code and try again.');
  end if;

  raw_token := encode(extensions.gen_random_bytes(32), 'hex');
  token_hash := encode(extensions.digest(raw_token::bytea, 'sha256'), 'hex');

  delete from public.convention_experience_sessions
  where registration_id = r.id or expires_at < now();

  insert into public.convention_experience_sessions(token_hash,registration_id)
  values(token_hash,r.id)
  returning id into session_id;

  return jsonb_build_object('ok',true,'token',raw_token,'session_id',session_id);
end;
$$;

revoke all on function public.eyf_experience_login(text) from public;
grant execute on function public.eyf_experience_login(text) to anon, authenticated;

create or replace function public.eyf_experience_logout(p_token text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.convention_experience_sessions
  where token_hash = encode(extensions.digest(p_token::bytea, 'sha256'), 'hex');
  return true;
end;
$$;
revoke all on function public.eyf_experience_logout(text) from public;
grant execute on function public.eyf_experience_logout(text) to anon, authenticated;

create or replace function public.eyf_experience_me(p_token text)
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
declare
  sid uuid;
  rid uuid;
  r public.convention_registrations%rowtype;
  paid boolean;
  pts integer;
  played integer;
begin
  select s.id,s.registration_id into sid,rid
  from public.convention_experience_sessions s
  where s.token_hash = encode(extensions.digest(p_token::bytea,'sha256'),'hex')
    and s.expires_at > now();

  if sid is null then
    return jsonb_build_object('ok',false,'message','Session expired.');
  end if;

  update public.convention_experience_sessions set last_seen_at=now() where id=sid;

  select * into r from public.convention_registrations where id=rid;
  select coalesce(payment_verified,false) into paid from public.convention_reward_eligibility where registration_id=rid;
  select coalesce(points,0),coalesce(games_played,0) into pts,played from public.convention_game_profiles where registration_id=rid;

  return jsonb_build_object(
    'ok',true,'registration_id',r.id,'registration_no',r.registration_no,
    'full_name',r.full_name,'branch',r.branch,'paid',coalesce(paid,false),
    'points',coalesce(pts,0),'games_played',coalesce(played,0),
    'checkins',coalesce((select jsonb_agg(jsonb_build_object('day',c.check_day,'checked_in_at',c.checked_in_at) order by c.check_day)
      from public.convention_checkins c where c.registration_id=rid and c.check_day in ('2026-10-08','2026-10-09','2026-10-11')), '[]'::jsonb),
    'wins',coalesce((select jsonb_agg(jsonb_build_object(
      'id',w.id,'reward_type',w.reward_type,'reward_label',w.reward_label,'created_at',w.created_at,
      'claim_status',w.claim_status,'can_claim',coalesce(paid,false)
    ) order by w.created_at desc) from public.convention_reward_wins w where w.registration_id=rid), '[]'::jsonb)
  );
end;
$$;
revoke all on function public.eyf_experience_me(text) from public;
grant execute on function public.eyf_experience_me(text) to anon, authenticated;

create or replace function public.eyf_record_game_secure(p_token text,p_game text,p_score integer)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  rid uuid;
  last_play timestamptz;
  new_points integer;
  new_games integer;
  now_ts timestamptz := now();
begin
  select registration_id into rid
  from public.convention_experience_sessions
  where token_hash=encode(extensions.digest(p_token::bytea,'sha256'),'hex')
    and expires_at>now();

  if rid is null then return jsonb_build_object('ok',false,'message','Session expired.'); end if;
  if p_game not in ('bible_quiz','tap_star') then return jsonb_build_object('ok',false,'message','Unknown game.'); end if;
  if p_score not in (0,10) then return jsonb_build_object('ok',false,'message','Invalid score.'); end if;

  select last_played_at into last_play from public.convention_game_profiles where registration_id=rid;
  if last_play is not null and last_play > now_ts - interval '45 seconds'
    then return jsonb_build_object('ok',false,'message','Please wait a little before recording another game.'); end if;

  insert into public.convention_game_profiles(registration_id,points,games_played,last_played_at,updated_at)
  values(rid,p_score,1,now_ts,now_ts)
  on conflict(registration_id) do update set
    points=public.convention_game_profiles.points+excluded.points,
    games_played=public.convention_game_profiles.games_played+1,
    last_played_at=excluded.last_played_at,
    updated_at=excluded.updated_at
  returning points,games_played into new_points,new_games;

  insert into public.convention_game_events(registration_id,game,points_awarded) values(rid,p_game,p_score);

  return jsonb_build_object('ok',true,'added',p_score,'points',new_points,'games_played',new_games);
end;
$$;
revoke all on function public.eyf_record_game_secure(text,text,integer) from public;
grant execute on function public.eyf_record_game_secure(text,text,integer) to anon, authenticated;

create or replace function public.eyf_experience_leaderboard()
returns jsonb
language sql
security definer
stable
set search_path = ''
as $$
  select coalesce(jsonb_agg(row_data order by (row_data->>'points')::int desc, row_data->>'full_name'), '[]'::jsonb)
  from (
    select jsonb_build_object('registration_no',r.registration_no,'full_name',r.full_name,'branch',r.branch,'points',coalesce(g.points,0))
      as row_data
    from public.convention_registrations r
    left join public.convention_game_profiles g on g.registration_id=r.id
    order by coalesce(g.points,0) desc,r.full_name asc
    limit 50
  ) s;
$$;
revoke all on function public.eyf_experience_leaderboard() from public;
grant execute on function public.eyf_experience_leaderboard() to anon, authenticated;

create or replace function public.eyf_record_quiz_answer(p_token text,p_question integer,p_answer text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare rid uuid; correct_answer text; score integer := 0; last_play timestamptz; new_points integer; new_games integer; now_ts timestamptz := now();
begin
  select registration_id into rid from public.convention_experience_sessions
  where token_hash=encode(extensions.digest(p_token::bytea,'sha256'),'hex') and expires_at>now();
  if rid is null then return jsonb_build_object('ok',false,'message','Session expired.'); end if;
  if p_question not between 0 and 3 then return jsonb_build_object('ok',false,'message','Invalid question.'); end if;
  correct_answer := case p_question when 0 then 'David' when 1 then 'Jonah' when 2 then 'Matthew' when 3 then 'Joseph' end;
  if p_answer = correct_answer then score := 10; end if;
  select last_played_at into last_play from public.convention_game_profiles where registration_id=rid;
  if last_play is not null and last_play > now_ts - interval '45 seconds' then
    return jsonb_build_object('ok',false,'message','Please wait a little before recording another game.');
  end if;
  insert into public.convention_game_profiles(registration_id,points,games_played,last_played_at,updated_at)
  values(rid,score,1,now_ts,now_ts)
  on conflict(registration_id) do update set
    points=public.convention_game_profiles.points+excluded.points,
    games_played=public.convention_game_profiles.games_played+1,
    last_played_at=excluded.last_played_at,
    updated_at=excluded.updated_at
  returning points,games_played into new_points,new_games;
  insert into public.convention_game_events(registration_id,game,points_awarded) values(rid,'bible_quiz',score);
  return jsonb_build_object('ok',true,'added',score,'points',new_points,'games_played',new_games,'correct',score=10);
end;
$$;
revoke all on function public.eyf_record_quiz_answer(text,integer,text) from public;
grant execute on function public.eyf_record_quiz_answer(text,integer,text) to anon, authenticated;

create or replace function public.eyf_admin_assign_reward_v2(p_code text,p_reward_type text,p_reward_label text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare rid uuid; win_id uuid; admin_id uuid := (select auth.uid());
begin
  if not private.eyf_is_admin() then raise exception 'Not authorized'; end if;
  if p_reward_type not in ('free_recharge','free_data','extra_food','cash_prize','secret_gift') then raise exception 'Invalid reward type'; end if;
  select id into rid from public.convention_registrations where upper(registration_no)=upper(trim(p_code)) limit 1;
  if rid is null then return jsonb_build_object('ok',false,'message','EYF Code not found.'); end if;

  insert into public.convention_reward_wins(registration_id,reward_type,reward_label)
  values(rid,p_reward_type,p_reward_label) returning id into win_id;

  insert into public.convention_reward_audit_log(admin_user_id,action,registration_id,reward_win_id,details)
  values(admin_id,'reward_assigned',rid,win_id,jsonb_build_object('reward_type',p_reward_type,'reward_label',p_reward_label));

  return jsonb_build_object('ok',true,'win_id',win_id);
end;
$$;
revoke all on function public.eyf_admin_assign_reward_v2(text,text,text) from public;
grant execute on function public.eyf_admin_assign_reward_v2(text,text,text) to authenticated;

create or replace function public.eyf_admin_set_paid_v2(p_code text,p_paid boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare rid uuid; admin_id uuid := (select auth.uid());
begin
  if not private.eyf_is_admin() then raise exception 'Not authorized'; end if;
  select id into rid from public.convention_registrations where upper(registration_no)=upper(trim(p_code)) limit 1;
  if rid is null then return jsonb_build_object('ok',false,'message','EYF Code not found.'); end if;
  insert into public.convention_reward_eligibility(registration_id,payment_verified,updated_at)
  values(rid,p_paid,now())
  on conflict(registration_id) do update set payment_verified=excluded.payment_verified,updated_at=now();
  insert into public.convention_reward_audit_log(admin_user_id,action,registration_id,details)
  values(admin_id,'payment_verified',rid,jsonb_build_object('payment_verified',p_paid));
  return jsonb_build_object('ok',true,'paid',p_paid);
end;
$$;
revoke all on function public.eyf_admin_set_paid_v2(text,boolean) from public;
grant execute on function public.eyf_admin_set_paid_v2(text,boolean) to authenticated;

create or replace function public.eyf_admin_claim_win_v2(p_win_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare win public.convention_reward_wins%rowtype; paid boolean; admin_id uuid := (select auth.uid());
begin
  if not private.eyf_is_admin() then raise exception 'Not authorized'; end if;
  select * into win from public.convention_reward_wins where id=p_win_id for update;
  if win.id is null then return jsonb_build_object('ok',false,'message','Reward not found.'); end if;
  select coalesce(payment_verified,false) into paid from public.convention_reward_eligibility where registration_id=win.registration_id;
  if not paid then return jsonb_build_object('ok',false,'message','This winner has not been marked as paid.'); end if;
  update public.convention_reward_wins set claim_status='claimed',claimed_at=now(),claimed_by=admin_id where id=p_win_id;
  insert into public.convention_reward_audit_log(admin_user_id,action,registration_id,reward_win_id)
  values(admin_id,'reward_claimed',win.registration_id,win.id);
  return jsonb_build_object('ok',true,'message','Reward marked as claimed.');
end;
$$;
revoke all on function public.eyf_admin_claim_win_v2(uuid) from public;
grant execute on function public.eyf_admin_claim_win_v2(uuid) to authenticated;

create or replace function public.eyf_admin_overview_v2()
returns jsonb
language plpgsql
security definer
stable
set search_path = ''
as $$
begin
 if not private.eyf_is_admin() then raise exception 'Not authorized'; end if;
 return jsonb_build_object(
  'registered',(select count(*) from public.convention_registrations),
  'paid',(select count(*) from public.convention_reward_eligibility where payment_verified),
  'players',(select count(*) from public.convention_game_profiles where games_played>0),
  'games_played',(select coalesce(sum(games_played),0) from public.convention_game_profiles),
  'rewards_won',(select count(*) from public.convention_reward_wins),
  'rewards_claimed',(select count(*) from public.convention_reward_wins where claim_status='claimed'),
  'pending_rewards',(select count(*) from public.convention_reward_wins where claim_status='pending'),
  'recent_winners',coalesce((select jsonb_agg(jsonb_build_object(
    'id',w.id,'registration_no',r.registration_no,'full_name',r.full_name,'branch',r.branch,
    'reward_type',w.reward_type,'reward_label',w.reward_label,'created_at',w.created_at,
    'claim_status',w.claim_status,'paid',coalesce(e.payment_verified,false)
  ) order by w.created_at desc) from public.convention_reward_wins w
  join public.convention_registrations r on r.id=w.registration_id
  left join public.convention_reward_eligibility e on e.registration_id=w.registration_id limit 100),'[]'::jsonb),
  'players_list',coalesce((select jsonb_agg(jsonb_build_object(
    'registration_no',r.registration_no,'full_name',r.full_name,'branch',r.branch,
    'points',coalesce(g.points,0),'games_played',coalesce(g.games_played,0),'paid',coalesce(e.payment_verified,false)
  ) order by coalesce(g.points,0) desc,r.full_name) from public.convention_registrations r
  left join public.convention_game_profiles g on g.registration_id=r.id
  left join public.convention_reward_eligibility e on e.registration_id=r.id),'[]'::jsonb)
 );
end;
$$;
revoke all on function public.eyf_admin_overview_v2() from public;
grant execute on function public.eyf_admin_overview_v2() to authenticated;

-- Secure random reward draw. The winner is selected inside PostgreSQL, never by the browser.
create or replace function public.eyf_admin_spin_v2(p_reward_type text,p_reward_label text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  winner public.convention_registrations%rowtype;
  win_id uuid;
  admin_id uuid := (select auth.uid());
begin
  if not private.eyf_is_admin() then raise exception 'Not authorized'; end if;
  if p_reward_type not in ('free_recharge','free_data','extra_food','cash_prize','secret_gift') then
    return jsonb_build_object('ok',false,'message','Invalid reward category.');
  end if;
  if length(trim(coalesce(p_reward_label,''))) = 0 or length(trim(p_reward_label)) > 200 then
    return jsonb_build_object('ok',false,'message','Enter a valid reward description.');
  end if;

  -- PostgreSQL performs the random selection. This is independent of game points and past wins.
  select r.* into winner
  from public.convention_registrations r
  order by random()
  limit 1;

  if winner.id is null then
    return jsonb_build_object('ok',false,'message','No registered participants to draw from.');
  end if;

  insert into public.convention_reward_wins(registration_id,reward_type,reward_label)
  values(winner.id,p_reward_type,trim(p_reward_label))
  returning id into win_id;

  insert into public.convention_reward_audit_log(admin_user_id,action,registration_id,reward_win_id,details)
  values(admin_id,'reward_spin',winner.id,win_id,jsonb_build_object('reward_type',p_reward_type,'reward_label',trim(p_reward_label)));

  return jsonb_build_object(
    'ok',true,
    'win_id',win_id,
    'registration_no',winner.registration_no,
    'full_name',winner.full_name,
    'branch',winner.branch,
    'reward_type',p_reward_type,
    'reward_label',trim(p_reward_label),
    'paid',coalesce((select payment_verified from public.convention_reward_eligibility where registration_id=winner.id),false)
  );
end;
$$;
revoke all on function public.eyf_admin_spin_v2(text,text) from public;
grant execute on function public.eyf_admin_spin_v2(text,text) to authenticated;

-- Secure random reward draw. The winner is selected inside PostgreSQL, never by the browser.
create or replace function public.eyf_admin_spin_v2(p_reward_type text,p_reward_label text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare winner public.convention_registrations%rowtype; win_id uuid; admin_id uuid := (select auth.uid());
begin
  if not private.eyf_is_admin() then raise exception 'Not authorized'; end if;
  if p_reward_type not in ('free_recharge','free_data','extra_food','cash_prize','secret_gift') then return jsonb_build_object('ok',false,'message','Invalid reward category.'); end if;
  if length(trim(coalesce(p_reward_label,'')))=0 or length(trim(p_reward_label))>200 then return jsonb_build_object('ok',false,'message','Enter a valid reward description.'); end if;
  select r.* into winner from public.convention_registrations r order by random() limit 1;
  if winner.id is null then return jsonb_build_object('ok',false,'message','No registered participants to draw from.'); end if;
  insert into public.convention_reward_wins(registration_id,reward_type,reward_label) values(winner.id,p_reward_type,trim(p_reward_label)) returning id into win_id;
  insert into public.convention_reward_audit_log(admin_user_id,action,registration_id,reward_win_id,details) values(admin_id,'reward_spin',winner.id,win_id,jsonb_build_object('reward_type',p_reward_type,'reward_label',trim(p_reward_label)));
  return jsonb_build_object('ok',true,'win_id',win_id,'registration_no',winner.registration_no,'full_name',winner.full_name,'branch',winner.branch,'reward_type',p_reward_type,'reward_label',trim(p_reward_label),'paid',coalesce((select payment_verified from public.convention_reward_eligibility where registration_id=winner.id),false));
end;
$$;
revoke all on function public.eyf_admin_spin_v2(text,text) from public;
grant execute on function public.eyf_admin_spin_v2(text,text) to authenticated;


-- Production reward draw: server side random winner selection.
-- The visual wheel in the frontend must call this function; it must never
-- choose the winner itself.
create or replace function public.eyf_admin_spin_v2(
  p_reward_type text,
  p_reward_label text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin uuid := auth.uid();
  v_registration public.convention_registrations%rowtype;
  v_win public.convention_reward_wins%rowtype;
begin
  if v_admin is null or not exists (
    select 1 from public.convention_reward_admins a
    where a.user_id = v_admin
  ) then
    raise exception 'unauthorized';
  end if;

  if coalesce(trim(p_reward_type), '') = ''
     or coalesce(trim(p_reward_label), '') = '' then
    raise exception 'reward details required';
  end if;

  select r.*
  into v_registration
  from public.convention_registrations r
  order by random()
  limit 1
  for update;

  if v_registration.id is null then
    raise exception 'no registered participants';
  end if;

  insert into public.convention_reward_wins
    (registration_id, reward_type, reward_label)
  values
    (v_registration.id, trim(p_reward_type), trim(p_reward_label))
  returning * into v_win;

  insert into public.convention_reward_audit_log
    (admin_user_id, action, reward_win_id, registration_id,
     reward_type, reward_label)
  values
    (v_admin, 'reward assigned', v_win.id, v_registration.id,
     v_win.reward_type, v_win.reward_label);

  return jsonb_build_object(
    'win_id', v_win.id,
    'registration_id', v_registration.id,
    'registration_no', v_registration.registration_no,
    'full_name', v_registration.full_name,
    'branch', v_registration.branch,
    'reward_type', v_win.reward_type,
    'reward_label', v_win.reward_label,
    'created_at', v_win.created_at
  );
end;
$$;

revoke all on function public.eyf_admin_spin_v2(text,text) from public;
grant execute on function public.eyf_admin_spin_v2(text,text) to authenticated;
