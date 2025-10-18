import axios from 'axios';

const DEFAULT_BACKEND = 'http://localhost:5001';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || DEFAULT_BACKEND,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

if (!process.env.NEXT_PUBLIC_API_BASE_URL) {
  console.info(`[api] NEXT_PUBLIC_API_BASE_URL not set — using ${DEFAULT_BACKEND}`);
}

export default api;

