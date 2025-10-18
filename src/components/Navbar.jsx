"use client";

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function Navbar({
  value = '',
  onChange = () => {},
  onSearch = () => {},
  filters = { tags: [], before: '', after: '', sort: '' },
  onFiltersChange = () => {},
  tagSuggestions = [],
}) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters || { tags: [], before: '', after: '', sort: '' });
  const panelRef = useRef();

  useEffect(() => setLocalFilters(filters || { tags: [], before: '', after: '', sort: '' }), [filters]);

  useEffect(() => {
    function onDoc(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function handleKeyDown(e) {
    if (e.key === 'Enter') onSearch(value);
  }

  function addTagFromString(str) {
    if (!str) return;
    const parts = str.split(',').map((s) => s.trim()).filter(Boolean);
    if (parts.length === 0) return;
    setLocalFilters((s) => ({ ...s, tags: Array.from(new Set([...(s.tags || []), ...parts])) }));
  }

  function handleClear() {
    setLocalFilters({ tags: [], before: '', after: '', sort: '' });
  }

  function handleApply() {
    onFiltersChange(localFilters);
    setOpen(false);
    toast.success('Filters applied');
  }

  return (
    <header className="w-full bg-gradient-to-r from-surface-50/90 via-brand-900/20 to-surface-50/90 backdrop-blur-xl border-b border-brand-800/40 shadow-glow sticky top-0 z-50">
      <nav className="max-w-6xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          {/* Left: Title */}
          <div className="flex items-center justify-center md:justify-start">
            <a href="/" className="text-2xl font-extrabold bg-gradient-to-r from-fuchsia-300 via-violet-300 to-pink-300 bg-clip-text text-transparent drop-shadow hover:scale-105 transition-transform">
              Debate
            </a>
          </div>

          {/* Middle: Search (centered on desktop, full width on mobile) */}
          <div className="flex justify-center">
            <div className="w-full max-w-xl relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <input
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search debates..."
                className="w-full rounded-full border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-400 pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/60 focus:border-transparent transition-all shadow-sm hover:shadow-md"
              />
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center justify-center md:justify-end gap-3">
            {/* Filters popover */}
            <div className="relative">
              <button
                onClick={() => setOpen((s) => !s)}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2 text-sm font-semibold bg-white/10 backdrop-blur-sm text-zinc-200 hover:bg-white/20 hover:border-brand-500/40 hover:shadow-md transition-all"
                aria-expanded={open}
                aria-haspopup="dialog"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
                Filters
                {(localFilters.tags?.length > 0 || localFilters.before || localFilters.after || localFilters.sort) && (
                  <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-gradient-to-r from-brand-500 to-pink-500 text-white text-xs font-bold shadow-sm">{(localFilters.tags?.length || 0) + (localFilters.before ? 1 : 0) + (localFilters.after ? 1 : 0) + (localFilters.sort ? 1 : 0)}</span>
                )}
              </button>

              {open && (
                <div ref={panelRef} className="absolute right-0 mt-3 w-80 bg-surface-100/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-brand-800/30 p-5 z-40">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-zinc-300">Tags</label>
                      <div className="mt-2 flex gap-2 flex-wrap">
                        {(localFilters.tags || []).map((t) => (
                          <span key={t} className="inline-flex items-center gap-2 rounded-full bg-brand-900/30 border border-brand-700/40 px-2 py-0.5 text-xs text-zinc-200">
                            <span>{t}</span>
                            <button
                              onClick={() => setLocalFilters((s) => ({ ...s, tags: (s.tags || []).filter((x) => x !== t) }))}
                              className="text-zinc-400 hover:text-zinc-200"
                              aria-label={`remove ${t}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>

                      <input
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTagFromString(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="mt-2 w-full rounded-md border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 px-2 py-1 text-sm focus:ring-2 focus:ring-brand-500/60"
                        placeholder="add tag and press Enter"
                      />

                      {tagSuggestions && tagSuggestions.length > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-zinc-400 mb-1">Suggestions</div>
                          <div className="flex flex-wrap gap-2">
                            {tagSuggestions.slice(0, 12).map((t) => (
                              <button
                                key={t}
                                onClick={() => setLocalFilters((s) => ({ ...s, tags: Array.from(new Set([...(s.tags || []), t])) }))}
                                className="text-xs bg-brand-900/20 hover:bg-brand-800/30 border border-brand-700/30 text-zinc-200 px-2 py-1 rounded-full transition-colors"
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300">Before</label>
                      <input
                        type="date"
                        value={localFilters.before || ''}
                        onChange={(e) => setLocalFilters((s) => ({ ...s, before: e.target.value }))}
                        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 text-zinc-100 px-2 py-1 text-sm focus:ring-2 focus:ring-brand-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300">After</label>
                      <input
                        type="date"
                        value={localFilters.after || ''}
                        onChange={(e) => setLocalFilters((s) => ({ ...s, after: e.target.value }))}
                        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 text-zinc-100 px-2 py-1 text-sm focus:ring-2 focus:ring-brand-500/60"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-zinc-300">Sort</label>
                      <select
                        value={localFilters.sort || ''}
                        onChange={(e) => setLocalFilters((s) => ({ ...s, sort: e.target.value }))}
                        className="mt-1 w-full rounded-md border border-white/10 bg-white/5 text-zinc-100 px-2 py-1 text-sm focus:ring-2 focus:ring-brand-500/60"
                      >
                        <option value="">Relevance</option>
                        <option value="date_desc">Date: newest</option>
                        <option value="date_asc">Date: oldest</option>
                      </select>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-2">
                      <button onClick={handleClear} className="text-sm font-semibold text-zinc-400 hover:text-zinc-200 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">Clear</button>
                      <button onClick={handleApply} className="rounded-full bg-gradient-to-r from-brand-500 to-pink-500 text-white px-5 py-2 text-sm font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all">Apply</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 1v1 quick action */}
            <a href="/1v1" className="text-sm font-bold text-white bg-gradient-to-r from-brand-500 to-pink-500 px-4 py-2 rounded-full shadow-md hover:shadow-lg hover:scale-105 transition-all">1v1</a>

            {/* Auth area */}
            {user ? (
              <div className="flex items-center gap-3">
                {(() => {
                  const displayName = user?.username || user?.name || (user?.email ? user.email.split('@')[0] : '');
                  return (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r from-brand-900/30 to-pink-900/30 border border-brand-700/40">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-brand-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                        {displayName[0]?.toUpperCase()}
                      </div>
                      <span className="text-sm font-semibold text-zinc-200">{displayName}</span>
                    </div>
                  );
                })()}

                <button
                  onClick={() => {
                    logout();
                    toast.success('Signed out');
                  }}
                  className="text-sm font-semibold text-zinc-300 hover:text-zinc-100 px-4 py-2 rounded-full border border-white/20 hover:border-brand-500/40 hover:bg-white/10 transition-all"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium text-zinc-200 bg-white/10 border border-white/20 hover:bg-white/20 hover:border-brand-500/40 hover:scale-105 transition-all shadow-sm"
                >
                  Log in
                </a>
                <a
                  href="/signup"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold text-white bg-gradient-to-r from-brand-500 via-pink-500 to-rose-500 shadow-lg hover:shadow-2xl hover:scale-105 transition-all"
                >
                  Sign up
                </a>
              </div>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
