import React from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';
import { Code2 as Github, Linkedin, MessageCircle, MessageSquare } from 'lucide-react';
import { SITE } from '../../lib/site';

export function Footer() {
  return (
    <footer className="bg-surface border-t border-border relative z-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="md:col-span-2 flex flex-col gap-4">
            <Logo />
            <p className="text-sm text-ink-muted leading-relaxed max-w-md">
              {SITE.shortName}, {SITE.college}. A student-run technical club building open-source
              contributors, strong problem solvers, and hackathon teams - guided by {SITE.facultyCoordinator}.
            </p>
            <p className="text-xs font-mono text-ink-muted">
              Daily sessions {SITE.hours} • {SITE.lab}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-ink text-xs uppercase tracking-wider mb-4 font-mono">
              {'// Navigation'}
            </h4>
            <ul className="space-y-2.5 text-xs font-mono text-ink-muted">
              <li><Link href="/#about" className="hover:text-ink transition-colors">About Club</Link></li>
              <li><Link href="/#focus-areas" className="hover:text-ink transition-colors">Domains</Link></li>
              <li><Link href="/#events" className="hover:text-ink transition-colors">Events</Link></li>
              <li><Link href="/#roadmap" className="hover:text-ink transition-colors">First Month</Link></li>
              <li><Link href="/apply" className="text-accent hover:underline font-semibold">Apply Now →</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-ink text-xs uppercase tracking-wider mb-4 font-mono">
              {'// Connect'}
            </h4>
            <ul className="space-y-2.5 text-xs font-mono text-ink-muted">
              <li>
                <a href={SITE.github} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-ink transition-colors">
                  <Github className="w-3.5 h-3.5" />
                  <span>GitHub Organisation</span>
                </a>
              </li>
              <li>
                <a href={SITE.discord} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-ink transition-colors">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Community Discord</span>
                </a>
              </li>
              <li>
                <a href={SITE.linkedin} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-ink transition-colors">
                  <Linkedin className="w-3.5 h-3.5" />
                  <span>LinkedIn Page</span>
                </a>
              </li>
              <li>
                <a href={SITE.whatsapp} target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-ink transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Group</span>
                </a>
              </li>
              <li>
                <Link href="/account" className="hover:text-ink transition-colors">My Application</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-muted font-mono">
          <p>© {new Date().getFullYear()} {SITE.shortName}, {SITE.college}.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms</Link>
            <span className="opacity-80">Ubuntu-first • GitHub</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
