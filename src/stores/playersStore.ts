import type { PlayerData } from '@/types/game';

// ===================== GLOBAL PLAYERS STORE (NO RE-RENDER!) =====================
// Ini adalah key optimization - gunakan global store bukan React state
// Pattern ini mirip dengan Zustand tapi lebih ringan

interface PlayersStore {
  data: Record<string, PlayerData>;
  listeners: Set<() => void>;
  update: (id: string, data: PlayerData) => void;
  updateChat: (id: string, message: string) => void;
  remove: (id: string) => void;
  notifyListeners: () => void;
  subscribe: (fn: () => void) => () => void;
  getIds: () => string[];
  get: (id: string) => PlayerData | undefined;
  clear: () => void;
}

export const playersStore: PlayersStore = {
  data: {},
  listeners: new Set(),

  update(id: string, data: PlayerData) {
    // Preserve existing chat data if not provided
    const existingChat = this.data[id]?.chatMessage;
    const existingChatTimestamp = this.data[id]?.chatTimestamp;
    
    this.data[id] = { 
      ...data, 
      chatMessage: data.chatMessage ?? existingChat,
      chatTimestamp: data.chatTimestamp ?? existingChatTimestamp,
    };
  },

  updateChat(id: string, message: string) {
    // Update chat message untuk player tertentu
    if (this.data[id]) {
      this.data[id] = {
        ...this.data[id],
        chatMessage: message,
        chatTimestamp: Date.now(),
      };
    }
  },

  remove(id: string) {
    delete this.data[id];
    this.notifyListeners();
  },

  notifyListeners() {
    this.listeners.forEach((fn) => fn());
  },

  subscribe(fn: () => void) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  },

  getIds() {
    return Object.keys(this.data);
  },

  get(id: string) {
    return this.data[id];
  },

  clear() {
    this.data = {};
    this.notifyListeners();
  },
};
