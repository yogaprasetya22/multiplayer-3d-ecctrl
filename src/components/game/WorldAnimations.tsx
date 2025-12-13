'use client';

import { useFrame } from '@react-three/fiber';

export function WorldAnimations() {
  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // Moving platform animation
    const platform = state.scene.getObjectByName('moving-platform');
    if (platform) {
      platform.position.y = 5 + Math.sin(t * 1.5) * 3;
    }

    // Gems animation (rotation + float)
    state.scene.traverse((obj) => {
      if (obj.userData.type === 'gem' && !obj.userData.collected) {
        obj.rotation.y += 0.02;
        obj.position.y = obj.userData.baseY + Math.sin(t * 3) * 0.2;
      }
    });
  });

  return null;
}
