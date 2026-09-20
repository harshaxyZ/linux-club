import React from 'react';
import Image from 'next/image';

/**
 * OSSC logo: the round badge next to the OSSC banner wordmark.
 *
 * The banner artwork has white text drawn for a dark backdrop, which disappears
 * on a light page, so two variants are shipped and swapped by theme: the light
 * one has the club name and tagline recoloured to dark aubergine, and both keep
 * the orange OSSC letter gradient.
 */
export function Logo({
  size = 'sm',
  showText = true,
}: {
  className?: string;
  /** `sm` for the header, `lg` for the footer. */
  size?: 'sm' | 'lg';
  showText?: boolean;
}) {
  const badge = size === 'lg' ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-9 h-9';
  const ribbon = size === 'lg' ? 'h-14 sm:h-16' : 'h-9 sm:h-10';
  const gap = size === 'lg' ? 'gap-4' : 'gap-2.5';

  return (
    <div className={`flex items-center ${gap} select-none group cursor-pointer`}>
      {/* Round OSSC badge */}
      <div
        className={`${badge} shrink-0 rounded-full overflow-hidden ring-1 ring-accent/30 transition-all duration-300 group-hover:ring-accent/60 group-hover:shadow-[0_0_15px_var(--accent-glow)]`}
      >
        <Image
          src="/logo.jpg"
          alt="OSSC badge"
          width={160}
          height={160}
          priority
          className="w-full h-full object-cover"
        />
      </div>

      {showText && (
        <>
          {/* Light mode: club name and tagline recoloured dark so they are legible
              on a light page. The OSSC letter gradient is untouched. */}
          <Image
            src="/banner-blend-light.png"
            alt="OSSC - OpenSource Students Club - Engineering Beyond the Classroom"
            width={449}
            height={195}
            priority
            className={`${ribbon} w-auto object-contain block dark:hidden transition-transform duration-300 group-hover:scale-[1.02]`}
          />
          {/* Dark mode: original artwork, white text on the aubergine page. */}
          <Image
            src="/banner-blend.png"
            alt=""
            aria-hidden="true"
            width={449}
            height={195}
            priority
            className={`${ribbon} w-auto object-contain hidden dark:block transition-transform duration-300 group-hover:scale-[1.02] [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.55))]`}
          />
        </>
      )}
    </div>
  );
}
