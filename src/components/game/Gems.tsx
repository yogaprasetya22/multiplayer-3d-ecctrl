'use client';

import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { characterStatus } from 'bvhecctrl';
import * as THREE from 'three';

// Gem positions
const GEM_POSITIONS: [number, number, number, string][] = [
  [8, 2, 8, 'gem1'],
  [-18, 3, -5, 'gem2'],
  [22, 2, 12, 'gem3'],
  [-12, 5, 15, 'gem4'],
  [0, 8, -20, 'gem5'],
];

const COLLECT_DISTANCE = 2; // Distance to collect gem

interface GemsProps {
  onCollect: (id: string) => void;
}

// Individual Gem with distance-based collection
function Gem({ 
  position, 
  id, 
  onCollect 
}: { 
  position: [number, number, number]; 
  id: string; 
  onCollect: (id: string) => void;
}) {
  const [collected, setCollected] = useState(false);
  const meshRef = useRef<THREE.Mesh>(null);
  const gemPos = useRef(new THREE.Vector3(...position));

  useFrame((state, delta) => {
    if (collected || !meshRef.current) return;

    // Rotate gem
    meshRef.current.rotation.y += delta * 2;
    
    // Check distance to player using characterStatus from BVHEcctrl
    const playerPos = characterStatus.position;
    const distance = gemPos.current.distanceTo(playerPos);
    
    if (distance < COLLECT_DISTANCE) {
      setCollected(true);
      onCollect(id);
    }
  });

  if (collected) return null;

  return (
    <group position={position} userData={{ type: 'gem', baseY: position[1] }}>
      <mesh ref={meshRef} castShadow={false}>
        <octahedronGeometry args={[0.8]} />
        <meshBasicMaterial
          color="#ffd700"
          toneMapped={false}
        />
      </mesh>
      <pointLight color="#ffd700" intensity={2} distance={6} />
    </group>
  );
}

export function Gems({ onCollect }: GemsProps) {
  return (
    <>
      {GEM_POSITIONS.map(([x, y, z, id]) => (
        <Gem
          key={id}
          position={[x, y, z]}
          id={id}
          onCollect={onCollect}
        />
      ))}
    </>
  );
}

export const GEM_COUNT = GEM_POSITIONS.length;
