-- EYF Experience hardening and production integration.
-- IMPORTANT: This migration intentionally does NOT modify convention_registrations.
-- The existing registration frontend remains untouched.

-- Do not allow the public client to read the quiz table because it contains correct_answer.
-- The application reads quiz questions through eyf_get_quiz_questions_safe(), which omits correct_answer.
drop policy if exists "quiz questions public read" on public.convention_quiz_questions;

-- The game profile is authoritative server-side data. The browser must not read/write it directly.
-- Dashboard and leaderboard access are provided by SECURITY DEFINER RPCs.
drop policy if exists "anon can read game profiles" on public.convention_game_profiles;
drop policy if exists "service can upsert game profiles" on public.convention_game_profiles;

-- Reward eligibility and wins are also exposed through protected RPCs only.
drop policy if exists "anon can read eligibility via rpc" on public.convention_reward_eligibility;
drop policy if exists "anon can read wins via rpc" on public.convention_reward_wins;

-- Ensure the safe quiz loader is executable but does not reveal the answer key.
revoke all on function public.eyf_get_quiz_questions_safe(integer) from public;
grant execute on function public.eyf_get_quiz_questions_safe(integer) to anon, authenticated;

-- The older p_code game recorder cannot securely bind a caller to an EYF session.
-- Keep it available only to the authenticated role for backwards compatibility; the new
-- Experience frontend uses the session-bound eyf_record_tap_star() function instead.
revoke execute on function public.eyf_record_game(text,text) from anon;
grant execute on function public.eyf_record_game(text,text) to authenticated;

-- Make the session-bound Tap Star function callable by Experience users.
revoke all on function public.eyf_record_tap_star(text) from public;
grant execute on function public.eyf_record_tap_star(text) to anon, authenticated;

-- Secure quiz answer submission: the browser supplies only the question ID and selected option.
-- The database reads correct_answer and points from convention_quiz_questions.
revoke all on function public.eyf_submit_quiz_answer(text,uuid,character) from public;
grant execute on function public.eyf_submit_quiz_answer(text,uuid,character) to anon, authenticated;

-- Dashboard/leaderboard RPCs remain the controlled read path.
revoke all on function public.eyf_experience_me(text) from public;
grant execute on function public.eyf_experience_me(text) to anon, authenticated;
revoke all on function public.eyf_experience_leaderboard() from public;
grant execute on function public.eyf_experience_leaderboard() to anon, authenticated;
