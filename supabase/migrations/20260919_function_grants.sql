-- Audit follow-up: lock down function execution.
--
-- Postgres grants EXECUTE on new functions to PUBLIC, so the anon role could
-- call public.is_admin(uuid) through PostgREST:
--   POST /rest/v1/rpc/is_admin {"user_id":"..."} -> 200 false
-- That is a SECURITY DEFINER function acting as an "is this user an admin?"
-- oracle for anyone holding the (public) anon key. Only `authenticated` needs it,
-- because every RLS policy that calls it is scoped TO authenticated.

REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated, service_role;

-- Same treatment for the updated_at trigger helper: triggers run as the table
-- owner, so no role needs a direct EXECUTE grant.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'set_updated_at'
    ) THEN
        EXECUTE 'REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon, authenticated';
    END IF;
END
$$;

-- rate_limit_hit was already service-role only; re-assert it so this migration is
-- a complete statement of intent.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'rate_limit_hit'
    ) THEN
        EXECUTE 'REVOKE ALL ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, BIGINT) FROM PUBLIC, anon, authenticated';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, BIGINT) TO service_role';
    END IF;
END
$$;
