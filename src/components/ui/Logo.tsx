import React from 'react';
import Image from 'next/image';
import { SITE } from '../../lib/site';

export function Logo({ 
  className = "w-7 h-7", 
  showText = true 
}: { 
  className?: string; 
  showText?: boolean 
}) {
  return (
    <div className="flex items-center gap-3 select-none group cursor-pointer">
      <div className="relative flex items-center justify-center">
        {/* OSSC badge emblem */}
        <div className="w-9 h-9 rounded-full overflow-hidden ring-1 ring-border transition-all duration-300 group-hover:ring-accent/60 group-hover:shadow-[0_0_15px_var(--accent-glow)]">
          <Image
            src="/logo.jpg"
            alt="OSSC - OpenSource Students Club"
            width={72}
            height={72}
            priority
            className={`${className} w-full h-full object-cover`}
          />
        </div>
      </div>

      {showText && (
        <>
          <div className="hidden min-[420px]:flex flex-col">
            {/* One word, no gap: the accent only colours the OSS glyphs. */}
            <div className="font-heading font-extrabold text-base tracking-tight leading-none">
              <span className="text-accent">OSS</span>
              <span className="text-ink">C</span>
              <span className="text-ink-muted font-mono text-[11px] ml-1.5">DBIT</span>
            </div>
            <span className="font-mono text-[9px] text-ink-muted tracking-wider uppercase mt-0.5 whitespace-nowrap">
              {SITE.tagline}
            </span>
          </div>
          <span className="min-[420px]:hidden font-heading font-extrabold text-ink text-sm tracking-tight leading-none">
            <span className="text-accent">OSS</span>C{' '}
            <span className="text-ink-muted font-mono text-[11px]">DBIT</span>
          </span>
        </>
      )}
    </div>
  );
}
