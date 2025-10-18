"use client";

import React from 'react';

// MessageBubble is resilient to different message shapes returned by the backend.
// Supported shapes:
//  - { user, time, text }
//  - { username, message }
//  - { username, message, createdAt }
export default function MessageBubble({ user, time, text, msg, side = 'for' }) {
  // If caller passed a message object via `msg`, prefer its fields.
  const source = msg || {};

  const author =
    user ||
    source.authorName ||
    source.author ||
    source.user ||
    source.username ||
    source.name ||
    '';
  const body = text || source.text || source.message || '';
  const ts = time || source.time || source.createdAt || source.timestamp || new Date().toISOString();

  const isFor = side === 'for';
  const bg = isFor 
    ? 'bg-gradient-to-br from-brand-900/10 via-emerald-500/5 to-indigo-500/5 border-l-4 border-brand-500/60' 
    : 'bg-gradient-to-br from-brand-900/10 via-rose-500/5 to-pink-500/5 border-l-4 border-pink-500/60';
  const avatarBg = isFor ? 'bg-gradient-to-br from-brand-500 to-indigo-500' : 'bg-gradient-to-br from-pink-500 to-rose-500';
  const formatted = (() => {
    try { return new Date(ts).toLocaleString(); } catch (e) { return ts; }
  })();

  return (
    <div className={`p-5 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 ${bg} max-w-full animate-fade-in backdrop-blur-sm`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-full ${avatarBg} flex items-center justify-center text-white font-bold text-sm shadow-md`}>
          {author ? author[0]?.toUpperCase() : '?'}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-zinc-100">{author}</div>
          <div className="text-xs text-zinc-400 mt-0.5">{formatted}</div>
        </div>
      </div>
      <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap pl-12">{body}</div>
    </div>
  );
}
