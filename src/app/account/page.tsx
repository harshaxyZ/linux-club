'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BackgroundGrid } from '../../components/ui/BackgroundGrid';
import { ExternalLink, Trash2, ArrowLeft, Clock } from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
  const [deleted, setDeleted] = useState(false);
  const [appData, setAppData] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('club_applications');
      if (stored) {
        try {
          const list = JSON.parse(stored);
          if (list && list.length > 0) {
            setAppData(list[0]);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to withdraw your application and erase your records?')) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('club_applications');
      }
      setDeleted(true);
    }
  };

  const app = appData || {
    full_name: 'Registered Candidate',
    usn: 'Pending Verification',
    year: 'Active Candidate',
    course: 'Engineering Core',
    section: 'A',
    email: 'candidate@example.com',
    phone: '+91 9876543210',
    github_url: 'https://github.com',
    status: 'under_review',
    created_at: 'Cohort 2026',
    about_text: 'Interested in mastering Linux systems, competitive programming in C++, and full-stack software development.',
  };

  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-ink relative selection:bg-rose-600 selection:text-white transition-colors duration-200">
      <BackgroundGrid />
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-ink-muted hover:text-ink transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 text-accent" />
            <span>Back to Home</span>
          </Link>

          {deleted ? (
            <div className="minimal-card rounded-3xl p-12 text-center shadow-2xl">
              <h2 className="font-heading font-extrabold text-ink text-2xl">Application Record Removed</h2>
              <p className="text-sm text-ink-muted mt-2">Your application data has been removed from active evaluation.</p>
              <Link href="/" className="mt-6 inline-block bg-[#E11D48] hover:bg-[#F43F5E] !text-white font-mono font-bold text-xs px-6 py-3 rounded-xl shadow-md transition-all">
                Return to Homepage
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Header Status Card */}
              <div className="minimal-card rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-subsurface border border-border text-ink flex items-center justify-center font-heading font-extrabold text-xl shadow-sm">
                    {app.full_name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="font-heading font-extrabold text-ink text-2xl">{app.full_name}</h1>
                    <p className="text-xs font-mono text-ink-muted mt-0.5">{app.usn} • {app.course} ({app.year})</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-ink-muted">Application Status:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-mono font-bold border border-accent/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Under Review</span>
                  </span>
                </div>
              </div>

              {/* Details grid */}
              <div className="minimal-card rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <h3 className="font-heading font-bold text-ink text-lg border-b border-border pb-4 font-mono">
                  // Submitted Profile Data
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm font-mono">
                  <div>
                    <span className="block text-[10px] text-ink-muted uppercase mb-1">Email Address</span>
                    <span className="font-medium text-ink">{app.email}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-ink-muted uppercase mb-1">Phone Number</span>
                    <span className="font-medium text-ink">{app.phone}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-ink-muted uppercase mb-1">GitHub Profile</span>
                    <a href={app.github_url} target="_blank" rel="noreferrer" className="text-accent hover:underline inline-flex items-center gap-1">
                      <span>{app.github_url}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div>
                    <span className="block text-[10px] text-ink-muted uppercase mb-1">Logged Date</span>
                    <span className="font-medium text-ink">{app.created_at}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-border">
                  <span className="block text-[10px] font-mono text-ink-muted uppercase mb-2">Statement of Intent</span>
                  <p className="text-xs text-ink bg-subsurface p-4 rounded-xl border border-border leading-relaxed font-body">
                    {app.about_text}
                  </p>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="minimal-card border border-accent/20 rounded-3xl p-6 sm:p-8 flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-accent text-base">Withdraw Application</h4>
                  <p className="text-xs text-ink-muted mt-1">Remove your registration records from active evaluation.</p>
                </div>

                <button
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center gap-2 bg-[#E11D48] hover:bg-[#F43F5E] !text-white font-mono font-bold text-xs px-4 py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Withdraw</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
