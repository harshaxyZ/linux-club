'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Monitor, Users, Trophy, Code, Zap, Flame } from 'lucide-react';
import { SITE } from '../../lib/site';

const benefits = [
  {
    icon: Monitor,
    title: 'Daily lab + Ubuntu environment',
    desc: `${SITE.lab}, ${SITE.hours}. WSL-first so existing machines work as-is, with stable internet for cloning, packages, and docs.`,
  },
  {
    icon: Users,
    title: 'Mentored tracks, fair evaluation',
    desc: 'Core team owns each domain track. Published monthly scoring - attendance, tasks, Git activity, initiative - with written feedback and appeal to faculty.',
  },
  {
    icon: Trophy,
    title: 'Hackathons + GSoC pipeline',
    desc: 'Trained teams for inter-college and national hackathons, Hacktoberfest drives, and mentored GSoC proposals from org selection to execution.',
  },
  {
    icon: Code,
    title: 'Public GitHub organisation',
    desc: `All projects, resources, and docs live in our public org (${SITE.github.replace('https://', '')}). Every member builds reviewable work.`,
  },
  {
    icon: Zap,
    title: 'Foundation for juniors',
    desc: 'Mandatory Unix/Linux and Git baseline before track work. 1st to 3rd sem start from programming fundamentals in whichever language they choose; no one is left behind.',
  },
  {
    icon: Flame,
    title: 'Recognition, not just filtering',
    desc: 'High monthly scorers get hackathon priority, project ownership, and core-team consideration. The cumulative record powers certificates and recommendations.',
  },
];

export function WhyJoin() {
  return (
    <section id="why-join" className="py-16 sm:py-24 bg-background border-t border-border transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-16">
          <span className="font-mono text-xs text-accent uppercase tracking-wider block mb-2">
            {'// Why members stay'}
          </span>
          <h2 className="font-heading font-extrabold text-ink text-3xl sm:text-5xl tracking-tight">
            Built for sustained work
          </h2>
          <p className="text-base text-ink-muted mt-4">
            Not a one-time test club - a daily practice with mentoring, public output, and monthly accountability.
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
                <h3 className="font-heading font-bold text-ink text-lg">{b.title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{b.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
