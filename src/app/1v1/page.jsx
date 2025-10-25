"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useRouter } from "next/navigation";
import axios from "../../api/axios";
import { toast } from "react-toastify";
import { TargetIcon, ZapIcon } from "../../components/Icons";

export default function OneVOnePage() {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [hype, setHype] = useState(0);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [isSearchingRanked, setIsSearchingRanked] = useState(false);
  const [matchmakingStatus, setMatchmakingStatus] = useState("");
  const [showRulesModal, setShowRulesModal] = useState(false);

  const joinTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchHype = async () => {
      try {
        const response = await axios.get("/api/auth/me");
        setHype(response.data.hype || 0);
      } catch (error) {      }
    };
    fetchHype();
  }, []);

  useEffect(() => {
    if (!socket) {      return;
    }
    const handleRoomCreated = ({ roomID, roomId, ...rest } = {}) => {
      const id = roomID || roomId;
      if (!id) {        return;
      }      setIsCreatingRoom(false);
      toast.success(`Room created: ${id}`, { autoClose: 3500 });
      router.push(`/1v1/room/${id}`);
    };

    const handleRoomJoined = ({ roomID, roomId, players } = {}) => {
      const id = roomID || roomId;      setIsJoiningRoom(false);
      toast.success("Joined room", { autoClose: 2000 });
      router.push(`/1v1/room/${id}`);
    };

    const handleStartMatch = (data) => {      const id = data?.roomID || data?.roomId;
      toast.success("Match starting", { autoClose: 1500 });
      if (id) router.push(`/1v1/room/${id}`);
    };

    const handleMatchFound = ({ roomID, roomId, players } = {}) => {
      const id = roomID || roomId;      setIsSearchingRanked(false);
      setMatchmakingStatus("");
      toast.success("Match found! Joining...", { autoClose: 1800 });
      if (id) router.push(`/1v1/room/${id}`);
    };

    const handleWaitingRanked = (payload) => {
      const message = typeof payload === "string" ? payload : payload?.message || "Waiting for opponent...";      setMatchmakingStatus(message);
      toast.info(message, { autoClose: 1600 });
    };

    const handleErrorMessage = (payload) => {
      const message = typeof payload === "string" ? payload : payload?.message || JSON.stringify(payload);      setIsCreatingRoom(false);
      setIsJoiningRoom(false);
      setIsSearchingRanked(false);
      setMatchmakingStatus("");
      toast.error(message, { autoClose: 3000 });
    };

    const handleRoomNotFound = ({ roomID, roomId } = {}) => {
      const id = roomID || roomId;      setIsJoiningRoom(false);
      toast.error(`Room "${id}" not found.`, { autoClose: 3000 });
    };

    const handleRoomFull = ({ roomID, roomId } = {}) => {
      const id = roomID || roomId;      setIsJoiningRoom(false);
      toast.error("Room is already full.", { autoClose: 3000 });
    };

    socket.on("room-created", handleRoomCreated);
    socket.on("room_created", handleRoomCreated);

    socket.on("room-joined", handleRoomJoined);
    socket.on("room_joined", handleRoomJoined);

    socket.on("start-match", handleStartMatch);
    socket.on("match-start", handleStartMatch);

    socket.on("match-found", handleMatchFound);
    socket.on("match_found", handleMatchFound);

    socket.on("waiting-ranked", handleWaitingRanked);
    socket.on("waiting_ranked", handleWaitingRanked);

    socket.on("error-message", handleErrorMessage);
    socket.on("error_message", handleErrorMessage);
    socket.on("error", handleErrorMessage);

    socket.on("room-not-found", handleRoomNotFound);
    socket.on("room-full", handleRoomFull);

    socket.on("server-message", (payload) => {      if (payload?.toast) toast.info(payload.toast, { autoClose: 2500 });
    });

    return () => {      if (joinTimeoutRef.current) {
        clearTimeout(joinTimeoutRef.current);
        joinTimeoutRef.current = null;
      }

      socket.off("room-created", handleRoomCreated);
      socket.off("room_created", handleRoomCreated);

      socket.off("room-joined", handleRoomJoined);
      socket.off("room_joined", handleRoomJoined);

      socket.off("start-match", handleStartMatch);
      socket.off("match-start", handleStartMatch);

      socket.off("match-found", handleMatchFound);
      socket.off("match_found", handleMatchFound);

      socket.off("waiting-ranked", handleWaitingRanked);
      socket.off("waiting_ranked", handleWaitingRanked);

      socket.off("error-message", handleErrorMessage);
      socket.off("error_message", handleErrorMessage);
      socket.off("error", handleErrorMessage);

      socket.off("room-not-found", handleRoomNotFound);
      socket.off("room-full", handleRoomFull);

      socket.off("server-message");
    };
  }, [socket, router]);

  const handleCreateRoom = () => {
    if (!user?.id) {
      toast.error("Please sign in to create a room");
      return;
    }
    if (!socket || !isConnected) return toast.error("Not connected to server");

    setIsCreatingRoom(true);

    const payload = { userId: user.id, username: user?.username || user?.name || null };

    socket.emit("create-room", payload);
    socket.emit("create_room", payload);
    socket.emit("createRoom", payload);

    setTimeout(() => {
      if (isCreatingRoom) {
        setIsCreatingRoom(false);
        toast.error("No response from server when creating room. Try again.");
      }
    }, 10_000);
  };

  const handleJoinRoom = () => {
    if (!roomCode.trim()) return toast.error("Please enter a room code");
    if (!user?.id) return toast.error("Please sign in to join a room");
    if (!socket || !isConnected) return toast.error("Not connected to server");

    setIsJoiningRoom(true);

    const payload = { userId: user.id, username: user?.username || user?.name || null, roomID: roomCode.trim() };

    socket.emit("join-room", payload);
    socket.emit("join_room", payload);
    socket.emit("joinRoom", payload);

    if (joinTimeoutRef.current) clearTimeout(joinTimeoutRef.current);
    joinTimeoutRef.current = setTimeout(() => {
      if (isJoiningRoom) {
        setIsJoiningRoom(false);
        toast.warning("Join response taking longer than expected. Check the code or try again.");
      }
    }, 10_000);
  };

  const handlePlayRanked = () => {
    if (!user?.id) return toast.error("Please sign in to play ranked");
    if (!socket || !isConnected) return toast.error("Not connected to server");

    setIsSearchingRanked(true);
    setMatchmakingStatus("Searching for opponent...");

    const payload = { userId: user.id, username: user?.username || user?.name || null };
    
    socket.emit("join-ranked", payload);
    socket.emit("join_ranked", payload);
    socket.emit("join-rankedqueue", payload);
    socket.emit("join_rankedqueue", payload);
    socket.emit("join-rankedqueue-v2", payload);

    setTimeout(() => {
      if (isSearchingRanked) {
        setMatchmakingStatus("Still searching...");
        toast.info("Still searching for opponents...", { autoClose: 1800 });
      }
    }, 8_000);
  };

  const handleCancelRanked = () => {
    if (!socket) {
      setIsSearchingRanked(false);
      setMatchmakingStatus("");
      return;
    }
    setIsSearchingRanked(false);
    setMatchmakingStatus("");
    
    socket.emit("leave-ranked", { userId: user?.id });
    socket.emit("leave_ranked", { userId: user?.id });
    socket.emit("cancel-ranked", { userId: user?.id });
    socket.emit("cancel_ranked", { userId: user?.id });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-purple-950/20 to-zinc-950 flex flex-col">
      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-zinc-900/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 max-w-3xl w-full border border-purple-500/20 shadow-2xl shadow-purple-500/10 my-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                📜 How to Debate
              </h2>
              <button
                onClick={() => setShowRulesModal(false)}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white transition-all flex-shrink-0"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4 sm:space-y-6 text-zinc-300 max-h-[70vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-500/20 scrollbar-track-transparent">
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg sm:rounded-xl p-4 sm:p-5">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">
                  <TargetIcon className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />
                  Overview
                </h3>
                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                  1v1 debates are <strong className="text-purple-400">structured, turn-based</strong> arguments where two debaters take opposing sides (FOR and AGAINST). 
                  Each debate consists of <strong className="text-pink-400">1 round with 6 phases</strong>, judged by AI at the end.
                </p>
              </div>

              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                  <ZapIcon className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400" />
                  Phase Structure (1 Round)
                </h3>
                <div className="space-y-2 sm:space-y-3">
                  {[
                    { phase: "Phase 1", side: "FOR", color: "green", action: "Opening Argument", time: "5min", msgs: "2", desc: "Present your main argument" },
                    { phase: "Phase 2", side: "AGAINST", color: "red", action: "Response", time: "5min", msgs: "2", desc: "Respond to FOR's argument" },
                    { phase: "Phase 3", side: "AGAINST", color: "red", action: "Counter-Argument", time: "5min", msgs: "2", desc: "Present your counter-argument" },
                    { phase: "Phase 4", side: "FOR", color: "green", action: "Response", time: "5min", msgs: "2", desc: "Respond to counter-argument" },
                    { phase: "Phase 5", side: "FOR", color: "green", action: "Rebuttal", time: "5min", msgs: "1", desc: "Your final rebuttal" },
                    { phase: "Phase 6", side: "AGAINST", color: "red", action: "Final Rebuttal", time: "5min", msgs: "1", desc: "Final response" },
                  ].map((p, i) => (
                    <div key={i} className="flex items-start gap-2 sm:gap-3 bg-zinc-800/50 rounded-lg p-3 sm:p-4 border border-zinc-700/50">
                      <div className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full ${p.color === 'green' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'} flex items-center justify-center font-bold text-xs sm:text-sm`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                          <span className={`font-bold text-xs sm:text-sm ${p.color === 'green' ? 'text-green-400' : 'text-red-400'}`}>{p.side}</span>
                          <span className="text-white font-semibold text-xs sm:text-sm">→ {p.action}</span>
                          <div className="flex items-center gap-1.5 ml-auto flex-shrink-0">
                            <span className="text-xs bg-zinc-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">{p.time}</span>
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">{p.msgs}msg</span>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-zinc-400">{p.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Turn Rules */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🔒</span>
                  Turn-Based Rules
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                    <span>Only the <strong className="text-white">designated side can send messages</strong> during their phase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                    <span>Message input is <strong className="text-white">locked during opponent's turn</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                    <span>Phase indicator shows <strong className="text-green-400">green (your turn)</strong> or <strong className="text-zinc-400">gray (opponent's turn)</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                    <span>Phases <strong className="text-white">auto-advance</strong> when time expires or message limit is reached</span>
                  </li>
                </ul>
              </div>

              {/* Scoring */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">🤖</span>
                  AI Judging & Scoring
                </h3>
                <div className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-zinc-300">
                  <p className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                    <span>AI analyzes <strong className="text-white">argument quality, logic, evidence, and persuasiveness</strong></span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                    <span>Each side receives a <strong className="text-white">score (0-100)</strong> and personalized feedback</span>
                  </p>
                  <p className="flex items-start gap-2">
                    <span className="text-purple-400 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                    <span>Higher score wins the debate</span>
                  </p>
                </div>
              </div>

              {/* Hype System */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">⭐</span>
                  Hype Point System
                </h3>
                <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 sm:p-4">
                  <p className="text-sm sm:text-base text-zinc-300 mb-2 sm:mb-3">
                    Win debates to earn <strong className="text-orange-400">Hype points</strong> (ELO-like rating):
                  </p>
                  <ul className="space-y-1 text-xs sm:text-sm text-zinc-400">
                    <li>• <strong className="text-white">Base:</strong> 30 points</li>
                    <li>• <strong className="text-white">Adjusted by opponent:</strong> Beat stronger for more points</li>
                    <li>• <strong className="text-white">Range:</strong> 10-50 points per match</li>
                    <li>• <strong className="text-white">Winner:</strong> Gains hype</li>
                    <li>• <strong className="text-white">Loser:</strong> Loses hype (minimum 0)</li>
                  </ul>
                </div>
              </div>

              {/* Forfeit */}
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">⚠️</span>
                  Forfeit & Disconnect
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 text-sm sm:text-base text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                    <span>If you disconnect or leave, you have <strong className="text-white">20 seconds to rejoin</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                    <span>If you don't rejoin in time, <strong className="text-white">opponent wins by forfeit</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-400 mt-0.5 sm:mt-1 flex-shrink-0">•</span>
                    <span>Forfeit still affects your Hype rating</span>
                  </li>
                </ul>
              </div>

              {/* Tips */}
              <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-lg sm:rounded-xl p-4 sm:p-5">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 sm:mb-3 flex items-center gap-2">
                  <span className="text-xl sm:text-2xl">💡</span>
                  Pro Tips
                </h3>
                <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-zinc-300">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 flex-shrink-0">✓</span>
                    <span>Use your messages wisely - limited messages per phase</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 flex-shrink-0">✓</span>
                    <span>Watch the timer - phases auto-advance when time runs out</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 flex-shrink-0">✓</span>
                    <span>Focus on <strong className="text-white">logic, evidence, and persuasive language</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 flex-shrink-0">✓</span>
                    <span>Address opponent's points directly in response phases</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400 flex-shrink-0">✓</span>
                    <span>Make your final rebuttal count - it's your last word!</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-4 sm:mt-6 flex justify-center">
              <button
                onClick={() => setShowRulesModal(false)}
                className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg hover:shadow-lg hover:shadow-purple-500/50 transition-all text-sm sm:text-base"
              >
                Got it! Let's Debate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Matchmaking Modal */}
      {isSearchingRanked && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900/90 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-purple-500/20 shadow-2xl shadow-purple-500/10">
            <div className="flex flex-col items-center text-center">
              <div className="relative w-24 h-24 mb-6">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-ping opacity-75" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center">
                  <svg className="w-12 h-12 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-2">Finding Opponent...</h3>
              <p className="text-zinc-400 mb-6">{matchmakingStatus || "Searching for a worthy adversary"}</p>

              <div className="flex gap-2 mb-8">
                <div className="w-3 h-3 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-3 h-3 rounded-full bg-pink-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-3 h-3 rounded-full bg-fuchsia-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>

              <button
                onClick={handleCancelRanked}
                className="px-6 py-2.5 rounded-lg border border-white/20 text-zinc-300 hover:text-white hover:bg-white/10 transition-all font-semibold"
              >
                Cancel Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="w-full p-4 md:p-6 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <a href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors group">
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="font-semibold text-sm sm:text-base">Back to Home</span>
            </a>
            
            <button
              onClick={() => setShowRulesModal(true)}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 rounded-lg text-purple-300 hover:text-purple-200 transition-all group"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-sm sm:text-base">Rules</span>
            </button>
          </div>

          {user && (
            <div className="flex items-center gap-4 bg-zinc-900/70 backdrop-blur-xl rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 border border-purple-500/20 shadow-lg w-full sm:w-auto">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-base sm:text-lg shadow-lg">
                  {(user?.username || user?.name || "U")[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-white">{user?.username || user?.name || "Player"}</span>
                  <div className="flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-xs font-bold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">{hype.toLocaleString()} Hype</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="max-w-6xl w-full">
          {/* Title */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-3 sm:mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent">
              ArguMate Arena
            </h1>
            <p className="text-zinc-400 text-base sm:text-lg">Choose your battle mode and prove your debating prowess</p>
          </div>

          {/* Main Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Create Room Card */}
            <button
              onClick={handleCreateRoom}
              disabled={isCreatingRoom}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-purple-500/20 p-8 hover:border-purple-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4 shadow-lg shadow-purple-500/50 group-hover:scale-110 transition-transform">
                  {isCreatingRoom ? (
                    <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Create Room</h3>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  {isCreatingRoom ? "Creating your private arena..." : "Start a private debate room and invite friends"}
                </p>
              </div>
            </button>

            {/* Join Room Card */}
            <div className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-blue-500/20 p-8 hover:border-blue-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/50 group-hover:scale-110 transition-transform">
                  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Join Room</h3>
                <p className="text-sm text-zinc-400 mb-4">Enter a room code to join an existing debate</p>
                
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Enter room code"
                  maxLength={12}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-center font-mono text-lg focus:outline-none focus:border-blue-500 mb-3 transition-colors"
                />
                
                <button
                  onClick={handleJoinRoom}
                  disabled={!roomCode.trim() || isJoiningRoom}
                  className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
                >
                  {isJoiningRoom ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Joining...
                    </span>
                  ) : (
                    "Join Now"
                  )}
                </button>
              </div>
            </div>

            {/* Play Ranked Card */}
            <button
              onClick={handlePlayRanked}
              disabled={isSearchingRanked}
              className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 to-zinc-800 border border-orange-500/20 p-8 hover:border-orange-500/40 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center mb-4 shadow-lg shadow-orange-500/50 group-hover:scale-110 transition-transform">
                  {isSearchingRanked ? (
                    <svg className="w-10 h-10 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  ) : (
                    <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  )}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Play Ranked</h3>
                <p className="text-sm text-zinc-400 leading-relaxed mb-2">
                  {isSearchingRanked ? "Searching for opponent..." : "Enter competitive matchmaking"}
                </p>
                <p className="text-xs font-semibold bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                  Earn Hype & Climb the Leaderboard
                </p>
              </div>
            </button>
          </div>

          {/* Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">6 Phases</div>
              <div className="text-sm text-zinc-500">Structured Debate</div>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">~30 Minutes</div>
              <div className="text-sm text-zinc-500">Total Duration</div>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-orange-400 mb-1">AI Judge</div>
              <div className="text-sm text-zinc-500">Determines Winner</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
