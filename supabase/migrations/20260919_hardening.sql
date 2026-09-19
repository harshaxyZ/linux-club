-- Follow-up hardening for the initial schema (20260916_init.sql).
-- Safe to re-run: every statement is guarded.

-- ---------------------------------------------------------------------------
-- 1. applications: integrity + query support
-- ---------------------------------------------------------------------------

-- One row per verified email. The API matches and adopts rows by email, and
-- `.maybeSingle()` used to error out when two rows shared an address. Created
-- only when the data is already clean, so the migration never destroys rows:
-- if it is skipped, fix the duplicates it reports and re-run.
DO $$
DECLARE
    dupes INTEGER;
BEGIN
    SELECT COUNT(*) INTO dupes
    FROM (
        SELECT lower(email) AS e
        FROM public.applications
        GROUP BY lower(email)
        HAVING COUNT(*) > 1
    ) d;

    IF dupes > 0 THEN
        RAISE WARNING
            'Skipping unique index on applications(lower(email)): % duplicated address(es). Merge them, then re-run this migration.',
            dupes;
    ELSE
        CREATE UNIQUE INDEX IF NOT EXISTS applications_email_unique_idx
            ON public.applications (lower(email));
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications (status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON public.applications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_email ON public.applications (lower(email));

-- updated_at was declared but never maintained.
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applications_set_updated_at ON public.applications;
CREATE TRIGGER applications_set_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 2. Durable rate limiting
-- ---------------------------------------------------------------------------
-- The app used an in-process Map, which on serverless resets on every cold
-- start and is not shared between instances, so OTP/apply/invite limits were
-- effectively unenforced. Keys arrive pre-hashed (SHA-256) so no email or IP is
-- stored here.

CREATE TABLE IF NOT EXISTS public.rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 0,
    reset_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_at ON public.rate_limits (reset_at);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: only the service role (which bypasses RLS) and the
-- SECURITY DEFINER function below may touch this table. Supabase grants the
-- anon/authenticated roles privileges on new public tables by default, so those
-- are revoked here rather than in a later migration (the table has to exist
-- first).
REVOKE ALL ON public.rate_limits FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.rate_limit_hit(
    p_key TEXT,
    p_limit INTEGER,
    p_window_ms BIGINT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_now TIMESTAMPTZ := now();
    v_window INTERVAL := make_interval(secs => GREATEST(p_window_ms, 1) / 1000.0);
    v_count INTEGER;
BEGIN
    IF p_key IS NULL OR p_key = '' OR p_limit IS NULL OR p_limit <= 0 THEN
        RETURN FALSE;
    END IF;

    INSERT INTO public.rate_limits AS r (key, count, reset_at)
    VALUES (p_key, 1, v_now + v_window)
    ON CONFLICT (key) DO UPDATE
        SET count = CASE WHEN r.reset_at <= v_now THEN 1 ELSE r.count + 1 END,
            reset_at = CASE WHEN r.reset_at <= v_now THEN v_now + v_window ELSE r.reset_at END
    RETURNING r.count INTO v_count;

    -- Opportunistic housekeeping so the table stays small without a cron job.
    IF random() < 0.01 THEN
        DELETE FROM public.rate_limits WHERE reset_at < v_now - INTERVAL '1 day';
    END IF;

    RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, BIGINT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, BIGINT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rate_limit_hit(TEXT, INTEGER, BIGINT) TO service_role;

-- ---------------------------------------------------------------------------
-- 3. Tighten the helper used by RLS policies
-- ---------------------------------------------------------------------------
-- SECURITY DEFINER without a pinned search_path is a privilege-escalation
-- footgun (a caller-controlled search_path can shadow `public.admins`).
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.admins WHERE admins.user_id = is_admin.user_id
    );
END;
$$;
