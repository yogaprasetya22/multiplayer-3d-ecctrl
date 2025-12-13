// ===================== ECCTRL CONFIGURATION =====================
// Konfigurasi character controller yang smooth seperti Ecctrl repo

export const ECCTRL_CONFIG = {
  // Floating Capsule (Spring-Damper System)
  floatHeight: 0.4,
  springK: 1.2,
  dampingC: 0.12,

  // Movement
  maxVelLimit: 6,
  turnVelMultiplier: 0.8,
  turnSpeed: 15,
  sprintMult: 1.8,
  moveImpulsePointY: 0.5,

  // Acceleration & Drag
  accDeltaTime: 8,
  rejectVelMult: 4,
  dragDampingC: 0.15,
  airDragMultiplier: 0.2,

  // Jump
  jumpVel: 6,
  jumpForceToGroundMult: 5,
  slopJumpMult: 0.25,
  sprintJumpMult: 1.2,
  fallingGravityScale: 2.5,
  fallingMaxVel: -20,

  // Auto Balance
  autoBalance: true,
  autoBalanceSpringK: 0.4,
  autoBalanceDampingC: 0.04,
  autoBalanceSpringOnY: 0.5,
  autoBalanceDampingOnY: 0.02,

  // Camera
  camInitDis: -8,
  camMaxDis: -15,
  camMinDis: -3,
  camFollowMult: 11,
  camLerpMult: 25,
  camCollision: true,
  camCollisionOffset: 0.7,
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
