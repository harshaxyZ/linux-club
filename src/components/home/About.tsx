'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Layers, GitPullRequest } from 'lucide-react';

export function About() {
  return (
    <section id="about" className="py-24 relative overflow-hidden border-t border-border bg-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-mono text-accent uppercase tracking-wider mb-3">
            <Terminal className="w-3.5 h-3.5" />
            <span>// Engineering Philosophy</span>
          </div>
          <h2 className="font-heading font-extrabold text-ink text-3xl sm:text-5xl tracking-tight leading-tight">
            We build real software, solve hard problems, and ship.
          </h2>
          <p className="text-base text-ink-muted mt-4 leading-relaxed">
            Our collective is designed for ambitious engineers who want to go deeper than standard tutorials. From kernel systems and competitive algorithms to production deployments.
          </p>
        </div>

        {/* Bento Grid in Theme-Adaptive Minimal Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Bento Card 1: Low-level Systems */}
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
              <h3 className="font-heading font-bold text-ink text-xl mb-3">
                Linux Systems &amp; POSIX
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Understand what happens under the hood. Master Linux internals, process scheduling, memory virtualization, shell scripting, and kernel compilation.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border flex items-center gap-2 text-xs font-mono text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>Arch, Debian &amp; C Systems</span>
            </div>
          </motion.div>

          {/* Bento Card 2: DSA Core */}
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
              <h3 className="font-heading font-bold text-ink text-xl mb-3">
                Algorithmic Rigor
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                DSA is our primary core. Weekly competitive programming sessions, curated LeetCode hard sets, graph theory, dynamic programming, and Codeforces sprints.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border flex items-center gap-2 text-xs font-mono text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>LeetCode Hard &amp; Codeforces</span>
            </div>
          </motion.div>

          {/* Bento Card 3: Open Source Impact */}
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
              <h3 className="font-heading font-bold text-ink text-xl mb-3">
                Open Source In Public
              </h3>
              <p className="text-sm text-ink-muted leading-relaxed">
                Learn Git workflows, review pull requests, create developer tooling, and contribute to notable worldwide open-source repositories.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-border flex items-center gap-2 text-xs font-mono text-accent">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              <span>Production Pull Requests</span>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
