import React from 'react';
import DebateThread from '../../../components/DebateThread';

export default async function DebatePage(props) {
  // params may be a promise in newer Next versions; ensure it's resolved
  const { params } = props;
  // React.use is available in this environment; however to avoid depending on it,
  // unwrap params if it's a thenable
  let resolvedParams = params;
  if (typeof params?.then === 'function') {
    resolvedParams = await params;
  }
  const id = resolvedParams?.id || 'debate-topic';
  // default title is the decoded id (covers simple slug-based routes)
  let title = decodeURIComponent(id);

  // Attempt to fetch the debate from the API and use its canonical title when available.
  try {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5001';
    const res = await fetch(`${base}/api/debates/${encodeURIComponent(id)}`);
    if (res.ok) {
      const data = await res.json();
      // pick a sensible title field from the API response
      title = data?.title || data?.name || data?.topic || data?.debateTitle || title;
    }
  } catch (err) {
    // ignore fetch errors and fall back to decoded id
  }

  // Mock initial messages that could be fetched server-side (kept for backwards compatibility)
  const initialFor = [
    { user: 'Alice', time: new Date().toISOString(), text: 'AI helps artists create faster.' },
  ];
  const initialAgainst = [
    { user: 'Carol', time: new Date().toISOString(), text: 'AI is a tool, not a replacement.' },
  ];

  return <DebateThread id={id} title={title} initialFor={initialFor} initialAgainst={initialAgainst} />;
}
