"use client";

import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster 
      position="top-right" 
      toastOptions={{ 
        duration: 2500,
        style: {
          background: 'rgba(17, 17, 36, 0.95)',
          color: '#f4f4f5',
          border: '1px solid rgba(168, 85, 247, 0.3)',
          backdropFilter: 'blur(12px)',
          borderRadius: '12px',
          boxShadow: '0 0 0 1px rgba(168,85,247,0.15), 0 15px 30px -10px rgba(168,85,247,0.25)',
        },
        success: {
          iconTheme: {
            primary: '#a855f7',
            secondary: '#f4f4f5',
          },
        },
        error: {
          iconTheme: {
            primary: '#f87171',
            secondary: '#f4f4f5',
          },
        },
        loading: {
          iconTheme: {
            primary: '#a855f7',
            secondary: '#f4f4f5',
          },
        },
      }} 
    />
  );
}
