'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const milestones = [
  {
    phase: 'WEEK 01',
    title: 'Orientation + Ubuntu & Shell',
    desc: 'Club orientation, WSL/Ubuntu setup, filesystem, core commands, permissions, processes, shell basics, SSH keys.',
    tag: 'Foundation',
    badge: 'Hands-on check later',
  },
  {
    phase: 'WEEK 02',
    title: 'Git, GitHub & First PR',
    desc: 'Repositories, branches, commits, merges, pull requests. Every member lands a first internal PR and sets up a GitHub profile.',
    tag: 'Collaboration',
    badge: 'Public history starts',
  },
  {
    phase: 'WEEK 03',
    title: 'Open Source + Track Kickoff',
    desc: 'Licences, issues, contribution guidelines, reading unfamiliar codebases. Practical Unix check. Domain tracks begin.',
    tag: 'Contribution',
    badge: 'Domains assigned',
  },
  {
    phase: 'WEEK 04',
    title: 'Domain Work + Evaluation 1',
    desc: 'Full DSA / AI / systems work, first internal contest, then the decisive first monthly evaluation: provisional → confirmed.',
    tag: 'Accountability',
    badge: '~50 → ~20-25',
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="py-16 sm:py-24 relative overflow-hidden border-t border-border bg-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <span className="font-mono text-xs text-accent uppercase tracking-wider block mb-2">
            {'// First month • repeats monthly'}
          </span>
          <h2 className="font-heading font-extrabold text-ink text-3xl sm:text-5xl tracking-tight">
            How the first month works
          </h2>
          <p className="text-sm text-ink-muted mt-3">
            Induction starts day one. Then every member is scored monthly on attendance, tasks,
            technical progress, Git activity, initiative, and collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {milestones.map((m, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="minimal-card minimal-card-red-hover rounded-2xl p-6 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-accent px-2.5 py-1 rounded bg-accent/10 border border-accent/20">{m.phase}</span>
                  <span className="font-mono text-[10px] text-ink-muted">{m.badge}</span>
                </div>
                <h3 className="font-heading font-bold text-ink text-lg mb-2">{m.title}</h3>
                <p className="text-xs text-ink-muted leading-relaxed">{m.desc}</p>
              </div>
              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between text-[11px] font-mono">
                <span className="text-ink-muted">{m.tag}</span>
                <Zap className="w-3.5 h-3.5 text-accent" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
