-- Club-wide settings, currently the application window.
--
-- Single row, enforced by a primary key that can only ever be true. Reads and
-- writes go through the API with the service role, so no client role gets any
-- privilege here: /api/settings exposes the two public fields, and
-- /api/admin/settings writes them after an admin check.

CREATE TABLE IF NOT EXISTS public.app_settings (
    id BOOLEAN PRIMARY KEY DEFAULT TRUE CHECK (id),
    applications_open BOOLEAN NOT NULL DEFAULT TRUE,
    -- Shown on /apply when the window is closed. Null uses the app's default text.
    closed_message TEXT,
    -- Optional deadline: once past, the window counts as closed even if the
    -- toggle above is still on, so a drive can end without anyone being awake.
    closes_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_by TEXT
);

INSERT INTO public.app_settings (id, applications_open)
VALUES (TRUE, TRUE)
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- No policies and no grants: service role only, same posture as rate_limits.
REVOKE ALL ON public.app_settings FROM anon, authenticated;

-- Keeps updated_at honest. Guarded because public.set_updated_at is created in
-- 20260919_hardening.sql, and migrations have been run out of order here before.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'set_updated_at'
    ) THEN
        DROP TRIGGER IF EXISTS app_settings_set_updated_at ON public.app_settings;
        CREATE TRIGGER app_settings_set_updated_at
            BEFORE UPDATE ON public.app_settings
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    ELSE
        RAISE WARNING 'public.set_updated_at() is missing: run 20260919_hardening.sql, then re-run this file to add the updated_at trigger.';
    END IF;
END
$$;
