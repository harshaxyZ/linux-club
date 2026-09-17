'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

const milestones = [
  {
    phase: 'PHASE 01',
    title: 'Linux Foundations & Tooling',
    desc: 'Mastering the command line, Vim/Neovim configuration, bash scripting, SSH keys, package managers, and dual-boot environments.',
    tag: 'Foundation',
    badge: 'Weeks 1 - 4',
  },
  {
    phase: 'PHASE 02',
    title: 'Competitive DSA Sprints',
    desc: 'Structured problem-solving routines covering arrays, linked lists, binary search, trees, dynamic programming, and weekly contests.',
    tag: 'Core Mastery',
    badge: 'Weeks 5 - 10',
  },
  {
    phase: 'PHASE 03',
    title: 'Systems & Microservices',
    desc: 'Writing C/C++ network servers, exploring kernel calls, building full-stack applications with Next.js, and containerizing with Docker.',
    tag: 'Advanced Build',
    badge: 'Weeks 11 - 16',
  },
  {
    phase: 'PHASE 04',
    title: 'Open Source HackSprint & PRs',
    desc: 'Collaborative team projects, code reviews, submitting upstream pull requests to public repositories, and preparing for GSOC.',
    tag: 'Production',
    badge: 'Weeks 17 - 20',
  },
];

export function Roadmap() {
  return (
    <section id="roadmap" className="py-24 relative overflow-hidden border-t border-white/[0.08] bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-xs text-red-500 uppercase tracking-wider block mb-2">
            // Cohort Roadmap
          </span>
          <h2 className="font-heading font-extrabold text-white text-3xl sm:text-5xl tracking-tight">
            How We Level Up Together
          </h2>
          <p className="text-sm text-[#A3A3A3] mt-3">
            A structured, hands-on progression designed to turn motivated beginners into autonomous software engineers.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {milestones.map((milestone, idx) => (
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
                  <span className="font-mono text-xs font-bold text-red-400 px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20">
                    {milestone.phase}
                  </span>
                  <span className="font-mono text-[10px] text-[#737373]">
                    {milestone.badge}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-white text-lg mb-2">
                  {milestone.title}
                </h3>

                <p className="text-xs text-[#A3A3A3] leading-relaxed">
                  {milestone.desc}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#737373]">{milestone.tag}</span>
                <Zap className="w-3.5 h-3.5 text-red-500" />
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
