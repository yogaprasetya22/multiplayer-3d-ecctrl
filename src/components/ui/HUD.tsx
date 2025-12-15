'use client';

interface HUDProps {
  playerCount: number;
  score: number;
  maxScore: number;
  lobbyId: string;
}

export function HUD({ playerCount, score, maxScore, lobbyId }: HUDProps) {
  return (
    <>
      {/* Player Count */}
      <div className="absolute top-5 left-5 bg-black/70 text-white px-5 py-3 rounded-2xl backdrop-blur">
        <div className="text-sm lg:text-3xl font-bold" id="player-count">
          {playerCount}
        </div>
        <div className="text-xs opacity-80">Players</div>
      </div>

      {/* Score */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/70 text-white px-6 py-4 rounded-2xl backdrop-blur">
        <div className="text-sm lg:text-3xl font-bold">
          {score}/{maxScore}
        </div>
        <div className="text-xs opacity-80">Gems</div>
      </div>

      {/* Lobby ID */}
      <div className="absolute top-5 right-5 bg-black/70 text-white py-3 px-5 rounded-2xl backdrop-blur text-sm">
        Lobby: <span className="font-bold">{lobbyId}</span>
      </div>
    </>
  );
}
