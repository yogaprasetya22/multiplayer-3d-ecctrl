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
        
        // Simple ping via Supabase RPC atau REST check
        // Kita gunakan method sederhana - fetch ke Supabase endpoint
        const { error } = await supabase.from('_ping_check').select('*').limit(1).maybeSingle();
        
        // Kalau table tidak ada, tetap hitung latency dari response
        const endTime = performance.now();
        const pingMs = Math.round(endTime - startTime);
        
        if (mounted) {
          setStats(prev => ({
            ...prev,
            ping: pingMs,
            networkStatus: pingMs < 100 ? 'good' : pingMs < 200 ? 'medium' : 'poor',
          }));
        }
      } catch (err) {
        // Fallback: estimate from broadcast events
        if (mounted) {
          setStats(prev => ({ ...prev, networkStatus: 'poor' }));
        }
      }
    };

    // Initial ping check
    measurePing();
    
    // Measure ping setiap 5 detik (tidak terlalu sering agar tidak spam server)
    pingInterval.current = setInterval(measurePing, 5000);

    // ===================== NETWORK EVENT LISTENER =====================
    // Listen to broadcast events untuk lebih akurat
    let lastReceiveTime = 0;
    let receiveDeltas: number[] = [];

    const handleReceive = () => {
      const now = performance.now();
      if (lastReceiveTime > 0) {
        const delta = now - lastReceiveTime;
        receiveDeltas.push(delta);
        
        // Keep only last 10 deltas
        if (receiveDeltas.length > 10) {
          receiveDeltas.shift();
        }
        
        // Calculate average receive interval as rough "ping" estimate
        const avgDelta = receiveDeltas.reduce((a, b) => a + b, 0) / receiveDeltas.length;
        
        // Network health based on receive consistency
        const status = avgDelta < 100 ? 'good' : avgDelta < 200 ? 'medium' : 'poor';
        
        setStats(prev => ({
          ...prev,
          networkStatus: status,
        }));
      }
      lastReceiveTime = now;
    };

    window.addEventListener('network:receive', handleReceive as EventListener);

    return () => {
      mounted = false;
      cancelAnimationFrame(animationId);
      if (pingInterval.current) {
        clearInterval(pingInterval.current);
      }
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
    if (stats.ping < 80) return 'text-green-400';
    if (stats.ping < 150) return 'text-yellow-400';
    if (stats.ping < 250) return 'text-orange-400';
    return 'text-red-400';
  };

  const getNetworkIcon = () => {
    switch (stats.networkStatus) {
      case 'good': return '🟢';
      case 'medium': return '🟡';
      case 'poor': return '🔴';
      default: return '⚪';
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
          {stats.ping > 0 ? stats.ping : '--'}
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
