'use client';

interface LoginScreenProps {
  username: string;
  setUsername: (value: string) => void;
  lobbyId: string;
  setLobbyId: (value: string) => void;
  onStart: () => void;
}

export function LoginScreen({
  username,
  setUsername,
  lobbyId,
  setLobbyId,
  onStart,
}: LoginScreenProps) {
  const handleStart = () => {
    if (username.trim()) {
      onStart();
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-600 via-purple-600 to-pink-600 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl p-10 shadow-2xl max-w-md w-full">
        <h1 className="text-5xl font-black mb-8 text-center bg-linear-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          3D Multiplayer
        </h1>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 focus:border-purple-500 outline-none text-gray-800"
            maxLength={16}
            onKeyDown={(e) => e.key === 'Enter' && handleStart()}
          />

          <input
            type="text"
            placeholder="Lobby ID"
            value={lobbyId}
            onChange={(e) => setLobbyId(e.target.value || 'default-lobby')}
            className="w-full px-4 py-3 rounded-xl border-2 focus:border-purple-500 outline-none text-gray-800"
          />

          <button
            onClick={handleStart}
            disabled={!username.trim()}
            className="w-full bg-linear-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-xl font-bold text-xl hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎮 Mulai Bermain
          </button>
        </div>

        <div className="mt-6 p-4 bg-gray-100 rounded-xl text-sm text-gray-700">
          <div className="font-bold mb-2">📝 Kontrol:</div>
          <div>• WASD - Gerak</div>
          <div>• Mouse - Lihat sekeliling</div>
          <div>• Space - Lompat</div>
          <div>• Shift - Sprint</div>
          <div>• T - Toggle chat</div>
        </div>
      </div>
    </div>
  );
}
