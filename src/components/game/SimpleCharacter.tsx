/**
 * SimpleCharacter - Ultra lightweight character for other players
 * Sama persis dengan karakter utama (kuning/gold), super ringan untuk 200+ players
 */

'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface SimpleCharacterProps {
  isMoving?: boolean;
  scale?: number;
}

// Shared geometry dan material - sama dengan karakter utama (gold/kuning)
const capsuleGeometry = new THREE.CapsuleGeometry(0.25, 0.5, 4, 8);
const headGeometry = new THREE.SphereGeometry(0.22, 8, 6);

// Warna sama dengan PrototypePete (gold/olive seperti di gambar)
const bodyMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x8B7355, // Olive/tan color seperti karakter utama
  roughness: 0.8,
  metalness: 0.1,
});
const headMaterial = new THREE.MeshStandardMaterial({ 
  color: 0x8B7355, // Sama dengan body
  roughness: 0.8,
  metalness: 0.1,
});

export function SimpleCharacter({ isMoving = false, scale = 1 }: SimpleCharacterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const bobOffset = useRef(Math.random() * Math.PI * 2);

  // Simple bobbing animation when moving
  useFrame((state) => {
    if (!groupRef.current) return;
    
    if (isMoving) {
      const t = state.clock.elapsedTime * 8 + bobOffset.current;
      groupRef.current.position.y = Math.sin(t) * 0.04;
    } else {
      groupRef.current.position.y *= 0.9;
    }
  });

  return (
    <group ref={groupRef} scale={scale}>
      {/* Body - Capsule */}
      <mesh geometry={capsuleGeometry} material={bodyMaterial} position={[0, 0.45, 0]} />
      
      {/* Head - Sphere */}
      <mesh geometry={headGeometry} material={headMaterial} position={[0, 0.95, 0]} />
    </group>
  );
}
