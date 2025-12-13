'use client';

import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { Sky } from '@react-three/drei';
import { ForestMap } from './ForestMap';

export function WorldEnvironment() {
  return (
    <>
      {/* Sky */}
      <Sky sunPosition={[100, 100, 20]} />

      {/* Lighting - optimized */}
      <ambientLight intensity={0.7} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={0.8}
        // Shadow disabled untuk performa - bisa di-enable jika perlu
        castShadow={false}
      />

      {/* Ground Collider (invisible) */}
      <RigidBody type="fixed" position={[0, -0.1, 0]}>
        <CuboidCollider args={[150, 0.1, 150]} />
      </RigidBody>

      {/* Forest Map - DISABLED for performance testing */}
      {/* <ForestMap scale={0.05} position={[0, 0, 0]} /> */}

      {/* Moving Platform */}
      <RigidBody type="kinematicPosition" position={[-10, 5, 0]}>
        <mesh name="moving-platform">
          <boxGeometry args={[8, 1, 8]} />
          <meshStandardMaterial color="#e67e22" emissive="#e67e22" emissiveIntensity={0.3} />
        </mesh>
        <CuboidCollider args={[4, 0.5, 4]} />
      </RigidBody>
    </>
  );
}
