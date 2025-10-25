"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within SocketProvider");
  }
  return context;
};

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:5001";

    const getToken = () => {
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'token') {
            return decodeURIComponent(value);
          }
        }
      }
      return null;
    };

    const token = getToken();
    const auth = token ? { token } : {};

    socketRef.current = io(socketUrl, {
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: Infinity,
      timeout: 20000,
      autoConnect: true,
      withCredentials: true,
      auth,
      extraHeaders: {
        "Content-Type": "application/json",
      },
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      setIsConnected(true);
      setTransport(socket.io?.engine?.transport?.name || "unknown");
      toast.success("Connected to server", { autoClose: 1500 });
    });

    socket.on("connect_error", (error) => {
      setIsConnected(false);
      toast.error(`Connection error: ${error.message}`, { autoClose: 3000 });
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
      
      if (reason === "io server disconnect") {
        socket.connect();
      }
    });

    socket.on("reconnect", (attemptNumber) => {
      setIsConnected(true);
      toast.success("Reconnected to server", { autoClose: 1500 });
    });

    socket.on("reconnect_attempt", (attemptNumber) => {
    });

    socket.on("reconnect_error", (error) => {
    });

    socket.on("reconnect_failed", () => {
      toast.error("Unable to reconnect to server", { autoClose: 5000 });
    });

    socket.io.engine.on("upgrade", (transport) => {
      setTransport(transport.name);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (socketRef.current && user?.id) {
      socketRef.current.auth = { userId: user.id };
    }
  }, [user?.id]);

  const value = {
    socket: socketRef.current,
    isConnected,
    transport,
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}
