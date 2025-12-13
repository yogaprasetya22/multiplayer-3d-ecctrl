import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

interface VelocityDebugProps {
  velocityRef: React.MutableRefObject<number>;
  animationRef: React.MutableRefObject<string>;
  isJumpingRef: React.MutableRefObject<boolean>;
}

export function VelocityDebugOverlay({ velocityRef, animationRef, isJumpingRef }: VelocityDebugProps) {
  const displayRef = useRef<HTMLDivElement>(null);

  useFrame(() => {
    if (displayRef.current) {
      const vel = velocityRef.current.toFixed(2);
      const anim = animationRef.current;
      const jumping = isJumpingRef.current;
      
      displayRef.current.innerHTML = `
        <div style="font-size: 12px; font-family: monospace;">
          <div>Velocity: <span style="color: #4f9">${vel}</span></div>
          <div>Animation: <span style="color: #9f4">${anim}</span></div>
          <div>Jumping: <span style="color: ${jumping ? '#f44' : '#4f4'}">${jumping ? 'YES' : 'NO'}</span></div>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #666; font-size: 10px; opacity: 0.7;">
            <div>Threshold: 0.3 < Walk < 7 < Run</div>
          </div>
        </div>
      `;
    }
  });

  return (
    <div
      ref={displayRef}
      style={{
        position: 'fixed',
        top: 10,
        left: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#fff',
        padding: '10px',
        borderRadius: '4px',
        pointerEvents: 'none',
        zIndex: 1000,
        border: '1px solid #444',
      }}
    />
  );
}
