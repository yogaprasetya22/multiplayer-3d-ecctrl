'use client';

import { CuboidCollider, RigidBody } from '@react-three/rapier';

// ===================== OBSTACLE DATA =====================
const OBSTACLES: { position: [number, number, number]; size: [number, number, number]; collider: [number, number, number]; color: string }[] = [
  // Kubus Merah
  { position: [10, 1.5, 10], size: [4, 3, 4], collider: [2, 1.5, 2], color: '#ff6b6b' },
  // Kubus Besar Cyan
  { position: [-20, 2.5, 0], size: [6, 5, 6], collider: [3, 2.5, 3], color: '#4ecdc4' },
  // Tembok Panjang Orange
  { position: [0, 2, -30], size: [40, 4, 2], collider: [20, 2, 1], color: '#e67e22' },
  // Pilar Hijau 1
  { position: [-30, 3, -20], size: [3, 6, 3], collider: [1.5, 3, 1.5], color: '#2ecc71' },
  // Pilar Hijau 2
  { position: [30, 3, -20], size: [3, 6, 3], collider: [1.5, 3, 1.5], color: '#2ecc71' },
  // Kubus Kuning Kecil
  { position: [-15, 1, 15], size: [3, 2, 3], collider: [1.5, 1, 1.5], color: '#f1c40f' },
  // Kubus Biru Kecil
  { position: [20, 1, 5], size: [2.5, 2, 2.5], collider: [1.25, 1, 1.25], color: '#3498db' },
  // Platform Tinggi Merah
  { position: [-25, 5, 10], size: [6, 1, 6], collider: [3, 0.5, 3], color: '#c0392b' },
  // Maze Wall 1
  { position: [35, 1.5, 5], size: [2, 3, 15], collider: [1, 1.5, 7.5], color: '#8e44ad' },
  // Maze Wall 2
  { position: [40, 1.5, -5], size: [10, 3, 2], collider: [5, 1.5, 1], color: '#8e44ad' },
  // Tower Base
  { position: [-40, 1, -30], size: [5, 2, 5], collider: [2.5, 1, 2.5], color: '#34495e' },
  // Tower Mid
  { position: [-40, 4, -30], size: [4, 4, 4], collider: [2, 2, 2], color: '#34495e' },
  // Tower Top
  { position: [-40, 7.5, -30], size: [3, 3, 3], collider: [1.5, 1.5, 1.5], color: '#34495e' },
  // Kubus Lime
  { position: [5, 1.5, 25], size: [3.5, 3, 3.5], collider: [1.75, 1.5, 1.75], color: '#cddc39' },
];

// Silinder obstacles
const CYLINDERS: { position: [number, number, number]; radius: number; height: number; collider: [number, number, number]; color: string }[] = [
  // Silinder Ungu
  { position: [25, 4, -15], radius: 2, height: 8, collider: [2, 4, 2], color: '#9b59b6' },
  // Silinder Pink
  { position: [15, 2.5, -5], radius: 1.5, height: 5, collider: [1.5, 2.5, 1.5], color: '#e91e63' },
  // Silinder Indigo
  { position: [-10, 3, 30], radius: 2, height: 6, collider: [2, 3, 2], color: '#3f51b5' },
];

// Tangga
const STAIRS: { position: [number, number, number]; size: [number, number, number]; collider: [number, number, number] }[] = [
  { position: [-5, 0.5, -10], size: [8, 1, 3], collider: [4, 0.5, 1.5] },
  { position: [-5, 1.5, -12], size: [8, 1, 3], collider: [4, 0.5, 1.5] },
  { position: [-5, 2.5, -14], size: [8, 1, 3], collider: [4, 0.5, 1.5] },
];

export function WorldObstacles() {
  return (
    <>
      {/* Box Obstacles */}
      {OBSTACLES.map((obs, i) => (
        <RigidBody key={`box-${i}`} type="fixed" position={obs.position}>
          <mesh castShadow>
            <boxGeometry args={obs.size} />
            <meshStandardMaterial color={obs.color} />
          </mesh>
          <CuboidCollider args={obs.collider} />
        </RigidBody>
      ))}

      {/* Cylinder Obstacles */}
      {CYLINDERS.map((cyl, i) => (
        <RigidBody key={`cyl-${i}`} type="fixed" position={cyl.position}>
          <mesh castShadow>
            <cylinderGeometry args={[cyl.radius, cyl.radius, cyl.height, 16]} />
            <meshStandardMaterial color={cyl.color} />
          </mesh>
          <CuboidCollider args={cyl.collider} />
        </RigidBody>
      ))}

      {/* Stairs */}
      {STAIRS.map((stair, i) => (
        <RigidBody key={`stair-${i}`} type="fixed" position={stair.position}>
          <mesh castShadow>
            <boxGeometry args={stair.size} />
            <meshStandardMaterial color="#95a5a6" />
          </mesh>
          <CuboidCollider args={stair.collider} />
        </RigidBody>
      ))}

      {/* Horizontal Cylinder (Teal) */}
      <RigidBody type="fixed" position={[0, 2, 20]} rotation={[0, 0, Math.PI / 2]}>
        <mesh castShadow>
          <cylinderGeometry args={[1, 1, 10, 16]} />
          <meshStandardMaterial color="#16a085" />
        </mesh>
        <CuboidCollider args={[1, 5, 1]} />
      </RigidBody>

      {/* Ramp */}
      <RigidBody type="fixed" position={[-35, 1, 20]} rotation={[0, 0, -0.3]}>
        <mesh castShadow>
          <boxGeometry args={[8, 0.5, 10]} />
          <meshStandardMaterial color="#d35400" />
        </mesh>
        <CuboidCollider args={[4, 0.25, 5]} />
      </RigidBody>
    </>
  );
}
