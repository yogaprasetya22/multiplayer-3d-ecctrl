// ===================== GAME TYPES =====================

import * as THREE from 'three';

export type ChatMessage =
  | { type: 'system'; message: string; timestamp: number }
  | { type: 'message'; username: string; message: string; timestamp: number; isOwn: boolean };

export interface PlayerData {
  x: number;
  y: number;
  z: number;
  rot: number; // Euler Y for backward compatibility
  quat?: { x: number; y: number; z: number; w: number }; // Quaternion for accurate rotation
  animation?: string;
  username: string;
  lastUpdate?: number; // Timestamp untuk track update
  chatMessage?: string; // Pesan chat terbaru
  chatTimestamp?: number; // Kapan chat dikirim (untuk auto-hide)
}

export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
  rot: number;
}

export interface BroadcastPayload {
  id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    y: number;
  };
  username: string;
}

export interface GemData {
  id: string;
  position: [number, number, number];
}

export interface ObstacleData {
  id: string;
  type: 'box' | 'cylinder';
  position: [number, number, number];
  rotation?: [number, number, number];
  size: number[];
  color: string;
}

// BVHEcctrl ref type (no physics engine needed!)
export interface BVHEcctrlRef {
  group: THREE.Group | null;
  model: THREE.Group | null;
  resetLinVel: () => void;
  addLinVel: (v: THREE.Vector3) => void;
  setLinVel: (v: THREE.Vector3) => void;
  setMovement: (input: {
    forward?: boolean;
    backward?: boolean;
    leftward?: boolean;
    rightward?: boolean;
    joystick?: { x: number; y: number };
    run?: boolean;
    jump?: boolean;
  }) => void;
}

// Channel type (simplified Supabase channel)
export interface GameChannel {
  send: (message: { type: string; event: string; payload: any }) => void;
  on: (event: string, filter: any, callback: (data: any) => void) => GameChannel;
  track: (data: any) => Promise<void>;
  presenceState: () => Record<string, any[]>;
  unsubscribe: () => void;
  subscribe: (callback: (status: string) => void) => GameChannel;
}
