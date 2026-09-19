'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';
import { ArrowRight, Sun, Moon } from 'lucide-react';
import { useTheme } from '../theme/ThemeProvider';

export function Header({ showNav = true }: { showNav?: boolean }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl border-b transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Navigation Links */}
        {showNav && (
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/#about"
            className="text-xs font-mono uppercase tracking-wider text-ink-muted hover:text-ink transition-colors"
          >
            About
          </Link>
          <Link
            href="/#focus-areas"
            className="text-xs font-mono uppercase tracking-wider text-ink-muted hover:text-ink transition-colors"
          >
            Tracks
          </Link>
          <Link
            href="/#events"
            className="text-xs font-mono uppercase tracking-wider text-ink-muted hover:text-ink transition-colors"
          >
            Events
          </Link>
          <Link
            href="/#roadmap"
            className="text-xs font-mono uppercase tracking-wider text-ink-muted hover:text-ink transition-colors"
          >
            Roadmap
          </Link>
        </nav>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={mounted && theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={mounted && theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-lg border border-border bg-surface hover:bg-subsurface text-ink-muted hover:text-ink transition-colors flex items-center justify-center cursor-pointer shadow-sm"
          >
            {mounted && theme === 'light' ? (
              <Moon className="w-4 h-4 text-slate-700 hover:text-slate-900 transition-colors" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400 hover:text-amber-300 transition-colors" />
            )}
          </button>

          {/* Action CTA */}
          <Link
            href="/apply"
            className="inline-flex items-center justify-center gap-2 bg-accent hover:bg-accent-hover !text-accent-contrast font-mono font-bold text-xs uppercase tracking-wider px-4 sm:px-5 py-2.5 rounded-lg shadow-lg shadow-accent/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Apply Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
