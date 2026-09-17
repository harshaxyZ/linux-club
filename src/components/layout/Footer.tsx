import React from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';
import { Code2 as Github, Terminal, MessageSquare } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-black border-t border-white/[0.08] relative z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Logo />
            <p className="text-sm text-[#A3A3A3] leading-relaxed max-w-md">
              The premier open-source engineering collective. We build low-level systems, solve hard algorithmic challenges, and master production software engineering.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-[#737373] mt-2">
              <span className="text-red-500 font-bold">&gt;</span>
              <span>Crafted for students of DBIT</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-white text-xs uppercase tracking-wider mb-4 font-mono">
              // Navigation
            </h4>
            <ul className="space-y-2.5 text-xs font-mono text-[#A3A3A3]">
              <li>
                <a href="#about" className="hover:text-white transition-colors">
                  About Collective
                </a>
              </li>
              <li>
                <a href="#focus-areas" className="hover:text-white transition-colors">
                  Core Tracks
                </a>
              </li>
              <li>
                <a href="#roadmap" className="hover:text-white transition-colors">
                  Cohort Roadmap
                </a>
              </li>
              <li>
                <Link href="/apply" className="text-red-400 hover:text-red-300 font-semibold transition-colors">
                  Apply Now →
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-heading font-semibold text-white text-xs uppercase tracking-wider mb-4 font-mono">
              // Connect
            </h4>
            <ul className="space-y-2.5 text-xs font-mono text-[#A3A3A3]">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Github className="w-3.5 h-3.5 text-white" />
                  <span>GitHub Organization</span>
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#A3A3A3]" />
                  <span>Community Discord</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#737373] font-mono">
          <p>
            © {new Date().getFullYear()} Linux OSS Club. All rights reserved.
          </p>
          <p className="text-[#525252]">
            Built for engineers who build in public.
          </p>
        </div>
      </div>
    </footer>
  );
}
