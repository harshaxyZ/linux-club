import React from 'react';

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
        {/* Geometric Minimalist Emblem */}
        <div className="w-8 h-8 rounded-lg bg-surface border border-border flex items-center justify-center transition-all duration-300 group-hover:border-accent/50 group-hover:shadow-[0_0_15px_rgba(225,29,72,0.25)]">
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Theme-Adaptive Geometric Shapes */}
            <path
              d="M4 6H10V18H4V6Z"
              className="fill-current text-ink transition-colors"
            />
            <path
              d="M14 6H20V12H14V6Z"
              fill="#E11D48"
            />
            <path
              d="M14 14H20V18H14V14Z"
              className="fill-current text-ink-dark opacity-60 transition-colors"
            />
          </svg>
        </div>
      </div>

      {showText && (
        <>
          <div className="hidden min-[420px]:flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-heading font-extrabold text-ink text-base tracking-tight">
              LINUX
            </span>
            <span className="font-heading font-extrabold text-accent text-base tracking-tight">
              OSS
            </span>
            <span className="font-heading font-extrabold text-ink text-base tracking-tight">
              CLUB
            </span>
          </div>
          <span className="font-mono text-[9px] text-ink-muted tracking-widest uppercase mt-0.5">
            ENGINEERING COLLECTIVE
          </span>
          </div>
          <span className="min-[420px]:hidden font-heading font-extrabold text-ink text-sm tracking-tight leading-none">
            LOSSC<span className="text-accent">-DBIT</span>
          </span>
        </>
      )}
    </div>
  );
}
