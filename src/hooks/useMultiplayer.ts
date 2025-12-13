'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { playersStore } from '@/stores/playersStore';
import type { ChatMessage, GameChannel } from '@/types/game';

interface UseMultiplayerOptions {
  myId: string;
  username: string;
  lobbyId: string;
  onChatMessage: (message: ChatMessage) => void;
}

interface UseMultiplayerReturn {
  channel: GameChannel | null;
  isConnected: boolean;
  otherPlayerCount: number;
  sendChat: (message: string) => void;
  broadcastPosition: (
    position: { x: number; y: number; z: number }, 
    rotation: { y: number }, 
    animation: string,
    quaternion: { x: number; y: number; z: number; w: number }
  ) => void;
}

export function useMultiplayer({
  myId,
  username,
  lobbyId,
  onChatMessage,
}: UseMultiplayerOptions): UseMultiplayerReturn {
  const [channel, setChannel] = useState<GameChannel | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [otherPlayerCount, setOtherPlayerCount] = useState(0);
  const channelRef = useRef<any>(null);
  
  // ✅ Store callback in ref to avoid dependency issues
  const onChatMessageRef = useRef(onChatMessage);
  onChatMessageRef.current = onChatMessage;

  useEffect(() => {
    // Don't connect if username is empty
    if (!username) return;

    const newChannel = supabase.channel(`lobby:${lobbyId}`, {
      config: {
        broadcast: { self: false },
        presence: { key: myId },
      },
    });

    // Handler for player movement
    const handlePlayerMove = ({ payload }: any) => {
      if (!payload?.id || payload.id === myId) return;

      // 🔍 DEBUG: Emit receive event untuk NetworkDebug
      window.dispatchEvent(new CustomEvent('network:receive', { detail: payload }));

      const isNew = !playersStore.data[payload.id];

      playersStore.update(payload.id, {
        x: payload.position?.x ?? 0,
        y: payload.position?.y ?? 0,
        z: payload.position?.z ?? 0,
        rot: payload.rotation?.y ?? 0,
        quat: payload.quaternion, // Store quaternion for accurate rotation
        animation: payload.animation || 'Idle',
        username: payload.username || 'Unknown',
      });

      if (isNew) {
        playersStore.notifyListeners();
      }
    };

    // Setup listeners
    newChannel
      .on('broadcast', { event: 'player-move' }, handlePlayerMove)
      .on('broadcast', { event: 'chat' }, ({ payload }: any) => {
        // Update playersStore dengan chat message untuk bubble
        if (payload.id && payload.id !== myId) {
          playersStore.updateChat(payload.id, payload.message);
        }
        
        onChatMessageRef.current({
          type: 'message',
          username: payload.username,
          message: payload.message,
          timestamp: payload.ts,
          isOwn: payload.id === myId,
        });
      })
      .on('presence', { event: 'sync' }, () => {
        const state = newChannel.presenceState();
        const allPresences = Object.values(state).flat();
        const count = allPresences.length;

        // Update player count display
        const el = document.getElementById('player-count');
        if (el) el.textContent = count.toString();

        setOtherPlayerCount(Math.max(0, count - 1));
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
        leftPresences.forEach((presence: any) => {
          playersStore.remove(presence.id);
        });
        setOtherPlayerCount((prev) => Math.max(0, prev - leftPresences.length));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = newChannel;
          setChannel(newChannel as unknown as GameChannel);
          setIsConnected(true);

          await newChannel.track({
            id: myId,
            username,
            lobbyId,
            online_at: new Date().toISOString(),
          });

          onChatMessageRef.current({
            type: 'system',
            message: `${username} bergabung ke lobby`,
            timestamp: Date.now(),
          });
        }
      });

    return () => {
      setIsConnected(false);
      setChannel(null);
      channelRef.current = null;
      playersStore.clear();
      newChannel.unsubscribe();
    };
  }, [myId, username, lobbyId]); // ✅ Removed onChatMessage from deps

  const sendChat = useCallback(
    (message: string) => {
      if (!message.trim() || !channelRef.current) return;

      channelRef.current.send({
        type: 'broadcast',
        event: 'chat',
        payload: { id: myId, username, message, ts: Date.now() },
      });
    },
    [myId, username]
  );

  const broadcastPosition = useCallback(
    (
      position: { x: number; y: number; z: number }, 
      rotation: { y: number }, 
      animation: string,
      quaternion: { x: number; y: number; z: number; w: number }
    ) => {
      if (!channelRef.current) return;

      // 🔍 DEBUG: Emit broadcast event
      window.dispatchEvent(new CustomEvent('network:broadcast', { 
        detail: { position, rotation, animation, quaternion } 
      }));

      channelRef.current.send({
        type: 'broadcast',
        event: 'player-move',
        payload: {
          id: myId,
          position,
          rotation,
          quaternion, // Send quaternion for accurate rotation
          animation,
          username,
        },
      });
    },
    [myId, username]
  );

  return {
    channel,
    isConnected,
    otherPlayerCount,
    sendChat,
    broadcastPosition,
  };
}
