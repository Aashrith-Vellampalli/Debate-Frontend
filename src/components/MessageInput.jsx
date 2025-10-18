"use client";

import React, { useState } from 'react';

export default function MessageInput({ onSend }) {
  const [text, setText] = useState('');
  const [side, setSide] = useState('for');
  function handleSend() {
    if (!text.trim()) return;
    onSend && onSend({ text: text.trim(), side, time: new Date().toISOString(), user: 'You' });
    setText('');
  }
   return (
    <div className="w-full bg-surface-50/70 backdrop-blur-xl rounded-2xl shadow-glow border border-white/10 p-4">
      <div className="flex gap-3 items-stretch">
        <select 
          value={side} 
          onChange={(e) => setSide(e.target.value)} 
          className="rounded-xl border border-white/10 bg-white/5 text-zinc-100 px-4 py-3 text-sm font-semibold hover:border-brand-500/40 focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-transparent transition-all cursor-pointer shadow-sm"
        >
          <option value="for">✓ For</option>
          <option value="against">✗ Against</option>
        </select>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Share your perspective..."
          className="flex-1 rounded-xl border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-transparent transition-all shadow-sm"
        />
        <button 
          onClick={handleSend} 
          className="rounded-xl bg-gradient-to-r from-brand-500 via-pink-500 to-rose-500 text-white px-6 py-3 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={!text.trim()}
        >
          <span className="flex items-center gap-2">
            Send
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </span>
        </button>
      </div>
    </div>
   );
 }
