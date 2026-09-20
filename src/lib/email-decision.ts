import { env } from './env';
import { emailLayout, emailMuted, emailParagraph, emailQuote } from './email-template';
import { escapeHtml } from './security';
import { SITE } from './site';

/** Statuses that notify the applicant. `pending` and `under_review` stay silent. */
export const NOTIFYING_STATUSES = ['accepted', 'rejected'] as const;
export type NotifyingStatus = (typeof NOTIFYING_STATUSES)[number];

export function isNotifyingStatus(status: string): status is NotifyingStatus {
  return (NOTIFYING_STATUSES as readonly string[]).includes(status);
}

export function decisionSubject(status: NotifyingStatus): string {
  return status === 'accepted'
    ? 'You are in - OpenSource Students Club'
    : 'Your OpenSource Students Club application';
}

/** Extra context a reviewer supplies when rejecting. */
export interface DecisionExtras {
  /** Reviewer's reason, shown to the applicant verbatim. */
  reason?: string;
  /** Next screening test date, as `YYYY-MM-DD`. */
  nextTestDate?: string;
}

/**
 * Formats `YYYY-MM-DD` as e.g. "Friday, 16 October 2026".
 * Parsed as UTC so the date never shifts a day by timezone. Returns null when the
 * value is not a real calendar date.
 */
export function formatTestDate(iso: string): string | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(mo) - 1 ||
    date.getUTCDate() !== Number(d)
  ) {
    return null;
  }
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/**
 * Decision email. Acceptance gives the next concrete step; rejection is honest,
 * says why, and points at the next drive so it reads as "not yet" rather than
 * "never".
 */
export function decisionEmailHtml(
  status: NotifyingStatus,
  fullName: string,
  extras: DecisionExtras = {}
): string {
  const e = escapeHtml;
  const name = e(fullName.split(' ')[0] || fullName);

  if (status === 'accepted') {
    return emailLayout({
      title: 'Welcome to the club',
      preheader: 'Your application was accepted. Here is how to get started.',
      bodyHtml: [
        emailParagraph(`Hey ${name},`),
        emailParagraph(
          'Your application was accepted. You are in for the provisional first month, which is assessed on attendance, tasks and Git activity like everyone else.'
        ),
        emailParagraph(
          `Next step: join the Discord and turn up to a session. We run ${e(SITE.hours)} in ${e(SITE.lab)}.`
        ),
        emailMuted(
          'Bring a laptop if you have one. Ubuntu is the working environment, and we will help you set it up natively, dual-boot or through WSL in the first week.'
        ),
      ].join(''),
      cta: { label: 'Join the Discord', url: SITE.discord },
      note: `Your application stays visible at ${env.appUrl}/account.`,
    });
  }

  const reason = (extras.reason ?? '').trim();
  const nextDate = (extras.nextTestDate ?? '').trim();
  const prettyDate = nextDate ? formatTestDate(nextDate) : null;

  const body: string[] = [
    emailParagraph(`Hey ${name},`),
    emailParagraph(
      'Thanks for applying to the OpenSource Students Club. We are not taking your application forward in this drive.'
    ),
  ];

  if (reason) {
    body.push(
      emailParagraph('<strong>Reviewer feedback</strong>'),
      emailQuote(e(reason))
    );
  }

  body.push(
    emailParagraph(
      'Please read that as a starting point, not a verdict. Intake per drive is limited and we weigh current availability and commitment heavily, and both of those change.'
    )
  );

  if (prettyDate) {
    body.push(
      emailParagraph(
        `<strong>The next screening test is on ${e(prettyDate)}.</strong> You are welcome to sit it. ` +
          'Work on the feedback above between now and then and apply again - reapplying after ' +
          'visible improvement is exactly what we want to see.'
      )
    );
  } else {
    body.push(
      emailParagraph(
        'You are welcome to apply again at the next drive. We will announce the date on the Discord.'
      )
    );
  }

  body.push(
    emailMuted(
      'The Discord stays open in the meantime: sessions, problem sets and open-source discussion are public there, so you can keep learning with the club before you reapply.'
    )
  );

  return emailLayout({
    title: 'Not this time - and here is what next',
    preheader: prettyDate
      ? `An update on your OSSC application. Next test: ${prettyDate}.`
      : 'An update on your OSSC application.',
    bodyHtml: body.join(''),
    cta: { label: 'Stay in the Discord', url: SITE.discord },
    note: 'If you think something in your application was misread, reply to this email and ask a reviewer to look again.',
  });
}
