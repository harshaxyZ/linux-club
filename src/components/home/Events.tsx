'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, Terminal, Rocket, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export function Events() {
  return (
    <section id="events" className="py-24 bg-background border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-xs text-accent uppercase tracking-wider">
            Sprints &amp; Workshops
          </span>
          <h2 className="font-heading font-extrabold text-ink text-3xl sm:text-5xl tracking-tight mt-3">
            Upcoming Club Events
          </h2>
          <p className="text-base text-ink-muted mt-4">
            Regular campus hackathons, Linux installation drives, and algorithmic sprint contests.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Flagship Event Card 1 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="bg-surface border border-border rounded-xl p-8 shadow-sm flex flex-col justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 bg-accent text-white font-mono text-[10px] uppercase font-bold px-3 py-1 rounded-bl-lg">
              FLAGSHIP HACKATHON
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-accent-terminal mb-4">
                <Rocket className="w-4 h-4" />
                <span>SEASON OPENER • OCTOBER 2026</span>
              </div>

              <h3 className="font-heading font-extrabold text-ink text-2xl mb-3">
                Linux OSS HackSprint v1.0
              </h3>

              <p className="text-sm text-ink-muted leading-relaxed mb-6">
                A 12-hour continuous build sprint at DBIT campus. Build open source tools, Linux utilities, or web applications. Open to all DBIT engineering branches.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-ink-muted pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>Date: October 15, 2026</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>Duration: 09:00 AM - 09:00 PM</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>Venue: DBIT Main Tech Seminar Hall &amp; Computer Lab</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
              <span className="text-xs font-mono text-ink-muted">Exclusive for registered members</span>
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 bg-accent hover:bg-accent-hover text-white text-xs font-semibold px-4 py-2 rounded-md transition-all"
              >
                <span>Apply To Join</span>
                <span>→</span>
              </Link>
            </div>
          </motion.div>

          {/* Regular Workshop Card 2 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="bg-surface border border-border rounded-xl p-8 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-accent mb-4">
                <Terminal className="w-4 h-4" />
                <span>WEEKLY WORKSHOP</span>
              </div>

              <h3 className="font-heading font-extrabold text-ink text-2xl mb-3">
                Linux Terminal &amp; Vim Bootcamp
              </h3>

              <p className="text-sm text-ink-muted leading-relaxed mb-6">
                Master terminal navigation, bash scripts, package management, and Vim keybindings. Essential primer for 1st and 2nd year students.
              </p>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-ink-muted pt-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span>Date: Every Wednesday</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-accent" />
                  <span>Time: 04:30 PM - 06:00 PM</span>
                </div>
                <div className="flex items-center gap-2 col-span-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span>Venue: Lab 3, Computer Science Dept, DBIT</span>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
              <span className="text-xs font-mono text-accent-terminal flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Free Entry for DBIT Students</span>
              </span>
              <Link
                href="/apply"
                className="inline-flex items-center gap-2 bg-background hover:bg-surface text-ink border border-border text-xs font-semibold px-4 py-2 rounded-md transition-all"
              >
                <span>Reserve Seat</span>
              </Link>
            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
}
