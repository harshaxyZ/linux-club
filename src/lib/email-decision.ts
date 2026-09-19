import { env } from './env';
import { emailLayout, emailMuted, emailParagraph } from './email-template';
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

/**
 * Decision email. Acceptance gives the next concrete step; rejection is short,
 * specific about what happens next, and does not pretend to be good news.
 */
export function decisionEmailHtml(status: NotifyingStatus, fullName: string): string {
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

  return emailLayout({
    title: 'Application not taken forward',
    preheader: 'An update on your OSSC application.',
    bodyHtml: [
      emailParagraph(`Hey ${name},`),
      emailParagraph(
        'Thanks for applying to the OpenSource Students Club. We are not taking your application forward in this drive.'
      ),
      emailParagraph(
        'This is not a judgement of your ability. Intake per drive is limited and we weigh current availability and commitment heavily, both of which change.'
      ),
      emailMuted(
        'You are welcome to apply again at the next drive, and the Discord stays open in the meantime: sessions, problem sets and open-source discussion are public there.'
      ),
    ].join(''),
    cta: { label: 'Stay in the Discord', url: SITE.discord },
    note: 'If you think something in your application was misread, reply to this email and ask a reviewer to look again.',
  });
}
