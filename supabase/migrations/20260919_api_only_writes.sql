-- Writes go through the API only.
--
-- Inserting an application already requires authentication twice over: the route
-- rejects an unsigned request with 401, and the anon role has no privileges on
-- the table. The remaining gap was a *signed-in* user calling PostgREST directly
-- with the publishable key: `authenticated` held INSERT/UPDATE/DELETE, so RLS and
-- the CHECK constraints were the only validation. Everything the API enforces on
-- top of that (phone shape, GitHub username format, statement length 20-1000,
-- course and year whitelists, extra-link limits, one-application identity
-- merging) would have been skipped.
--
-- No client code writes to these tables: /api/apply and /api/apply/mine use the
-- service role after their own authorization checks. So the write grants can go.
-- SELECT stays, still restricted by RLS to the caller's own row or an admin.

REVOKE INSERT, UPDATE, DELETE ON public.applications FROM authenticated;
GRANT SELECT ON public.applications TO authenticated;

-- The matching policies stay in place deliberately: if a future migration ever
-- re-grants writes, the row-level rules are still there rather than absent.

-- Same posture for the admin tables (already read-only for clients, restated so
-- this file is a complete statement of intent).
REVOKE INSERT, UPDATE, DELETE ON public.admins FROM authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.admin_invitations FROM authenticated;
GRANT SELECT ON public.admins TO authenticated;
GRANT SELECT ON public.admin_invitations TO authenticated;

-- Verify afterwards (expects only SELECT rows for authenticated):
--   SELECT grantee, privilege_type
--   FROM information_schema.role_table_grants
--   WHERE table_schema = 'public'
--     AND table_name IN ('applications','admins','admin_invitations')
--     AND grantee IN ('anon','authenticated')
--   ORDER BY table_name, grantee, privilege_type;
