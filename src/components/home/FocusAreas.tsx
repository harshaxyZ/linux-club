'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Binary, Cpu, Server } from 'lucide-react';
import { DOMAINS } from '../../lib/site';

const icons = [Binary, Cpu, Server];

export function FocusAreas() {
  return (
    <section id="focus-areas" className="py-16 sm:py-24 relative overflow-hidden border-t border-border bg-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 sm:mb-16 gap-6">
          <div>
            <span className="font-mono text-xs text-accent uppercase tracking-wider block mb-2">
              {'// Three domains • 10 core members'}
            </span>
            <h2 className="font-heading font-extrabold text-ink text-3xl sm:text-5xl tracking-tight">
              Pick your track
            </h2>
          </div>
          <p className="text-sm text-ink-muted max-w-md">
            DSA (3 mentors) • AI &amp; Development (3) • Core CS &amp; Systems (4).
            You are assigned a track after recruitment based on interest and aptitude.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {DOMAINS.map((track, i) => {
            const Icon = icons[i % icons.length];
            return (
              <motion.div
                key={track.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="minimal-card minimal-card-red-hover rounded-2xl p-8 group relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-subsurface border border-border flex items-center justify-center text-ink group-hover:text-accent transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-2xl font-bold text-ink-muted/30 group-hover:text-accent/60 transition-colors">
                    {track.num}
                  </span>
                </div>
                <h3 className="font-heading font-bold text-ink text-2xl mb-3 group-hover:text-accent transition-colors">
                  {track.title}
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed mb-6">{track.desc}</p>
                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  {track.tags.map((tag) => (
                    <span key={tag} className="px-2.5 py-1 rounded bg-subsurface border border-border font-mono text-[11px] text-ink-muted group-hover:border-accent/30 transition-colors">
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
