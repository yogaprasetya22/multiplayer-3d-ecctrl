'use client';

import { Suspense } from 'react';
import { StaticCollider } from 'bvhecctrl';
import { Sky } from '@react-three/drei';
import { ForestMap } from './ForestMap';
import { BrendamDocksOptimized } from './BrendamDocksOptimized';
import { usePlayerSettings } from '@/config/playerSettings';

// Simple fallback box saat map loading
function MapFallback() {
  return (
    <mesh position={[0, -0.5, 0]}>
      <boxGeometry args={[20, 1, 20]} />
      <meshBasicMaterial color="#228B22" wireframe />
    </mesh>
  );
}

export function WorldEnvironment() {
  const { settings } = usePlayerSettings();
  return (
    <>
      {/* Sky */}
      <Sky sunPosition={[100, 100, 20]} />

      {/* Lighting - enhanced untuk bisa lihat warna */}
      <ambientLight intensity={1.2} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={0.8}
        castShadow={false}
      />

      {/* Ground Collider - simple box for BVHEcctrl */}
      {/* <StaticCollider>
        <mesh position={[0, -0.5, 0]} receiveShadow={false}>
          <boxGeometry args={[1000, 1, 1000]} />
          <meshBasicMaterial color="#4a7c59" />
        </mesh>
      </StaticCollider> */}

      {/* ForestMap - wrapped in StaticCollider for collision */}
      <Suspense fallback={<MapFallback />}>
        <StaticCollider>
          {/* <ForestMap scale={1.05} position={[0, 0, 0]} /> */}
          <BrendamDocksOptimized 
            scale={50.05} 
            position={[0, 0, 0]}
            maxDistance={settings?.mapCullingDisabled ? 50000 : 180}
          />
        </StaticCollider>
      </Suspense>
    </>
  );
}
