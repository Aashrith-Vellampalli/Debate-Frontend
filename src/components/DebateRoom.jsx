"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { 
  TrophyIcon, 
  SwordIcon, 
  TargetIcon, 
  FlameIcon,
  PenIcon,
  CheckCircleIcon,
  HourglassIcon 
} from './Icons';

export default function DebateRoom({ roomID }) {
  const { user, hydrated } = useAuth();
  const { socket, isConnected } = useSocket();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(1);
  const [players, setPlayers] = useState([]);
  const [mySide, setMySide] = useState(null);
  const [topic, setTopic] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [maxMessagesPerRound, setMaxMessagesPerRound] = useState(5);
  const [gameStatus, setGameStatus] = useState('waiting');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPhase, setCurrentPhase] = useState(null);
  const [phaseDescription, setPhaseDescription] = useState('');
  const [phaseMessageLimit, setPhaseMessageLimit] = useState(2);
  const ROUND_TIME = 300;
  const [roundTimeLeft, setRoundTimeLeft] = useState(ROUND_TIME);
  const roundTimerRef = useRef(null);
  const [showRoundAnimation, setShowRoundAnimation] = useState(false);
  const [roundAnimationText, setRoundAnimationText] = useState('');
  const [forfeitTimeLeft, setForfeitTimeLeft] = useState(null);
  const [opponentLeftUsername, setOpponentLeftUsername] = useState(null);
  const forfeitTimerRef = useRef(null);
  const [gameResult, setGameResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!hydrated) {      return;
    }

    if (!user) {
      toast.error('Please login first');
      router.push('/login');
      return;
    }

    if (!socket || !isConnected) {      return;
    }    setIsLoading(false);

    const username = user?.username || user?.name;
    const userId = user?.id;
    
    if (!username || !userId) {      toast.error('User information not available. Please login again.');
      router.push('/login');
      return;
    }    socket.emit('join-room', { 
      username, 
      roomID,
      userId 
    });

    socket.emit('get-debate-state', { roomID });

    const handleRoomCreated = ({ roomID: createdRoomID, side: mySideFromBackend, player }) => {      if (mySideFromBackend) {
        setMySide(mySideFromBackend);
        const myUsername = user?.username || user?.name;
        setPlayers([{ username: myUsername, side: mySideFromBackend }]);
      }
      setGameStatus('waiting');
      toast.info('Room created! Waiting for opponent to join...', { autoClose: 3000 });
    };

    const handleStartMatch = (data) => {      
      const { roomID: matchRoomID, players: playersList, status, topic: matchTopic, currentPhase, phaseDescription: phaseDesc, messageLimit } = data;
      
      if (!Array.isArray(playersList) || playersList.length < 2) {        return;
      }
      
      const normalizedPlayers = playersList.map((p, idx) => ({
        username: p.username || 'Player' + (idx + 1),
        side: p.side || (idx === 0 ? 'for' : 'against')
      }));
      
      setPlayers(normalizedPlayers);
      
      const myUsername = user?.username || user?.name;
      const myPlayer = normalizedPlayers.find(p => 
        p.username === myUsername || 
        p.username.toLowerCase() === myUsername?.toLowerCase()
      );
      
      if (myPlayer) {
        setMySide(myPlayer.side);
      }
      
      if (currentPhase) {
        setCurrentPhase(currentPhase);
        setPhaseDescription(phaseDesc || '');
        setPhaseMessageLimit(messageLimit || 2);
        setMessageCount(0);
        
        if (currentPhase === 'for_argument' || phaseDesc?.includes('opening argument')) {
          const isMyTurnToStart = myPlayer?.side === 'for';
          setRoundAnimationText(
            isMyTurnToStart 
              ? 'DEBATE STARTS! Present your opening argument!' 
              : 'Debate begins! Opponent presents their opening argument...'
          );
          setShowRoundAnimation(true);
          setTimeout(() => setShowRoundAnimation(false), 3500);
          
          if (isMyTurnToStart) {
            toast.success('Your turn! Present your opening argument!', {
              autoClose: 4000
            });
          } else {
            toast.info('Opponent goes first with their opening argument', {
              autoClose: 3000
            });
          }
        }
      }
      
      if (matchTopic) {
        setTopic(matchTopic);
      }
      
      setGameStatus('ongoing');
      setRoundTimeLeft(ROUND_TIME);
      toast.success('Match started! Good luck!');
    };

    const handleDebateState = ({ debate }) => {      
      if (debate) {
        if (debate.topic) {
          setTopic(debate.topic);        }
        
        if (debate.players) {
          const playersWithSides = debate.players.map((p, idx) => ({
            username: p.username || 'Player' + (idx + 1),
            side: p.side || (idx === 0 ? 'for' : 'against')
          }));
          
          setPlayers(playersWithSides);
        
          const myUsername = user?.username || user?.name;
          const myPlayer = playersWithSides.find(p => 
            p.username === myUsername || 
            p.username.toLowerCase() === myUsername?.toLowerCase()
          );
          
          if (myPlayer) {
            setMySide(myPlayer.side);
          }
        }
        
        if (debate.status === 'ongoing' && debate.players && debate.players.length >= 2) {
          setGameStatus('ongoing');
        } else if (debate.status === 'finished') {
          setGameStatus('finished');
        } else {
          setGameStatus('waiting');
        }
        
        if (debate.currentRound) {
          setCurrentRound(debate.currentRound);
        }

        if (debate.messages && Array.isArray(debate.messages)) {
          setMessages(debate.messages);
        }
      }
    };

    const handleReceiveMessage = (messageData) => {      setMessages(prev => [...prev, messageData]);
      
      const myUsername = user?.username || user?.name;
      if (messageData.author === myUsername || messageData.sender === myUsername) {
        setMessageCount(prev => prev + 1);
      }
    };

    const handleRoundEnd = (data) => {
      const { nextRound, phase, description } = data;
      setCurrentRound(nextRound);
      setMessageCount(0);
      setRoundTimeLeft(ROUND_TIME);
      
      if (phase) {
        setCurrentPhase(phase);
        setPhaseDescription(description || '');
      }
      
      const endedRound = Math.max(1, nextRound - 1);
      setRoundAnimationText(`Round ${endedRound} finished — Round ${nextRound} started`);
      setShowRoundAnimation(true);
      setTimeout(() => setShowRoundAnimation(false), 2200);
      toast.info(`Round ${nextRound} started!`);
    };
    
    const handlePhaseChange = (data) => {      const { phase, description, messageLimit } = data;
      setCurrentPhase(phase);
      setPhaseDescription(description);
      setPhaseMessageLimit(messageLimit || 2);
      setMessageCount(0);
      
      if (phase === 'for_argument' || description?.includes('opening argument')) {
        const isMyTurn = description?.includes('FOR side') && mySide === 'for';
        setRoundAnimationText(
          isMyTurn 
            ? 'DEBATE STARTS! Your opening argument!' 
            : 'DEBATE STARTS! Opponent\'s opening argument...'
        );
        setShowRoundAnimation(true);
        setTimeout(() => setShowRoundAnimation(false), 3500);
        
        toast.info(description, {
          autoClose: 4000
        });
      } else {
        toast.info(description, {
          autoClose: 3000
        });
      }
    };

    const handleGameOver = (payload) => {      setGameStatus('finished');
      
      if (forfeitTimerRef.current) {
        clearInterval(forfeitTimerRef.current);
        forfeitTimerRef.current = null;
      }
      setForfeitTimeLeft(null);
      setOpponentLeftUsername(null);
      
      const myUserId = user?.id;
      const iWon = payload?.winner?.userId === myUserId;
      
      setGameResult({
        isWinner: iWon,
        winner: payload?.winner,
        loser: payload?.loser,
        reason: payload?.reason,
        message: payload?.message
      });
      
      setTimeout(() => {
        setShowResultModal(true);
      }, 500);
      
      if (payload?.winner && payload?.reason === 'opponent_forfeit') {
        if (iWon) {
          toast.success('You win! Your opponent forfeited by not rejoining.', { autoClose: 5000 });
        } else {
          toast.error('You lost by forfeit.', { autoClose: 5000 });
        }
      } else {
        toast.success('Debate finished! Calculating results...');
      }
    };

    const handleError = (payload) => {
      const message = typeof payload === 'string' ? payload : payload?.message || 'An error occurred';      
      if (message.includes('authentication') || message.includes('Unauthorized')) {
        toast.error(message + ' - Redirecting...');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        toast.error(message);
      }
    };

    const handleRoomNotFound = (payload) => {
      const message = payload?.message || 'Room not found';      toast.error(message);
      setTimeout(() => router.push('/1v1'), 2000);
    };

    const handleRoomFull = (payload) => {
      const message = payload?.message || 'Room is full';      toast.error(message);
      setTimeout(() => router.push('/1v1'), 2000);
    };

    const handleOpponentDisconnected = (payload) => {
      const username = payload?.username || 'Opponent';
      const message = payload?.message || `${username} disconnected`;
      toast.warning(message, { autoClose: 5000 });
      
    };

    const handleOpponentLeft = (payload) => {
      const username = payload?.username || 'Opponent';
      const message = payload?.message || `${username} left the debate. They have 20 seconds to rejoin or you win by forfeit.`;
      toast.warning(message, { autoClose: 20000 });      
      setOpponentLeftUsername(username);
      setForfeitTimeLeft(20);
      
      if (forfeitTimerRef.current) {
        clearInterval(forfeitTimerRef.current);
      }
      
      forfeitTimerRef.current = setInterval(() => {
        setForfeitTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(forfeitTimerRef.current);
            forfeitTimerRef.current = null;
            return null;
          }
          return prev - 1;
        });
      }, 1000);
    };

    const handleLeftRoom = (payload) => {
      const message = payload?.message || 'You have left the room.';
      toast.info(message, { autoClose: 3000 });    };

    const handleOpponentRejoined = (payload) => {
      const username = payload?.username || 'Opponent';
      const message = payload?.message || `${username} has rejoined!`;
      toast.success(message);
      
      if (forfeitTimerRef.current) {
        clearInterval(forfeitTimerRef.current);
        forfeitTimerRef.current = null;
      }
      setForfeitTimeLeft(null);
      setOpponentLeftUsername(null);
    };

    socket.on('room-created', handleRoomCreated);
    socket.on('start-match', handleStartMatch);
    socket.on('match-found', handleStartMatch);
    socket.on('debate-state', handleDebateState);
    socket.on('receive-message', handleReceiveMessage);
    socket.on('round-end', handleRoundEnd);
    socket.on('phase-change', handlePhaseChange);
    socket.on('game-over', handleGameOver);
    socket.on('error', handleError);
    socket.on('room-not-found', handleRoomNotFound);
    socket.on('room-full', handleRoomFull);
    socket.on('opponent-disconnected', handleOpponentDisconnected);
    socket.on('opponent-left', handleOpponentLeft);
    socket.on('left-room', handleLeftRoom);
    socket.on('opponent-rejoined', handleOpponentRejoined);

    return () => {      
      if (forfeitTimerRef.current) {
        clearInterval(forfeitTimerRef.current);
        forfeitTimerRef.current = null;
      }
      
      socket.off('room-created', handleRoomCreated);
      socket.off('start-match', handleStartMatch);
      socket.off('match-found', handleStartMatch);
      socket.off('debate-state', handleDebateState);
      socket.off('receive-message', handleReceiveMessage);
      socket.off('round-end', handleRoundEnd);
      socket.off('phase-change', handlePhaseChange);
      socket.off('game-over', handleGameOver);
      socket.off('error', handleError);
      socket.off('room-not-found', handleRoomNotFound);
      socket.off('room-full', handleRoomFull);
      socket.off('opponent-disconnected', handleOpponentDisconnected);
      socket.off('opponent-left', handleOpponentLeft);
      socket.off('left-room', handleLeftRoom);
      socket.off('opponent-rejoined', handleOpponentRejoined);
    };
  }, [hydrated, user?.id, socket, isConnected, router, roomID]);

  useEffect(() => {
    if (gameStatus !== 'ongoing') {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
      return;
    }
    
    setRoundTimeLeft(ROUND_TIME);
    if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    
    roundTimerRef.current = setInterval(() => {
      setRoundTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(roundTimerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => {
      if (roundTimerRef.current) clearInterval(roundTimerRef.current);
    };
  }, [currentPhase, gameStatus]);

  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    
    if (currentPhase && phaseDescription) {
      const isMyTurn = (phaseDescription.includes('FOR side') && mySide === 'for') ||
                       (phaseDescription.includes('AGAINST side') && mySide === 'against');
      
      if (!isMyTurn) {
        toast.warning(`Not your turn. ${phaseDescription}`, {
          icon: '🚫',
          autoClose: 3000
        });
        return;
      }
    }
    
    if (messageCount >= phaseMessageLimit) {
      toast.warning(`Maximum ${phaseMessageLimit} messages for this phase reached!`);
      return;
    }
    if (gameStatus !== 'ongoing') {
      toast.warning('Game is not active');
      return;
    }
    if (!socket) {
      toast.error('Not connected to server');
      return;
    }

    socket.emit('send-message', {
      roomID,
      message: currentMessage.trim(),
    });

    setCurrentMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLeaveRoom = () => {
    if (socket && roomID) {
      socket.emit('leave-room', { roomID });    }
    router.push('/1v1');
  };

  const handleCopyRoomCode = () => {
    const shortCode = roomID.split('_')[1]?.toUpperCase() || roomID;
    navigator.clipboard.writeText(shortCode)
      .then(() => {
        toast.success('Room code copied!', { autoClose: 2000 });
      })
      .catch(() => {
        toast.error('Failed to copy code');
      });
  };

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-900/30 to-surface-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-300 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-900/30 to-surface-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-zinc-300 text-lg">Connecting to debate room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-brand-900/30 to-surface-50 flex flex-col">
      {/* Game Result Modal */}
      {showResultModal && gameResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fadeIn">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/90 backdrop-blur-md"
            onClick={() => {
              setShowResultModal(false);
              router.push('/1v1');
            }}
          />
          
          {/* Modal Content */}
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Victory/Defeat Card */}
            <div className={`
              relative overflow-hidden rounded-3xl shadow-2xl
              ${gameResult.isWinner 
                ? 'bg-gradient-to-br from-yellow-900/40 via-amber-900/40 to-orange-900/40 border-2 border-yellow-500/60' 
                : 'bg-gradient-to-br from-slate-800/40 via-slate-700/40 to-slate-600/40 border-2 border-slate-500/60'
              }
              backdrop-blur-xl
              animate-scaleIn
            `}>
              {/* Animated Background Effects */}
              <div className="absolute inset-0 opacity-20">
                <div className="absolute top-0 left-1/4 w-64 h-64 bg-yellow-500 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-orange-500 rounded-full blur-3xl animate-pulse delay-75" />
              </div>
              
              {/* Content */}
              <div className="relative p-6 md:p-8">
                {/* Header Section */}
                <div className="text-center mb-8">
                  {/* Trophy/Icon */}
                  <div className={`
                    inline-flex items-center justify-center w-28 h-28 rounded-full mb-6
                    ${gameResult.isWinner 
                      ? 'bg-gradient-to-br from-yellow-400 to-amber-600 shadow-2xl shadow-yellow-500/50' 
                      : 'bg-gradient-to-br from-slate-500 to-slate-700 shadow-2xl shadow-slate-500/30'
                    }
                    animate-bounce-slow
                    ring-4 ring-white/20
                  `}>
                    {gameResult.isWinner ? (
                      <svg className="w-16 h-16 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ) : (
                      <svg className="w-16 h-16 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Title */}
                  <h2 className={`
                    text-5xl md:text-6xl font-black mb-3 tracking-tight
                    ${gameResult.isWinner 
                      ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-400' 
                      : 'text-transparent bg-clip-text bg-gradient-to-r from-slate-300 via-slate-400 to-slate-500'
                    }
                    drop-shadow-lg
                  `}>
                    {gameResult.isWinner ? 'VICTORY!' : 'DEFEAT'}
                  </h2>
                  
                  <p className="text-base text-zinc-300 font-medium flex items-center gap-2 justify-center">
                    {gameResult.reason === 'opponent_forfeit' ? (
                      <>
                        <TrophyIcon className="w-5 h-5" />
                        Won by forfeit
                      </>
                    ) : (
                      <>
                        <SwordIcon className="w-5 h-5" />
                        Debate completed
                      </>
                    )}
                  </p>
                </div>

                {gameResult.aiJudgment?.summary && (
                  <div className="mb-6 p-5 bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-400/40 rounded-2xl backdrop-blur-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center">
                        <TargetIcon className="w-6 h-6 text-blue-300" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-blue-300 mb-2">AI Judge Summary</div>
                        <div className="text-sm text-zinc-200 leading-relaxed">{gameResult.aiJudgment.summary}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Players Comparison */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {/* Winner Card */}
                  {gameResult.winner && (
                    <div className={`
                      ${gameResult.isWinner ? 'md:order-1' : 'md:order-2'}
                      bg-gradient-to-br from-yellow-500/10 to-amber-500/10 
                      border-2 border-yellow-500/50 rounded-2xl p-5 
                      backdrop-blur-sm shadow-xl
                      transform hover:scale-105 transition-transform duration-300
                    `}>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg">
                            <span className="text-white font-black text-xl">W</span>
                          </div>
                          <div>
                            <div className="text-base font-bold text-zinc-50">
                              {gameResult.winner.username}
                            </div>
                            <div className="text-xs text-zinc-400 capitalize flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${gameResult.winner.side === 'for' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                              {gameResult.winner.side}
                            </div>
                          </div>
                        </div>
                        
                        {gameResult.winner.userId === user?.id && (
                          <span className="px-3 py-1 bg-emerald-500/20 border border-emerald-400/50 rounded-full text-xs font-bold text-emerald-300">
                            YOU
                          </span>
                        )}
                      </div>

                      {/* Score */}
                      {gameResult.winner.score !== null && gameResult.winner.score !== undefined && (
                        <div className="mb-4">
                          <div className="text-center py-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-5xl font-black text-yellow-300 mb-1">
                              {gameResult.winner.score}
                            </div>
                            <div className="text-sm text-zinc-400 font-semibold">out of 100</div>
                          </div>
                        </div>
                      )}

                      {/* Hype Change */}
                      {gameResult.winner.hypeGained !== undefined && (
                        <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-xl mb-4">
                          <span className="text-sm font-semibold text-zinc-300">Hype Earned</span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-green-400 animate-pulse">
                              +{gameResult.winner.hypeGained}
                            </span>
                            <span className="text-xs text-zinc-500">
                              → {gameResult.winner.newHype}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* AI Feedback */}
                      {gameResult.winner.feedback && (
                        <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                          <div className="text-xs font-bold text-emerald-400 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            AI Feedback
                          </div>
                          <div className="text-xs text-zinc-300 leading-relaxed">{gameResult.winner.feedback}</div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Loser Card */}
                  {gameResult.loser && (
                    <div className={`
                      ${gameResult.isWinner ? 'md:order-2' : 'md:order-1'}
                      bg-gradient-to-br from-slate-500/10 to-slate-600/10 
                      border-2 border-slate-500/50 rounded-2xl p-5 
                      backdrop-blur-sm
                      opacity-90
                    `}>
                      {/* Header */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center shadow-lg">
                            <span className="text-white font-black text-xl">L</span>
                          </div>
                          <div>
                            <div className="text-base font-bold text-zinc-50">
                              {gameResult.loser.username}
                            </div>
                            <div className="text-xs text-zinc-400 capitalize flex items-center gap-1">
                              <span className={`w-2 h-2 rounded-full ${gameResult.loser.side === 'for' ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                              {gameResult.loser.side}
                            </div>
                          </div>
                        </div>
                        
                        {gameResult.loser.userId === user?.id && (
                          <span className="px-3 py-1 bg-red-500/20 border border-red-400/50 rounded-full text-xs font-bold text-red-300">
                            YOU
                          </span>
                        )}
                      </div>

                      {/* Score */}
                      {gameResult.loser.score !== null && gameResult.loser.score !== undefined && (
                        <div className="mb-4">
                          <div className="text-center py-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-5xl font-black text-slate-300 mb-1">
                              {gameResult.loser.score}
                            </div>
                            <div className="text-sm text-zinc-400 font-semibold">out of 100</div>
                          </div>
                        </div>
                      )}

                      {/* Hype Change */}
                      {gameResult.loser.hypeLost !== undefined && (
                        <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/30 rounded-xl mb-4">
                          <span className="text-sm font-semibold text-zinc-300">Hype Lost</span>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl font-black text-red-400">
                              -{gameResult.loser.hypeLost}
                            </span>
                            <span className="text-xs text-zinc-500">
                              → {gameResult.loser.newHype}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* AI Feedback */}
                      {gameResult.loser.feedback && (
                        <div className="p-4 bg-black/20 rounded-xl border border-white/10">
                          <div className="text-xs font-bold text-orange-400 mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            AI Feedback
                          </div>
                          <div className="text-xs text-zinc-300 leading-relaxed">{gameResult.loser.feedback}</div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      setShowResultModal(false);
                      router.push('/1v1');
                    }}
                    className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:via-pink-500 hover:to-rose-500 text-white font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform hover:scale-105 flex items-center justify-center gap-2"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Back to Lobby
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-surface-50/70 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-0">
            {/* Left: Room info */}
            <div className="flex items-center gap-3 flex-wrap">
              <button
                onClick={handleLeaveRoom}
                className="p-3 md:p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors touch-manipulation"
                title="Leave Room"
                aria-label="Leave Room"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-xs text-zinc-400">Room Code</div>
                  <div className="text-sm font-bold text-zinc-100 font-mono">{roomID.split('_')[1]?.toUpperCase() || roomID}</div>
                </div>
                
                <button
                  onClick={handleCopyRoomCode}
                  className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 transition-colors"
                  title="Copy room code"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              
              {/* Topic Display */}
              {topic && (
                <div className="ml-4 pl-4 border-l border-white/10 hidden sm:flex">
                  <div className="text-xs text-zinc-400">Topic</div>
                  <div className="text-sm font-semibold text-purple-300 truncate max-w-xs">{topic}</div>
                </div>
              )}
              
              {gameStatus === 'waiting' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>
                  <span className="text-xs font-semibold text-yellow-300">Waiting for opponent...</span>
                </div>
              )}
              
              {gameStatus === 'ongoing' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-400"></div>
                  <span className="text-xs font-semibold text-green-300">Live</span>
                </div>
              )}
              
              {gameStatus === 'finished' && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30">
                  <span className="text-xs font-semibold text-blue-300">Finished</span>
                </div>
              )}
            </div>

            {/* Center: Round info */}
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-center">
                <div className="text-xs text-zinc-400">Round</div>
                <div className="text-2xl font-bold bg-gradient-to-r from-brand-400 to-pink-400 bg-clip-text text-transparent">
                  {currentRound}/{totalRounds}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-zinc-400">Messages</div>
                <div className="text-lg font-bold text-zinc-100">
                  <span className={messageCount >= maxMessagesPerRound ? 'text-red-400' : 'text-green-400'}>
                    {messageCount}
                  </span>
                  <span className="text-zinc-500">/{maxMessagesPerRound}</span>
                </div>
              </div>
            </div>

            {/* Right: Players */}
            <div className="flex items-center gap-3">
              {players.length > 0 ? (
                <>
                  {players.map((player, idx) => {
                    const playerName = player.username || 'Player';
                    const playerSide = player.side || (idx === 0 ? 'for' : 'against');
                    const isFor = playerSide === 'for';
                    const initial = playerName[0]?.toUpperCase() || 'P';

                    return (
                      <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50/50 border border-white/5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                          isFor ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : 'bg-gradient-to-br from-rose-500 to-pink-500'
                        }`}>
                          {initial}
                        </div>
                        <div>
                          <div className={`text-xs font-semibold ${isFor ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {playerSide.charAt(0).toUpperCase() + playerSide.slice(1)}
                          </div>
                          <div className="text-sm font-semibold text-zinc-100">{playerName}</div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Show empty slot if waiting for second player */}
                  {players.length === 1 && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-50/30 border border-dashed border-white/20">
                      <div className="w-8 h-8 rounded-full bg-zinc-700/50 flex items-center justify-center">
                        <svg className="w-4 h-4 text-zinc-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div>
                        <div className={`text-xs font-semibold ${
                          players[0]?.side === 'for' ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {players[0]?.side === 'for' ? 'Against' : 'For'}
                        </div>
                        <div className="text-sm font-semibold text-zinc-500">Waiting...</div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-zinc-500">Waiting for players...</div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Round transition animation overlay */}
      <div className="pointer-events-none">
        <div className={`fixed inset-0 flex items-start justify-center z-50 mt-20 transition-all duration-500 ease-out transform ${showRoundAnimation ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          <div className={`backdrop-blur-md text-white px-8 py-4 rounded-2xl border shadow-2xl max-w-2xl text-center ${
            roundAnimationText?.includes('DEBATE STARTS') 
              ? 'bg-gradient-to-r from-green-900/80 via-emerald-900/80 to-green-900/80 border-green-400/50 shadow-green-500/30' 
              : 'bg-black/60 border-white/10'
          }`}>
            <div className={`font-bold ${
              roundAnimationText?.includes('DEBATE STARTS') ? 'text-2xl md:text-3xl' : 'text-lg'
            }`}>
              {roundAnimationText}
            </div>
            {roundAnimationText?.includes('DEBATE STARTS') && (
              <div className="mt-2 text-sm text-green-200/80 animate-pulse">
                Good luck! Make your best arguments!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <main className="flex-1 overflow-hidden flex flex-col max-w-7xl w-full mx-auto px-6 py-6">
        {/* Phase Indicator (Structured Rounds) - PROMINENT */}
        {currentPhase && phaseDescription && gameStatus === 'ongoing' && (
          <div className="mb-6">
            <div className="max-w-4xl mx-auto">
              {(() => {
                const isMyTurn = (phaseDescription.includes('FOR side') && mySide === 'for') ||
                                 (phaseDescription.includes('AGAINST side') && mySide === 'against');
                
                return (
                  <div className={`relative rounded-2xl ${
                    isMyTurn 
                      ? 'bg-gradient-to-r from-green-900/50 via-emerald-900/40 to-green-900/50 border-2 border-green-400/50 shadow-2xl shadow-green-500/20' 
                      : 'bg-gradient-to-r from-gray-900/50 via-slate-900/40 to-gray-900/50 border-2 border-gray-600/30 shadow-lg'
                  } p-5 backdrop-blur-md overflow-hidden animate-fadeIn`}>
                    <div className={`absolute -top-10 -right-10 w-40 h-40 ${isMyTurn ? 'bg-green-500/20' : 'bg-gray-500/10'} rounded-full blur-3xl ${isMyTurn ? 'animate-pulse' : ''}`} />
                    <div className={`absolute -bottom-10 -left-10 w-40 h-40 ${isMyTurn ? 'bg-emerald-500/20' : 'bg-gray-500/10'} rounded-full blur-3xl ${isMyTurn ? 'animate-pulse' : ''}`} />
                    
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                          isMyTurn 
                            ? 'bg-green-500/30 border-2 border-green-400/50' 
                            : 'bg-gray-700/30 border-2 border-gray-500/30'
                        }`}>
                          {isMyTurn ? (
                            <>
                              <TargetIcon className="w-5 h-5 text-green-300 animate-pulse" />
                              <span className="text-sm font-bold text-green-200 uppercase tracking-wider">YOUR TURN</span>
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">⏳ OPPONENT'S TURN</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Phase Info */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-4 h-4 rounded-full ${isMyTurn ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-gray-500'}`} />
                          <div className="flex-1">
                            <div className={`text-xs uppercase tracking-wide font-medium mb-1 ${isMyTurn ? 'text-green-300/80' : 'text-gray-400'}`}>
                              Current Phase
                            </div>
                            <div className={`text-lg md:text-xl font-bold ${isMyTurn ? 'text-white' : 'text-gray-300'}`}>
                              {phaseDescription}
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right ml-4">
                          <div className={`text-xs uppercase tracking-wide font-medium mb-1 ${isMyTurn ? 'text-green-300/80' : 'text-gray-400'}`}>
                            Messages
                          </div>
                          <div className="text-3xl md:text-4xl font-bold">
                            <span className={messageCount >= phaseMessageLimit ? 'text-red-400' : (isMyTurn ? 'text-green-400' : 'text-gray-400')}>{messageCount}</span>
                            <span className="text-gray-500 text-2xl">/</span>
                            <span className={isMyTurn ? 'text-white' : 'text-gray-400'}>{phaseMessageLimit}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
        
        {/* Topic Banner */}
        {topic && (
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
                    {topic}
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
                      <span className="text-sm text-gray-300"><span className="font-bold text-white">{Math.floor(roundTimeLeft / 60)}:{(roundTimeLeft % 60).toString().padStart(2, '0')}</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Forfeit Warning Banner */}
        {forfeitTimeLeft !== null && opponentLeftUsername && (
          <div className="mb-6">
            <div className="max-w-4xl mx-auto">
              <div className="relative rounded-2xl bg-gradient-to-r from-amber-900/60 via-orange-900/50 to-red-900/60 border-2 border-orange-500/50 p-5 shadow-2xl backdrop-blur-md overflow-hidden animate-pulse">
                {/* Decorative elements */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-red-500/20 rounded-full blur-3xl animate-pulse" />
                
                <div className="relative z-10 text-center">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <svg className="w-6 h-6 text-orange-400 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-lg font-bold text-orange-200 uppercase tracking-wide">⚠️ Opponent Left</span>
                  </div>
                  
                  <p className="text-white text-lg mb-4">
                    <span className="font-semibold text-orange-300">{opponentLeftUsername}</span> has left the debate
                  </p>
                  
                  <div className="flex items-center justify-center gap-3">
                    <div className="relative">
                      {/* Countdown Circle */}
                      <div className="relative w-14 h-14 md:w-20 md:h-20">
                        <svg className="w-14 h-14 md:w-20 md:h-20 transform -rotate-90">
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-orange-900/50"
                          />
                          <circle
                            cx="40"
                            cy="40"
                            r="35"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 35}`}
                            strokeDashoffset={`${2 * Math.PI * 35 * (1 - forfeitTimeLeft / 20)}`}
                            className="text-orange-400 transition-all duration-1000"
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl md:text-3xl font-bold text-white">{forfeitTimeLeft}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-sm text-orange-200 font-medium">Time to rejoin</p>
                      <p className="text-xs text-orange-300/80">You'll win by forfeit if they don't return</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
  <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 pb-24 sm:pb-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {messages.length === 0 && gameStatus === 'waiting' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-brand-500/20 to-pink-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-brand-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-200 mb-2">Waiting for Opponent</h3>
                <p className="text-sm text-zinc-400">Share the room code with your friend to start debating!</p>
              </div>
            </div>
          )}

          {messages.length === 0 && gameStatus === 'ongoing' && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-zinc-200 mb-2">Debate Started!</h3>
                <p className="text-sm text-zinc-400">Make your first argument to begin the debate.</p>
              </div>
            </div>
          )}
          
          {messages.map((msg, idx) => {
            const isMyMessage = (msg.author === (user?.username || user?.name)) || (msg.sender === (user?.username || user?.name));
            const isForSide = msg.side === 'for';
            const displayMessage = msg.message || msg.content;
            const displayAuthor = msg.author || msg.sender || 'Unknown';
            
            return (
              <div
                key={idx}
                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] sm:max-w-[70%] ${isMyMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                  <div className="flex items-center gap-2 px-2">
                    <span className="text-xs font-semibold text-zinc-400">{displayAuthor}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isForSide 
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    }`}>
                      {msg.side}
                    </span>
                    {msg.round && (
                      <span className="text-xs text-zinc-500">R{msg.round}</span>
                    )}
                  </div>
                  
                  <div className={`rounded-2xl px-4 py-3 ${
                    isMyMessage
                      ? isForSide
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                        : 'bg-gradient-to-br from-rose-500 to-pink-500 text-white'
                      : 'bg-surface-50/70 backdrop-blur-sm text-zinc-100 border border-white/10'
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{displayMessage}</p>
                  </div>
                  
                  <span className="text-xs text-zinc-500 px-2">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        {gameStatus === 'ongoing' && (() => {
          const isMyTurn = !currentPhase || !phaseDescription || 
                           (phaseDescription.includes('FOR side') && mySide === 'for') ||
                           (phaseDescription.includes('AGAINST side') && mySide === 'against');
          
          return (
            <div className="bg-surface-50/70 backdrop-blur-xl rounded-2xl border border-white/10 p-4">
              {/* Not Your Turn Overlay */}
              {!isMyTurn && (
                <div className="mb-3 p-4 rounded-xl bg-gradient-to-r from-orange-900/40 to-red-900/40 border-2 border-orange-500/50 backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <svg className="w-6 h-6 text-orange-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <div className="text-sm font-bold text-orange-200">⏳ Waiting for opponent's turn</div>
                      <div className="text-xs text-orange-300/80">You cannot send messages right now</div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row items-end gap-3">
                <div className="flex-1">
                  {/* Round Timer */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-zinc-400">Time left:</span>
                    <span className={`text-xs font-bold ${roundTimeLeft <= 10 ? 'text-red-400' : 'text-green-400'}`}>{roundTimeLeft}s</span>
                  </div>
                  <textarea
                    ref={inputRef}
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder={
                      isMyTurn 
                        ? (currentPhase === 'for_argument' && mySide === 'for' 
                          ? "START HERE: Type your opening argument and press Enter..." 
                          : "Type your argument...")
                        : "Wait for your turn..."
                    }
                    disabled={!isMyTurn || messageCount >= phaseMessageLimit}
                    className={`w-full border rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 resize-none transition-all ${
                      isMyTurn 
                        ? 'bg-white/5 border-white/10 focus:ring-green-500/50' 
                        : 'bg-gray-900/50 border-red-500/30 cursor-not-allowed opacity-50'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    rows={3}
                  />
                  <div className="flex items-center justify-between mt-2 px-1">
                    <span className="text-xs text-zinc-500">
                      {isMyTurn ? 'Press Enter to send, Shift+Enter for new line' : 'Input disabled - Not your turn'}
                    </span>
                    <span className={`text-xs font-semibold ${
                      messageCount >= phaseMessageLimit ? 'text-red-400' : (isMyTurn ? 'text-green-400' : 'text-zinc-500')
                    }`}>
                      {messageCount}/{phaseMessageLimit} messages used
                    </span>
                  </div>
                </div>
                <button
                  onClick={handleSendMessage}
                  disabled={!isMyTurn || !currentMessage.trim() || messageCount >= phaseMessageLimit}
                  className={`w-full sm:w-auto px-6 py-3 rounded-xl font-semibold shadow-lg transition-all flex items-center gap-2 justify-center mt-3 sm:mt-0 ${
                    isMyTurn 
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-xl hover:scale-105' 
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100`}
                >
                  <span>{isMyTurn ? 'Send' : 'Locked'}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMyTurn ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    )}
                  </svg>
                </button>
              </div>
            </div>
          );
        })()}

        {gameStatus === 'waiting' && (
          <div className="bg-yellow-500/10 backdrop-blur-xl rounded-2xl border border-yellow-500/30 p-6 text-center">
            <p className="text-yellow-300 font-semibold">Waiting for opponent to join...</p>
            <p className="text-xs text-yellow-400/70 mt-2">Share room code: <span className="font-mono font-bold">{roomID.split('_')[1]?.toUpperCase() || roomID}</span></p>
          </div>
        )}

        {gameStatus === 'finished' && (
          <div className="bg-blue-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircleIcon className="w-6 h-6 text-blue-300" />
              <p className="text-blue-300 font-semibold text-lg">Debate Finished!</p>
            </div>
            <p className="text-sm text-blue-400/70">Calculating results and updating rankings...</p>
          </div>
        )}
      </main>
    </div>
  );
}
