export type AnimationName = string;

export interface PlayerState {
    id: string;
    username: string;
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number };
    lobbyId: string;
    timestamp: number;
}

export interface PlayerData {
    x: number;
    y: number;
    z: number;
    rot: number;
    quat?: { x: number; y: number; z: number; w: number }; // Quaternion untuk rotasi akurat
    animation?: AnimationName;
    username: string;
    lastUpdate?: number; // Timestamp untuk track update
    chatMessage?: string; // Pesan chat terbaru
    chatTimestamp?: number; // Kapan chat dikirim (untuk auto-hide)
}

export interface ChatMessage {
    type: "system" | "message";
    username?: string;
    message: string;
    timestamp: number;
    isOwn?: boolean;
}
