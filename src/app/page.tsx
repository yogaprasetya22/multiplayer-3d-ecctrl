'use client';

import { useRef, useCallback, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { KeyboardControls } from '@react-three/drei';
import { Physics } from '@react-three/rapier';
import Ecctrl, { EcctrlJoystick } from 'ecctrl';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

// Config
import { ECCTRL_CONFIG, KEYBOARD_MAP, PHYSICS_CONFIG, GAME_CONFIG } from '@/config/game.config';

// Hooks
import { useIsMobile, useChat } from '@/hooks';
import { useMultiplayer } from '@/hooks/useMultiplayer';

// Types
import type { ChatMessage } from '@/types/game';

// UI Components
import { LoginScreen, HUD, ChatBox, ControlsHint, PerformanceMonitor, PlayerDebugOverlay } from '@/components/ui';

// Game Components
import {
  PlayerMesh,
  OtherPlayers,
  WorldEnvironment,
  WorldObstacles,
  WorldAnimations,
  Gems,
  GEM_COUNT,
} from '@/components/game';
import { MyPlayerLabel } from '@/components/game/PlayerLabel';
import type { AnimationName } from '@/components/game';

// ===================== PLAYER CONTROLLER =====================
interface PlayerControllerProps {
  ecctrlRef: React.RefObject<any>;
  onPositionUpdate: (
    position: { x: number; y: number; z: number }, 
    rotation: { y: number }, 
    animation: string,
    quaternion: { x: number; y: number; z: number; w: number }
  ) => void;
  username: string;
  lastChatMessage?: string;
  lastChatTimestamp?: number;
}

function PlayerController({ ecctrlRef, onPositionUpdate, username, lastChatMessage, lastChatTimestamp }: PlayerControllerProps) {
  const lastBroadcastTime = useRef(0); // Time-based throttling
  const [animation, setAnimation] = useState<AnimationName>('Idle');
  const lastPos = useRef({ x: 0, z: 0 });
  const velocityRef = useRef(0);
  const currentAnimRef = useRef<AnimationName>('Idle');

  useFrame((state, delta) => {
    if (!ecctrlRef.current?.group) return;

    const rigidBody = ecctrlRef.current.group;
    const pos = rigidBody.translation();
    const rotQuat = rigidBody.rotation();

    // Convert quaternion to euler Y (for backward compatibility)
    const euler = new THREE.Euler().setFromQuaternion(
      new THREE.Quaternion(rotQuat.x, rotQuat.y, rotQuat.z, rotQuat.w)
    );
    
    // Calculate velocity for animation
    const dx = pos.x - lastPos.current.x;
    const dz = pos.z - lastPos.current.z;
    const velocity = Math.sqrt(dx * dx + dz * dz) / delta;
    
    // Smooth velocity
    velocityRef.current += (velocity - velocityRef.current) * 0.15;
    lastPos.current = { x: pos.x, z: pos.z };
    
    // Update animation based on velocity
    const newAnim: AnimationName = velocityRef.current > 4 ? 'Run' 
      : velocityRef.current > 0.5 ? 'Walk' 
      : 'Idle';
    
    if (newAnim !== animation) {
      setAnimation(newAnim);
      currentAnimRef.current = newAnim;
    }

    // 🚀 TIME-BASED BROADCAST - lebih reliable dari frame counting!
    // Target ~15-20 updates per detik (setiap 50-66ms)
    const now = state.clock.elapsedTime * 1000; // Convert to ms
    const BROADCAST_INTERVAL = 50; // 50ms = 20 updates/sec max
    
    if (now - lastBroadcastTime.current >= BROADCAST_INTERVAL) {
      lastBroadcastTime.current = now;
      
      if (pos.x !== 0 || pos.y !== 0 || pos.z !== 0) {
        onPositionUpdate(
          { x: pos.x, y: pos.y, z: pos.z }, 
          { y: euler.y }, 
          currentAnimRef.current,
          { x: rotQuat.x, y: rotQuat.y, z: rotQuat.z, w: rotQuat.w } // Send quaternion
        );
      }
    }
  });

  return (
    <Ecctrl
      ref={ecctrlRef}
      debug={false}
      animated={false}
      position={GAME_CONFIG.playerSpawnPosition}
      {...ECCTRL_CONFIG}
    >
      <group name="player-character">
        {/* Label nama dan chat bubble di atas kepala */}
        <MyPlayerLabel 
          username={username}
          chatMessage={lastChatMessage}
          chatTimestamp={lastChatTimestamp}
        />
        <PlayerMesh animation={animation} />
      </group>
    </Ecctrl>
  );
}

// ===================== GAME SCENE =====================
interface GameSceneProps {
  broadcastPosition: (
    position: { x: number; y: number; z: number }, 
    rotation: { y: number }, 
    animation: string,
    quaternion: { x: number; y: number; z: number; w: number }
  ) => void;
  onGemCollect: (gemId: string) => void;
  username: string;
  lastChatMessage?: string;
  lastChatTimestamp?: number;
}

function GameScene({ broadcastPosition, onGemCollect, username, lastChatMessage, lastChatTimestamp }: GameSceneProps) {
  const ecctrlRef = useRef<any>(null);

  return (
    <>
      <WorldEnvironment />
      <WorldObstacles />
      <Gems onCollect={onGemCollect} />

      <KeyboardControls map={KEYBOARD_MAP}>
        <PlayerController 
          ecctrlRef={ecctrlRef} 
          onPositionUpdate={broadcastPosition}
          username={username}
          lastChatMessage={lastChatMessage}
          lastChatTimestamp={lastChatTimestamp}
        />
      </KeyboardControls>

      <OtherPlayers />
      <WorldAnimations />
    </>
  );
}

// ===================== MAIN PAGE =====================
export default function GamePage() {
  const [started, setStarted] = useState(false);
  const [username, setUsername] = useState('');
  const [lobbyId, setLobbyId] = useState(GAME_CONFIG.defaultLobbyId);
  const [score, setScore] = useState(0);
  const [collectedGems, setCollectedGems] = useState<Set<string>>(new Set());
  
  // State untuk track chat yang dikirim player sendiri (untuk bubble)
  const [lastSentChat, setLastSentChat] = useState<string | undefined>(undefined);
  const [lastSentChatTime, setLastSentChatTime] = useState<number | undefined>(undefined);

  const myId = useRef(uuidv4()).current;
  const isMobile = useIsMobile();

  // Chat hook
  const chat = useChat();
  
  // ✅ Store addMessage in ref to avoid dependency issues
  const addMessageRef = useRef(chat.addMessage);
  addMessageRef.current = chat.addMessage;

  // Handle chat messages - stable callback
  const handleChatMessage = useCallback(
    (message: ChatMessage) => {
      addMessageRef.current(message);
    },
    [] // ✅ No dependencies - uses ref
  );

  // Multiplayer hook
  const multiplayer = useMultiplayer({
    myId,
    username,
    lobbyId,
    onChatMessage: handleChatMessage,
  });
  
  // Store channel in ref
  const channelRef = useRef(multiplayer.channel);
  channelRef.current = multiplayer.channel;

  // Handle gem collection
  const handleGemCollect = useCallback(
    (gemId: string) => {
      setCollectedGems((prev) => {
        if (prev.has(gemId)) return prev;
        
        const newSet = new Set(prev).add(gemId);
        setScore((s) => s + 1);

        // Broadcast gem collection
        if (channelRef.current) {
          (channelRef.current as any).send({
            type: 'broadcast',
            event: 'collect',
            payload: { gemId, username },
          });
        }

        addMessageRef.current({
          type: 'system',
          message: `${username} mengambil gem!`,
          timestamp: Date.now(),
        });
        
        return newSet;
      });
    },
    [username] // ✅ Only username needed
  );

  // Handle chat send - juga update lastSentChat untuk bubble di atas kepala
  const handleSendChat = useCallback(() => {
    const message = chat.input.trim();
    if (message) {
      setLastSentChat(message);
      setLastSentChatTime(Date.now());
    }
    chat.sendMessage(multiplayer.sendChat);
  }, [chat.sendMessage, chat.input, multiplayer.sendChat]);

  // Request pointer lock
  const handleCanvasClick = useCallback(() => {
    const canvas = document.querySelector('canvas');
    if (canvas && !document.pointerLockElement) {
      canvas.requestPointerLock();
    }
  }, []);

  // Show login screen if not started
  if (!started) {
    return (
      <LoginScreen
        username={username}
        setUsername={setUsername}
        lobbyId={lobbyId}
        setLobbyId={setLobbyId}
        onStart={() => username.trim() && setStarted(true)}
      />
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 3D Canvas - Optimized for 50 players */}
      <Canvas
        shadows={false}
        camera={{ 
          fov: 75,
          near: 0.1,
          far: 55, // 🎯 Camera far plane = 55m (tidak render lebih jauh!)
        }}
        onClick={handleCanvasClick}
        style={{ cursor: 'pointer' }}
        gl={{ 
          antialias: false, // Disable untuk performa
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]} // Limit pixel ratio untuk performa
      >
        {/* 🌫️ FOG - membuat object memudar mulai 35m, hilang total di 55m */}
        <fog attach="fog" args={['#87CEEB', 35, 55]} />
        
        <Physics gravity={PHYSICS_CONFIG.gravity} timeStep={PHYSICS_CONFIG.timeStep}>
          <GameScene
            broadcastPosition={multiplayer.broadcastPosition}
            onGemCollect={handleGemCollect}
            username={username}
            lastChatMessage={lastSentChat}
            lastChatTimestamp={lastSentChatTime}
          />
        </Physics>
      </Canvas>

      {/* Mobile Joystick */}
      {isMobile && <EcctrlJoystick />}

      {/* Performance Monitor (FPS + Ping) */}
      <PerformanceMonitor />

      {/* Player Debug Overlay */}
      {/* <PlayerDebugOverlay /> */}

      {/* HUD */}
      <HUD
        playerCount={multiplayer.otherPlayerCount + 1}
        score={score}
        maxScore={GEM_COUNT}
        lobbyId={lobbyId}
      />

      {/* Chat */}
      <ChatBox
        messages={chat.messages}
        input={chat.input}
        setInput={chat.setInput}
        onSend={handleSendChat}
        visible={chat.showChat}
      />

      {/* Controls Hint */}
      <ControlsHint isMobile={isMobile} />

      {/* Connection Status */}
      {!multiplayer.isConnected && (
        <div className="absolute top-20 left-5 bg-yellow-600/90 text-white px-4 py-2 rounded-lg text-sm font-bold">
          ⏳ Menghubungkan ke server...
        </div>
      )}
    </div>
  );
}
