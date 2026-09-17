import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const {
      fullName,
      year,
      section,
      usn,
      course,
      courseOther,
      email,
      phone,
      githubUrl,
      linkedinUrl,
      extraLinks,
      aboutText,
      userId,
    } = data;

    if (!fullName || !section || !usn || !email || !phone || !githubUrl || !aboutText) {
      return NextResponse.json(
        { error: 'Missing required application fields.' },
        { status: 400 }
      );
    }

    // 1. Insert directly into Supabase database
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://noaucjjnhpxuyyskzihl.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      try {
        const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
        await supabase.from('applications').insert({
          user_id: userId || '00000000-0000-0000-0000-000000000000',
          full_name: fullName,
          year,
          section,
          usn,
          course: course === 'Others' ? courseOther : course,
          course_other: courseOther,
          email,
          phone,
          github_url: githubUrl,
          linkedin_url: linkedinUrl,
          extra_links: extraLinks || [],
          about_text: aboutText,
          status: 'pending',
        });
      } catch (dbErr) {
        console.error('Database write log:', dbErr);
      }
    }

    // 2. Initialize Resend for email dispatch
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@linuxossclub.org';

      // Send Alert Email to Admin
      await resend.emails.send({
        from: 'Linux OSS Club <onboarding@resend.dev>',
        to: adminEmail,
        subject: `⚡ New Application: ${fullName} (${usn}) - ${course}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #050505; color: #FFFFFF; padding: 24px; border-radius: 12px; border: 1px solid #262626;">
            <h2 style="color: #E11D48; margin-top: 0; font-size: 20px;">⚡ New Linux OSS Club Application</h2>
            <hr style="border: 0; border-top: 1px solid #262626; margin: 16px 0;" />
            <p style="margin: 6px 0;"><strong>Full Name:</strong> ${fullName}</p>
            <p style="margin: 6px 0;"><strong>USN:</strong> ${usn}</p>
            <p style="margin: 6px 0;"><strong>Academic Year:</strong> ${year} Year (Section ${section})</p>
            <p style="margin: 6px 0;"><strong>Branch / Course:</strong> ${course === 'Others' ? courseOther : course}</p>
            <p style="margin: 6px 0;"><strong>Email:</strong> <a href="mailto:${email}" style="color: #E11D48;">${email}</a></p>
            <p style="margin: 6px 0;"><strong>Phone:</strong> ${phone}</p>
            <p style="margin: 6px 0;"><strong>GitHub:</strong> <a href="${githubUrl}" style="color: #FFFFFF;">${githubUrl}</a></p>
            ${linkedinUrl ? `<p style="margin: 6px 0;"><strong>LinkedIn:</strong> <a href="${linkedinUrl}" style="color: #A3A3A3;">${linkedinUrl}</a></p>` : ''}
            <div style="margin-top: 16px; background-color: #0D0D0D; padding: 16px; border-radius: 8px; border: 1px solid #262626;">
              <strong style="color: #E11D48;">Statement of Interest:</strong>
              <p style="color: #A3A3A3; white-space: pre-wrap; margin-top: 8px; line-height: 1.5;">${aboutText}</p>
            </div>
            <p style="margin-top: 24px; font-size: 12px; color: #737373;">Direct link to review: <a href="https://webuildnow.in/admin" style="color: #E11D48;">https://webuildnow.in/admin</a></p>
          </div>
        `,
      }).catch((e) => {
        console.error('Failed to send admin notification email:', e);
      });

      // Send Confirmation Email to Applicant
      await resend.emails.send({
        from: 'Linux OSS Club <onboarding@resend.dev>',
        to: email,
        subject: `Application Received - Linux OSS Club`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background-color: #050505; color: #FFFFFF; padding: 24px; border-radius: 12px; border: 1px solid #262626;">
            <h2 style="color: #E11D48; margin-top: 0; font-size: 20px;">// Linux Open Source Coding Club</h2>
            <p>Hey ${fullName},</p>
            <p>We've successfully received your application for club membership.</p>
            <p>The core review team is evaluating your application details (USN: <strong>${usn}</strong>). You will receive an update once reviews are completed.</p>
            <br />
            <p style="color: #737373;">Keep building in public,</p>
            <p style="color: #E11D48; font-weight: bold;">Linux OSS Club Core Team</p>
          </div>
        `,
      }).catch((e) => {
        console.error('Failed to send applicant confirmation email:', e);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Application recorded and email notification dispatched.',
    });
  } catch (error: any) {
    console.error('Application API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
