'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../../components/layout/Header';
import { Footer } from '../../components/layout/Footer';
import { BackgroundGrid } from '../../components/ui/BackgroundGrid';
import { motion } from 'framer-motion';
import { Code2 as Github, ExternalLink, Trash2, ArrowLeft, Clock, Terminal } from 'lucide-react';
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
    <div className="min-h-screen flex flex-col bg-black font-body text-white relative selection:bg-red-600 selection:text-white">
      <BackgroundGrid />
      <Header />

      <main className="flex-1 py-12 px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto">
          
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-mono text-[#A3A3A3] hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 text-red-500" />
            <span>Back to Home</span>
          </Link>

          {deleted ? (
            <div className="minimal-card rounded-3xl p-12 text-center shadow-2xl">
              <h2 className="font-heading font-extrabold text-white text-2xl">Application Record Removed</h2>
              <p className="text-sm text-[#A3A3A3] mt-2">Your application data has been removed from active evaluation.</p>
              <Link href="/" className="mt-6 inline-block bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs px-6 py-3 rounded-xl">
                Return to Homepage
              </Link>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Header Status Card */}
              <div className="minimal-card rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 text-white flex items-center justify-center font-heading font-extrabold text-xl">
                    {app.full_name.charAt(0)}
                  </div>
                  <div>
                    <h1 className="font-heading font-extrabold text-white text-2xl">{app.full_name}</h1>
                    <p className="text-xs font-mono text-[#A3A3A3] mt-0.5">{app.usn} • {app.course} ({app.year})</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-[#A3A3A3]">Application Status:</span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-500/10 text-red-400 text-xs font-mono font-bold border border-red-500/20">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Under Review</span>
                  </span>
                </div>
              </div>

              {/* Details grid */}
              <div className="minimal-card rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
                <h3 className="font-heading font-bold text-white text-lg border-b border-white/[0.08] pb-4 font-mono">
                  // Submitted Profile Data
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm font-mono">
                  <div>
                    <span className="block text-[10px] text-[#737373] uppercase mb-1">Email Address</span>
                    <span className="font-medium text-white">{app.email}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#737373] uppercase mb-1">Phone Number</span>
                    <span className="font-medium text-white">{app.phone}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#737373] uppercase mb-1">GitHub Profile</span>
                    <a href={app.github_url} target="_blank" rel="noreferrer" className="text-red-400 hover:underline inline-flex items-center gap-1">
                      <span>{app.github_url}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                  <div>
                    <span className="block text-[10px] text-[#737373] uppercase mb-1">Logged Date</span>
                    <span className="font-medium text-white">{app.created_at}</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-white/[0.08]">
                  <span className="block text-[10px] font-mono text-[#737373] uppercase mb-2">Statement of Intent</span>
                  <p className="text-xs text-[#D4D4D4] bg-[#050505] p-4 rounded-xl border border-white/[0.08] leading-relaxed font-body">
                    {app.about_text}
                  </p>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="minimal-card border border-red-500/20 rounded-3xl p-6 sm:p-8 flex items-center justify-between">
                <div>
                  <h4 className="font-heading font-bold text-red-400 text-base">Withdraw Application</h4>
                  <p className="text-xs text-[#A3A3A3] mt-1">Remove your registration records from active evaluation.</p>
                </div>

                <button
                  onClick={handleDeleteAccount}
                  className="inline-flex items-center gap-2 bg-red-600/80 hover:bg-red-600 text-white font-mono font-bold text-xs px-4 py-2.5 rounded-xl transition-all cursor-pointer"
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
