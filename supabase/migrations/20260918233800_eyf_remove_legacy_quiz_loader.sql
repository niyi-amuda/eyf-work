-- The old quiz loader exposes correct_answer and is no longer used by EYF Experience.
revoke all on function public.eyf_get_quiz_questions(integer) from public;
