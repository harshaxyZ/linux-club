import { env } from './env';
import { SITE } from './site';

/**
 * Shared layout for every transactional email.
 *
 * Constraints that shape the markup: Gmail strips <svg>, so the logo mark is
 * rebuilt from the icon's three rectangles as table cells with background
 * colours. Outlook ignores most CSS shorthand and flexbox, so everything is
 * nested tables with explicit widths, and every colour is stated inline because
 * clients drop <style> blocks.
 */

const INK = '#F1F5F9';
const MUTED = '#8B98A9';
// Emails cannot read CSS variables and cannot switch theme, so the Linux/Ubuntu
// purple is fixed here: it sits on the dark card (7.89:1) and takes Ubuntu's
// dark aubergine on filled buttons (7.62:1).
const ACCENT = '#B794F6';
const ON_ACCENT = '#2C001E';
const PAGE_BG = '#050505';
const CARD_BG = '#0B0E14';
const BORDER = '#1F2733';

/** The icon.svg mark (white bar, red square, grey square) as nested tables. */
function logoMark(): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
    <tr>
      <td style="padding:0 8px 0 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr><td width="14" height="36" style="width:14px;height:36px;background-color:${INK};line-height:36px;font-size:0;">&nbsp;</td></tr>
        </table>
      </td>
      <td>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
          <tr><td width="14" height="15" style="width:14px;height:15px;background-color:${ACCENT};line-height:15px;font-size:0;">&nbsp;</td></tr>
          <tr><td height="6" style="height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
          <tr><td width="14" height="15" style="width:14px;height:15px;background-color:#737373;line-height:15px;font-size:0;">&nbsp;</td></tr>
        </table>
      </td>
    </tr>
  </table>`;
}

export interface EmailLayoutArgs {
  /** Big heading inside the card. */
  title: string;
  /** Inbox preview line. Kept out of the visible body. */
  preheader: string;
  /** Main content: paragraphs, detail rows, code blocks. */
  bodyHtml: string;
  cta?: { label: string; url: string };
  /** Small print under the body, above the footer. */
  note?: string;
}

export function emailLayout({ title, preheader, bodyHtml, cta, note }: EmailLayoutArgs): string {
  const ctaBlock = cta
    ? `
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:24px 0 8px;">
        <tr>
          <td align="center" bgcolor="${ACCENT}" style="border-radius:10px;">
            <a href="${cta.url}" style="display:inline-block;padding:13px 26px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:12px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:${ON_ACCENT};text-decoration:none;">${cta.label}</a>
          </td>
        </tr>
      </table>`
    : '';

  const noteBlock = note
    ? `<p style="margin:20px 0 0;font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:11px;line-height:1.7;color:${MUTED};">${note}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en" style="margin:0;padding:0;">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="dark light" />
<meta name="supported-color-schemes" content="dark light" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};">
<div style="display:none;font-size:1px;color:${PAGE_BG};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;background-color:${PAGE_BG};">
  <tr>
    <td align="center" style="padding:28px 12px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;width:100%;max-width:560px;">

        <!-- Brand -->
        <tr>
          <td style="padding:0 4px 18px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
              <tr>
                <td valign="middle" style="padding-right:12px;">${logoMark()}</td>
                <td valign="middle">
                  <div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:17px;font-weight:800;letter-spacing:-0.01em;color:${INK};">
                    <span style="color:${ACCENT};">OSS</span>C<span style="color:${MUTED};font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:12px;">&nbsp;DBIT</span>
                  </div>
                  <div style="font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:9px;letter-spacing:0.14em;text-transform:uppercase;color:${MUTED};padding-top:3px;">
                    ${SITE.tagline}
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background-color:${CARD_BG};border:1px solid ${BORDER};border-radius:14px;padding:28px 26px;">
            <h1 style="margin:0 0 14px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:21px;line-height:1.3;font-weight:800;color:${INK};">${title}</h1>
            ${bodyHtml}
            ${ctaBlock}
            ${noteBlock}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:18px 6px 0;">
            <p style="margin:0 0 6px;font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:11px;line-height:1.7;color:${MUTED};">
              ${SITE.name}, ${SITE.college}<br />
              Sessions ${SITE.hours} &middot; ${SITE.lab}
            </p>
            <p style="margin:0;font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:11px;color:${MUTED};">
              <a href="${SITE.discord}" style="color:${ACCENT};text-decoration:none;">Discord</a>
              &nbsp;&middot;&nbsp;
              <a href="${SITE.whatsapp}" style="color:${ACCENT};text-decoration:none;">WhatsApp</a>
              &nbsp;&middot;&nbsp;
              <a href="${SITE.linkedin}" style="color:${ACCENT};text-decoration:none;">LinkedIn</a>
              &nbsp;&middot;&nbsp;
              <a href="${SITE.github}" style="color:${ACCENT};text-decoration:none;">GitHub</a>
              &nbsp;&middot;&nbsp;
              <a href="${env.appUrl}" style="color:${ACCENT};text-decoration:none;">${env.appUrl.replace(/^https?:\/\//, '')}</a>
            </p>
            <p style="margin:10px 0 0;font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:10px;color:#5B6675;">
              You received this because you used the club portal. This is a transactional message, not marketing.
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Body paragraph in the shared style. */
export function emailParagraph(html: string): string {
  return `<p style="margin:0 0 12px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.65;color:${INK};">${html}</p>`;
}

/** Muted secondary paragraph. */
export function emailMuted(html: string): string {
  return `<p style="margin:0 0 12px;font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:12px;line-height:1.7;color:${MUTED};">${html}</p>`;
}

/** Label/value rows, used for application summaries. */
export function emailDetailTable(rows: Array<[string, string]>): string {
  const body = rows
    .map(
      ([label, value]) => `
      <tr>
        <td valign="top" style="padding:7px 12px 7px 0;font-family:'SFMono-Regular',Consolas,Menlo,monospace;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${MUTED};white-space:nowrap;">${label}</td>
        <td valign="top" style="padding:7px 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:${INK};">${value}</td>
      </tr>`
    )
    .join('');
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:4px 0 8px;border-top:1px solid ${BORDER};">
    ${body}
  </table>`;
}

/** Monospaced one-time passcode block. */
export function emailCodeBlock(code: string): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;margin:8px 0 4px;">
    <tr>
      <td align="center" style="background-color:#05070B;border:1px solid ${BORDER};border-radius:12px;padding:18px 12px;">
        <div style="font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;font-size:30px;font-weight:bold;letter-spacing:0.28em;color:${INK};">${code}</div>
      </td>
    </tr>
  </table>`;
}

/** Quoted free-text block, e.g. an applicant's statement. */
export function emailQuote(text: string): string {
  return `<div style="margin:4px 0 12px;padding:14px;background-color:#05070B;border:1px solid ${BORDER};border-radius:12px;font-family:'Segoe UI',Helvetica,Arial,sans-serif;font-size:13px;line-height:1.65;color:${MUTED};">${text}</div>`;
}
