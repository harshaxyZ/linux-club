import React from 'react';
import Link from 'next/link';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { BackgroundGrid } from '../components/ui/BackgroundGrid';
import { Terminal, ArrowLeft, ArrowRight } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-background font-body text-ink relative">
      <BackgroundGrid />
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 relative z-10 py-16">
        <div className="minimal-card rounded-3xl p-8 sm:p-12 text-center shadow-2xl max-w-md w-full">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-subsurface border border-border flex items-center justify-center mb-6">
            <Terminal className="w-7 h-7 text-accent" />
          </div>
          <p className="font-mono text-xs text-accent uppercase tracking-widest mb-2">{'// 404 - route not found'}</p>
          <h1 className="font-heading font-extrabold text-ink text-3xl tracking-tight">guest@ossc: command not found</h1>
          <p className="text-sm text-ink-muted mt-3">The page you asked for does not exist or was moved.</p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#E11D48] hover:bg-[#F43F5E] !text-white font-mono font-bold text-xs uppercase tracking-wider px-6 py-3 rounded-xl"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back Home</span>
            </Link>
            <Link
              href="/apply"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-surface hover:bg-subsurface border border-border text-ink font-mono text-xs uppercase tracking-wider px-6 py-3 rounded-xl"
            >
              <span>Apply</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
