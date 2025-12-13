'use client';

import { Character, AnimationName } from './Character';

interface PlayerMeshProps {
  color?: string;
  animation?: AnimationName;
}

export function PlayerMesh({ color, animation = 'Idle' }: PlayerMeshProps) {
  return (
    <Character 
      animation={animation} 
      color={color}
      characterScale={0.5}
      position-y={-0.5} // Adjust to ground level
    />
  );
}
