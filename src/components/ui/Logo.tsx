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
        <div className="w-8 h-8 rounded-lg bg-[#121212] border border-white/10 flex items-center justify-center transition-all duration-300 group-hover:border-red-500/50 group-hover:shadow-[0_0_15px_rgba(239,68,68,0.25)]">
          <svg
            className={className}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Minimalist Solid Geometric Shapes */}
            <path
              d="M4 6H10V18H4V6Z"
              fill="white"
            />
            <path
              d="M14 6H20V12H14V6Z"
              fill="#EF4444"
            />
            <path
              d="M14 14H20V18H14V14Z"
              fill="#737373"
            />
          </svg>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 leading-none">
            <span className="font-heading font-extrabold text-white text-base tracking-tight">
              LINUX
            </span>
            <span className="font-heading font-extrabold text-red-500 text-base tracking-tight">
              OSS
            </span>
            <span className="font-heading font-extrabold text-white text-base tracking-tight">
              CLUB
            </span>
          </div>
          <span className="font-mono text-[9px] text-[#737373] tracking-widest uppercase mt-0.5">
            ENGINEERING COLLECTIVE
          </span>
        </div>
      )}
    </div>
  );
}
