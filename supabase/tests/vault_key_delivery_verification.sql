-- Run read-only in the Supabase SQL Editor after 202608230002_vault_key_delivery.sql.
select tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in ('vault_key_records', 'vault_delivery_challenges', 'vault_delivery_audit')
order by tablename;

select grantee, table_name, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('vault_key_records', 'vault_delivery_challenges', 'vault_delivery_audit')
  and grantee in ('PUBLIC', 'anon', 'authenticated')
order by table_name, grantee, privilege_type;

select trigger_name, event_manipulation, event_object_table, action_timing
from information_schema.triggers
where trigger_schema = 'public'
  and trigger_name = 'vault_key_registration_audit';

select routine_name, security_type
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'audit_vault_key_registration';

-- Expected: three rows with rowsecurity=true; zero client grants; one AFTER INSERT
-- trigger; and one SECURITY DEFINER function. Inspect with a non-owner anon client
-- as well: every direct select/insert/update/delete must be denied.
