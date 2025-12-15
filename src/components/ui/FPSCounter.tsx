'use client';

import { useEffect, useRef, useState } from 'react';

export function FPSCounter() {
  const [fps, setFps] = useState(60);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());

  useEffect(() => {
    let animationId: number;

    const updateFPS = () => {
      frameCount.current++;
      const now = performance.now();
      const delta = now - lastTime.current;

      // Update FPS setiap 500ms
      if (delta >= 500) {
        const currentFps = Math.round((frameCount.current * 1000) / delta);
        setFps(currentFps);
        frameCount.current = 0;
        lastTime.current = now;
      }

      animationId = requestAnimationFrame(updateFPS);
    };

    animationId = requestAnimationFrame(updateFPS);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  // Color based on FPS (optimized for 120 FPS target)
  const getColor = () => {
    if (fps >= 100) return 'text-green-400';   // Excellent
    if (fps >= 60) return 'text-lime-400';     // Great
    if (fps >= 45) return 'text-yellow-400';   // Good
    if (fps >= 30) return 'text-orange-400';   // Playable
    return 'text-red-400';                      // Lag
  };

  return (
    <div className="absolute top-5 left-28 bg-black/70 text-white px-4 py-3 rounded-2xl backdrop-blur">
      <div className={`text-xs md:text-2xl font-bold font-mono ${getColor()}`}>
        {fps}
      </div>
      <div className="text-xs opacity-80">FPS</div>
    </div>
  );
}
