"use client";

import React from 'react';
import Link from 'next/link';

export default function AddDebateCard() {
  return (
    <Link
      href="/create"
      className="group w-full text-left bg-surface-50/70 backdrop-blur-xl rounded-2xl border-2 border-dashed border-purple-500/30 hover:border-fuchsia-400/60 shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-2 hover:scale-[1.02] p-8 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden"
      aria-label="Start a new debate"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-fuchsia-500/15 via-violet-500/12 to-pink-500/15 opacity-0 group-hover:opacity-70 transition-opacity duration-300" />
      
      <div className="absolute top-4 right-4 w-2 h-2 bg-fuchsia-300 rounded-full animate-pulse" />
      <div className="absolute bottom-6 left-6 w-1.5 h-1.5 bg-pink-400 rounded-full animate-pulse delay-75" />
      
      <div className="flex flex-col items-center relative z-10">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white flex items-center justify-center text-3xl font-extrabold shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300 group-hover:rotate-90">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" /></svg>
        </div>
        <h4 className="mt-5 text-xl font-bold bg-gradient-to-r from-fuchsia-300 via-violet-300 to-pink-300 bg-clip-text text-transparent drop-shadow transition-all">Start a New Debate</h4>
        <p className="mt-2 text-sm text-zinc-400 text-center max-w-xs">Create a topic and spark meaningful conversations with the community</p>
        
        {/* Call to action arrow */}
        <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <svg className="w-5 h-5 text-fuchsia-300 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        </div>
      </div>
    </Link>
  );
}
