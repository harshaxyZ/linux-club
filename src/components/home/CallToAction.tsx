'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export function CallToAction() {
  return (
    <section className="py-24 relative overflow-hidden bg-background border-t border-border transition-colors duration-200">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="minimal-card rounded-3xl p-8 sm:p-14 relative overflow-hidden shadow-2xl"
        >
          {/* Subtle Ambient Red Glow */}
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-accent/[0.08] blur-[100px] rounded-full pointer-events-none" />

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent font-mono text-xs mb-6">
            <Terminal className="w-3.5 h-3.5" />
            <span>// 2026 COHORT APPLICATIONS OPEN</span>
          </div>

          <h2 className="font-heading font-extrabold text-ink text-3xl sm:text-5xl tracking-tight max-w-2xl mx-auto leading-tight">
            Ready to build high-impact software?
          </h2>

          <p className="text-base text-ink-muted mt-4 max-w-xl mx-auto leading-relaxed">
            Join the collective of developers, competitive coders, and open-source contributors. All branches and academic years welcome.
          </p>

          <div className="mt-8 flex items-center justify-center">
            <Link
              href="/apply"
              className="inline-flex items-center justify-center gap-2 bg-[#E11D48] hover:bg-[#F43F5E] !text-white font-mono font-bold text-xs uppercase tracking-wider px-8 py-4 rounded-xl shadow-xl shadow-rose-600/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Apply Now</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
