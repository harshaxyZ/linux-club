import React from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';
import { Code2 as Github, Terminal, MessageSquare } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border relative z-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Brand Info */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Logo />
            <p className="text-sm text-ink-muted leading-relaxed max-w-md">
              The premier open-source engineering collective. We build low-level systems, solve hard algorithmic challenges, and master production software engineering.
            </p>
            <div className="flex items-center gap-2 text-xs font-mono text-ink-muted mt-2">
              <span className="text-accent font-bold">&gt;</span>
              <span>Crafted for students of DBIT</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-ink text-xs uppercase tracking-wider mb-4 font-mono">
              // Navigation
            </h4>
            <ul className="space-y-2.5 text-xs font-mono text-ink-muted">
              <li>
                <Link href="/#about" className="hover:text-ink transition-colors">
                  About Collective
                </Link>
              </li>
              <li>
                <Link href="/#focus-areas" className="hover:text-ink transition-colors">
                  Core Tracks
                </Link>
              </li>
              <li>
                <Link href="/#events" className="hover:text-ink transition-colors">
                  Club Events
                </Link>
              </li>
              <li>
                <Link href="/#roadmap" className="hover:text-ink transition-colors">
                  Cohort Roadmap
                </Link>
              </li>
              <li>
                <Link href="/apply" className="text-accent hover:underline font-semibold transition-colors">
                  Apply Now →
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-heading font-semibold text-ink text-xs uppercase tracking-wider mb-4 font-mono">
              // Connect
            </h4>
            <ul className="space-y-2.5 text-xs font-mono text-ink-muted">
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-ink transition-colors"
                >
                  <Github className="w-3.5 h-3.5 text-ink" />
                  <span>GitHub Organization</span>
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 hover:text-ink transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Community Discord</span>
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted font-mono">
          <p>
            © {new Date().getFullYear()} Linux OSS Club. All rights reserved.
          </p>
          <p className="text-ink-muted opacity-80">
            Built for engineers who build in public.
          </p>
        </div>
      </div>
    </footer>
  );
}
