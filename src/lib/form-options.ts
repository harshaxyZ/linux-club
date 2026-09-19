/** Options shared by the apply form and the /api/apply validator. */

export const YEARS = ['1st', '2nd', '3rd', '4th'] as const;
export type Year = (typeof YEARS)[number];

export const COURSES = [
  'CSE',
  'AI ML',
  'AI DS',
  'ISE',
  'ECE',
  'EEE',
  'IOT',
  'MECHANICAL',
  'CIVIL',
] as const;

export const EXTRA_LABELS = [
  'LeetCode',
  'HackerRank',
  'Codeforces',
  'TryHackMe',
  'Portfolio',
  'Other',
] as const;

/** First years have no USN yet, so they are asked for their registration number. */
export function studentIdLabel(year: string): string {
  return year === '1st' ? 'Registration Number' : 'USN';
}

export function needsLanguages(year: string): boolean {
  return year === '1st';
}

export const NO_LANGUAGE = 'NA (none yet)';
export const MAX_LANGUAGES = 12;

/**
 * Languages offered to first-year applicants. `NO_LANGUAGE` is exclusive: it
 * cannot be combined with an actual language.
 */
export const PROGRAMMING_LANGUAGES = [
  NO_LANGUAGE,
  'C',
  'C++',
  'C#',
  'Java',
  'Python',
  'JavaScript',
  'TypeScript',
  'Go',
  'Rust',
  'Kotlin',
  'Swift',
  'Dart',
  'Ruby',
  'PHP',
  'R',
  'MATLAB',
  'Julia',
  'Scala',
  'Perl',
  'Haskell',
  'Elixir',
  'Erlang',
  'Clojure',
  'OCaml',
  'F#',
  'Lua',
  'Groovy',
  'Objective-C',
  'Visual Basic',
  'Assembly',
  'Bash / Shell',
  'PowerShell',
  'SQL',
  'HTML / CSS',
  'Solidity',
  'Zig',
  'Nim',
  'Fortran',
  'COBOL',
  'Pascal',
  'Prolog',
  'Scheme',
  'Racket',
  'Verilog',
  'VHDL',
] as const;

export function isKnownLanguage(value: string): boolean {
  return (PROGRAMMING_LANGUAGES as readonly string[]).includes(value);
}
