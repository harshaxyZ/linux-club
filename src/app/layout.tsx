import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { ScrollProgressBar } from '../components/ui/ScrollProgressBar';
import { ThemeProvider } from '../components/theme/ThemeProvider';

export const metadata: Metadata = {
  title: 'OpenSource Students Club - DBIT',
  description:
    'Student-run Linux, DSA, and open source club at Don Bosco Institute of Technology. Daily sessions 4-6 PM, Lab A-306/A-228. Registration → test → interview → monthly evaluation.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F8FAFC' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('site_theme');
                  var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
                  var theme = saved || (prefersLight ? 'light' : 'dark');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className="min-h-screen bg-background text-ink antialiased selection:bg-accent selection:text-accent-contrast transition-colors duration-200"
        suppressHydrationWarning
      >
        <ThemeProvider>
          <ScrollProgressBar />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
