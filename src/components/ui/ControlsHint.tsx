'use client';

interface ControlsHintProps {
  isMobile: boolean;
}

export function ControlsHint({ isMobile }: ControlsHintProps) {
  if (isMobile) {
    return (
      <div className="absolute bottom-5 right-5 text-white bg-black/50 px-4 py-2 rounded-lg text-sm">
        Tekan <kbd className="px-2 py-1 bg-white/20 rounded mx-1">T</kbd> untuk chat
      </div>
    );
  }

  return (
    <div className="absolute bottom-5 right-5 text-white bg-black/80 px-4 py-3 rounded-lg text-sm space-y-1 max-w-xs">
      <div className="font-bold text-yellow-400 mb-2">📌 PENTING:</div>
      <div>1. KLIK CANVAS (area 3D hitam)</div>
      <div>2. WASD - Gerak</div>
      <div>3. Mouse - Lihat sekeliling</div>
      <div>4. Space - Lompat | Shift - Sprint</div>
      <div>5. ESC - Unlock mouse</div>
      <div className="text-xs opacity-70 mt-2">Tekan T untuk chat</div>
      <div className="text-xs opacity-70 border-t border-white/20 pt-2 mt-2">
        <div className="text-yellow-300 font-semibold mb-1">🎭 Animasi:</div>
        <div>1-Attack | 2-Dance | 3-Cheer | 4-Wave</div>
        <div>5-Roll | 6-Block | 7-Spin | 8-Heavy</div>
        <div>9-Shoot | 0-Hop</div>
      </div>
    </div>
  );
}
