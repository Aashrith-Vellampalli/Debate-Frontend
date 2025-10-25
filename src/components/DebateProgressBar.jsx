"use client";

import React from 'react';

export default function DebateProgressBar({ forPercent = 55, againstPercent = 45 }) {
  const f = Math.max(0, Math.min(100, forPercent));
  const a = Math.max(0, Math.min(100, againstPercent));
  return (
    <div className="w-full p-4 bg-surface-50/60 backdrop-blur-xl rounded-2xl border border-white/10 shadow-inner">
      <div className="w-full h-6 rounded-full overflow-hidden relative shadow-inner border border-white/10" style={{ background: '#0f172a' }}>
        {/* Left (For) - Blue gradient */}
        <div
          className="absolute left-0 top-0 h-full transition-all duration-700 ease-out shadow-lg"
          style={{ width: `${f}%`, background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}
        />
        {/* Right (Against) - Red/Orange gradient */}
        <div
          className="absolute right-0 top-0 h-full transition-all duration-700 ease-out shadow-lg"
          style={{ width: `${a}%`, background: 'linear-gradient(90deg, #ef4444, #f97316)' }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }} />
          <span className="text-sm font-bold text-zinc-200">For: {f}%</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <span className="text-sm font-bold text-zinc-200">Against: {a}%</span>
          <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: 'linear-gradient(90deg, #ef4444, #f97316)' }} />
        </div>
      </div>
    </div>
  );
}
