"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import api from '../../api/axios';

export default function CreateDebate() {
  const router = useRouter();
  const [topic, setTopic] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed) {
      setError('Topic is required');
      return;
    }

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    for (const t of tags) {
      if (t.length > 30) {
        setError('Each tag must be 30 characters or less');
        return;
      }
      if (t.includes(',')) {
        setError('Tags should not contain commas');
        return;
      }
    }

    const payload = {
      title: trimmed,
      tags,
    };

    try {
      await api.post('/api/debates', payload);
      toast.success('Debate created');
      router.push('/');
    } catch (err) {      toast.error('Failed to create debate');
    }
  }

  return (
    <div className="min-h-screen flex items-start justify-center py-12 px-4">
      <div className="w-full max-w-2xl bg-surface-50/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-glow p-6">
        <h1 className="text-2xl font-semibold mb-4 text-zinc-100">Create a new debate</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300">Topic</label>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 shadow-sm py-2 px-3 focus:ring-2 focus:ring-brand-500/60"
              placeholder="Enter the debate topic"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300">Tags (comma separated)</label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 shadow-sm py-2 px-3 focus:ring-2 focus:ring-brand-500/60"
              placeholder="e.g. AI, ethics, jobs"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          <div className="flex items-center gap-3">
            <button type="submit" className="inline-flex items-center px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-md transition-colors">Create</button>
            <button type="button" onClick={() => router.push('/')} className="text-sm text-zinc-400 hover:text-zinc-200">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
