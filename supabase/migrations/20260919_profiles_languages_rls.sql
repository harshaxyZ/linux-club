-- Feature + RLS migration.
-- 1. GitHub profile is optional, 2. first-year language answers, 3. a stricter
-- row-level security setup. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Schema changes
-- ---------------------------------------------------------------------------

-- GitHub is no longer mandatory (first years often have no account yet).
ALTER TABLE public.applications ALTER COLUMN github_url DROP NOT NULL;

-- Languages known, asked of first-year applicants only. Empty array for others.
ALTER TABLE public.applications
    ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{}'::text[];

-- At most 12 entries, no blanks: mirrors the API and form limits.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'applications_languages_sane'
    ) THEN
        ALTER TABLE public.applications
            ADD CONSTRAINT applications_languages_sane
            CHECK (
                array_length(languages, 1) IS NULL
                OR (array_length(languages, 1) <= 12 AND array_position(languages, '') IS NULL)
            );
    END IF;
END
$$;

-- First years are asked for a registration number instead of a USN; both live in
-- the same TEXT column. A length check is used instead of narrowing the type to
-- VARCHAR(25), which would fail outright on any longer existing value.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'applications_usn_length'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.applications WHERE char_length(usn) NOT BETWEEN 4 AND 25
    ) THEN
        ALTER TABLE public.applications
            ADD CONSTRAINT applications_usn_length
            CHECK (char_length(usn) BETWEEN 4 AND 25);
    END IF;
END
$$;

CREATE INDEX IF NOT EXISTS idx_applications_languages ON public.applications USING GIN (languages);

-- ---------------------------------------------------------------------------
-- 2. Row-level security
-- ---------------------------------------------------------------------------
-- Every API route uses the service role (which bypasses RLS) *after* doing its
-- own authorization check, so these policies protect direct access with the
-- publishable anon key from the browser. Goals:
--   * anonymous visitors get nothing at all;
--   * a signed-in student sees and edits only their own row;
--   * a student cannot approve themselves (status is not writable);
--   * a student cannot hand their row to someone else (user_id is not writable);
--   * admins can read everything.

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

-- Supabase grants the anon/authenticated roles broad table privileges by
-- default. The anon role has no business touching any of these tables.
-- (public.rate_limits is locked down in 20260919_hardening.sql, where it is
-- created, so this migration does not depend on that one having run first.)
REVOKE ALL ON public.applications FROM anon;
REVOKE ALL ON public.admins FROM anon;
REVOKE ALL ON public.admin_invitations FROM anon;

-- Column-level privileges are what actually stop self-approval: RLS decides
-- which rows are visible, not which columns may be written.
REVOKE UPDATE ON public.applications FROM authenticated;
GRANT UPDATE (
    full_name, year, section, usn, course, course_other, email, phone,
    github_url, linkedin_url, languages, extra_links, about_text, updated_at
) ON public.applications TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.applications TO authenticated;

DROP POLICY IF EXISTS "Students can view their own application" ON public.applications;
DROP POLICY IF EXISTS "Students can insert their own application" ON public.applications;
DROP POLICY IF EXISTS "Students can update their own application" ON public.applications;
DROP POLICY IF EXISTS "Students can delete their own application" ON public.applications;
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admins;
DROP POLICY IF EXISTS "Admins can view invitations" ON public.admin_invitations;

CREATE POLICY "applications_select_own_or_admin"
    ON public.applications FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

CREATE POLICY "applications_insert_own"
    ON public.applications FOR INSERT
    TO authenticated
    WITH CHECK (
        auth.uid() = user_id
        AND status = 'pending'
        AND lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    );

-- USING picks the rows that may be updated, WITH CHECK validates the result, so
-- a student cannot move their row to another user_id or a different email.
CREATE POLICY "applications_update_own"
    ON public.applications FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()))
    WITH CHECK (
        public.is_admin(auth.uid())
        OR (
            auth.uid() = user_id
            AND lower(email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
        )
    );

CREATE POLICY "applications_delete_own_or_admin"
    ON public.applications FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id OR public.is_admin(auth.uid()));

-- Admin tables: readable by admins, never writable with a user token (invites
-- and promotions go through the service-role API routes).
GRANT SELECT ON public.admins TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.admins FROM authenticated;
GRANT SELECT ON public.admin_invitations TO authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.admin_invitations FROM authenticated;

CREATE POLICY "admins_select_admin_only"
    ON public.admins FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));

CREATE POLICY "admin_invitations_select_admin_only"
    ON public.admin_invitations FOR SELECT
    TO authenticated
    USING (public.is_admin(auth.uid()));
