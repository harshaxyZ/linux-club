'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { TypewriterEffect } from '../ui/TypewriterEffect';

export function Hero() {
  return (
    <section className="relative min-h-[80vh] flex flex-col items-center justify-center pt-16 pb-16 sm:pt-20 sm:pb-20 overflow-hidden">
      
      {/* Ambient Crimson Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[300px] bg-accent/[0.06] blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10 w-full">

        {/* Main Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="font-heading font-extrabold text-4xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.08] max-w-4xl mx-auto text-ink"
        >
          Engineering Beyond the Classroom{' '}
          <span className="block mt-2 text-accent">
            <TypewriterEffect
              words={[
                'Linux Systems',
                'DSA Mastery',
                'Open Source PRs',
                'Kernel Internals',
                'Production Web Apps',
                'Competitive Code',
              ]}
            />
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 text-base sm:text-lg text-ink-muted leading-relaxed max-w-2xl mx-auto font-normal"
        >
          Master Ubuntu Linux, solve DSA daily, and contribute to real open-source software - mentored by a 10-member core team, evaluated monthly, representing DBIT at hackathons and GSoC.
        </motion.p>

        {/* Action CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/apply"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover !text-accent-contrast font-mono font-bold text-xs uppercase tracking-wider px-8 py-3.5 rounded-xl shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Sign In & Apply</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <a
            href="#about"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface hover:bg-subsurface text-ink font-mono text-xs uppercase tracking-wider px-6 py-3.5 rounded-xl border border-border shadow-sm transition-all"
          >
            <span>Explore Tracks</span>
            <ChevronRight className="w-4 h-4 text-ink-muted" />
          </a>
        </motion.div>

      </div>
    </section>
  );
}
