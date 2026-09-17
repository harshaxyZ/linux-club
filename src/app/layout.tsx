import React from 'react';
import './globals.css';
import { ScrollProgressBar } from '../components/ui/ScrollProgressBar';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth bg-black">
      <head>
        <title>Linux Open Source Club</title>
        <meta
          name="description"
          content="The premier engineering collective for Linux systems, Data Structures & Algorithms, and Open Source Software."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-black text-white antialiased selection:bg-red-600 selection:text-white">
        <ScrollProgressBar />
        {children}
      </body>
    </html>
  );
}
