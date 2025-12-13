'use client';

import { RigidBody } from '@react-three/rapier';

// Gem positions
const GEM_POSITIONS: [number, number, number, string][] = [
  [8, 2, 8, 'gem1'],
  [-18, 3, -5, 'gem2'],
  [22, 2, 12, 'gem3'],
  [-12, 5, 15, 'gem4'],
  [0, 8, -20, 'gem5'],
];

interface GemsProps {
  onCollect: (id: string) => void;
}

export function Gems({ onCollect }: GemsProps) {
  return (
    <>
      {GEM_POSITIONS.map(([x, y, z, id]) => (
        <RigidBody
          key={id}
          type="fixed"
          sensor
          onIntersectionEnter={() => onCollect(id)}
        >
          <group
            name={id}
            position={[x, y, z]}
            userData={{ type: 'gem', baseY: y }}
          >
            <mesh castShadow>
              <octahedronGeometry args={[0.8]} />
              <meshStandardMaterial
                color="#ffd700"
                emissive="#ffd700"
                emissiveIntensity={0.8}
                metalness={0.9}
                roughness={0.1}
              />
            </mesh>
            <pointLight color="#ffd700" intensity={2} distance={6} />
          </group>
        </RigidBody>
      ))}
    </>
  );
}

export const GEM_COUNT = GEM_POSITIONS.length;
