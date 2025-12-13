'use client';

import { useRef, useState, useEffect, memo } from 'react';
import { Html } from '@react-three/drei';

interface PlayerLabelProps {
  username: string;
  chatMessage?: string;
  chatTimestamp?: number;
  position?: [number, number, number];
}

// Durasi chat bubble ditampilkan (dalam ms)
const CHAT_DISPLAY_DURATION = 5000;

// 🚀 OPTIMIZED: Menggunakan Html dari drei (lebih ringan dari Text 3D)
export const PlayerLabel = memo(function PlayerLabel({ 
  username, 
  chatMessage, 
  chatTimestamp,
  position = [0, 2.2, 0]
}: PlayerLabelProps) {
  const [showChat, setShowChat] = useState(false);
  const [currentChat, setCurrentChat] = useState('');
  const chatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (chatMessage && chatTimestamp) {
      setCurrentChat(chatMessage);
      setShowChat(true);
      
      if (chatTimeoutRef.current) {
        clearTimeout(chatTimeoutRef.current);
      }
      
      chatTimeoutRef.current = setTimeout(() => {
        setShowChat(false);
      }, CHAT_DISPLAY_DURATION);
    }
    
    return () => {
      if (chatTimeoutRef.current) {
        clearTimeout(chatTimeoutRef.current);
      }
    };
  }, [chatMessage, chatTimestamp]);

  const displayName = username.length > 12 ? username.slice(0, 12) + '...' : username;
  const displayChat = currentChat.length > 40 ? currentChat.slice(0, 40) + '...' : currentChat;

  return (
    <Html
      position={position}
      center
      distanceFactor={8}
      occlude={false}
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex flex-col items-center gap-1" style={{ transform: 'translateY(-50%)' }}>
        {/* Chat Bubble */}
        {showChat && currentChat && (
          <div 
            className="bg-white text-gray-800 px-2 py-1 rounded-lg text-xs max-w-[150px] text-center shadow-md"
            style={{ 
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {displayChat}
            <div 
              className="absolute left-1/2 -bottom-1 w-2 h-2 bg-white transform -translate-x-1/2 rotate-45"
            />
          </div>
        )}
        
        {/* Username */}
        <div 
          className="bg-black/70 text-white px-2 py-0.5 rounded text-xs font-medium"
          style={{ whiteSpace: 'nowrap' }}
        >
          {displayName}
        </div>
      </div>
    </Html>
  );
});

// Komponen untuk player sendiri
export const MyPlayerLabel = memo(function MyPlayerLabel({ 
  username, 
  chatMessage, 
  chatTimestamp 
}: Omit<PlayerLabelProps, 'position'>) {
  const [showChat, setShowChat] = useState(false);
  const [currentChat, setCurrentChat] = useState('');
  const chatTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (chatMessage && chatTimestamp) {
      setCurrentChat(chatMessage);
      setShowChat(true);
      
      if (chatTimeoutRef.current) {
        clearTimeout(chatTimeoutRef.current);
      }
      
      chatTimeoutRef.current = setTimeout(() => {
        setShowChat(false);
      }, CHAT_DISPLAY_DURATION);
    }
    
    return () => {
      if (chatTimeoutRef.current) {
        clearTimeout(chatTimeoutRef.current);
      }
    };
  }, [chatMessage, chatTimestamp]);

  const displayName = username.length > 12 ? username.slice(0, 12) + '...' : username;
  const displayChat = currentChat.length > 40 ? currentChat.slice(0, 40) + '...' : currentChat;

  return (
    <Html
      position={[0, 0.7, 0]}
      center
      distanceFactor={8}
      occlude={false}
      style={{ pointerEvents: 'none' }}
    >
      <div className="flex flex-col items-center gap-1" style={{ transform: 'translateY(-50%)' }}>
        {/* Chat Bubble - Hijau untuk player sendiri */}
        {showChat && currentChat && (
          <div 
            className="bg-green-100 text-green-800 px-2 py-1 rounded-lg text-xs max-w-[150px] text-center shadow-md border border-green-300"
            style={{ 
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {displayChat}
            <div 
              className="absolute left-1/2 -bottom-1 w-2 h-2 bg-green-100 border-r border-b border-green-300 transform -translate-x-1/2 rotate-45"
            />
          </div>
        )}
        
        {/* Username - Hijau untuk player sendiri */}
        <div 
          className="bg-green-600/90 text-green-100 px-2 py-0.5 rounded text-2xl font-medium"
          style={{ whiteSpace: 'nowrap' }}
        >
          {displayName}
        </div>
      </div>
    </Html>
  );
});
