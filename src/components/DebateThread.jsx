"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import DebateProgressBar from './DebateProgressBar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import api from '../api/axios';
import { toast } from 'react-hot-toast';

export default function DebateThread({ id, title = 'Debate' }) {
  const [forMessages, setForMessages] = useState([]);
  const [againstMessages, setAgainstMessages] = useState([]);
  const containerRef = useRef();
  const { user: currentUser, hydrated } = useAuth();

  useEffect(() => {
    let mounted = true;
    if (!id) return undefined;

    async function load() {
      try {
        const res = await api.get(`/api/debates/${id}`);
        if (!mounted) return;
        const data = res.data || {};

        let f = [];
        let a = [];
        if (Array.isArray(data.messagesFor)) {
          f = data.messagesFor;
        }
        if (Array.isArray(data.messagesAgainst)) {
          a = data.messagesAgainst;
        }
        if (!f.length && !a.length && Array.isArray(data.messages)) {
          data.messages.forEach((m) => {
            if (m.side === 'for' || m.side === 'For') f.push(m);
            else a.push(m);
          });
        }

        const normalize = (m) => ({
          ...m,
          user:
            m.user || m.username || m.name || m.authorName || m.author || m.createdBy || '',
          text: m.text || m.message || '',
          time: m.time || m.createdAt || m.timestamp || new Date().toISOString(),
        });

        setForMessages(f.map(normalize));
        setAgainstMessages(a.map(normalize));
      } catch (err) {
      }
    }

    load();

    const interval = setInterval(() => {
      load();
    }, 10_000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [id]);

  const total = forMessages.length + againstMessages.length || 1;
  const forPct = Math.round((forMessages.length / total) * 100);
  const againstPct = 100 - forPct;

  function handleSend({ text, side, time }) {
  const username = hydrated ? (currentUser?.username || currentUser?.name || '') : '';
  const msg = { user: username, time: new Date().toISOString(), text };

    const prevFor = forMessages;
    const prevAgainst = againstMessages;

    if (side === 'for') {
      setForMessages((s) => [...s, msg]);
      sendMessage(id, 'For', text)
        .then((serverMsg) => {
          if (serverMsg) toast.success(serverMsg);
        })
        .catch((err) => {
          setForMessages(prevFor);
          const serverMsg = err?.response?.data?.message || err?.message || 'Failed to save message to server';
          const status = err?.response?.status;
          toast.error(status ? `${serverMsg} (${status})` : serverMsg);
        });
    } else {
      setAgainstMessages((s) => [...s, msg]);
      sendMessage(id, 'Against', text)
        .then((serverMsg) => {
          if (serverMsg) toast.success(serverMsg);
        })
        .catch((err) => {
          setAgainstMessages(prevAgainst);
          const serverMsg = err?.response?.data?.message || err?.message || 'Failed to save message to server';
          const status = err?.response?.status;
          toast.error(status ? `${serverMsg} (${status})` : serverMsg);
        });
    }
  }

  async function sendMessage(debateId, type, message) {
    if (!debateId) return;
    try {
      const res = await api.put(`/api/debates/${debateId}/message`, { type, message });
      return res?.data?.message;
    } catch (err) {
      throw err;
    }
  }

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [forMessages.length, againstMessages.length]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-900/30 to-surface-50 flex flex-col">
      <header className="max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <div className="bg-surface-50/70 backdrop-blur-xl rounded-2xl shadow-glow border border-white/10 p-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-fuchsia-300 via-violet-300 to-pink-300 bg-clip-text text-transparent drop-shadow">{title}</h1>
          {/* Active users count removed per request */}

          <div className="mt-6">
            <DebateProgressBar forPercent={forPct} againstPercent={againstPct} />
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col">

        <div ref={containerRef} className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-auto pb-32">
          <section className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-full shadow-md">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                <h2 className="font-bold text-sm uppercase tracking-wide">For</h2>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-brand-900/40 to-transparent" />
            </div>
            {forMessages.map((m, i) => (
              <div key={i} className="animate-fade-in">
                <MessageBubble msg={m} side="for" />
              </div>
            ))}
          </section>
          <section className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px flex-1 bg-gradient-to-l from-pink-900/40 to-transparent" />
              <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-rose-600 text-white rounded-full shadow-md">
                <h2 className="font-bold text-sm uppercase tracking-wide">Against</h2>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
              </div>
            </div>
            {againstMessages.map((m, i) => (
              <div key={i} className="animate-fade-in">
                <MessageBubble msg={m} side="against" />
              </div>
            ))}
          </section>
        </div>

        <div className="fixed bottom-4 left-0 right-0 flex justify-center pointer-events-none z-50">
          <div className="w-full max-w-6xl pointer-events-auto px-4">
            <MessageInput onSend={handleSend} />
          </div>
        </div>
      </main>
    </div>
  );
}
