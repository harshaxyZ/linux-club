'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Layers, GitPullRequest } from 'lucide-react';
import { SITE } from '../../lib/site';

export function About() {
  return (
    <section id="about" className="py-16 sm:py-24 relative overflow-hidden border-t border-border bg-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-10 sm:mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-wider mb-3">
            <Terminal className="w-3.5 h-3.5" />
            {'// OpenSource Students Club - '}{SITE.college}
          </div>
          <h2 className="font-heading font-extrabold text-ink text-3xl sm:text-5xl tracking-tight leading-tight">
            Daily practice. Real pull requests. Monthly accountability.
          </h2>
          <p className="text-base text-ink-muted mt-4 leading-relaxed">
            A student-run technical club under {SITE.dept}, guided by {SITE.facultyCoordinator}.
            Core team of 10 across three domains. Daily 2-hour sessions ({SITE.hours}) in {SITE.lab}.
            Every member is scored individually every month - provisional in month one, confirmed on merit.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="minimal-card minimal-card-red-hover rounded-2xl p-8 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-subsurface border border-border flex items-center justify-center text-ink mb-6">
                <Terminal className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-ink text-xl mb-3">Ubuntu-first engineering</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Ubuntu is the mandatory working environment - native, dual-boot, or WSL so nobody
                repartitions a personal machine. Filesystem, permissions, processes, shell, SSH - verified hands-on in the first month.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border flex items-center gap-2 text-xs font-mono text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>WSL • Shell • SSH</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="minimal-card minimal-card-red-hover rounded-2xl p-8 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-subsurface border border-border flex items-center justify-center text-ink mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-ink text-xl mb-3">DSA every day</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Daily problem sets with a defined syllabus, peer and senior mentoring, and internal
                contests. Solve in any language you like. Recruitment test is semester-wise:
                programming fundamentals for 1st to 3rd sem, DSA + DBMS + networks for 5th to 7th sem.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border flex items-center gap-2 text-xs font-mono text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>Contests • Peer review</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="minimal-card minimal-card-red-hover rounded-2xl p-8 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-subsurface border border-border flex items-center justify-center text-ink mb-6">
                <GitPullRequest className="w-6 h-6" />
              </div>
              <h3 className="font-heading font-bold text-ink text-xl mb-3">Open source in public</h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Git and GitHub from week two, club projects under a public organisation, then real
                upstream contributions - Hacktoberfest, GSoC mentoring, and hackathon teams that
                represent the college.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border flex items-center gap-2 text-xs font-mono text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>GSoC • Hacktoberfest</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
