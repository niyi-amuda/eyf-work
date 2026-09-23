-- Session-aware quiz loader for EYF Experience.
-- It returns only safe question fields and skips questions already answered by the session owner.
-- It does not modify convention registration data.

create or replace function public.eyf_get_quiz_questions_for_session(p_token text, p_limit integer default 10)
returns table(
  id uuid,
  question text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  difficulty text,
  category text,
  points integer,
  reference text
)
language sql
security definer
stable
set search_path = ''
as $$
  select q.id,q.question,q.option_a,q.option_b,q.option_c,q.option_d,
         q.difficulty,q.category,q.points,q.reference
  from public.convention_quiz_questions q
  where q.is_active = true
    and exists (
      select 1
      from public.convention_experience_sessions s
      where s.token_hash = encode(extensions.digest(p_token::bytea,'sha256'),'hex')
        and s.expires_at > now()
    )
    and not exists (
      select 1
      from public.convention_quiz_answers a
      join public.convention_experience_sessions s2
        on s2.registration_id = a.registration_id
      where s2.token_hash = encode(extensions.digest(p_token::bytea,'sha256'),'hex')
        and s2.expires_at > now()
        and a.question_id = q.id
    )
  order by random()
  limit least(greatest(coalesce(p_limit,10),1),50);
$$;

revoke all on function public.eyf_get_quiz_questions_for_session(text,integer) from public;
grant execute on function public.eyf_get_quiz_questions_for_session(text,integer) to anon, authenticated;
