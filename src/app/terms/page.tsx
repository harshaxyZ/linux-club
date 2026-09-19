import React from 'react';
import Link from 'next/link';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BackgroundGrid } from '../../components/ui/BackgroundGrid';
import { ArrowLeft, FileText } from 'lucide-react';
import { SITE } from '../../lib/site';

export const dynamic = 'force-dynamic';

export default function TermsPage() {
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
              <FileText className="w-3.5 h-3.5" />
              <span>{'// Terms & Conditions'}</span>
            </div>
            <h1 className="font-heading font-extrabold text-ink text-3xl tracking-tight">Terms &amp; Conditions</h1>
            <p className="text-xs font-mono text-ink-muted mt-2">Effective 19 September 2026 • {SITE.shortName}, {SITE.college}</p>

            <div className="mt-8 space-y-6 text-sm text-ink-muted leading-relaxed">
              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">1. Acceptance</h2>
                <p>By ticking the consent box at sign-in or submitting an application, you agree to these terms and to the Privacy Policy.</p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">2. Eligibility</h2>
                <p>Membership is open to students of {SITE.college}. Recruitment is merit-based: registration, semester-wise screening test, interview where required, provisional membership, and confirmation via the first monthly evaluation.</p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">3. Your account</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Use Google OAuth or your own email-code sign-in. Keep your account to yourself - one account per person.</li>
                  <li>Provide accurate details. False information can lead to rejection or removal.</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">4. Member obligations</h2>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Attend daily sessions ({SITE.hours}, {SITE.lab}) and complete assigned work.</li>
                  <li>Learn and use the Ubuntu/Linux baseline and route project work through Git and GitHub.</li>
                  <li>Follow the code of conduct: respectful communication, zero tolerance for harassment or discrimination, no plagiarism, and respect for open-source licence terms.</li>
                  <li>Monthly individual evaluation applies to every member; persistent inactivity after a warning month leads to discontinuation (appeals go to the faculty coordinator).</li>
                </ul>
              </section>

              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">5. Club projects</h2>
                <p>Club-owned projects are released under permissive open-source licences (MIT/Apache-2.0). Your public contributions remain attributed to you.</p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">6. Withdrawal</h2>
                <p>You may withdraw your application anytime from the account page. Discontinuation carries no academic consequence.</p>
              </section>

              <section>
                <h2 className="font-heading font-bold text-ink text-lg mb-2">7. Liability &amp; changes</h2>
                <p>This is a student-run portal provided as-is. The core team may update these terms with notice on Discord; continued use means acceptance.</p>
              </section>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row gap-4">
              <Link href="/apply" className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover !text-accent-contrast font-mono font-bold text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl">
                <span>Sign In &amp; Apply</span>
              </Link>
              <Link href="/privacy" className="inline-flex items-center justify-center gap-2 bg-surface hover:bg-subsurface border border-border text-ink font-mono text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl">
                <span>Privacy Policy</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
