'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Binary, Terminal, Server, Cpu } from 'lucide-react';

const tracks = [
  {
    num: '01',
    title: 'Data Structures & Algorithms',
    desc: 'Master computational complexity, trees, graphs, dynamic programming, bit manipulation, and competitive problem sets.',
    icon: Binary,
    tags: ['C++', 'Java', 'LeetCode', 'Codeforces'],
  },
  {
    num: '02',
    title: 'Linux Systems & Kernel Architecture',
    desc: 'POSIX APIs, multi-threading, custom shell development, Linux memory models, file systems, and system calls.',
    icon: Terminal,
    tags: ['C', 'Bash', 'Arch Linux', 'GDB'],
  },
  {
    num: '03',
    title: 'Cloud & Modern Full-Stack',
    desc: 'Scalable backend architectures, REST & gRPC microservices, Next.js, Go/Rust web servers, Docker containerization.',
    icon: Server,
    tags: ['Next.js 15', 'Go', 'Rust', 'Docker'],
  },
  {
    num: '04',
    title: 'AI Systems & Open Tooling',
    desc: 'Local model inference, CUDA optimizations, open-source AI tooling, vector embeddings, and LLM automation pipelines.',
    icon: Cpu,
    tags: ['PyTorch', 'Ollama', 'FastAPI', 'HuggingFace'],
  },
];

export function FocusAreas() {
  return (
    <section id="focus-areas" className="py-24 relative overflow-hidden border-t border-border bg-background transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <span className="font-mono text-xs text-accent uppercase tracking-wider block mb-2">
              // Core Curriculum
            </span>
            <h2 className="font-heading font-extrabold text-ink text-3xl sm:text-5xl tracking-tight">
              Four Specialized Engineering Tracks
            </h2>
          </div>
          <p className="text-sm text-ink-muted max-w-md">
            Whether you are starting from your 1st year or preparing for top tech product firms in your 4th year, our tracks provide hands-on roadmaps.
          </p>
        </div>

        {/* Tracks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tracks.map((track, i) => {
            const Icon = track.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="minimal-card minimal-card-red-hover rounded-2xl p-8 group relative overflow-hidden"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-subsurface border border-border flex items-center justify-center text-ink group-hover:text-accent transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-mono text-2xl font-bold text-ink-muted/30 group-hover:text-accent/60 transition-colors">
                    {track.num}
                  </span>
                </div>

                <h3 className="font-heading font-bold text-ink text-2xl mb-3 group-hover:text-accent transition-colors">
                  {track.title}
                </h3>

                <p className="text-sm text-ink-muted leading-relaxed mb-6">
                  {track.desc}
                </p>

                <div className="flex flex-wrap gap-2 pt-4 border-t border-border">
                  {track.tags.map((tag, tagIdx) => (
                    <span
                      key={tagIdx}
                      className="px-2.5 py-1 rounded bg-subsurface border border-border font-mono text-[11px] text-ink-muted group-hover:border-accent/30 transition-colors"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
