import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);

      await resend.emails.send({
        from: 'Linux OSS Club <onboarding@resend.dev>',
        to: email,
        subject: `⚡ You've been invited as an Admin - Linux OSS Club`,
        html: `
          <div style="font-family: monospace; background-color: #0B0E14; color: #F1F5F9; padding: 24px; border-radius: 12px; border: 1px solid #1E293B;">
            <h2 style="color: #10B981; margin-top: 0;">⚡ Linux OSS Club Admin Invitation</h2>
            <p>You have been granted administrator access to the Linux OSS Club CMS Portal.</p>
            <p>You can sign in using your Google account (${email}) or authenticate via the admin console.</p>
            <div style="margin: 24px 0;">
              <a href="https://webuildnow.in/admin" style="background-color: #10B981; color: #000000; padding: 12px 24px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block;">
                Access Admin CMS Panel →
              </a>
            </div>
            <p style="color: #64748B; font-size: 12px;">If you were not expecting this invitation, you can ignore this email.</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ success: true, message: 'Invitation email sent.' });
  } catch (error: any) {
    console.error('Admin invite error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to dispatch invite' },
      { status: 500 }
    );
  }
}
