# ArguMate — Frontend

A Next.js frontend for ArguMate, an AI-assisted structured 1v1 debate platform.

## Tech stack
- Next.js
- React
- Tailwind CSS / PostCSS
- Axios
- socket.io-client
- three.js (visual effects)
- date-fns

## Prerequisites
- Node.js 18+ and npm (or pnpm/yarn)
- Access to the deployed backend (API + Socket endpoints)
- Git

## Environment variables
Create `.env.local` at the project root with:

NEXT_PUBLIC_API_URL="https://api.your-backend.com"  
NEXT_PUBLIC_SOCKET_URL="https://api.your-backend.com"  
NODE_ENV=production

## Setup (local)
1. Clone repo:
   git clone <repo-url>
2. Change to frontend folder:
   cd debate/debate-frontend/deb-frontend
3. Install dependencies:
   npm ci
4. Dev mode:
   npm run dev
   Open http://localhost:3000
5. Build for production:
   npm run build
