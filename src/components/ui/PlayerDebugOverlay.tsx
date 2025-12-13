'use client';

import { useEffect, useState, useRef } from 'react';
import { playersStore } from '@/stores/playersStore';

interface PlayerDebugInfo {
  id: string;
  username: string;
  position: { x: number; y: number; z: number };
  fps: number;
  updateRate: number; // Updates per second dari server
  lastUpdateGap: number; // Milliseconds since last update
  ping: number;
  isLagging: boolean;
}

export function PlayerDebugOverlay() {
  const [debugInfo, setDebugInfo] = useState<PlayerDebugInfo[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const updateCounts = useRef<Record<string, number>>({});
  const lastResetTime = useRef(Date.now());
  const fpsData = useRef<Record<string, number[]>>({});

  useEffect(() => {
    // Listen for player updates
    const handlePlayerUpdate = (e: CustomEvent) => {
      const playerId = e.detail?.id;
      if (!playerId) return;
      
      updateCounts.current[playerId] = (updateCounts.current[playerId] || 0) + 1;
    };

    window.addEventListener('network:receive' as any, handlePlayerUpdate);

    // Update stats every second
    const statsInterval = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastResetTime.current) / 1000;
      
      const playerIds = playersStore.getIds();
      const newDebugInfo: PlayerDebugInfo[] = playerIds.map(id => {
        const data = playersStore.get(id);
        if (!data) return null;

        const updateRate = Math.round((updateCounts.current[id] || 0) / elapsed);
        
        // FIX: lastUpdate adalah timestamp dari performance.now(), bukan Date.now()
        // Jadi kita track sendiri kapan terakhir update
        const lastUpdateGap = data.lastUpdate 
          ? Math.round(performance.now() - data.lastUpdate)
          : 999;
        
        // Calculate FPS (placeholder)
        const fps = 60;
        
        const isLagging = updateRate < 10 || lastUpdateGap > 200;

        return {
          id,
          username: data.username,
          position: { x: data.x, y: data.y, z: data.z },
          fps,
          updateRate,
          lastUpdateGap,
          ping: Math.round(lastUpdateGap / 2), // Rough estimate
          isLagging,
        };
      }).filter(Boolean) as PlayerDebugInfo[];

      setDebugInfo(newDebugInfo);
      
      // Reset counters
      updateCounts.current = {};
      lastResetTime.current = now;
    }, 1000);

    return () => {
      window.removeEventListener('network:receive' as any, handlePlayerUpdate);
      clearInterval(statsInterval);
    };
  }, []);

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg"
        >
          🔍 Show Debug ({debugInfo.length} players)
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg font-mono text-xs z-50 max-w-md max-h-[80vh] overflow-auto">
      <div className="flex justify-between items-center mb-3 sticky top-0 bg-black pb-2">
        <div className="font-bold text-purple-400">👥 Player Debug Monitor</div>
        <button
          onClick={() => setIsMinimized(true)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {debugInfo.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No other players online
        </div>
      ) : (
        <div className="space-y-3">
          {debugInfo.map(player => (
            <div
              key={player.id}
              className={`p-3 rounded border-2 cursor-pointer transition-all ${
                player.isLagging
                  ? 'border-red-500 bg-red-900/20'
                  : 'border-green-500 bg-green-900/10'
              } ${selectedPlayer === player.id ? 'ring-2 ring-yellow-400' : ''}`}
              onClick={() => setSelectedPlayer(selectedPlayer === player.id ? null : player.id)}
            >
              {/* Header */}
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-cyan-400">
                  {player.username}
                  {player.isLagging && <span className="ml-2 text-red-400">⚠️ LAG</span>}
                </div>
                <div className="text-xs text-gray-400">
                  {player.id.slice(0, 8)}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-gray-400">Update Rate:</span>
                  <span className={`ml-1 font-bold ${
                    player.updateRate < 10 ? 'text-red-400' : 
                    player.updateRate < 20 ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    {player.updateRate}/s
                  </span>
                </div>

                <div>
                  <span className="text-gray-400">Last Update:</span>
                  <span className={`ml-1 font-bold ${
                    player.lastUpdateGap > 200 ? 'text-red-400' : 
                    player.lastUpdateGap > 100 ? 'text-yellow-400' : 
                    'text-green-400'
                  }`}>
                    {player.lastUpdateGap}ms
                  </span>
                </div>

                <div>
                  <span className="text-gray-400">Ping:</span>
                  <span className="ml-1 font-bold text-blue-400">
                    ~{Math.round(player.ping)}ms
                  </span>
                </div>

                <div>
                  <span className="text-gray-400">FPS:</span>
                  <span className="ml-1 font-bold text-purple-400">
                    {player.fps}
                  </span>
                </div>
              </div>

              {/* Position (expanded view) */}
              {selectedPlayer === player.id && (
                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="text-gray-400 mb-1">Position:</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-red-400">X:</span>
                      <span className="ml-1">{player.position.x.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-green-400">Y:</span>
                      <span className="ml-1">{player.position.y.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-blue-400">Z:</span>
                      <span className="ml-1">{player.position.z.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Diagnostics */}
                  <div className="mt-2 pt-2 border-t border-gray-700">
                    <div className="text-yellow-400 font-bold mb-1">🔍 Diagnosis:</div>
                    {player.updateRate < 10 && (
                      <div className="text-red-400 text-xs">
                        ⚠️ Network updates TOO SLOW (should be 25-30/s)
                      </div>
                    )}
                    {player.lastUpdateGap > 200 && (
                      <div className="text-red-400 text-xs">
                        ⚠️ Large gap between updates (stale data)
                      </div>
                    )}
                    {player.fps < 30 && (
                      <div className="text-red-400 text-xs">
                        ⚠️ Low FPS causing choppy interpolation
                      </div>
                    )}
                    {!player.isLagging && (
                      <div className="text-green-400 text-xs">
                        ✅ All metrics looking good
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="mt-4 pt-3 border-t border-gray-700 text-xs space-y-1">
        <div className="text-gray-400 font-bold mb-2">Legend:</div>
        <div className="text-green-400">✓ Update Rate: Network updates/second (target: 25-30)</div>
        <div className="text-yellow-400">✓ Last Update: Time since last data (target: &lt;50ms)</div>
        <div className="text-blue-400">✓ Ping: Estimated network latency</div>
        <div className="text-red-400">⚠️ Red = Problem detected</div>
      </div>
    </div>
  );
}
