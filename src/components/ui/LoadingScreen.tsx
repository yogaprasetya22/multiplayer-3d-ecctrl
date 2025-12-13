'use client';

import { useState, useEffect } from 'react';

interface LoadingScreenProps {
  progress: number;
  status: string;
  isLoading: boolean;
}

export function LoadingScreen({ progress, status, isLoading }: LoadingScreenProps) {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-linear-to-b from-gray-900 to-black">
      <div className="text-center px-8">
        {/* Logo/Title */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            🎮 Multiplayer 3D Game
          </h1>
          <p className="text-gray-400 text-lg">Powered by Three.js & Supabase</p>
        </div>

        {/* Progress Bar */}
        <div className="w-80 mx-auto mb-6">
          <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-linear-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-400">
            <span>{Math.round(progress)}%</span>
            <span>Loading{dots}</span>
          </div>
        </div>

        {/* Status Text */}
        <div className="text-white text-lg mb-8 h-8">
          {status}
        </div>

        {/* Loading Animation */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-3 h-3 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>

        {/* Tips */}
        {progress < 100 && (
          <div className="mt-8 text-gray-500 text-sm max-w-md mx-auto">
            <p className="mb-2">💡 Tips:</p>
            <ul className="text-left space-y-1">
              <li>• Use WASD to move</li>
              <li>• Press Space to jump</li>
              <li>• Hold Shift to sprint</li>
              <li>• Press T to chat</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
