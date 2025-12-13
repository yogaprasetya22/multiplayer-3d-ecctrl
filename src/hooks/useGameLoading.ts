'use client';

import { useState, useEffect, useCallback } from 'react';
import { useGLTF } from '@react-three/drei';

export interface LoadingState {
  progress: number;
  status: string;
  isLoading: boolean;
}

export function useGameLoading(modelPath: string) {
  const [loadingState, setLoadingState] = useState<LoadingState>({
    progress: 0,
    status: 'Initializing...',
    isLoading: true,
  });

  useEffect(() => {
    let mounted = true;

    const loadGame = async () => {
      try {
        // Step 1: Check server connection (10%)
        if (mounted) {
          setLoadingState({
            progress: 5,
            status: '🔌 Connecting to server...',
            isLoading: true,
          });
        }

        // Simulate server check (bisa diganti dengan actual ping/health check)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (mounted) {
          setLoadingState({
            progress: 10,
            status: '✅ Server connected',
            isLoading: true,
          });
        }

        // Step 2: Load 3D model (10% -> 90%)
        if (mounted) {
          setLoadingState({
            progress: 15,
            status: '📦 Loading 3D models...',
            isLoading: true,
          });
        }

        // Preload model with simple progress simulation
        const modelLoadPromise = new Promise<void>((resolve) => {
          // Start preloading
          useGLTF.preload(modelPath);
          
          // Simulate progress for large model
          let currentProgress = 15;
          const interval = setInterval(() => {
            currentProgress += 5;
            if (currentProgress >= 90) {
              clearInterval(interval);
              resolve();
            }
            if (mounted) {
              setLoadingState({
                progress: currentProgress,
                status: `📦 Loading models... ${Math.round(((currentProgress - 15) / 75) * 100)}%`,
                isLoading: true,
              });
            }
          }, 200); // Update every 200ms

          // Timeout after 10 seconds
          setTimeout(() => {
            clearInterval(interval);
            resolve();
          }, 10000);
        });

        await modelLoadPromise;

        // Step 3: Initialize game systems (90% -> 95%)
        if (mounted) {
          setLoadingState({
            progress: 92,
            status: '⚙️ Initializing game systems...',
            isLoading: true,
          });
        }

        await new Promise(resolve => setTimeout(resolve, 300));

        // Step 4: Final preparations (95% -> 100%)
        if (mounted) {
          setLoadingState({
            progress: 96,
            status: '🎮 Almost ready...',
            isLoading: true,
          });
        }

        await new Promise(resolve => setTimeout(resolve, 200));

        // Complete!
        if (mounted) {
          setLoadingState({
            progress: 100,
            status: '✨ Ready to play!',
            isLoading: false,
          });
        }
      } catch (error) {
        console.error('Loading error:', error);
        if (mounted) {
          setLoadingState({
            progress: 0,
            status: '❌ Loading failed. Please refresh.',
            isLoading: false,
          });
        }
      }
    };

    loadGame();

    return () => {
      mounted = false;
    };
  }, [modelPath]);

  const startLoading = useCallback(() => {
    setLoadingState({
      progress: 0,
      status: 'Initializing...',
      isLoading: true,
    });
  }, []);

  return {
    loadingState,
    startLoading,
    isLoading: loadingState.isLoading,
  };
}
