'use client';

import { useRef, useEffect, useState, memo, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { playersStore } from '@/stores/playersStore';
import { Character, AnimationName } from './Character';
import { SimpleCharacter } from './SimpleCharacter';
import { GAME_CONFIG } from '@/config/game.config';
import { MyPlayerLabel } from './PlayerLabel';

// ===================== RENDER DISTANCE =====================
const RENDER_DISTANCE = 50; // Hanya render player dalam 50 meter

// ===================== OTHER PLAYER =====================
const OtherPlayer = memo(function OtherPlayer({ playerId }: { playerId: string }) {
  const ref = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3());
  const prevPos = useRef(new THREE.Vector3());
  const movementDir = useRef(new THREE.Vector3());
  const velocity = useRef(new THREE.Vector3()); // Track velocity for prediction
  const targetRotation = useRef(0);
  const initialized = useRef(false);
  const animRef = useRef<AnimationName>('Idle');
  const [animation, setAnimation] = useState<AnimationName>('Idle');

  useFrame((_, delta) => {
    const data = playersStore.get(playerId);
    if (!data || !ref.current) return;

    // Update target position
    targetPos.current.set(data.x, data.y, data.z);

    // Initialize
    if (!initialized.current) {
      ref.current.position.copy(targetPos.current);
      prevPos.current.copy(targetPos.current);
      velocity.current.set(0, 0, 0);
      initialized.current = true;
      return;
    }

    // 🎯 Calculate movement direction
    movementDir.current.subVectors(targetPos.current, prevPos.current);
    
    // 🎯 POSITION: Smooth interpolation to target (NO prediction to avoid jitter)
    const distance = ref.current.position.distanceTo(targetPos.current);
    
    // If far away (teleport/spawn), snap immediately
    // If close, use smooth lerp toward ACTUAL target position (not predicted)
    // delta * 40 = smooth without jitter
    const posLerpFactor = distance > 3 ? 1 : Math.min(delta * 40, 1);
    ref.current.position.lerp(targetPos.current, posLerpFactor);

    // 🎯 ROTATION: Calculate target rotation from movement direction
    if (movementDir.current.lengthSq() > 0.001) {
      targetRotation.current = Math.atan2(movementDir.current.x, movementDir.current.z);
    }
    
    // 🎯 ROTATION: Smooth rotate to face movement direction (delta * 30 = less jitter)
    if (movementDir.current.lengthSq() > 0.001) {
      const currentRotY = ref.current.rotation.y;
      let diff = targetRotation.current - currentRotY;
      
      // Normalize angle difference to -PI to PI
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      
      // Smooth rotation - delta * 30 untuk stable rotation tanpa jitter
      ref.current.rotation.y += diff * Math.min(delta * 30, 1);
    }

    // Update previous position
    prevPos.current.copy(targetPos.current);

    // 🎯 ANIMATION: Update from server
    const serverAnim = (data as any).animation as AnimationName || 'Idle';
    if (serverAnim !== animRef.current) {
      console.log(`[OtherPlayer ${playerId.slice(0, 8)}] Animation change: ${animRef.current} → ${serverAnim}`);
      animRef.current = serverAnim;
      setAnimation(serverAnim);
    }
  });

  const initialData = playersStore.get(playerId);
  const initPos: [number, number, number] = initialData
    ? [initialData.x, initialData.y, initialData.z]
    : [0, 0, 0];

  return (
    <group ref={ref} position={initPos}>
      <Suspense fallback={<SimpleCharacter scale={1} />}>
        <Character animation={animation} characterScale={0.5} position-y={-0.5} />
      </Suspense>
      {/* 🏷️ Player label dengan chat bubble (hijau untuk other players juga!) */}
      <MyPlayerLabel 
        username={initialData?.username || 'Unknown'} 
        chatMessage={(initialData as any)?.chatMessage}
        chatTimestamp={(initialData as any)?.chatTimestamp}
      />
    </group>
  );
});

// ===================== ALL OTHER PLAYERS CONTAINER =====================
export function OtherPlayers() {
  const [playerIds, setPlayerIds] = useState<string[]>([]);
  const { camera } = useThree();
  const [visiblePlayers, setVisiblePlayers] = useState<string[]>([]);
  const cullCheckFrame = useRef(0);

  useEffect(() => {
    const unsubscribe = playersStore.subscribe(() => {
      setPlayerIds(playersStore.getIds());
    });
    setPlayerIds(playersStore.getIds());
    return () => unsubscribe();
  }, []);

  // Distance-based culling - check setiap 15 frame
  useFrame(() => {
    cullCheckFrame.current++;
    if (cullCheckFrame.current % 15 !== 0) return;
    
    const camPos = camera.position;
    const renderDistSq = RENDER_DISTANCE ** 2;
    
    const visible: string[] = [];
    
    for (const id of playerIds) {
      const data = playersStore.get(id);
      if (!data) continue;
      
      const dx = data.x - camPos.x;
      const dz = data.z - camPos.z;
      const distSq = dx * dx + dz * dz;
      
      // Hanya render dalam 30 meter
      if (distSq < renderDistSq) {
        visible.push(id);
      }
    }
    
    // Limit max players
    if (visible.length > GAME_CONFIG.maxVisiblePlayers) {
      visible.length = GAME_CONFIG.maxVisiblePlayers;
    }
    
    setVisiblePlayers(visible);
  });

  // Initial
  useEffect(() => {
    setVisiblePlayers(playerIds);
  }, [playerIds]);

  return (
    <>
      {visiblePlayers.map((id) => (
        <OtherPlayer key={id} playerId={id} />
      ))}
    </>
  );
}
