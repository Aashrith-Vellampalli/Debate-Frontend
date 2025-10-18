"use client";

import React from 'react';

export default function DebateProgressBar({ forPercent = 55, againstPercent = 45 }) {
  const f = Math.max(0, Math.min(100, forPercent));
  const a = Math.max(0, Math.min(100, againstPercent));
  return (
    <div className="w-full p-4 bg-gradient-to-r from-white/50 to-white/30 backdrop-blur-sm rounded-2xl shadow-inner border border-white/40">
      <div className="w-full h-6 bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 rounded-full overflow-hidden relative shadow-inner">
        <div
          className="absolute left-0 top-0 h-full transition-all duration-700 ease-out shadow-lg"
          style={{ width: `${f}%`, background: 'linear-gradient(90deg, #10b981, #06b6d4, #3b82f6)' }}
        />
        <div
          className="absolute right-0 top-0 h-full transition-all duration-700 ease-out shadow-lg"
          style={{ width: `${a}%`, background: 'linear-gradient(90deg, #f43f5e, #fb923c, #f97316)' }}
        />
      </div>

      <div className="mt-4 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm" />
          <span className="text-sm font-bold text-emerald-700">For: {f}%</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-rose-100 to-orange-100 rounded-full">
          <span className="text-sm font-bold text-rose-700">Against: {a}%</span>
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-500 to-orange-500 shadow-sm" />
        </div>
      </div>
    </div>
  );
}
