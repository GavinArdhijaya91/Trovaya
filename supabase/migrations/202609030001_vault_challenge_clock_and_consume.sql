begin;

create or replace function public.close_vault_delivery_challenges(
  p_wallet_address varchar,
  p_token_id numeric,
  p_purpose text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.vault_delivery_challenges
  set consumed_at = now()
  where wallet_address = lower(p_wallet_address)
    and token_id = p_token_id
    and purpose = p_purpose
    and consumed_at is null;
$$;

create or replace function public.consume_vault_delivery_challenge(p_challenge_id uuid)
returns table (id uuid)
language sql
security definer
set search_path = public
as $$
  update public.vault_delivery_challenges
  set consumed_at = now()
  where id = p_challenge_id
    and consumed_at is null
    and expires_at > now()
  returning vault_delivery_challenges.id;
$$;

create or replace function public.record_vault_challenge_failure(p_challenge_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.vault_delivery_challenges
  set failed_attempts = least(failed_attempts + 1, 5)
  where id = p_challenge_id
    and consumed_at is null
    and failed_attempts < 5;
$$;

revoke execute on function public.close_vault_delivery_challenges(varchar, numeric, text) from public, anon, authenticated;
revoke execute on function public.consume_vault_delivery_challenge(uuid) from public, anon, authenticated;
revoke execute on function public.record_vault_challenge_failure(uuid) from public, anon, authenticated;
grant execute on function public.close_vault_delivery_challenges(varchar, numeric, text) to service_role;
grant execute on function public.consume_vault_delivery_challenge(uuid) to service_role;
grant execute on function public.record_vault_challenge_failure(uuid) to service_role;

commit;