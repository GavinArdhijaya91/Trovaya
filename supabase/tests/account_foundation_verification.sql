-- Run in the Supabase SQL Editor after applying account migrations.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('account_profiles', 'creator_profiles', 'linked_wallets', 'wallet_link_challenges', 'account_audit_events')
order by tablename;

select schemaname, tablename, policyname, roles, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('account_profiles', 'creator_profiles', 'linked_wallets')
order by tablename, policyname;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('account_profiles', 'creator_profiles', 'linked_wallets', 'wallet_link_challenges', 'account_audit_events')
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

select grantee, table_name, column_name, privilege_type
from information_schema.column_privileges
where table_schema = 'public'
  and table_name in ('account_profiles', 'creator_profiles')
  and grantee = 'authenticated'
order by table_name, column_name;
