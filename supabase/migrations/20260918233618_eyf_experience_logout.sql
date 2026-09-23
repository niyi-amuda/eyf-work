-- Participant Experience logout RPC.
create or replace function public.eyf_experience_logout(p_token text)
returns boolean
language plpgsql
security definer
set search_path=''
as $$
begin
 delete from public.convention_experience_sessions
 where token_hash=encode(extensions.digest(p_token::bytea,'sha256'),'hex');
 return true;
end;
$$;
revoke all on function public.eyf_experience_logout(text) from public;
grant execute on function public.eyf_experience_logout(text) to anon,authenticated;
