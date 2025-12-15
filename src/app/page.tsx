'use client';

import { useRef, useCallback, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { KeyboardControls, Bvh, CameraControls } from '@react-three/drei';
import BVHEcctrl, { Joystick, VirtualButton, type BVHEcctrlApi, useEcctrlStore } from 'bvhecctrl';
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
  const lastBroadcastTime = useRef(0);
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

        if (manualAnimationTimer.current) {
          clearTimeout(manualAnimationTimer.current);
        }

        manualAnimationRef.current = anim;
        setAnimation(anim);
        currentAnimRef.current = anim;

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

    const euler = new THREE.Euler().setFromQuaternion(rotQuat);

    const dx = pos.x - lastPos.current.x;
    const dz = pos.z - lastPos.current.z;
    const dy = pos.y - lastPos.current.y;

    const distance = Math.sqrt(dx * dx + dz * dz);
    const rawVelocity = distance / Math.max(delta, 0.016);

    const verticalVel = dy / delta;
    const onGround = Math.abs(verticalVel) < 0.1 && Math.abs(dy) < 0.01;

    if (!wasOnGround.current && onGround) {
      isJumping.current = false;
    } else if (wasOnGround.current && !onGround && verticalVel > 1) {
      isJumping.current = true;
    }

    wasOnGround.current = onGround;

    velocityRef.current = velocityRef.current * 0.6 + rawVelocity * 0.4;
    lastPos.current = { x: pos.x, y: pos.y, z: pos.z };

    let newAnim: AnimationName;

    if (manualAnimationRef.current) {
      newAnim = manualAnimationRef.current;
    } else if (isJumping.current) {
      newAnim = verticalVel > 0 ? 'Jump_Start' : 'Jump_Idle';
    } else {
      newAnim = velocityRef.current > 4 ? 'Run'
        : velocityRef.current > 0.5 ? 'Walk'
          : 'Idle';
    }

    if (newAnim !== animation) {
      console.log(`[MyPlayer] Animation: ${animation} → ${newAnim} (rawVel: ${rawVelocity.toFixed(2)}, smoothVel: ${velocityRef.current.toFixed(2)}, onGround: ${onGround})`);
      setAnimation(newAnim);
      currentAnimRef.current = newAnim;
    }

    if (Math.random() < 0.05) {
      console.log(`[DEBUG] rawVel: ${rawVelocity.toFixed(2)}, smoothVel: ${velocityRef.current.toFixed(2)}, anim: ${newAnim}`);
    }

    const now = state.clock.elapsedTime * 1000;
    const BROADCAST_INTERVAL = 50;

    if (now - lastBroadcastTime.current >= BROADCAST_INTERVAL) {
      lastBroadcastTime.current = now;

      if (pos.x !== 0 || pos.y !== 0 || pos.z !== 0) {
        onPositionUpdate(
          { x: pos.x, y: pos.y, z: pos.z },
          { y: euler.y },
          currentAnimRef.current,
          { x: rotQuat.x, y: rotQuat.y, z: rotQuat.z, w: rotQuat.w }
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
// ===================== CAMERA CONTROLLER =====================
interface CameraFollowerProps {
  bvhEcctrlRef: React.RefObject<BVHEcctrlApi | null>;
}

function CameraFollower({ bvhEcctrlRef }: CameraFollowerProps) {
  const camControlRef = useRef<CameraControls | null>(null);
  const { gl } = useThree();

  // Get collider meshes for camera collision detection
  const colliderMeshesArray = useEcctrlStore((state) => state.colliderMeshesArray);

  // ✅ Track touch by identifier (support multi-touch)
  const activeTouchId = useRef<number | null>(null);
  const lastTouchPos = useRef<{ x: number; y: number } | null>(null);

  const isTouchInControlArea = useCallback((clientX: number, clientY: number): boolean => {
    const screenHeight = window.innerHeight;
    const screenWidth = window.innerWidth;
    const bottomThreshold = screenHeight * 0.35;

    if (clientY < screenHeight - bottomThreshold) return false;

    const leftJoystickArea = clientX < screenWidth * 0.4;
    const rightButtonArea = clientX > screenWidth * 0.7;
    return leftJoystickArea || rightButtonArea;
  }, []);

  // ✅ Handle touch start - find camera touch (right side, not in controls)
  const handleTouchStart = useCallback((event: TouchEvent) => {
    // Loop through all touches to find camera control touch
    for (let i = 0; i < event.touches.length; i++) {
      const touch = event.touches[i];

      // Skip if already tracking a touch
      if (activeTouchId.current !== null) continue;

      // Skip if in control area (joystick/buttons)
      if (isTouchInControlArea(touch.clientX, touch.clientY)) continue;

      // This is our camera control touch!
      activeTouchId.current = touch.identifier;
      lastTouchPos.current = { x: touch.clientX, y: touch.clientY };
      break;
    }
  }, [isTouchInControlArea]);

  // ✅ Handle touch move - only process our tracked touch
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (activeTouchId.current === null) return;

    // Find our tracked touch by identifier
    let ourTouch: Touch | null = null;
    for (let i = 0; i < event.touches.length; i++) {
      if (event.touches[i].identifier === activeTouchId.current) {
        ourTouch = event.touches[i];
        break;
      }
    }

    if (!ourTouch || !lastTouchPos.current) return;

    // Check if moved into control area - if yes, stop tracking
    if (isTouchInControlArea(ourTouch.clientX, ourTouch.clientY)) {
      activeTouchId.current = null;
      lastTouchPos.current = null;
      return;
    }

    // Prevent default to avoid scrolling
    event.preventDefault();

    const deltaX = ourTouch.clientX - lastTouchPos.current.x;
    const deltaY = ourTouch.clientY - lastTouchPos.current.y;

    if (camControlRef.current) {
      const sensitivity = 0.004;
      camControlRef.current.rotate(-deltaX * sensitivity, deltaY * sensitivity, true);
    }

    // Update last position
    lastTouchPos.current = { x: ourTouch.clientX, y: ourTouch.clientY };
  }, [isTouchInControlArea]);

  // ✅ Handle touch end - clear tracking if our touch ended
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (activeTouchId.current === null) return;

    // Check if our tracked touch ended
    let ourTouchEnded = true;
    for (let i = 0; i < event.touches.length; i++) {
      if (event.touches[i].identifier === activeTouchId.current) {
        ourTouchEnded = false;
        break;
      }
    }

    if (ourTouchEnded) {
      activeTouchId.current = null;
      lastTouchPos.current = null;
    }
  }, []);

  const handleCanvasClick = useCallback(() => {
    if (camControlRef.current) {
      camControlRef.current.lockPointer();
    }
  }, []);

  useEffect(() => {
    gl.domElement.addEventListener('click', handleCanvasClick);
    gl.domElement.addEventListener('touchstart', handleTouchStart, { passive: true });
    gl.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    gl.domElement.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      gl.domElement.removeEventListener('click', handleCanvasClick);
      gl.domElement.removeEventListener('touchstart', handleTouchStart);
      gl.domElement.removeEventListener('touchmove', handleTouchMove);
      gl.domElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [gl, handleCanvasClick, handleTouchStart, handleTouchMove, handleTouchEnd]);

  useFrame(() => {
    if (!bvhEcctrlRef.current?.group || !camControlRef.current) return;

    const player = bvhEcctrlRef.current.group;
    const model = bvhEcctrlRef.current.model;

    // Follow player smoothly
    camControlRef.current.moveTo(
      player.position.x,
      player.position.y + 0.3,
      player.position.z,
      true
    );

    // Hide model in first-person view
    if (model) {
      model.visible = camControlRef.current.distance > 0.7;
    }
  });

  return (
    <CameraControls
      ref={camControlRef}
      smoothTime={0.1}
      colliderMeshes={colliderMeshesArray}
      makeDefault
      minDistance={0.5}
      maxDistance={20}
      minPolarAngle={0}
      maxPolarAngle={Math.PI / 2 + 0.2}
    />
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
  const bvhEcctrlRef = useRef<BVHEcctrlApi | null>(null);

  return (
    <>
      <WorldEnvironment />
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

  const [lastSentChat, setLastSentChat] = useState<string | undefined>(undefined);
  const [lastSentChatTime, setLastSentChatTime] = useState<number | undefined>(undefined);

  const myId = useRef(uuidv4()).current;
  const isMobile = useIsMobile();

  const { loadingState, startLoading, isLoading } = useGameLoading('/brendam_docks.glb');

  const chat = useChat();

  const addMessageRef = useRef(chat.addMessage);
  addMessageRef.current = chat.addMessage;

  const handleChatMessage = useCallback(
    (message: ChatMessage) => {
      addMessageRef.current(message);
    },
    []
  );

  const multiplayer = useMultiplayer({
    myId,
    username,
    lobbyId,
    onChatMessage: handleChatMessage,
  });

  const channelRef = useRef(multiplayer.channel);
  channelRef.current = multiplayer.channel;

  const handleGemCollect = useCallback(
    (gemId: string) => {
      setCollectedGems((prev) => {
        if (prev.has(gemId)) return prev;

        const newSet = new Set(prev).add(gemId);
        setScore((s) => s + 1);

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
    [username]
  );

  const handleSendChat = useCallback(() => {
    const message = chat.input.trim();
    if (message) {
      setLastSentChat(message);
      setLastSentChatTime(Date.now());
    }
    chat.sendMessage(multiplayer.sendChat);
  }, [chat.sendMessage, chat.input, multiplayer.sendChat]);

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

  if (isLoading) {
    return <LoadingScreen {...loadingState} />;
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <Canvas
        shadows={false}
        camera={{
          fov: 70,
          near: 0.5,
          far: 100,
          position: [0, 5, 10],
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
        <fog attach="fog" args={['#87CEEB', 40, 100]} />

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

      <PerformanceMonitor />

      <HUD
        playerCount={multiplayer.otherPlayerCount + 1}
        score={score}
        maxScore={GEM_COUNT}
        lobbyId={lobbyId}
      />

      <ChatBox
        messages={chat.messages}
        input={chat.input}
        setInput={chat.setInput}
        onSend={handleSendChat}
        visible={chat.showChat}
      />

      <ControlsHint isMobile={isMobile} />

      {!multiplayer.isConnected && (
        <div className="absolute top-20 left-5 bg-yellow-600/90 text-white px-4 py-2 rounded-lg text-sm font-bold">
          ⏳ Menghubungkan ke server...
        </div>
      )}
    </div>
  );
}