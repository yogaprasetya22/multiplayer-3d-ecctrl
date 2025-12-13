'use client';

import { useRef, useEffect, useState, memo, Suspense } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { playersStore } from '@/stores/playersStore';
import { Character, AnimationName } from './Character';
import { SimpleCharacter } from './SimpleCharacter';
import { GAME_CONFIG } from '@/config/game.config';

// ===================== RENDER DISTANCE =====================
const RENDER_DISTANCE = 50; // Hanya render player dalam 50 meter

// ===================== OTHER PLAYER =====================
const OtherPlayer = memo(function OtherPlayer({ playerId }: { playerId: string }) {
  const ref = useRef<THREE.Group>(null);
  const targetPos = useRef(new THREE.Vector3());
  const targetQuat = useRef(new THREE.Quaternion());
  const initialized = useRef(false);
  const animRef = useRef<AnimationName>('Idle');
  const [animation, setAnimation] = useState<AnimationName>('Idle');

  useFrame((_, delta) => {
    const data = playersStore.get(playerId);
    if (!data || !ref.current) return;

    // Update target
    targetPos.current.set(data.x, data.y, data.z);
    if (data.quat) {
      targetQuat.current.set(data.quat.x, data.quat.y, data.quat.z, data.quat.w);
    }

    // Initialize
    if (!initialized.current) {
      ref.current.position.copy(targetPos.current);
      ref.current.quaternion.copy(targetQuat.current);
      initialized.current = true;
      return;
    }

    // 🎯 SMOOTH LERP
    const t = 1 - Math.pow(0.0001, delta);
    ref.current.position.lerp(targetPos.current, t);
    ref.current.quaternion.slerp(targetQuat.current, t);

    // Animation update
    const serverAnim = (data as any).animation as AnimationName || 'Idle';
    if (serverAnim !== animRef.current) {
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
