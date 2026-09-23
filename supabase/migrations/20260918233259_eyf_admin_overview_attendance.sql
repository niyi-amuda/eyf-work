-- Production admin overview extension. Does not modify registration data.
create or replace function public.eyf_admin_overview_v2()
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $function$
declare uid uuid:=auth.uid(); out jsonb;
begin
 if uid is null or not exists(select 1 from public.convention_reward_admins a where a.user_id=uid) then raise exception 'unauthorized'; end if;
 select jsonb_build_object(
  'registered',(select count(*) from public.convention_registrations),
  'paid',(select count(*) from public.convention_reward_eligibility where payment_verified),
  'players',(select count(*) from public.convention_game_profiles where games_played>0),
  'games_played',(select coalesce(sum(games_played),0) from public.convention_game_profiles),
  'total_points',(select coalesce(sum(points),0) from public.convention_game_profiles),
  'rewards_won',(select count(*) from public.convention_reward_wins),
  'rewards_claimed',(select count(*) from public.convention_reward_wins where claim_status='claimed'),
  'pending_rewards',(select count(*) from public.convention_reward_wins where claim_status='pending'),
  'recent_winners',coalesce((select jsonb_agg(x order by x.created_at desc) from (
    select w.id,w.reward_type,w.reward_label,w.created_at,w.claim_status,r.registration_no,r.full_name,r.branch,
      coalesce(e.payment_verified,false) paid
    from public.convention_reward_wins w
    join public.convention_registrations r on r.id=w.registration_id
    left join public.convention_reward_eligibility e on e.registration_id=r.id
    order by w.created_at desc limit 100
  ) x),'[]'::jsonb),
  'players_list',coalesce((select jsonb_agg(x order by x.points desc,x.full_name) from (
    select r.registration_no,r.full_name,r.branch,coalesce(g.points,0) points,coalesce(g.games_played,0) games_played,
      coalesce(e.payment_verified,false) paid
    from public.convention_registrations r
    left join public.convention_game_profiles g on g.registration_id=r.id
    left join public.convention_reward_eligibility e on e.registration_id=r.id
    order by coalesce(g.points,0) desc,r.full_name limit 500
  ) x),'[]'::jsonb),
  'attendance_overview',coalesce((select jsonb_agg(x order by x.day) from (
    select c.check_day as day,count(*)::int as checked_in
    from public.convention_checkins c
    where c.check_day in ('2026-10-08'::date,'2026-10-09'::date,'2026-10-11'::date)
    group by c.check_day
  ) x),'[]'::jsonb),
  'recent_game_events',coalesce((select jsonb_agg(x order by x.created_at desc) from (
    select e.id,e.game,e.points_awarded,e.created_at,r.registration_no,r.full_name,r.branch
    from public.convention_game_events e
    join public.convention_registrations r on r.id=e.registration_id
    order by e.created_at desc limit 50
  ) x),'[]'::jsonb)
 ) into out;
 return out;
end;
$function$;
revoke all on function public.eyf_admin_overview_v2() from public;
grant execute on function public.eyf_admin_overview_v2() to authenticated;
