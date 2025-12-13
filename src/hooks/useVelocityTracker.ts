'use client';

import { useRef, useCallback, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import type { AnimationName } from '@/components/game';

/**
 * Hook untuk track velocity dan animation state
 * Digunakan untuk debugging dan animation selection
 */
export function useVelocityTracker() {
  const velocityRef = useRef(0);
  const animationRef = useRef<AnimationName>('Idle');
  const isJumpingRef = useRef(false);
  const [displayAnimation, setDisplayAnimation] = useState<AnimationName>('Idle');
  const [displayVelocity, setDisplayVelocity] = useState(0);
  const [displayJumping, setDisplayJumping] = useState(false);

  // Update display every 100ms untuk mengurangi re-render
  useFrame(() => {
    setDisplayVelocity(velocityRef.current);
    setDisplayAnimation(animationRef.current);
    setDisplayJumping(isJumpingRef.current);
  });

  return {
    velocityRef,
    animationRef,
    isJumpingRef,
    displayAnimation,
    displayVelocity,
    displayJumping,
  };
}
