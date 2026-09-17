'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Logo } from '../ui/Logo';
import { ArrowRight, Sun, Moon } from 'lucide-react';

export function Header() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('site_theme') as 'dark' | 'light' | null;
    if (saved) {
      setTheme(saved);
      document.documentElement.classList.toggle('light', saved === 'light');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      // Optional default
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('site_theme', next);
    document.documentElement.classList.toggle('light', next === 'light');
  };

  return (
    <header className="sticky top-0 z-50 bg-black/90 backdrop-blur-xl border-b border-white/[0.08] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Logo />
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="#about"
            className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3] hover:text-white transition-colors"
          >
            About
          </a>
          <a
            href="#focus-areas"
            className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3] hover:text-white transition-colors"
          >
            Tracks
          </a>
          <a
            href="#roadmap"
            className="text-xs font-mono uppercase tracking-wider text-[#A3A3A3] hover:text-white transition-colors"
          >
            Roadmap
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Theme"
            className="p-2 rounded-lg border border-white/[0.08] bg-[#0A0A0A] hover:bg-[#171717] text-[#A3A3A3] hover:text-white transition-colors flex items-center justify-center cursor-pointer"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>

          {/* Action CTA */}
          <Link
            href="/apply"
            className="inline-flex items-center justify-center gap-2 bg-[#E11D48] hover:bg-[#F43F5E] text-white font-mono font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-lg shadow-lg shadow-rose-600/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Apply Now</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
