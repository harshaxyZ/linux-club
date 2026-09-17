import React from 'react';
import { Header } from '../components/layout/Header';
import { Footer } from '../components/layout/Footer';
import { Hero } from '../components/home/Hero';
import { TechMarquee } from '../components/ui/TechMarquee';
import { About } from '../components/home/About';
import { FocusAreas } from '../components/home/FocusAreas';
import { Roadmap } from '../components/home/Roadmap';
import { CallToAction } from '../components/home/CallToAction';
import { BackgroundGrid } from '../components/ui/BackgroundGrid';

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-ink font-body relative selection:bg-accent/30 selection:text-white">
      {/* Dynamic Animated Particles & Cyber Grid */}
      <BackgroundGrid />
      
      <Header />
      <main className="flex-1 relative z-10">
        <Hero />
        <TechMarquee />
        <About />
        <FocusAreas />
        <Roadmap />
        <CallToAction />
      </main>
      <Footer />
    </div>
  );
}
