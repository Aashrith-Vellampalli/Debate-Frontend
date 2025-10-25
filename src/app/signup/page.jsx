"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitPayload, setSubmitPayload] = useState(null);
  const { login } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        toast.error('Please enter a valid email address');
        return;
      }
      setLoading(true);
      setSubmitPayload({ name, email, password });
    } catch (err) {
      toast.error('Something went wrong');
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!submitPayload) return;
    let canceled = false;

    async function doSignup() {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
        const res = await axios.post(`${baseUrl}/api/auth/signup`, {
          username: submitPayload.name,
          email: submitPayload.email,
          password: submitPayload.password,
        });
        if (canceled) return;
        if (res?.data) {
          login({ user: res.data.user || null, token: res.data.token || null });
        }
        toast.success('Account created');
        router.push('/');
      } catch (err) {
        const msg = err?.response?.data?.message || 'Signup failed';
        toast.error(msg);
      } finally {
        if (!canceled) setLoading(false);
        setSubmitPayload(null);
      }
    }

    doSignup();

    return () => {
      canceled = true;
    };
  }, [submitPayload, router]);

  return (
    <div className="max-w-md mx-auto mt-16 p-6 bg-surface-50/70 backdrop-blur-xl rounded-2xl border border-white/10 shadow-glow">
      <h1 className="text-2xl font-semibold mb-4 text-zinc-100">Create account</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300">Name</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/60"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 block w-full rounded-md border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 px-3 py-2 text-sm focus:ring-2 focus:ring-brand-500/60"
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-full bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 text-sm shadow transition-colors"
          >
            {loading ? 'Creating...' : 'Create account'}
          </button>
          <a href="/login" className="text-sm text-brand-400 hover:text-brand-300 hover:underline">Already have an account?</a>
        </div>
      </form>
    </div>
  );
}
