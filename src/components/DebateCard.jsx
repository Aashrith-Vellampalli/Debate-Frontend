"use client";

import React from 'react';
import { useAuth } from '../context/AuthContext';
import Link from 'next/link';

export default function DebateCard({ id, topic, date, tags = [], isUser = false, onDelete }) {
  // derive a route id for built-in debates by slugifying the topic
  const routeId = id || encodeURIComponent((topic || '').toLowerCase().replace(/\s+/g, '-'));

  const { user } = useAuth();

  // Format date in a more readable way
  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const d = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - d);
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      // If within last 7 days, show relative time
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      
      // Otherwise show formatted date
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Link href={`/debate/${routeId}`} className="block group outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0" style={{ WebkitTapHighlightColor: 'transparent' }}>
      <article className="bg-surface-50/70 backdrop-blur-xl rounded-2xl shadow-lg hover:shadow-2xl transform transition-all duration-300 hover:-translate-y-1 hover:scale-[1.01] active:scale-[1.005] p-6 md:p-7 flex flex-col justify-between min-h-[220px] relative overflow-hidden outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 active:ring-0">
        {/* Gradient accent on hover */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-brand-600/10 via-pink-500/10 to-indigo-500/10 opacity-0 group-hover:opacity-30 transition-opacity duration-300 pointer-events-none" />
        
        {/* Decorative corner element */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-brand-600/10 to-transparent rounded-bl-full opacity-40 pointer-events-none" />
        
        <div className="relative z-10">
          {/* Date badge at top */}
          <div className="flex items-center justify-between mb-3">
            <time className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gradient-to-r from-fuchsia-500 to-pink-500 px-3 py-1.5 rounded-full shadow-sm">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              {formatDate(date)}
            </time>
          </div>

          <h3 className="text-xl md:text-2xl font-bold text-zinc-100 mb-4 leading-tight group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-fuchsia-300 group-hover:via-violet-300 group-hover:to-pink-300 group-hover:bg-clip-text group-hover:drop-shadow transition-all">{topic}</h3>

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {(() => {
                const tagClass = 'inline-flex items-center justify-center text-xs font-semibold text-fuchsia-200 bg-gradient-to-r from-fuchsia-500/15 to-pink-500/15 px-3 py-1.5 rounded-full border border-fuchsia-400/30 shadow-sm';
                return (
                  <>
                    {tags.slice(0, 3).map((t, i) => (
                      <span key={i} className={tagClass}>
                        #{t}
                      </span>
                    ))}

                    {tags.length > 3 && (
                      <span className={tagClass}>+{tags.length - 3} more</span>
                    )}
                  </>
                );
              })()}
            </div>
          )}
        </div>

        <div className="mt-auto pt-4 flex items-center justify-between relative z-10">
          {/* View indicator */}
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-fuchsia-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <span className="text-xs font-semibold drop-shadow">
              <span className="bg-gradient-to-r from-fuchsia-300 via-violet-300 to-pink-300 bg-clip-text text-transparent" style={{ WebkitTextFillColor: 'transparent' }}>Join Discussion</span>
            </span>
          </div>
          {(isUser || user?.username === 'admin') && (
            <button 
              onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete && onDelete(); }} 
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-white bg-rose-50 hover:bg-rose-600 px-3 py-1.5 rounded-lg transition-all shadow-sm hover:shadow-md"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete
            </button>
          )}
        </div>
      </article>
    </Link>
  );
}
