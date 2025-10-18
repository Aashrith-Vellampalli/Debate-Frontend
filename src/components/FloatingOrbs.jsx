import React from 'react';

export default function FloatingOrbs() {
  return (
  <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {/* orb 1 */}
      <div className="absolute left-10 top-12 w-40 h-40 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400 opacity-30 blur-2xl animate-float-slow" />
      {/* orb 2 */}
      <div className="absolute right-14 top-40 w-32 h-32 rounded-full bg-gradient-to-br from-purple-300 via-indigo-400 to-cyan-300 opacity-25 blur-2xl animate-float-slower" />
      {/* orb 3 */}
      <div className="absolute left-1/4 bottom-28 w-28 h-28 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-rose-400 opacity-28 blur-xl animate-float" />
      {/* orb 4 */}
      <div className="absolute right-1/3 bottom-10 w-20 h-20 rounded-full bg-gradient-to-br from-violet-400 via-purple-500 to-pink-400 opacity-20 blur-lg animate-float-slower" />
    </div>
  );
}
