// ===================== BVHECCTRL CONFIGURATION =====================
// BVHEcctrl - No physics engine needed! Uses BVH for collision detection.

export const BVHECCTRL_CONFIG = {
    // Collider (stabil)
    colliderCapsuleArgs: [0.5, 1.5, 16, 16] as [number, number, number, number],

    // Physics (INI KUNCI ANTI MARS)
    gravity: 18, // ⬅️ lebih berat
    fallGravityFactor: 4.5, // ⬅️ jatuh cepet
    maxFallSpeed: 60,
    mass: 1,

    // Movement (ARCade)
    turnSpeed: 16,
    maxWalkSpeed: 4.5,
    maxRunSpeed: 8.5,
    acceleration: 38, // ⬅️ instant
    deceleration: 34, // ⬅️ stop cepat

    // Jump (tegas, tidak float)
    jumpVel: 6.6,

    // Ground snap (NEMPEL TANAH)
    floatHeight: 0.16, // jangan terlalu kecil
    floatSpringK: 650, // cukup keras
    floatDampingC: 32, // redam bounce
    floatSensorRadius: 0.14,

    // Collision
    collisionCheckIteration: 2,
    collisionPushBackVelocity: 2.8,

    delay: 0.4,
};


// ===================== KEYBOARD CONTROLS =====================
export const KEYBOARD_MAP = [
  { name: 'forward', keys: ['ArrowUp', 'KeyW'] },
  { name: 'backward', keys: ['ArrowDown', 'KeyS'] },
  { name: 'leftward', keys: ['ArrowLeft', 'KeyA'] },
  { name: 'rightward', keys: ['ArrowRight', 'KeyD'] },
  { name: 'jump', keys: ['Space'] },
  { name: 'run', keys: ['Shift'] },
];

// ===================== PHYSICS CONFIG =====================
export const PHYSICS_CONFIG = {
  gravity: [0, -20, 0] as [number, number, number],
  timeStep: 'vary' as const,
};

// ===================== GAME CONFIG =====================
export const GAME_CONFIG = {
  // Broadcast SANGAT CEPAT untuk movement yang super smooth (60 FPS - game modern)
  broadcastInterval: 0.016, // ~60 FPS network update - ULTRA SMOOTH!
  playerSpawnPosition: [0, 3, 0] as [number, number, number],
  defaultLobbyId: 'default-lobby',
  
  // Performance optimization untuk 200 players
  maxVisiblePlayers: 200,
  playerCullDistance: 150, // Jarak max untuk render player
};
