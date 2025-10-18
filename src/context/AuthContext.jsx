"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // initialize on client after hydration to avoid SSR/CSR HTML mismatch
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setUser(JSON.parse(raw));
    } catch (e) {
      // ignore
    }
    try {
      const t = localStorage.getItem('token');
      if (t) setToken(t);
    } catch (e) {
      // ignore
    }
    setHydrated(true);
  }, []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      if (user) localStorage.setItem('user', JSON.stringify(user));
      else localStorage.removeItem('user');
    } catch (e) {
      console.log('AuthContext: failed to write user to localStorage', e);
    }
  }, [user]);

  useEffect(() => {
    try {
      if (token) localStorage.setItem('token', token);
      else localStorage.removeItem('token');
    } catch (e) {
      console.log('AuthContext: failed to write token to localStorage', e);
    }
  }, [token]);

  function login({ user: userObj, token: newToken }) {
    setUser(userObj || null);
    if (newToken) setToken(newToken);
  }

  async function logout() {
    try {
      await api.post('/api/auth/logout');
    } catch (e) {
      
      console.log('AuthContext.logout: server logout failed', e?.response?.data || e?.message || e);
    }

    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    } catch (e) {
      
    }
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, setUser, setToken, hydrated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}