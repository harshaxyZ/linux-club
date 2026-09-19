-- One application per student identity, not per login.
--
-- The API refuses a submission whose USN or mobile number already belongs to
-- another row, which is what stops a student applying again from a second email.
-- This index is the guarantee behind that check: without it two submissions
-- racing each other could both pass and create duplicates.
--
-- Created only when the data is already clean, so the migration never destroys
-- rows. If it is skipped, merge the duplicates it reports and re-run.

DO $$
DECLARE
    dupes INTEGER;
BEGIN
    SELECT COUNT(*) INTO dupes
    FROM (
        SELECT upper(usn) AS u
        FROM public.applications
        GROUP BY upper(usn)
        HAVING COUNT(*) > 1
    ) d;

    IF dupes > 0 THEN
        RAISE WARNING
            'Skipping unique index on applications(upper(usn)): % duplicated USN(s). Merge them, then re-run this migration.',
            dupes;
    ELSE
        CREATE UNIQUE INDEX IF NOT EXISTS applications_usn_unique_idx
            ON public.applications (upper(usn));
    END IF;
END
$$;

-- Mobile numbers are checked in the API but deliberately not made unique here:
-- a shared family number is plausible enough that a hard database constraint
-- would lock out a genuine applicant with no way for a reviewer to override.
CREATE INDEX IF NOT EXISTS idx_applications_phone ON public.applications (phone);

-- Find duplicates to merge if the index above was skipped:
--   SELECT upper(usn) AS usn, count(*), array_agg(email) AS accounts
--   FROM public.applications GROUP BY upper(usn) HAVING count(*) > 1;
