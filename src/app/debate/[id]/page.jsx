import React from 'react';
import DebateThread from '../../../components/DebateThread';

export default async function DebatePage(props) {
  const { params } = props;
  let resolvedParams = params;
  if (typeof params?.then === 'function') {
    resolvedParams = await params;
  }
  const id = resolvedParams?.id || 'debate-topic';
  let title = decodeURIComponent(id);

  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
    const res = await fetch(`${base}/api/debates/${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      title = data?.title || data?.name || data?.topic || data?.debateTitle || title;
    }
  } catch (err) {
  }

  const initialFor = [
    { user: 'Alice', time: new Date().toISOString(), text: 'AI helps artists create faster.' },
  ];
  const initialAgainst = [
    { user: 'Carol', time: new Date().toISOString(), text: 'AI is a tool, not a replacement.' },
  ];

  return <DebateThread id={id} title={title} initialFor={initialFor} initialAgainst={initialAgainst} />;
}
