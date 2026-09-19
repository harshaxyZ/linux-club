import { NextRequest, NextResponse } from 'next/server';
import { adminClient, getSessionUser } from '@/lib/auth';
import { env } from '@/lib/env';
import { sendEmail } from '@/lib/email';
import { escapeHtml, getClientIp, isValidEmail, isValidPhone, isValidUrl, normalizeEmail, normalizePhone, rateLimit } from '@/lib/security';
import { resolveDeviceId } from '@/lib/device';
import { crossOriginDenied, isSameOrigin } from '@/lib/request';

const YEARS = ['1st', '2nd', '3rd', '4th'];
const COURSES = ['CSE', 'AI ML', 'AI DS', 'ISE', 'ECE', 'EEE', 'IOT', 'MECHANICAL', 'CIVIL'];
const EXTRA_LABELS = ['LeetCode', 'HackerRank', 'Codeforces', 'TryHackMe', 'Portfolio', 'Other'];

function bad(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    if (!isSameOrigin(req)) return crossOriginDenied();

    const user = await getSessionUser();
    if (!user) return bad('Sign in required.', 401);

    const ip = getClientIp(req.headers);
    const deviceId = resolveDeviceId(req.headers, req.cookies);
    const limited =
      !rateLimit(`apply:user:${user.id}`, 5, 60 * 60 * 1000) ||
      !rateLimit(`apply:ip:${ip}`, 30, 60 * 60 * 1000) ||
      (deviceId ? !rateLimit(`apply:device:${deviceId}`, 10, 60 * 60 * 1000) : false);
    if (limited) {
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
    const githubUrl = String(data.githubUrl ?? '').trim();
    const linkedinUrl = String(data.linkedinUrl ?? '').trim();
    const aboutText = String(data.aboutText ?? '').trim();
    const extraLinks = Array.isArray(data.extraLinks) ? data.extraLinks : [];
    const consent = data.consent === true;

    if (!consent) return bad('Privacy Policy and Terms acceptance required.');

    if (!fullName || fullName.length < 3 || fullName.length > 100) return bad('Full name is required (3–100 chars).');
    if (!YEARS.includes(year)) return bad('Valid academic year required.');
    if (!section || section.length > 5) return bad('Section required.');
    if (!usn || usn.length < 5 || usn.length > 20) return bad('Valid USN required.');
    if (!COURSES.includes(courseRaw) && courseRaw !== 'Others') return bad('Valid branch required.');
    const course = courseRaw === 'Others' ? courseOther.slice(0, 80) : courseRaw;
    if (courseRaw === 'Others' && !course) return bad('Specify your branch.');
    if (!isValidEmail(email)) return bad('Valid email required.');
    if (!isValidPhone(phone)) return bad('Valid 10-digit mobile number required.');
    if (!isValidUrl(githubUrl) || githubUrl.length > 300) return bad('Valid GitHub URL required.');
    if (linkedinUrl && (!isValidUrl(linkedinUrl) || linkedinUrl.length > 300)) return bad('LinkedIn URL invalid.');
    if (!aboutText || aboutText.length < 20 || aboutText.length > 1000) return bad('Statement of intent must be 20–1000 characters.');
    if (extraLinks.length > 3) return bad('Max 3 extra links.');

    const cleanExtra = extraLinks
      .slice(0, 3)
      .filter((l: unknown) => l && typeof l === 'object')
      .map((l: { label?: unknown; url?: unknown }) => ({
        label: EXTRA_LABELS.includes(String(l.label)) ? String(l.label) : 'Other',
        url: String(l.url ?? '').trim().slice(0, 300),
      }))
      .filter((l: { url: string }) => l.url === '' || isValidUrl(l.url));

    const supabase = adminClient();
    const authEmail = normalizeEmail(String(user.email ?? ''));
    const row = {
      user_id: user.id,
      full_name: fullName.slice(0, 100),
      year,
      section: section.slice(0, 5),
      usn: usn.slice(0, 20),
      course,
      course_other: courseOther.slice(0, 80),
      email,
      phone,
      github_url: githubUrl,
      linkedin_url: linkedinUrl || null,
      extra_links: cleanExtra,
      about_text: aboutText.slice(0, 1000),
      status: 'pending',
    };

    // Identity: one application per person across login methods.
    // Google OAuth and email-OTP create distinct auth users for the same email,
    // so match by user_id first, then by email (form or auth), adopting rows.
    const { data: ownRow } = await supabase
      .from('applications')
      .select('id,email')
      .eq('user_id', user.id)
      .maybeSingle();

    let dbError = null;
    if (ownRow) {
      if (email !== (ownRow as { email: string }).email) {
        const { data: clash } = await supabase
          .from('applications')
          .select('id')
          .eq('email', email)
          .neq('id', (ownRow as { id: string }).id)
          .maybeSingle();
        if (clash) {
          return bad('This email already has an application under a different sign-in. Sign in with that method to manage it.', 409);
        }
      }
      const { error } = await supabase
        .from('applications')
        .update(row)
        .eq('id', (ownRow as { id: string }).id);
      dbError = error;
    } else {
      const candidates = [...new Set([email, authEmail].filter(Boolean))];
      let matchId: string | null = null;
      for (const c of candidates) {
        const { data } = await supabase.from('applications').select('id').eq('email', c).maybeSingle();
        if (data) {
          matchId = (data as { id: string }).id;
          break;
        }
      }
      if (matchId) {
        // Adopt: same person, different login method — link to current user.
        const { error } = await supabase.from('applications').update(row).eq('id', matchId);
        dbError = error;
      } else {
        const { error } = await supabase.from('applications').insert(row);
        dbError = error;
      }
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
        <p><strong>Year:</strong> ${e(year)} (Sec ${e(section)}) — <strong>Branch:</strong> ${e(course)}</p>
        <p><strong>Email:</strong> ${e(email)} — <strong>Phone:</strong> ${e(phone)}</p>
        <p><strong>GitHub:</strong> ${e(githubUrl)}</p>
        ${linkedinUrl ? `<p><strong>LinkedIn:</strong> ${e(linkedinUrl)}</p>` : ''}
        ${extraRows}
        <p><strong>Statement:</strong></p><p style="color:#A3A3A3;">${e(aboutText)}</p>
        <p style="font-size:12px;color:#737373;">Consent: privacy + terms accepted at submission • Review: ${e(env.appUrl)}/admin</p>
      </div>`;

    const applicantHtml = `
      <div style="font-family: monospace; background:#050505; color:#fff; padding:24px; border-radius:12px;">
        <h2 style="color:#E11D48;">Application received</h2>
        <p>Hey ${e(fullName)},</p>
        <p>We received your Linux OpenSource Club application (USN ${e(usn)}). The core team reviews every application after the registration drive and will reach out on your registered email.</p>
        <p style="color:#737373;">Daily sessions: ${e('4:00 PM – 6:00 PM')}, Lab A-306 / A-228. Join Discord for updates.</p>
      </div>`;

    const admins = env.adminEmails;
    try {
      if (admins.length > 0) {
        await sendEmail({ to: admins, subject: `New application: ${fullName} (${usn})`, html: adminHtml });
      }
      await sendEmail({ to: email, subject: 'Application received — Linux OpenSource Club', html: applicantHtml });
    } catch (mailErr) {
      console.error('Application email failed (resend+brevo):', mailErr);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Application API error:', err);
    return bad('Internal error.', 500);
  }
}
