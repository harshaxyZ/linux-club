import React from 'react';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BackgroundGrid } from '../../components/ui/BackgroundGrid';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { SITE } from '../../lib/site';

export const dynamic = 'force-dynamic';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-ink relative">
      <BackgroundGrid />
      <Header />
      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted hover:text-ink mb-8">
            <ArrowLeft className="w-4 h-4 text-accent" /><span>Back to Home</span>
          </Link>

          <div className="minimal-card rounded-3xl p-6 sm:p-10 shadow-2xl">
            <div className="flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{'// Privacy Policy'}</span>
            </div>
            <h1 className="font-heading font-extrabold text-ink text-3xl tracking-tight">Privacy Policy</h1>
            <p className="text-xs font-mono text-ink-muted mt-2">Effective 19 September 2026 • {SITE.shortName}, {SITE.college}</p>

            <div className="mt-8 space-y-6 text-sm text-ink-muted leading-relaxed">
              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">1. Who we are</h2>
                <p>
                  This portal is run by the {SITE.shortName} core team at {SITE.college},
                  guided by {SITE.facultyCoordinator} ({SITE.dept}). For privacy questions, reach the
                  core team on <a className="text-accent hover:underline" href={SITE.discord} target="_blank" rel="noreferrer">Discord</a> or
                  via <a className="text-accent hover:underline" href={SITE.github} target="_blank" rel="noreferrer">GitHub</a>.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">2. Data we collect</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="text-ink">Account:</span> email address and name from Google OAuth or email-code sign-in.</li>
                  <li><span className="text-ink">Application:</span> full name, academic year, section, USN, branch, email, phone, GitHub/LinkedIn/coding-profile URLs, and statement of intent.</li>
                  <li><span className="text-ink">Technical:</span> authentication cookies, a random per-browser device id for abuse control, and theme preference.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">3. How we use it</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Verify your identity and prevent spam applications.</li>
                  <li>Review applications for the recruitment drive and contact you about outcomes.</li>
                  <li>Operate the admin console (application tracker, status updates, CSV export).</li>
                  <li>Rate-limit auth and API endpoints against abuse.</li>
                </ul>
                <p className="mt-2">We do not sell personal data. We do not use it for advertising.</p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">4. Processors</h2>
                <p>
                  Data is stored in Supabase (PostgreSQL, row-level security) and hosted on Vercel.
                  Transactional email is sent via Resend with Brevo as fallback. Google handles OAuth
                  authentication under its own privacy policy.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">5. Retention &amp; deletion</h2>
                <p>
                  Applications are kept for the academic year for evaluation records. You can withdraw
                  anytime from <Link className="text-accent hover:underline" href="/account">My Application</Link>,
                  which permanently deletes your application record.
                </p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">6. Your rights</h2>
                <p>Access, correct, or delete your data via the account page or by contacting the core team. Admins see only what is needed to run recruitment.</p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">7. Changes</h2>
                <p>Material changes will be announced on Discord before taking effect.</p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
