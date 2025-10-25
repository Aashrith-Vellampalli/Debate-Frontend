"use client";

import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-toastify';
import { TrophyIcon } from './Icons';

export default function DebatePlatform({ userId }) {
  const socketRef = useRef(null);
  
  const [view, setView] = useState('lobby');
  const [roomID, setRoomID] = useState('');
  const [joinRoomInput, setJoinRoomInput] = useState('');
  
  const [mySide, setMySide] = useState(null);
  const [opponent, setOpponent] = useState(null);
  const [topic, setTopic] = useState('');
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(3);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isRoundActive, setIsRoundActive] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  
  const [debateComplete, setDebateComplete] = useState(false);
  const [winner, setWinner] = useState(null);
  const [aiJudgement, setAiJudgement] = useState(null);
  
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  useEffect(() => {
    if (!userId) {
      toast.error('User ID is required');
      return;
    }

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5001';
    socketRef.current = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnection: true,
      withCredentials: true,
    });

    const socket = socketRef.current;

    socket.on('connect', () => {
      toast.success('Connected to debate server!');
      socket.emit('authenticate', { userId });
    });

    socket.on('connect_error', (error) => {
      toast.error('Failed to connect to server');
    });

    socket.on('room-created', (payload) => {
      const { roomID, side, topic } = payload;
      setRoomID(roomID);
      setMySide(side);
      setTopic(topic || 'General Debate');
      setView('room');
      setIsCreatingRoom(false);
      toast.success(`Room created! Code: ${roomID}`);
      toast.info(`You are arguing ${side} the topic`);
    });

    socket.on('match-found', ({ roomID, players, topic }) => {
      setRoomID(roomID);
      setTopic(topic || 'Ranked Match');
      setTotalRounds(3);
      
      const me = players.find(p => p.username === userId || players.findIndex(p2 => p2.username === userId) === players.indexOf(p));
      const opp = players.find(p => p !== me);
      
      if (me) setMySide(me.side);
      if (opp) setOpponent(opp);
      
      setView('debate');
      setIsSearching(false);
      setCurrentRound(1);
      setIsRoundActive(true);
      toast.success('Match found! Debate starting...');
    });

    socket.on('start-match', ({ roomID, players, topic, totalRounds }) => {
      setRoomID(roomID);
      setTopic(topic || 'General Debate');
      setTotalRounds(totalRounds || 3);
      
      const me = players.find(p => p.userId === userId);
      const opp = players.find(p => p.userId !== userId);
      
      if (me) setMySide(me.side);
      if (opp) setOpponent(opp);
      
      setView('debate');
      setIsSearching(false);
      toast.success('Match found! Debate starting...');
    });

    socket.on('round-start', ({ round, duration }) => {
      setCurrentRound(round);
      setTimeLeft(duration);
      setIsRoundActive(true);
      setCurrentMessage('');
      toast.info(`Round ${round} started!`);
    });

    socket.on('round-end', ({ round }) => {
      setIsRoundActive(false);
      setTimeLeft(0);
      toast.warning(`Round ${round} ended`);
    });

    socket.on('receive-message', ({ author, message, side, round }) => {
      setMessages(prev => [...prev, {
        id: Date.now() + Math.random(),
        author,
        message,
        side,
        round,
        timestamp: new Date(),
      }]);
    });

    socket.on('debate-complete', () => {
      setDebateComplete(true);
      setIsRoundActive(false);
      toast.info('Debate complete! Waiting for AI judgement...');
    });

    socket.on('ai-judgement', ({ winner, reasoning }) => {
      setWinner(winner);
      setAiJudgement(reasoning);
      
      const didIWin = winner === mySide;
      toast.success(
        didIWin ? 'You won the debate!' : 'You lost the debate',
        { autoClose: 5000 }
      );
    });

    socket.on('player-disconnected', ({ userId: disconnectedUserId }) => {
      toast.error('Your opponent disconnected!');
      alert('Your opponent has disconnected from the debate. The match will end.');
    });

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [userId, mySide]);

  useEffect(() => {
    if (isRoundActive && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [isRoundActive, timeLeft]);

  const handleCreateRoom = () => {
    if (!socketRef.current) {
      toast.error('Not connected to server');
      return;
    }
    
    setIsCreatingRoom(true);
    socketRef.current.emit('create-room', { userId });
  };

  const handleJoinRoom = () => {
    if (!socketRef.current) {
      toast.error('Not connected to server');
      return;
    }
    
    if (!joinRoomInput.trim()) {
      toast.error('Please enter a room ID');
      return;
    }
    socketRef.current.emit('join-room', { roomID: joinRoomInput.trim(), userId });
    toast.info('Joining room...');
  };

  const handleJoinRanked = () => {
    if (!socketRef.current) {
      toast.error('Not connected to server');
      return;
    }
    
    setIsSearching(true);
    socketRef.current.emit('join-rankedqueue', { userId });
    toast.info('Searching for opponent...');
  };

  const handleCancelRanked = () => {
    setIsSearching(false);
    socketRef.current?.emit('cancel-rankedqueue', { userId });
    toast.info('Search cancelled');
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!currentMessage.trim()) return;
    if (!isRoundActive) {
      toast.warning('Cannot send messages outside of active rounds');
      return;
    }
    socketRef.current.emit('send-message', {
      roomID,
      userId,
      message: currentMessage.trim(),
    });
    
    setCurrentMessage('');
  };

  const handleLeave = () => {
    setView('lobby');
    setRoomID('');
    setMySide(null);
    setOpponent(null);
    setTopic('');
    setCurrentRound(0);
    setMessages([]);
    setDebateComplete(false);
    setWinner(null);
    setAiJudgement(null);
    setIsRoundActive(false);
    setTimeLeft(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (view === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -right-40 -top-40 w-80 h-80 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 opacity-30 blur-3xl transform rotate-12" />
        <div className="pointer-events-none absolute -left-32 -bottom-28 w-72 h-72 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 opacity-20 blur-2xl" />

        <div className="max-w-4xl w-full">
          {/* Matchmaking Modal */}
          {isSearching && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
              <div className="bg-slate-800 rounded-3xl p-8 max-w-md w-full border border-purple-500/30">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-4 relative">
                    <div className="absolute inset-0 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Finding Opponent...</h3>
                  <p className="text-gray-400 mb-6">Searching for a worthy adversary</p>
                  <button
                    onClick={handleCancelRanked}
                    className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition"
                  >
                    Cancel Search
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="text-center mb-12">
            <h1 className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent mb-3 bg-gradient-to-r from-purple-400 to-pink-400">
              AI Debate Arena
            </h1>
            <p className="text-gray-300 text-lg max-w-2xl mx-auto animate-[fadeIn_400ms_ease-in-out]">
              Challenge opponents in fast, fair AI-judged debates. Small debates. Big arguments.
            </p>
            <div className="h-1 mx-auto mt-6 w-36 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 opacity-80 shadow-lg" />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Create Room */}
            <div className="group bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-emerald-500/10 hover:shadow-2xl transform transition duration-300 hover:scale-105 hover:-translate-y-1">
              <div className="w-16 h-16 bg-emerald-600 rounded-xl flex items-center justify-center mb-4 mx-auto transform transition group-hover:rotate-6">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-center">Create Room</h3>
              <p className="text-gray-400 text-sm mb-4 text-center">Start a private debate room</p>
              <button
                onClick={handleCreateRoom}
                disabled={isCreatingRoom}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-cyan-500 hover:to-emerald-500 text-white font-semibold transition shadow-md disabled:opacity-50"
              >
                {isCreatingRoom ? 'Creating...' : 'Create Room'}
              </button>
            </div>

            {/* Join Room */}
            <div className="group bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-blue-500/10 hover:shadow-2xl transform transition duration-300 hover:scale-105 hover:-translate-y-1">
              <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mb-4 mx-auto transform transition group-hover:-rotate-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-center">Join Room</h3>
              <p className="text-gray-400 text-sm mb-4 text-center">Enter a room code</p>
              <input
                type="text"
                value={joinRoomInput}
                onChange={(e) => setJoinRoomInput(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                className="w-full px-4 py-2 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-500 mb-3 text-center font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                maxLength={12}
              />
              <button
                onClick={handleJoinRoom}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-indigo-600 hover:to-blue-600 text-white font-semibold transition shadow-md"
              >
                Join Room
              </button>
            </div>

            {/* Ranked */}
            <div className="group bg-slate-800/60 backdrop-blur rounded-2xl p-6 border border-purple-500/10 hover:shadow-2xl transform transition duration-300 hover:scale-105 hover:-translate-y-1">
              <div className="w-16 h-16 bg-purple-600 rounded-xl flex items-center justify-center mb-4 mx-auto transform transition group-hover:scale-110">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2 text-center">Play Ranked</h3>
              <p className="text-gray-400 text-sm mb-4 text-center">Competitive matchmaking</p>
              <button
                onClick={handleJoinRanked}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-pink-500 hover:to-purple-600 text-white font-semibold transition shadow-md"
              >
                Find Match
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'room') {    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800/70 rounded-3xl p-8 max-w-md w-full border border-purple-500/20 shadow-xl backdrop-blur-sm">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 bg-emerald-600 rounded-full flex items-center justify-center shadow-lg transform transition hover:scale-105">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Room Created!</h2>
            <p className="text-gray-300 mb-6">Share this code with your opponent</p>
            
            <div className="bg-gradient-to-r from-slate-900/60 to-slate-800/60 rounded-xl p-6 mb-6 border border-purple-600/10 shadow-inner">
              <div className="text-sm text-gray-400 mb-2">Room Code</div>
              <div className="text-4xl font-bold text-white font-mono tracking-wider mb-2">{roomID}</div>
              <div className="text-sm text-gray-400 mb-2">Your Side: <span className={`font-bold ${mySide === 'for' ? 'text-emerald-400' : 'text-rose-400'}`}>{mySide?.toUpperCase()}</span></div>
              <div className="text-sm text-gray-400 mb-4">
                Topic: <span className="font-semibold text-purple-300">{topic || 'General Debate'}</span>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(roomID);
                  toast.success('Code copied!');
                }}
                className="text-purple-400 hover:text-purple-300 text-sm transition"
              >
                📋 Copy Code
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 mb-6">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-yellow-400 text-sm">Waiting for opponent...</span>
            </div>

            <button
              onClick={handleLeave}
              className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white transition shadow-md"
            >
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800/90 backdrop-blur border-b border-purple-500/30 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl md:text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-purple-300 to-pink-300">{topic || 'Debate Topic'}</h2>
              <p className="text-sm text-gray-400">Room: <span className="font-mono text-gray-200">{roomID}</span></p>
            </div>
            
            <div className="flex items-center gap-6">
              {/* Round Info */}
              <div className="text-center">
                <div className="text-sm text-gray-400">Round</div>
                <div className="text-2xl font-bold text-white">{currentRound}/{totalRounds}</div>
              </div>
              
              {/* Timer */}
              <div className="text-center">
                <div className="text-sm text-gray-400">Time Left</div>
                <div className={`text-2xl font-bold ${timeLeft <= 10 && timeLeft > 0 ? 'text-red-400 animate-pulse' : 'text-white'}`}>
                  {formatTime(timeLeft)}
                </div>
              </div>
              
              {/* Status */}
              <div className="text-center">
                <div className={`px-4 py-2 rounded-full text-sm font-semibold shadow-sm ${
                  isRoundActive ? 'bg-green-600 text-white' : 
                  debateComplete ? 'bg-blue-600 text-white' :
                  'bg-yellow-600 text-white'
                }`}>
                  {debateComplete ? 'Complete' : isRoundActive ? 'Active' : 'Waiting'}
                </div>
              </div>
              
              <button
                onClick={handleLeave}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition"
              >
                Leave
              </button>
            </div>
          </div>
          
          {/* Players */}
          <div className="flex items-center justify-center gap-8 mt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold">
                {mySide === 'for' ? 'ME' : opponent?.username?.[0] || 'O'}
              </div>
              <div>
                <div className="text-sm text-emerald-400 font-semibold">FOR</div>
                <div className="text-white">{mySide === 'for' ? 'You' : opponent?.username || 'Opponent'}</div>
              </div>
            </div>
            
            <div className="text-gray-500">VS</div>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold">
                {mySide === 'against' ? 'ME' : opponent?.username?.[0] || 'O'}
              </div>
              <div>
                <div className="text-sm text-rose-400 font-semibold">AGAINST</div>
                <div className="text-white">{mySide === 'against' ? 'You' : opponent?.username || 'Opponent'}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 overflow-y-auto p-6 max-w-5xl w-full mx-auto">
        {/* Topic banner at top of chat */}
        <div className="mb-6">
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-3xl bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-purple-900/40 border border-purple-500/30 p-6 shadow-2xl backdrop-blur-md overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 mb-3">
                  <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  <span className="text-xs font-semibold text-purple-200 uppercase tracking-wider">Debate Topic</span>
                </div>
                
                <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 via-pink-200 to-purple-200 mb-4 leading-tight px-4">
                  {topic || 'No topic assigned yet'}
                </h2>
                
                <div className="flex items-center justify-center gap-6">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-sm text-gray-300">Round <span className="font-bold text-white">{currentRound}</span> of <span className="font-bold text-white">{totalRounds}</span></span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <svg className="w-4 h-4 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm text-gray-300"><span className="font-bold text-white">{formatTime(timeLeft)}</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
          <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 mx-auto mb-4 bg-slate-800 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <p className="text-gray-500">No messages yet. Start debating!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.side === mySide;
              const sideColor = msg.side === 'for' ? 'emerald' : 'rose';
              
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col transition-transform duration-200 ease-out`}>
                    <div className="flex items-center gap-2 mb-1 px-2">
                      <span className="text-xs text-gray-400">{msg.author}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full bg-${sideColor}-600/20 text-${sideColor}-400 border border-${sideColor}-500/30`}>
                        {msg.side}
                      </span>
                      <span className="text-xs text-gray-500">R{msg.round}</span>
                    </div>
                    <div className={`rounded-2xl px-4 py-3 transition transform duration-200 ${
                      isMe 
                        ? `bg-${sideColor}-600 text-white shadow-md hover:scale-102` 
                        : 'bg-slate-800 text-white border border-slate-700 shadow-inner'
                    }`}>
                      <p className="text-sm leading-relaxed">{msg.message}</p>
                    </div>
                    <span className="text-xs text-gray-500 mt-1 px-2">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* AI Judgement */}
        {aiJudgement && (
          <div className="mt-8 bg-gradient-to-r from-purple-900/50 to-pink-900/50 border border-purple-500/30 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">AI Judgement</h3>
                <p className="text-sm text-purple-300">Winner: <span className={`font-bold ${winner === 'for' ? 'text-emerald-400' : 'text-rose-400'}`}>{winner?.toUpperCase()}</span></p>
              </div>
            </div>
            <p className="text-gray-300 leading-relaxed">{aiJudgement}</p>
            
            {winner === mySide && (
              <div className="mt-4 text-center flex flex-col items-center">
                <TrophyIcon className="w-16 h-16 text-yellow-400" />
                <p className="text-2xl font-bold text-yellow-400 mt-2">You Won!</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Input */}
      {!debateComplete && (
        <footer className="bg-slate-800/90 backdrop-blur border-t border-purple-500/30 p-6">
          <div className="max-w-5xl mx-auto">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                placeholder={isRoundActive ? "Type your argument..." : "Waiting for round to start..."}
                disabled={!isRoundActive}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!isRoundActive || !currentMessage.trim()}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-500 hover:from-pink-500 hover:to-purple-600 text-white font-semibold transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md"
              >
                <span>Send</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
            {!isRoundActive && !debateComplete && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                Messages are disabled between rounds
              </p>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
