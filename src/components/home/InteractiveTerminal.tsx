'use client';

import React, { useState } from 'react';
import { Terminal as TerminalIcon, Copy, Check, CornerDownLeft } from 'lucide-react';

export function InteractiveTerminal() {
  const [activeTab, setActiveTab] = useState<'neofetch' | 'dsa' | 'kernel'>('neofetch');
  const [inputVal, setInputVal] = useState('');
  const [copied, setCopied] = useState(false);
  const [commandHistory, setCommandHistory] = useState<Array<{ cmd: string; output: string }>>([]);

  const handleCopy = () => {
    navigator.clipboard.writeText('git clone https://github.com/linux-oss-club/core.git');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim().toLowerCase();
    if (!cmd) return;

    let output = '';
    if (cmd === 'help') {
      output = 'Available commands: about, tracks, events, apply, specs, clear';
    } else if (cmd === 'about') {
      output = 'Linux OSS Club: Premier collective mastering Linux, DSA, and open source systems.';
    } else if (cmd === 'tracks') {
      output = '1. DSA & Problem Solving  2. Linux Systems Architecture  3. Cloud & Web  4. AI Tooling';
    } else if (cmd === 'events') {
      output = 'Upcoming: Linux OSS HackSprint v1.0 • Weekly Vim & Shell Bootcamp every Wednesday.';
    } else if (cmd === 'apply') {
      output = 'Navigating to /apply for membership registration.';
    } else if (cmd === 'specs') {
      output = 'Stack: Arch Linux, GCC 14, Clang, Rust, Go, Neovim, Docker, Next.js, Postgres';
    } else if (cmd === 'clear') {
      setCommandHistory([]);
      setInputVal('');
      return;
    } else {
      output = `Unknown command: '${cmd}'. Type 'help' for options.`;
    }

    setCommandHistory((prev) => [...prev, { cmd: inputVal, output }]);
    setInputVal('');
  };

  return (
    <div className="w-full rounded-2xl overflow-hidden bg-[#0A0A0A] border border-white/[0.12] dark:border-white/[0.08] shadow-2xl relative">
      {/* Titlebar with Minimalist Controls */}
      <div className="bg-[#050505] px-4 py-3 flex flex-wrap items-center justify-between border-b border-white/[0.06] gap-2">
        <div className="flex items-center gap-3">
          {/* Subtle dots */}
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#333333]" />
          </div>

          <div className="h-3 w-[1px] bg-white/10 mx-1 hidden sm:block" />

          {/* Minimalist Tabs */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveTab('neofetch')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'neofetch'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-[#737373] hover:text-white'
              }`}
            >
              system.sys
            </button>
            <button
              onClick={() => setActiveTab('dsa')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'dsa'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-[#737373] hover:text-white'
              }`}
            >
              dsa_runner.cpp
            </button>
            <button
              onClick={() => setActiveTab('kernel')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                activeTab === 'kernel'
                  ? 'bg-white/10 text-white font-semibold'
                  : 'text-[#737373] hover:text-white'
              }`}
            >
              kernel_init.sh
            </button>
          </div>
        </div>

        {/* Copy command action */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-[11px] font-mono text-[#737373] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] px-2.5 py-1 rounded transition-colors cursor-pointer"
        >
          {copied ? <Check className="w-3 h-3 text-red-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied' : 'Clone Repo'}</span>
        </button>
      </div>

      {/* Terminal Screen Body */}
      <div className="p-6 bg-[#080808] font-mono text-xs text-[#A3A3A3] leading-relaxed min-h-[280px] flex flex-col justify-between overflow-x-auto">
        <div>
          {/* Tab 1: System Specs / Neofetch */}
          {activeTab === 'neofetch' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white">
                <span className="text-red-500 font-bold">guest@linux-oss:~$</span>
                <span>neofetch --club</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-3 pt-2 text-[#A3A3A3]">
                <div className="md:col-span-5 text-white font-mono text-[11px] leading-tight hidden sm:block">
                  <pre className="text-red-500 font-bold">
{`   /\\
  /  \\
 / /\\ \\
/ /__\\ \\
\\/____\\/`}
                  </pre>
                  <p className="mt-2 text-white font-semibold">LINUX OSS CLUB</p>
                  <p className="text-[10px] text-[#525252]">Release 2026.1</p>
                </div>
                <div className="md:col-span-7 space-y-1.5 text-xs">
                  <p><span className="text-white font-semibold">OS:</span> Linux Arch x86_64 Core</p>
                  <p><span className="text-white font-semibold">Core Focus:</span> Data Structures, Systems, Open Source</p>
                  <p><span className="text-white font-semibold">Shell:</span> Zsh + Tmux + Neovim</p>
                  <p><span className="text-white font-semibold">Stack:</span> C++, Rust, Go, TypeScript, Python</p>
                  <p><span className="text-white font-semibold">Status:</span> <span className="text-red-400 font-bold">● Accepting Applications</span></p>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: DSA Runner */}
          {activeTab === 'dsa' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white">
                <span className="text-red-500 font-bold">guest@linux-oss:~$</span>
                <span>g++ -O3 -std=c++20 graph_algorithms.cpp &amp;&amp; ./a.out</span>
              </div>
              <div className="p-3 bg-black/60 rounded-lg border border-white/[0.05] text-[11px] space-y-1 text-[#D4D4D4] mt-2">
                <p className="text-white">// Weekly Competitive DSA Benchmark</p>
                <p>✓ Dijkstra Shortest Path: 0.42ms (100,000 nodes)</p>
                <p>✓ Dynamic Programming Optimization: Passed 85/85 Test Cases</p>
                <p>✓ Segment Tree Range Queries: O(log N) Complexity Verified</p>
                <p className="text-red-400 font-bold mt-2">All tests passed! Ready for Codeforces Division rounds.</p>
              </div>
            </div>
          )}

          {/* Tab 3: Kernel Init */}
          {activeTab === 'kernel' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white">
                <span className="text-red-500 font-bold">guest@linux-oss:~$</span>
                <span>./init_system_environment.sh</span>
              </div>
              <div className="p-3 bg-black/60 rounded-lg border border-white/[0.05] text-[11px] space-y-1 text-[#D4D4D4] mt-2">
                <p>[ 0.000000 ] Booting Linux OSS Club Developer Environment...</p>
                <p>[ 0.124012 ] Mounting POSIX Virtual File Systems</p>
                <p>[ 0.354112 ] Initializing Containers &amp; Local Dev Cluster</p>
                <p className="text-red-400 font-bold">[ 0.999120 ] System Ready. Happy Hacking.</p>
              </div>
            </div>
          )}

          {/* User command outputs */}
          {commandHistory.map((item, idx) => (
            <div key={idx} className="mt-3 pt-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-2 text-white">
                <span className="text-red-500 font-bold">guest@linux-oss:~$</span>
                <span>{item.cmd}</span>
              </div>
              <p className="mt-1 text-white">{item.output}</p>
            </div>
          ))}
        </div>

        {/* Command input prompt */}
        <form onSubmit={handleRunCommand} className="flex items-center gap-2 mt-6 pt-3 border-t border-white/[0.08]">
          <span className="text-red-500 font-bold shrink-0">guest@linux-oss:~$</span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type 'help', 'tracks', or 'apply'..."
            className="terminal-input flex-1 !bg-transparent !text-white text-xs font-mono !border-none !outline-none placeholder:!text-[#525252]"
          />
          <button
            type="submit"
            className="text-xs font-mono text-[#737373] hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <span>Run</span>
            <CornerDownLeft className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
}
