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
    <div className="w-full overflow-hidden border-y border-white/[0.08] bg-[#050505] py-5 select-none relative">
      {/* Edge gradient masks for seamless fade */}
      <div className="absolute left-0 inset-y-0 w-24 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 inset-y-0 w-24 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

      <div className="flex w-max animate-marquee space-x-8">
        {[...partners, ...partners].map((item, i) => {
          const Icon = item.icon;
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-5 py-2 rounded-xl bg-[#0D0D0D] border border-white/[0.06] hover:border-red-500/40 transition-colors group cursor-default"
            >
              <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-white group-hover:text-red-500 transition-colors">
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-xs text-white tracking-tight group-hover:text-red-400 transition-colors">
                  {item.name}
                </span>
                <span className="font-mono text-[9px] text-[#737373] uppercase tracking-wider">
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
