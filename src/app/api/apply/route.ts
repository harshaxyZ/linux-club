import { NextRequest, NextResponse } from 'next/server';
import { adminClient, getSessionUser } from '@/lib/auth';
import { env } from '@/lib/env';
import { sendEmail } from '@/lib/email';
import {
  escapeHtml,
  getClientIp,
  isValidEmail,
  isValidPhone,
  isValidUrl,
  normalizeEmail,
  normalizePhone,
} from '@/lib/security';
import { rateLimitAll } from '@/lib/rate-limit';
import { resolveDeviceId } from '@/lib/device';
import { crossOriginDenied, isSameOrigin } from '@/lib/request';
import { findApplicationFor } from '@/lib/applications';
import {
  COURSES,
  EXTRA_LABELS,
  MAX_LANGUAGES,
  NO_LANGUAGE,
  YEARS,
  isKnownLanguage,
  needsLanguages,
  studentIdLabel,
} from '@/lib/form-options';
import {
  githubUrlFromHandle,
  isValidGithubHandle,
  isValidLinkedinHandle,
  linkedinUrlFromHandle,
  normalizeGithubHandle,
  normalizeLinkedinHandle,
} from '@/lib/handles';

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return crossOriginDenied();

    const user = await getSessionUser();
    if (!user) return bad('Sign in required.', 401);

    // Identity is anchored to the address the user proved control of (Google
    // or email OTP), never to the free-text field in the form.
    const authEmail = normalizeEmail(String(user.email ?? ''));
    if (!authEmail || !isValidEmail(authEmail)) {
      return bad('Your sign-in has no verified email address. Sign in with Google or an email code.', 403);
    }

    const ip = getClientIp(req.headers);
    const deviceId = resolveDeviceId(req.headers, req.cookies);
    const allowed = await rateLimitAll([
      { key: `apply:user:${user.id}`, limit: 5, windowMs: 60 * 60 * 1000 },
      { key: `apply:ip:${ip}`, limit: 30, windowMs: 60 * 60 * 1000 },
      deviceId ? { key: `apply:device:${deviceId}`, limit: 10, windowMs: 60 * 60 * 1000 } : null,
    ]);
    if (!allowed) {
      return bad('Too many submissions. Try again later.', 429);
    }

    const data = await req.json().catch(() => ({}));
    const fullName = String(data.fullName ?? '').trim();
    const year = String(data.year ?? '').trim();
    const section = String(data.section ?? '').trim().toUpperCase();
    const usn = String(data.usn ?? '').trim().toUpperCase();
    const courseRaw = String(data.course ?? '').trim();
    const courseOther = String(data.courseOther ?? '').trim();
    const email = normalizeEmail(String(data.email ?? ''));
    const phone = normalizePhone(String(data.phone ?? ''));
    // The form posts bare usernames; a pasted profile URL is tolerated too.
    const githubHandle = normalizeGithubHandle(String(data.githubHandle ?? data.githubUrl ?? ''));
    const linkedinHandle = normalizeLinkedinHandle(String(data.linkedinHandle ?? data.linkedinUrl ?? ''));
    const languagesInput = Array.isArray(data.languages) ? data.languages : [];
    const aboutText = String(data.aboutText ?? '').trim();
    const extraLinks = Array.isArray(data.extraLinks) ? data.extraLinks : [];
    const consent = data.consent === true;

    if (!consent) return bad('Privacy Policy and Terms acceptance required.');

    if (!fullName || fullName.length < 3 || fullName.length > 100) return bad('Full name is required (3-100 chars).');
    if (!(YEARS as readonly string[]).includes(year)) return bad('Valid academic year required.');
    if (!section || section.length > 5) return bad('Section required.');
    const idLabel = studentIdLabel(year);
    if (!usn || usn.length < 4 || usn.length > 25) return bad(`Valid ${idLabel} required.`);
    if (!(COURSES as readonly string[]).includes(courseRaw) && courseRaw !== 'Others') return bad('Valid branch required.');
    const course = courseRaw === 'Others' ? courseOther.slice(0, 80) : courseRaw;
    if (courseRaw === 'Others' && !course) return bad('Specify your branch.');
    if (!isValidEmail(email)) return bad('Valid email required.');
    if (email !== authEmail) {
      return bad(
        `The email on the form must match the address you signed in with (${authEmail}). Change the form email, or sign in again with ${email}.`,
        403
      );
    }
    if (!isValidPhone(phone)) return bad('Valid 10-digit mobile number required.');

    // GitHub is optional now; when given it must look like a real username so the
    // stored profile URL cannot be a broken or injected link.
    if (githubHandle && !isValidGithubHandle(githubHandle)) {
      return bad('GitHub username can only contain letters, digits and single hyphens (max 39 characters).');
    }
    if (linkedinHandle && !isValidLinkedinHandle(linkedinHandle)) {
      return bad('LinkedIn profile name looks invalid. Paste just the part after /in/.');
    }
    const githubUrl = githubHandle ? githubUrlFromHandle(githubHandle) : null;
    const linkedinUrl = linkedinHandle ? linkedinUrlFromHandle(linkedinHandle) : null;

    // Languages are asked of first years only, and the answer is required.
    let languages: string[] = [];
    if (needsLanguages(year)) {
      const cleaned: string[] = (languagesInput as unknown[])
        .map((l) => String(l ?? '').trim())
        .filter((l) => isKnownLanguage(l));
      languages = Array.from(new Set(cleaned)).slice(0, MAX_LANGUAGES);
      if (languages.length === 0) {
        return bad(`Select the languages you know, or "${NO_LANGUAGE}" if you have not started yet.`);
      }
      if (languages.includes(NO_LANGUAGE) && languages.length > 1) {
        languages = [NO_LANGUAGE];
      }
    }

    if (!aboutText || aboutText.length < 20 || aboutText.length > 1000) return bad('Statement of intent must be 20-1000 characters.');
    if (extraLinks.length > 3) return bad('Max 3 extra links.');

    const cleanExtra = extraLinks
      .slice(0, 3)
      .filter((l: unknown) => l && typeof l === 'object')
      .map((l: { label?: unknown; url?: unknown }) => ({
        label: (EXTRA_LABELS as readonly string[]).includes(String(l.label)) ? String(l.label) : 'Other',
        url: String(l.url ?? '').trim().slice(0, 300),
      }))
      .filter((l: { url: string }) => l.url === '' || isValidUrl(l.url));

    const supabase = adminClient();
    const row = {
      user_id: user.id,
      full_name: fullName.slice(0, 100),
      year,
      section: section.slice(0, 5),
      usn: usn.slice(0, 25),
      course,
      course_other: courseOther.slice(0, 80),
      email: authEmail,
      phone,
      github_url: githubUrl,
      linkedin_url: linkedinUrl,
      languages,
      extra_links: cleanExtra,
      about_text: aboutText.slice(0, 1000),
      status: 'pending',
    };

    // One application per person across login methods: Google OAuth and email
    // OTP mint different auth users for the same address, so a row is matched by
    // user_id first and then by the *verified* email, and re-linked to the
    // current user. Matching on the form email (as this route used to) let
    // anyone who typed someone else's address claim their row.
    const existing = await findApplicationFor(supabase, user.id, authEmail, 'id,user_id');
    let dbError = null;
    if (existing) {
      const { error } = await supabase.from('applications').update(row).eq('id', existing.id);
      dbError = error;
    } else {
      const { error } = await supabase.from('applications').insert(row);
      dbError = error;
    }

    if (dbError) {
      console.error('Application DB write failed:', dbError.message);
      return bad('Could not save application.', 500);
    }

    const e = escapeHtml;
    const extraRows = cleanExtra
      .filter((l: { url: string }) => l.url)
      .map((l: { label: string; url: string }) => `<p style="margin:6px 0;"><strong>${e(l.label)}:</strong> ${e(l.url)}</p>`)
      .join('');

    const adminHtml = `
      <div style="font-family: monospace; background:#050505; color:#fff; padding:24px; border-radius:12px;">
        <h2 style="color:#E11D48;">New application: ${e(fullName)} (${e(usn)})</h2>
        <p><strong>Year:</strong> ${e(year)} (Sec ${e(section)}) - <strong>Branch:</strong> ${e(course)}</p>
        <p><strong>${e(idLabel)}:</strong> ${e(usn)}</p>
        <p><strong>Email:</strong> ${e(authEmail)} - <strong>Phone:</strong> ${e(phone)}</p>
        <p><strong>GitHub:</strong> ${githubUrl ? e(githubUrl) : 'not provided'}</p>
        ${linkedinUrl ? `<p><strong>LinkedIn:</strong> ${e(linkedinUrl)}</p>` : ''}
        ${languages.length > 0 ? `<p><strong>Languages:</strong> ${e(languages.join(', '))}</p>` : ''}
        ${extraRows}
        <p><strong>Statement:</strong></p><p style="color:#A3A3A3;">${e(aboutText)}</p>
        <p style="font-size:12px;color:#737373;">Consent: privacy + terms accepted at submission - Review: ${e(env.appUrl)}/admin</p>
      </div>`;

    const applicantHtml = `
      <div style="font-family: monospace; background:#050505; color:#fff; padding:24px; border-radius:12px;">
        <h2 style="color:#E11D48;">Application received</h2>
        <p>Hey ${e(fullName)},</p>
        <p>We received your Linux OpenSource Club application (USN ${e(usn)}). The core team reviews every application after the registration drive and will reach out on your registered email.</p>
        <p style="color:#737373;">Daily sessions: ${e('4:00 PM - 6:00 PM')}, Lab A-306 / A-228. Join Discord for updates.</p>
      </div>`;

    const admins = env.adminEmails;
    try {
      if (admins.length > 0) {
        await sendEmail({ to: admins, subject: `New application: ${fullName} (${usn})`, html: adminHtml });
      }
      await sendEmail({ to: authEmail, subject: 'Application received - Linux OpenSource Club', html: applicantHtml });
    } catch (mailErr) {
      console.error('Application email failed (resend+brevo):', mailErr);
    }

    return NextResponse.json({ success: true }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (err) {
    console.error('Application API error:', err);
    return bad('Internal error.', 500);
  }
}
