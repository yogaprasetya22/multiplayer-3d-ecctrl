'use client';

import { Character, AnimationName } from './Character';
import { usePlayerSettings } from '@/config/playerSettings';

interface PlayerMeshProps {
  color?: string;
  animation?: AnimationName;
}

export function PlayerMesh({ color, animation = 'Idle' }: PlayerMeshProps) {
  const { settings } = usePlayerSettings();
  const scale = settings?.characterScale ?? 0.5;

  return (
    <Character 
      animation={animation} 
      color={color}
      characterScale={scale}
      position-y={-0.5} // Adjust to ground level
    />
  );
}
