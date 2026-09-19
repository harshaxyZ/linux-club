'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Terminal, Rocket, CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { SITE } from '../../lib/site';

export function Events() {
  return (
    <section id="events" className="py-16 sm:py-24 bg-background border-t border-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <span className="font-mono text-xs text-accent uppercase tracking-wider block mb-2">
            {'// Sprints & Workshops'}
          </span>
          <h2 className="font-heading font-extrabold text-ink text-3xl sm:text-5xl tracking-tight">
            Sessions &amp; events
          </h2>
          <p className="text-base text-ink-muted mt-4">
            Daily working sessions {SITE.hours} in {SITE.lab}, plus open workshops and hackathons.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="minimal-card minimal-card-red-hover rounded-2xl p-8 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-[#E11D48] !text-white font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
              RECRUITMENT DRIVE
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-emerald-500 mb-4">
                <Rocket className="w-4 h-4" />
                <span>STAGE 0 → 4 • TEST + INTERVIEW</span>
              </div>
              <h3 className="font-heading font-extrabold text-ink text-2xl mb-3">
                Membership recruitment drive
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-6">
                Registration → semester-wise screening test → interview where required → provisional
                membership → first monthly evaluation confirms ~20-25 members. Open to all branches.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-ink-muted pt-4 border-t border-border">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" /><span>Start of academic year</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-accent" /><span>Daily {SITE.hours}</span></div>
                <div className="flex items-center gap-2 sm:col-span-2"><MapPin className="w-4 h-4 text-accent" /><span>{SITE.lab}, {SITE.college}</span></div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-3 items-center justify-between">
              <span className="text-xs font-mono text-ink-muted">Registration → test → interview</span>
              <Link href="/apply" className="inline-flex items-center gap-2 bg-[#E11D48] hover:bg-[#F43F5E] !text-white text-xs font-mono font-bold px-4 py-2.5 rounded-lg shadow-md transition-all">
                <span>Register</span><ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="minimal-card minimal-card-red-hover rounded-2xl p-8 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-accent mb-4">
                <Terminal className="w-4 h-4" />
                <span>FOUNDATION • OPEN TO ALL</span>
              </div>
              <h3 className="font-heading font-extrabold text-ink text-2xl mb-3">
                Ubuntu, Git &amp; Open Source weeks
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed mb-6">
                Week 1 Unix/Linux fundamentals and WSL setup. Week 2 Git, branches, and your first
                internal pull request. Week 3 licences, issues, and reading unfamiliar codebases.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono text-ink-muted pt-4 border-t border-border">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-accent" /><span>First 3 weeks</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-accent" /><span>{SITE.hours}</span></div>
                <div className="flex items-center gap-2 sm:col-span-2"><MapPin className="w-4 h-4 text-accent" /><span>{SITE.lab}</span></div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-3 items-center justify-between">
              <span className="text-xs font-mono text-emerald-500 flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" /><span>Selected sessions open to all students</span>
              </span>
              <a href={SITE.discord} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-surface hover:bg-subsurface text-ink border border-border text-xs font-mono font-semibold px-4 py-2.5 rounded-lg">
                <span>Discord</span>
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
