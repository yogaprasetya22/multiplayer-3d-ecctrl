'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface PerformanceStats {
  fps: number;
  ping: number;
  networkStatus: 'good' | 'medium' | 'poor' | 'connecting';
}

export function PerformanceMonitor() {
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    ping: 0,
    networkStatus: 'connecting',
  });

  // FPS calculation refs
  const frameCount = useRef(0);
  const lastFpsTime = useRef(performance.now());

  // Ping calculation refs
  const pingInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let animationId: number;
    let mounted = true;

    // ===================== FPS COUNTER =====================
    const updateFPS = () => {
      if (!mounted) return;
      
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastFpsTime.current;

      // Update FPS setiap 500ms
      if (delta >= 500) {
        const currentFps = Math.round((frameCount.current * 1000) / delta);
        setStats(prev => ({ ...prev, fps: currentFps }));
        frameCount.current = 0;
        lastFpsTime.current = now;
      }

      animationId = requestAnimationFrame(updateFPS);
    };

    animationId = requestAnimationFrame(updateFPS);

    // ===================== PING MEASUREMENT =====================
    const measurePing = async () => {
      if (!mounted) return;
      
      try {
        const startTime = performance.now();
        
        // Use simple heartbeat - send a query to Supabase and measure response time
        // This gives us actual network latency
        const { error } = await supabase.from('players').select('count').limit(1);
        
        const endTime = performance.now();
        const pingMs = Math.round(endTime - startTime);
        
        // Only update if we got a result (not error)
        if (!error && mounted) {
          setStats(prev => ({
            ...prev,
            ping: Math.max(pingMs, prev.ping), // Use max to show real latency
          }));
        }
      } catch (err) {
        // Silently fail - we'll use broadcast/receive measurement instead
      }
    };

    // Initial ping check
    measurePing();
    
    // Measure ping setiap 3 detik untuk fallback
    pingInterval.current = setInterval(measurePing, 3000);
    pingInterval.current = setInterval(measurePing, 5000);

    // ===================== NETWORK EVENT LISTENER =====================
    // Listen to broadcast events untuk measure actual network latency
    let lastBroadcastTime = 0;
    let lastReceiveTime = 0;
    let pingValues: number[] = [];

    const handleBroadcast = () => {
      lastBroadcastTime = performance.now();
    };

    const handleReceive = () => {
      const now = performance.now();
      
      if (lastBroadcastTime > 0) {
        // Calculate round-trip time estimate
        // Since we don't have server timestamp, estimate from broadcast->receive delta
        const broadcastToReceive = now - lastBroadcastTime;
        const estimatedPing = Math.round(broadcastToReceive / 2); // Assume symmetric latency
        
        pingValues.push(estimatedPing);
        
        // Keep only last 20 measurements for averaging
        if (pingValues.length > 20) {
          pingValues.shift();
        }
        
        // Calculate average ping
        const avgPing = Math.round(pingValues.reduce((a, b) => a + b, 0) / pingValues.length);
        
        // Determine network health
        let status: 'good' | 'medium' | 'poor' | 'connecting' = 'good';
        if (avgPing < 100) status = 'good';
        else if (avgPing < 200) status = 'medium';
        else status = 'poor';
        
        if (mounted) {
          setStats(prev => ({
            ...prev,
            ping: avgPing,
            networkStatus: status,
          }));
        }
      }
      
      lastReceiveTime = now;
    };

    window.addEventListener('network:broadcast', handleBroadcast as EventListener);
    window.addEventListener('network:receive', handleReceive as EventListener);

    return () => {
      mounted = false;
      cancelAnimationFrame(animationId);
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
      window.removeEventListener('network:broadcast', handleBroadcast as EventListener);
      window.removeEventListener('network:receive', handleReceive as EventListener);
    };
  }, []);

  // ===================== STYLING HELPERS =====================
  const getFpsColor = () => {
    if (stats.fps >= 55) return 'text-green-400';
    if (stats.fps >= 40) return 'text-yellow-400';
    if (stats.fps >= 25) return 'text-orange-400';
    return 'text-red-400';
  };

  const getPingColor = () => {
    if (stats.ping === 0) return 'text-gray-400';      // Not measured yet
    if (stats.ping < 80) return 'text-green-400';      // Excellent
    if (stats.ping < 150) return 'text-yellow-400';    // Good
    if (stats.ping < 250) return 'text-orange-400';    // Fair
    return 'text-red-400';                             // Poor
  };

  const getNetworkIcon = () => {
    switch (stats.networkStatus) {
      case 'good': return '🟢';
      case 'medium': return '🟡';
      case 'poor': return '🔴';
      case 'connecting': return '⚪';
      default: return '⚫';
    }
  };

  return (
    <div className="absolute top-5 left-28 bg-black/70 backdrop-blur px-4 py-3 rounded-2xl flex gap-6 items-center">
      {/* FPS */}
      <div className="text-center">
        <div className={`text-2xl font-bold font-mono ${getFpsColor()}`}>
          {stats.fps}
        </div>
        <div className="text-xs text-white/70">FPS</div>
      </div>
      
      {/* Divider */}
      <div className="w-px h-10 bg-white/20" />
      
      {/* Ping */}
      <div className="text-center">
        <div className={`text-2xl font-bold font-mono ${getPingColor()}`}>
          {stats.ping > 0 ? `${stats.ping}ms` : '--'}
        </div>
        <div className="text-xs text-white/70">PING</div>
      </div>
      
      {/* Network Status Indicator */}
      <div className="text-lg" title={`Network: ${stats.networkStatus}`}>
        {getNetworkIcon()}
      </div>
    </div>
  );
}
