'use client';

import { useEffect, useState, useRef } from 'react';

interface NetworkStats {
  broadcastCount: number;
  receiveCount: number;
  broadcastRate: number; // per second
  receiveRate: number; // per second
  lastBroadcastTime: number;
  lastReceiveTime: number;
  avgBroadcastInterval: number;
  avgReceiveInterval: number;
}

export function NetworkDebug() {
  const [stats, setStats] = useState<NetworkStats>({
    broadcastCount: 0,
    receiveCount: 0,
    broadcastRate: 0,
    receiveRate: 0,
    lastBroadcastTime: 0,
    lastReceiveTime: 0,
    avgBroadcastInterval: 0,
    avgReceiveInterval: 0,
  });

  const statsRef = useRef(stats);
  statsRef.current = stats;

  useEffect(() => {
    // Listen for broadcast events
    const handleBroadcast = (e: CustomEvent) => {
      const now = performance.now();
      const interval = now - statsRef.current.lastBroadcastTime;
      
      setStats(prev => ({
        ...prev,
        broadcastCount: prev.broadcastCount + 1,
        lastBroadcastTime: now,
        avgBroadcastInterval: prev.avgBroadcastInterval * 0.9 + interval * 0.1,
      }));
    };

    // Listen for receive events
    const handleReceive = (e: CustomEvent) => {
      const now = performance.now();
      const interval = now - statsRef.current.lastReceiveTime;
      
      setStats(prev => ({
        ...prev,
        receiveCount: prev.receiveCount + 1,
        lastReceiveTime: now,
        avgReceiveInterval: prev.avgReceiveInterval * 0.9 + interval * 0.1,
      }));
    };

    window.addEventListener('network:broadcast' as any, handleBroadcast);
    window.addEventListener('network:receive' as any, handleReceive);

    // Calculate rates every second
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        broadcastRate: prev.broadcastCount,
        receiveRate: prev.receiveCount,
        broadcastCount: 0,
        receiveCount: 0,
      }));
    }, 1000);

    return () => {
      window.removeEventListener('network:broadcast' as any, handleBroadcast);
      window.removeEventListener('network:receive' as any, handleReceive);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="fixed top-20 right-4 bg-black/80 text-white p-4 rounded-lg font-mono text-sm z-50 min-w-[300px]">
      <div className="font-bold mb-2 text-yellow-400">🔍 Network Debug</div>
      
      <div className="space-y-1">
        <div className="text-green-400">
          📤 Broadcast: {stats.broadcastRate}/s
        </div>
        <div className="text-xs text-gray-400 ml-4">
          Avg interval: {stats.avgBroadcastInterval.toFixed(1)}ms
        </div>
        
        <div className="text-blue-400 mt-2">
          📥 Receive: {stats.receiveRate}/s
        </div>
        <div className="text-xs text-gray-400 ml-4">
          Avg interval: {stats.avgReceiveInterval.toFixed(1)}ms
        </div>

        <div className="mt-2 pt-2 border-t border-gray-600">
          <div className={`text-xs ${stats.broadcastRate < 20 ? 'text-red-400' : 'text-green-400'}`}>
            Status: {stats.broadcastRate < 20 ? '⚠️ SLOW BROADCAST!' : '✅ Good'}
          </div>
          {stats.receiveRate === 0 && stats.broadcastRate > 0 && (
            <div className="text-xs text-red-400">
              ⚠️ NOT RECEIVING DATA!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
