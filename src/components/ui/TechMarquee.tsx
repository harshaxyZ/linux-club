'use client';

import React from 'react';
import { 
  Code2 as Github, 
  Terminal, 
  Database, 
  Cpu, 
  ShieldAlert, 
  Sparkles, 
  Layers, 
  Binary, 
  Boxes, 
  Globe 
} from 'lucide-react';

const partners = [
  { name: 'GitHub', tag: 'Open Source', icon: Github },
  { name: 'Vercel', tag: 'Cloud Deployment', icon: Boxes },
  { name: 'Supabase', tag: 'Postgres & Auth', icon: Database },
  { name: 'Google AI Studio', tag: 'LLM Systems', icon: Sparkles },
  { name: 'Antigravity', tag: 'Agentic Engineering', icon: Terminal },
  { name: 'Claude Code', tag: 'Dev Engine', icon: Cpu },
  { name: 'LeetCode', tag: 'DSA Problem Sets', icon: Layers },
  { name: 'Hack The Box', tag: 'Security & Labs', icon: ShieldAlert },
  { name: 'HackerRank', tag: 'Competitive Arena', icon: Binary },
  { name: 'HackerEarth', tag: 'Campus Sprints', icon: Globe },
];

export function TechMarquee() {
  return (
    <div className="w-full overflow-hidden border-y border-border bg-surface/60 py-5 select-none relative transition-colors duration-200">
      {/* Edge gradient masks for seamless fade adapting to background */}
      <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />

      <div className="flex w-max animate-marquee space-x-8">
        {[...partners, ...partners].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-2.5 rounded-xl bg-surface border border-border hover:border-accent/40 shadow-sm transition-all group cursor-default"
            >
              <div className="w-7 h-7 rounded-lg bg-subsurface flex items-center justify-center text-ink group-hover:text-accent transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-xs text-ink tracking-tight group-hover:text-accent transition-colors">
                  {item.name}
                </span>
                <span className="font-mono text-[9px] text-ink-muted uppercase tracking-wider">
                  {item.tag}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
