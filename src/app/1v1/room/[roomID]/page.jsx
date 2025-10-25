"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import DebateRoom from '../../../../components/DebateRoom';

export default function DebateRoomPage() {
  const params = useParams();
  const roomID = params.roomID;
  
  return <DebateRoom roomID={roomID} />;
}
