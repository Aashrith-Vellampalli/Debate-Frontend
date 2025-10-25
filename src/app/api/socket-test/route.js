import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Socket.IO integration ready',
    endpoints: {
      socket: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
      events: {
        client: ['createRoom', 'joinRoom', 'joinQueue', 'sendMessage', 'startDebate'],
        server: ['roomJoined', 'matchFound', 'roundStarted', 'timerUpdate', 'messageReceived', 'matchEnded']
      }
    },
    usage: {
      lobby: '/debate-lobby',
      demo: '/debate-demo',
      components: ['DebateRoom', 'Queue', 'Lobby']
    }
  });
}
