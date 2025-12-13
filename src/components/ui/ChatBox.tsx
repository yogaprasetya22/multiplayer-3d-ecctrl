'use client';

import type { ChatMessage } from '@/types/game';

interface ChatBoxProps {
  messages: ChatMessage[];
  input: string;
  setInput: (value: string) => void;
  onSend: () => void;
  visible: boolean;
}

export function ChatBox({ messages, input, setInput, onSend, visible }: ChatBoxProps) {
  if (!visible) return null;

  return (
    <div className="absolute bottom-5 left-5 w-96 bg-black/90 rounded-2xl overflow-hidden shadow-2xl z-50">
      <div className="bg-linear-to-r from-indigo-600 to-purple-600 p-3 font-bold text-white">
        Chat
      </div>
      <div className="h-80 overflow-y-auto p-4 space-y-2 text-sm">
        {messages.map((m, i) => (
          <div
            key={i}
            className={
              m.type === 'system'
                ? 'text-gray-400 italic text-center'
                : m.isOwn
                  ? 'text-cyan-400'
                  : 'text-white'
            }
          >
            {m.type === 'message' && <span className="font-bold">{m.username}: </span>}
            {m.message}
          </div>
        ))}
      </div>
      <div className="p-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="Ketik pesan..."
          className="flex-1 bg-white/10 text-white px-4 py-2 rounded-lg focus:outline-none"
        />
        <button
          onClick={onSend}
          className="bg-purple-600 px-5 py-2 rounded-lg text-white font-bold hover:bg-purple-700 transition"
        >
          Kirim
        </button>
      </div>
    </div>
  );
}
