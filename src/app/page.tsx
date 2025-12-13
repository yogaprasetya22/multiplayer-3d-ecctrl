'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { KeyboardControls, Bvh } from '@react-three/drei';
import BVHEcctrl, { Joystick, VirtualButton, type BVHEcctrlApi } from 'bvhecctrl';
import * as THREE from 'three';
import { v4 as uuidv4 } from 'uuid';

// Config
import { BVHECCTRL_CONFIG, KEYBOARD_MAP, GAME_CONFIG } from '@/config/game.config';

// Hooks
import { useIsMobile, useChat } from '@/hooks';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useGameLoading } from '@/hooks/useGameLoading';

// Types
import type { ChatMessage } from '@/types/game';

// UI Components
import { LoginScreen, HUD, ChatBox, ControlsHint, PerformanceMonitor, PlayerDebugOverlay, LoadingScreen } from '@/components/ui';
import { VelocityDebugOverlay } from '@/components/ui/VelocityDebugOverlay';

// Game Components
import {
  PlayerMesh,
  OtherPlayers,
  WorldEnvironment,
  WorldAnimations,
  Gems,
  GEM_COUNT,
} from '@/components/game';
import { MyPlayerLabel } from '@/components/game/PlayerLabel';
import type { AnimationName } from '@/components/game';

// ===================== PLAYER CONTROLLER =====================
interface PlayerControllerProps {
  bvhEcctrlRef: React.RefObject<BVHEcctrlApi | null>;
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

function PlayerController({ bvhEcctrlRef, onPositionUpdate, username, lastChatMessage, lastChatTimestamp }: PlayerControllerProps) {
  const lastBroadcastTime = useRef(0); // Time-based throttling
  const [animation, setAnimation] = useState<AnimationName>('Idle');
  const lastPos = useRef({ x: 0, y: 0, z: 0 });
  const velocityRef = useRef(0);
  const currentAnimRef = useRef<AnimationName>('Idle');
  const isJumping = useRef(false);
  const wasOnGround = useRef(true);
  const manualAnimationRef = useRef<AnimationName | null>(null);
  const manualAnimationTimer = useRef<NodeJS.Timeout | null>(null);

  // Keyboard 1-0 for manual animations
  useEffect(() => {
    const keyMap: Record<string, AnimationName> = {
      '1': 'Attack(1h)',
      '2': 'Dance',
      '3': 'Cheer',
      '4': 'Wave',
      '5': 'Roll',
      '6': 'Block',
      '7': 'AttackSpinning',
      '8': 'HeavyAttack',
      '9': 'Shoot(1h)',
      '0': 'Hop'
    };

    const handleKeyPress = (e: KeyboardEvent) => {
      const anim = keyMap[e.key];
      if (anim) {
        console.log(`[Keyboard] Triggered manual animation: ${anim} (key ${e.key})`);
        
        // Clear previous timer
        if (manualAnimationTimer.current) {
          clearTimeout(manualAnimationTimer.current);
        }

        // Set manual animation
        manualAnimationRef.current = anim;
        setAnimation(anim);
        currentAnimRef.current = anim;

        // Auto-clear after 2 seconds
        manualAnimationTimer.current = setTimeout(() => {
          console.log(`[Keyboard] Manual animation ${anim} cleared after 2s`);
          manualAnimationRef.current = null;
        }, 2000);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
      if (manualAnimationTimer.current) {
        clearTimeout(manualAnimationTimer.current);
      }
    };
  }, []);

  useFrame((state, delta) => {
    if (!bvhEcctrlRef.current?.group) return;

    const group = bvhEcctrlRef.current.group;
    const pos = group.position;
    const rotQuat = group.quaternion;

    // Convert quaternion to euler Y (for backward compatibility)
    const euler = new THREE.Euler().setFromQuaternion(rotQuat);
    
    // Calculate horizontal velocity for animation
    const dx = pos.x - lastPos.current.x;
    const dz = pos.z - lastPos.current.z;
    const dy = pos.y - lastPos.current.y;
    
    // Distance traveled this frame
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    // Normalize by delta for consistent velocity (smoothed over frames)
    const rawVelocity = distance / Math.max(delta, 0.016); // Cap delta at 16ms (60fps)
    
    // Detect ground status
    const verticalVel = dy / delta;
    const onGround = Math.abs(verticalVel) < 0.1 && Math.abs(dy) < 0.01;
    
    // Jump detection
    if (!wasOnGround.current && onGround) {
      // Just landed
      isJumping.current = false;
    } else if (wasOnGround.current && !onGround && verticalVel > 1) {
      // Just jumped
      isJumping.current = true;
    }
    
    wasOnGround.current = onGround;
    
    // Smooth velocity - use exponential moving average
    // Increased smoothing (0.4) untuk lebih stable response
    velocityRef.current = velocityRef.current * 0.6 + rawVelocity * 0.4;
    lastPos.current = { x: pos.x, y: pos.y, z: pos.z };
    
    // Update animation based on state
    let newAnim: AnimationName;
    
    // If manual animation is active, keep it
    if (manualAnimationRef.current) {
      newAnim = manualAnimationRef.current;
    } else if (isJumping.current) {
      // In air - use jump animation
      newAnim = verticalVel > 0 ? 'Jump_Start' : 'Jump_Idle';
    } else {
      // On ground - use movement animation
      // Threshold dengan maxWalkSpeed=6.5, maxRunSpeed=13
      newAnim = velocityRef.current > 4 ? 'Run'      // Sprint threshold
        : velocityRef.current > 0.5 ? 'Walk'         // Walk threshold
        : 'Idle';                                     // Standing still
    }
    
    if (newAnim !== animation) {
      console.log(`[MyPlayer] Animation: ${animation} → ${newAnim} (rawVel: ${rawVelocity.toFixed(2)}, smoothVel: ${velocityRef.current.toFixed(2)}, onGround: ${onGround})`);
      setAnimation(newAnim);
      currentAnimRef.current = newAnim;
    }

    // 🔍 DEBUG: Log velocity setiap ~50ms untuk monitoring
    if (Math.random() < 0.05) { // ~5% frames = ~3 log per detik pada 60fps
      console.log(`[DEBUG] rawVel: ${rawVelocity.toFixed(2)}, smoothVel: ${velocityRef.current.toFixed(2)}, anim: ${newAnim}`);
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
    <BVHEcctrl
      ref={bvhEcctrlRef}
      debug={false}
      position={GAME_CONFIG.playerSpawnPosition}
      {...BVHECCTRL_CONFIG}
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
    </BVHEcctrl>
  );
}

// ===================== CAMERA CONTROLLER =====================
interface CameraFollowerProps {
  bvhEcctrlRef: React.RefObject<BVHEcctrlApi | null>;
}

function CameraFollower({ bvhEcctrlRef }: CameraFollowerProps) {
  const { camera, gl } = useThree();
  const horizontalAngle = useRef(0);
  const verticalAngle = useRef(0.3); // Initial tilt down
  const distance = useRef(8);
  
  // Pointer lock state
  const isLocked = useRef(false);

  // Touch control state
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const isTouchMode = useRef(false);

  // Helper: Check if touch is in joystick/button area (left bottom)
  const isTouchInControlArea = useCallback((clientX: number, clientY: number): boolean => {
    // Joystick typically on left side, bottom 1/3 of screen
    // Buttons on right side, bottom 1/3 of screen
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;
    
    // Bottom area threshold
    const bottomThreshold = screenHeight * 0.35; // Bottom 35%
    
    if (clientY < screenHeight - bottomThreshold) {
      return false; // Not in bottom area
    }
    
    // Left side joystick area (left 40% of screen)
    const leftJoystickArea = clientX < screenWidth * 0.4;
    // Right side buttons area (right 30% of screen)
    const rightButtonArea = clientX > screenWidth * 0.7;
    
    return leftJoystickArea || rightButtonArea;
  }, []);

  // Mouse move handler
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isLocked.current) return;

    const sensitivity = 0.002;
    horizontalAngle.current -= event.movementX * sensitivity;
    verticalAngle.current += event.movementY * sensitivity; // ✅ Reversed for natural camera

    // Clamp vertical angle
    verticalAngle.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 2.5, verticalAngle.current));
  }, []);

  // Touch start handler
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      
      // ✅ Ignore if touch is in joystick/button area
      if (isTouchInControlArea(touch.clientX, touch.clientY)) {
        return;
      }
      
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
      };
      isTouchMode.current = true;
    }
  }, [isTouchInControlArea]);

  // Touch move handler (for camera control)
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!touchStart.current || !isTouchMode.current || event.touches.length !== 1) return;

    const touch = event.touches[0];
    
    // ✅ Double-check: ignore if moved to control area
    if (isTouchInControlArea(touch.clientX, touch.clientY)) {
      touchStart.current = null;
      isTouchMode.current = false;
      return;
    }

    // ✅ Prevent default to avoid conflict with joystick
    event.preventDefault();

    const deltaX = touch.clientX - touchStart.current.x;
    const deltaY = touch.clientY - touchStart.current.y;

    // ✅ Higher sensitivity for mobile (0.004 = 2x more sensitive)
    const sensitivity = 0.004;
    horizontalAngle.current -= deltaX * sensitivity;
    verticalAngle.current += deltaY * sensitivity;

    // Clamp vertical angle
    verticalAngle.current = Math.max(-Math.PI / 3, Math.min(Math.PI / 2.5, verticalAngle.current));

    // Update touch start position for continuous movement
    touchStart.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
  }, [isTouchInControlArea]);

  // Touch end handler
  const handleTouchEnd = useCallback(() => {
    touchStart.current = null;
    isTouchMode.current = false;
  }, []);

  // Mouse wheel handler for zoom
  const handleWheel = useCallback((event: WheelEvent) => {
    event.preventDefault();
    distance.current = Math.max(3, Math.min(20, distance.current + event.deltaY * 0.01));
  }, []);

  // Pointer lock change handler
  const handlePointerLockChange = useCallback(() => {
    isLocked.current = document.pointerLockElement === gl.domElement;
  }, [gl]);

  // Click to lock pointer
  const handleCanvasClick = useCallback(() => {
    if (!isLocked.current) {
      gl.domElement.requestPointerLock();
    }
  }, [gl]);

  // Setup event listeners
  useState(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    gl.domElement.addEventListener('wheel', handleWheel, { passive: false });
    gl.domElement.addEventListener('click', handleCanvasClick);
    
    // ✅ NEW: Touch control for mobile
    gl.domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    gl.domElement.addEventListener('touchmove', handleTouchMove, { passive: false }); // ✅ Allow preventDefault
    gl.domElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      gl.domElement.removeEventListener('wheel', handleWheel);
      gl.domElement.removeEventListener('click', handleCanvasClick);
      gl.domElement.removeEventListener('touchstart', handleTouchStart);
      gl.domElement.removeEventListener('touchmove', handleTouchMove);
      gl.domElement.removeEventListener('touchend', handleTouchEnd);
    };
  });

  useFrame(() => {
    if (!bvhEcctrlRef.current?.group) return;

    const player = bvhEcctrlRef.current.group;
    const playerPos = player.position;

    // Calculate camera offset based on angles
    const offsetX = distance.current * Math.sin(horizontalAngle.current) * Math.cos(verticalAngle.current);
    const offsetY = distance.current * Math.sin(verticalAngle.current);
    const offsetZ = distance.current * Math.cos(horizontalAngle.current) * Math.cos(verticalAngle.current);

    // Set camera position
    camera.position.set(
      playerPos.x + offsetX,
      playerPos.y + offsetY + 2,
      playerPos.z + offsetZ
    );

    // Look at player
    camera.lookAt(playerPos.x, playerPos.y + 1.5, playerPos.z);
  });

  return null;
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
  const bvhEcctrlRef = useRef<BVHEcctrlApi | null>(null);

  return (
    <>
      <WorldEnvironment />
      {/* <WorldObstacles /> */}  {/* ❌ Disabled - obstacles removed */}
      <Gems onCollect={onGemCollect} />

      {/* Camera follows player */}
      <CameraFollower bvhEcctrlRef={bvhEcctrlRef} />

      <KeyboardControls map={KEYBOARD_MAP}>
        <PlayerController 
          bvhEcctrlRef={bvhEcctrlRef} 
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

  // 🔄 Game Loading Hook - load models and server
  const { loadingState, startLoading, isLoading } = useGameLoading('/brendam_docks.glb');

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

  // Show loading screen while game is loading
  if (isLoading) {
    return <LoadingScreen {...loadingState} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 3D Canvas - Balanced Settings */}
      <Canvas
        shadows={false}
        camera={{ 
          fov: 70,
          near: 0.5,
          far: 100,
          position: [0, 5, 10], // Initial camera position
        }}
        gl={{ 
          antialias: false,
          powerPreference: 'high-performance',
          precision: 'mediump',
          stencil: false,
          depth: true,
          alpha: false,
        }}
        dpr={[0.75, 1.25]}
        frameloop="always"
        performance={{ min: 0.5 }}
      >
        {/* FOG */}
        <fog attach="fog" args={['#87CEEB', 40, 100]} />
        
        {/* BVH Acceleration for collision detection */}
        <Bvh firstHitOnly>
          <GameScene
            broadcastPosition={multiplayer.broadcastPosition}
            onGemCollect={handleGemCollect}
            username={username}
            lastChatMessage={lastSentChat}
            lastChatTimestamp={lastSentChatTime}
          />
        </Bvh>
      </Canvas>

      {/* Mobile Joystick & Buttons */}
      {isMobile && (
        <>
          <Joystick />
          <VirtualButton
            id="run"
            label="RUN"
            buttonWrapperStyle={{ right: '100px', bottom: '40px' }}
          />
          <VirtualButton
            id="jump"
            label="JUMP"
            buttonWrapperStyle={{ right: '40px', bottom: '100px' }}
          />
        </>
      )}

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
