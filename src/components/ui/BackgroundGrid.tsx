'use client';

import React, { useEffect, useRef } from 'react';

export function BackgroundGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    const reduceMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Fewer particles on small screens: cheaper on mobile GPUs and batteries.
    const isSmallScreen = width < 640;
    const particleCount = reduceMotion
      ? 0
      : Math.min(Math.floor((width * height) / 30000), isSmallScreen ? 16 : 40);
    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      radius: Math.random() * 1.5 + 0.8,
      alpha: Math.random() * 0.3 + 0.1,
      isRed: Math.random() > 0.8,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const isLight = document.documentElement.classList.contains('light');

      // Grid line colors adapting to theme
      ctx.strokeStyle = isLight ? 'rgba(0, 0, 0, 0.035)' : 'rgba(255, 255, 255, 0.025)';
      ctx.lineWidth = 1;
      const gridSize = 64;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw particles
      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        if (p.isRed) {
          ctx.fillStyle = isLight
            ? `rgba(var(--accent-rgb), ${p.alpha * 0.9})`
            : `rgba(239, 68, 68, ${p.alpha * 1.5})`;
        } else {
          ctx.fillStyle = isLight
            ? `rgba(15, 23, 42, ${p.alpha * 0.5})`
            : `rgba(255, 255, 255, ${p.alpha})`;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            if (p.isRed || p2.isRed) {
              ctx.strokeStyle = isLight
                ? `rgba(var(--accent-rgb), ${0.1 * (1 - dist / 110)})`
                : `rgba(239, 68, 68, ${0.12 * (1 - dist / 110)})`;
            } else {
              ctx.strokeStyle = isLight
                ? `rgba(15, 23, 42, ${0.05 * (1 - dist / 110)})`
                : `rgba(255, 255, 255, ${0.06 * (1 - dist / 110)})`;
            }
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // Pause the loop when the tab is hidden to save mobile battery.
    const handleVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(animationFrameId);
      } else {
        cancelAnimationFrame(animationFrameId);
        render();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibility);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-background transition-colors duration-200">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-accent/[0.04] blur-[140px] rounded-full pointer-events-none" />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-80" />
    </div>
  );
}
