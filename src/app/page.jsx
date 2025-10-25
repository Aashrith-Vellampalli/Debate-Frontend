"use client";

import React, { useMemo, useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import DebateCard from '../components/DebateCard';
import AddDebateCard from '../components/AddDebateCard';
import api from '../api/axios';

export default function Home() {
  const [query, setQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({ tags: [], before: '', after: '', sort: '' });
  const [debates, setDebates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get('/api/debates');
        if (!mounted) return;
        if (Array.isArray(res.data)) {
          const normalized = res.data.map((d) => ({
            id: d._id || d.id,
            topic: d.title || d.topic || '',
            date: d.createdAt || d.date || '',
            tags: d.tags || [],
            percentFor: d.percentFor,
            isUser: d.isUser || false,
          }));
          setDebates(normalized);
        } else setDebates([]);
      } catch (err) {        if (mounted) setError('Failed to load debates');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  async function handleDelete(id) {
    try {
      await api.delete(`/api/debates/${id}`);
      setDebates((prev) => prev.filter((d) => d.id !== id));
      toast.success('Debate deleted');
    } catch (err) {      toast.error('Failed to delete debate');
    }
  }

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const tagSuggestions = useMemo(() => {
    const pool = new Set();
    (debates || []).forEach((d) => (d.tags || []).forEach((t) => pool.add(t)));
    return Array.from(pool).sort((a,b)=> a.localeCompare(b));
  }, [debates]);

  const filtered = useMemo(() => {
    const q = (query || '').trim();
  const items = [...(debates || [])];

    const tokens = [];
    const re = /("[^"]+"|\S+)/g; // quoted or non-space
    let m;
    while ((m = re.exec(q)) !== null) tokens.push(m[0]);

  const includeTerms = [];
    const excludeTerms = [];
    const tagFilters = [];
    let dateEq = null;
    let beforeDate = null;
    let afterDate = null;
    let sort = null;

    tokens.forEach((tok) => {
      const tkn = tok.replace(/^"|"$/g, '');
      if (/^-/.test(tkn)) {
        excludeTerms.push(tkn.slice(1).toLowerCase());
        return;
      }
      const kv = tkn.split(':');
      if (kv.length === 2) {
        const k = kv[0].toLowerCase();
        const v = kv[1];
        if (k === 'tag' || k === 'tags') { tagFilters.push(v.toLowerCase()); return; }
        if (k === 'date') { dateEq = v; return; }
        if (k === 'before') { beforeDate = v; return; }
        if (k === 'after') { afterDate = v; return; }
        if (k === 'sort') { sort = v.toLowerCase(); return; }
      }
      includeTerms.push(tkn.toLowerCase());
    });

    const mergedTagFilters = [...(tagFilters || []), ...((filters && filters.tags) || []).map((t) => t.toLowerCase())];
    if (filters && filters.before) beforeDate = filters.before;
    if (filters && filters.after) afterDate = filters.after;
    if (filters && filters.sort) sort = filters.sort;

  const matches = items.filter((d) => {
      const topic = (d.topic || '').toLowerCase();
      const tags = (d.tags || []).map((t) => t.toLowerCase());
      const date = d.date || '';

      const incOk = includeTerms.every((term) => {
        return topic.includes(term) || tags.some((tg) => tg.includes(term));
      });
      if (!incOk) return false;

      const excOk = excludeTerms.every((term) => {
        return !topic.includes(term) && !tags.some((tg) => tg.includes(term));
      });
      if (!excOk) return false;

  const tagOk = mergedTagFilters.every((tf) => tags.includes(tf));
      if (!tagOk) return false;

      if (dateEq && date !== dateEq) return false;
      try {
        if (beforeDate && date) { if (new Date(date) >= new Date(beforeDate)) return false; }
        if (afterDate && date) { if (new Date(date) <= new Date(afterDate)) return false; }
      } catch (e) {}

      return true;
    });

  if (sort === 'date_asc') matches.sort((a,b)=> new Date(a.date) - new Date(b.date));
  if (sort === 'date_desc') matches.sort((a,b)=> new Date(b.date) - new Date(a.date));

    return matches;
  }, [query, debates, filters]);
  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-900/30 to-surface-50">
      <Navbar value={query} onChange={setQuery} onSearch={(v) => setQuery(v)} filters={filters} onFiltersChange={setFilters} tagSuggestions={tagSuggestions} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-fuchsia-300 via-violet-300 to-pink-300 bg-clip-text text-transparent drop-shadow mb-4 inline-block leading-[1.15] pb-1">
            ArguMate
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Engage in meaningful debates, share your views, and learn from thoughtful discussions
          </p>
        </div>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-brand-900/30"></div>
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-t-brand-500 border-r-pink-500 absolute top-0 left-0"></div>
            </div>
            <p className="mt-4 text-zinc-400 text-sm">Loading debates...</p>
          </div>
        ) : error ? (
          <div className="py-20 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900/20 mb-4">
              <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </div>
            <p className="text-red-400 font-medium">{error}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              <AddDebateCard />
              {filtered.map((d, idx) => (
                <DebateCard
                  key={d.id || idx}
                  id={d.id}
                  topic={d.topic}
                  date={d.date}
                  tags={d.tags}
                  isUser={!!d.isUser}
                  onDelete={d.id ? () => handleDelete(d.id) : undefined}
                />
              ))}
            </div>
            
            {/* Empty state when no results */}
            {filtered.length === 0 && debates.length > 0 && (
              <div className="py-20 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-brand-900/20 to-pink-900/20 mb-4">
                  <svg className="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-100 mb-2">No debates found</h3>
                <p className="text-zinc-400 mb-6">Try adjusting your search or filters</p>
                <button 
                  onClick={() => { setQuery(''); setSearchInput(''); setFilters({ tags: [], before: '', after: '', sort: '' }); }}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-brand-500 to-pink-500 text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                  Clear all filters
                </button>
              </div>
            )}
          </>
        )}
      </main>
      {/* react-hot-toast handles toasts globally */}
    </div>
  );
}
