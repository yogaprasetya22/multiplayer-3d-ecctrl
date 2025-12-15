// ===================== BVHECCTRL CONFIGURATION =====================
// BVHEcctrl - No physics engine needed! Uses BVH for collision detection.

import { FloatCheckType } from "bvhecctrl";

export const BVHECCTRL_CONFIG = {
    // =====================
    // COLLIDER
    // =====================
    // [radius, height, radialSegments, heightSegments]
    colliderCapsuleArgs: [0.3, 0.8, 4, 8] as [number, number, number, number],

    // =====================
    // PHYSICS
    // =====================
    gravity: 14, // increase from 9.8 to remove 'floaty' feeling
    fallGravityFactor: 3.2, // increase fall acceleration to avoid long floaty falls
    maxFallSpeed: 60,
    mass: 1,

    // Movement (ARCade)
    turnSpeed: 16,
    maxWalkSpeed: 4.5,
    maxRunSpeed: 8.5,
    // Movement responsiveness
    acceleration: 34, // slightly less instant


    sleepTimeout: 10,
    slowMotionFactor: 1,
    paused: false,
    delay: 3,

    // =====================
    // MOVEMENT
    deceleration: 30,
    counterAccFactor: 0.5,
    airDragFactor: 0.3,

    // =====================
    // JUMP
    // =====================
    jumpVel: 6,

    // =====================
    // FLOATING / GROUND SNAP
    // =====================
    floatCheckType: "BOTH" as FloatCheckType,
    maxSlope: 1,
    floatHeight: 0.4,
    floatPullBackHeight: 0.25,
    floatSensorRadius: 0.12,
    floatSpringK: 900,
    floatDampingC: 30,

    // =====================
    // COLLISION RESPONSE
    // =====================
    collisionCheckIteration: 3,
    collisionPushBackVelocity: 3,
    collisionPushBackDamping: 0.1,
    collisionPushBackThreshold: 0.001,
};


// ===================== KEYBOARD CONTROLS =====================
export const KEYBOARD_MAP = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
    { name: "rightward", keys: ["ArrowRight", "KeyD"] },
    { name: "jump", keys: ["Space"] },
    { name: "run", keys: ["Shift"] },
];

// ===================== PHYSICS CONFIG =====================
export const PHYSICS_CONFIG = {
    gravity: [0, -20, 0] as [number, number, number],
    timeStep: "vary" as const,
};

// ===================== GAME CONFIG =====================
export const GAME_CONFIG = {
    // Broadcast SANGAT CEPAT untuk movement yang super smooth (60 FPS - game modern)
    broadcastInterval: 0.016, // ~60 FPS network update - ULTRA SMOOTH!
    playerSpawnPosition: [0, 3, 0] as [number, number, number],
    defaultLobbyId: "default-lobby",

    // Performance optimization untuk 200 players
    maxVisiblePlayers: 200,
    playerCullDistance: 150, // Jarak max untuk render player
};
