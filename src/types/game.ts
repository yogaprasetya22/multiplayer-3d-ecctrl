// ===================== GAME TYPES =====================

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

// Ecctrl ref type
export interface EcctrlRef {
  group: {
    translation: () => { x: number; y: number; z: number };
    rotation: () => { x: number; y: number; z: number; w: number };
  };
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
