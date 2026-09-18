'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Users, Trophy, Code, Zap, Flame } from 'lucide-react';

const benefits = [
  {
    icon: Monitor,
    title: "High-Spec Linux Lab Access",
    desc: "Daily physical access to DBIT tech lab machines pre-configured with Linux environments, dual boots, and dev tools.",
  },
  {
    icon: Users,
    title: "Peer-to-Peer Mentorship",
    desc: "Direct mentorship from senior DBIT engineers who have cracked hackathons, open source programs, and tech internships.",
  },
  {
    icon: Trophy,
    title: "Internal Hackathons & Sprints",
    desc: "Monthly 3-hour internal coding sprints and flagship campus hackathons with cash prizes and certification.",
  },
  {
    icon: Code,
    title: "Build in Public Projects",
    desc: "Ship real code to GitHub org repositories. Turn ideas into live web apps, CLI packages, and mobile applications.",
  },
  {
    icon: Zap,
    title: "Guided Basics for Juniors",
    desc: "First and second-year students receive step-by-step guidance starting from C++ fundamentals to Linux terminal mastery.",
  },
  {
    icon: Flame,
    title: "DSA Contest Leaderboard",
    desc: "Compete on our club leaderboard, track daily solving streaks, and prepare for tier-1 company tech rounds.",
  },
];

export function WhyJoin() {
  return (
    <section id="why-join" className="py-24 bg-background border-t border-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="font-mono text-xs text-accent uppercase tracking-wider block mb-2">
            // Club Privileges
          </span>
          <h2 className="font-heading font-extrabold text-ink text-3xl sm:text-5xl tracking-tight">
            What You Get As A Member
          </h2>
          <p className="text-base text-ink-muted mt-4">
            Everything you need to accelerate your software engineering career right from the DBIT campus.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                className="minimal-card minimal-card-red-hover rounded-2xl p-6 flex flex-col gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-subsurface border border-border flex items-center justify-center text-accent shadow-sm">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-heading font-bold text-ink text-lg">
                  {b.title}
                </h3>
                <p className="text-sm text-ink-muted leading-relaxed">
                  {b.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
