/**
 * VTU USN validation.
 *
 * Structure (10 characters): region digit + 2-letter college code + 2-digit
 * admission year + 2-letter branch code + 3-digit serial, e.g. 1DB23CS001.
 * VTU regions are 1 Bangalore, 2 Belagavi, 3 Kalaburagi, 4 Mysuru; DBIT is 1DB.
 *
 * First years are not checked against this: VTU allots the USN after admission
 * formalities, so they give the college registration number instead.
 */

export const USN_LENGTH = 10;
export const USN_COLLEGE_CODE = '1DB';
export const USN_PATTERN = /^[1-4][A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;

/**
 * Branch codes accepted per form branch. Single-code branches are exact. The
 * newer CS specialisations are listed with their known variants because VTU
 * colleges do not use one consistent code for them (AI, CG for CSE-AI&ML;
 * AD, AT, DS for AI & Data Science; CI, CY, IC for IoT and Cyber Security),
 * so a narrow guess would reject genuine students.
 */
export const BRANCH_USN_CODES: Record<string, string[]> = {
  CSE: ['CS'],
  ISE: ['IS'],
  ECE: ['EC'],
  EEE: ['EE'],
  MECHANICAL: ['ME'],
  CIVIL: ['CV'],
  'AI ML': ['AI', 'CG', 'CS'],
  'AI DS': ['AD', 'AT', 'DS', 'CS'],
  IOT: ['CI', 'CY', 'IC', 'CS'],
};

/** Uppercases and drops anything that cannot appear in a USN. */
export function normalizeUsn(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/**
 * The admission year that a given academic year implies, as a 2-digit number.
 * The academic year is taken to start in July, so in September 2026 a 4th year
 * was admitted in 2023 (`23`), a 3rd year in 2024, a 2nd year in 2025.
 */
export function expectedAdmissionYear(academicYear: string, now = new Date()): number | null {
  const index = ['1st', '2nd', '3rd', '4th'].indexOf(academicYear);
  if (index === -1) return null;
  const academicStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return (academicStart - index) % 100;
}

/**
 * Admission years accepted for an academic year.
 *
 * Includes one year older than expected, for students repeating a year, and for
 * 2nd year also one year newer, because diploma lateral-entry students join in
 * the second year and carry that year's admission code.
 */
export function allowedAdmissionYears(academicYear: string, now = new Date()): number[] {
  const expected = expectedAdmissionYear(academicYear, now);
  if (expected === null) return [];
  const years = [expected, (expected + 99) % 100];
  if (academicYear === '2nd') years.push((expected + 1) % 100);
  return [...new Set(years)];
}

const pad2 = (n: number) => String(n).padStart(2, '0');

/** Characters the student types after the locked prefix: branch code + serial. */
export const USN_SUFFIX_LENGTH = 5;

/**
 * The fixed leading part of a USN for an academic year, e.g. `1DB23` for a 4th
 * year in 2026-27. Empty for first years (no USN yet) or an unknown year.
 *
 * Shown as a locked prefix in the form so a student cannot mistype the college
 * code or the admission year, which are both implied by the year they selected.
 */
export function usnPrefix(academicYear: string, now = new Date()): string {
  if (academicYear === '1st') return '';
  const year = expectedAdmissionYear(academicYear, now);
  if (year === null) return '';
  return `${USN_COLLEGE_CODE}${pad2(year)}`;
}

/** Example USN for the selected year and branch, used in hints and errors. */
export function usnExample(academicYear: string, course: string, now = new Date()): string {
  const year = expectedAdmissionYear(academicYear, now);
  const code = BRANCH_USN_CODES[course]?.[0] ?? 'CS';
  return `${USN_COLLEGE_CODE}${year === null ? 'YY' : pad2(year)}${code}001`;
}

export type UsnCheck = { ok: true; usn: string } | { ok: false; error: string };

/**
 * Validates a USN against the structure, the college code, the admission year
 * implied by the academic year, and the selected branch.
 */
export function validateUsn(
  rawUsn: string,
  academicYear: string,
  course: string,
  now = new Date()
): UsnCheck {
  const usn = normalizeUsn(rawUsn);

  if (usn.length !== USN_LENGTH) {
    return {
      ok: false,
      error: `USN must be exactly ${USN_LENGTH} characters, like ${usnExample(academicYear, course, now)}. You entered ${usn.length}.`,
    };
  }
  if (!USN_PATTERN.test(usn)) {
    return {
      ok: false,
      error: `USN format looks wrong. Expected college code, 2-digit admission year, 2-letter branch code and 3 digits, like ${usnExample(academicYear, course, now)}.`,
    };
  }
  if (!usn.startsWith(USN_COLLEGE_CODE)) {
    return {
      ok: false,
      error: `USN should start with ${USN_COLLEGE_CODE} for this college. Yours starts with ${usn.slice(0, 3)}.`,
    };
  }

  const admissionYear = Number.parseInt(usn.slice(3, 5), 10);
  const allowed = allowedAdmissionYears(academicYear, now);
  if (allowed.length > 0 && !allowed.includes(admissionYear)) {
    const expected = expectedAdmissionYear(academicYear, now);
    return {
      ok: false,
      error: `A ${academicYear} year USN normally starts ${USN_COLLEGE_CODE}${pad2(expected ?? 0)}. Yours says ${usn.slice(0, 5)}. Check the academic year you selected.`,
    };
  }

  const branchCode = usn.slice(5, 7);
  const expectedCodes = BRANCH_USN_CODES[course];
  if (expectedCodes && !expectedCodes.includes(branchCode)) {
    return {
      ok: false,
      error: `USN branch code ${branchCode} does not match ${course} (expected ${expectedCodes.join(' or ')}). Check the branch you selected.`,
    };
  }

  return { ok: true, usn };
}

/**
 * First-year registration number: college-issued, no published format, so this
 * only guards length and character set.
 */
export function validateRegistrationNumber(raw: string): UsnCheck {
  const value = normalizeUsn(raw);
  if (value.length < 4 || value.length > 20) {
    return { ok: false, error: 'Registration number must be 4 to 20 letters or digits.' };
  }
  return { ok: true, usn: value };
}
