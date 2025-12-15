import { useEffect, useState } from 'react';

export type DeviceDesktopSettings = {
  mouseSensitivity: number; // mouse movement multiplier
};

export type DeviceMobileSettings = {
  touchSensitivity: number; // touch drag multiplier
  bottomThresholdPercent: number; // fraction of screen height reserved for controls (0-1)
  leftJoystickPercent: number; // fraction of screen width considered joystick area (0-1)
  rightButtonPercent: number; // fraction of screen width marking start of button area (0-1)
};

export type PlayerSettings = {
  desktop: DeviceDesktopSettings;
  mobile: DeviceMobileSettings;
  mapCullingDisabled: boolean;
  // Visual scale for the character model (1.0 = original model size)
  characterScale: number;
};

const DEFAULT_SETTINGS: PlayerSettings = {
  desktop: { mouseSensitivity: 0.002 },
  mobile: {
    touchSensitivity: 0.004,
    bottomThresholdPercent: 0.35,
    leftJoystickPercent: 0.4,
    rightButtonPercent: 0.7,
  },
  mapCullingDisabled: true,
  characterScale: 0.5,
};

const LS_KEY = 'multiplayer_player_settings_v1';

export function loadPlayerSettings(): PlayerSettings {
  try {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as any;

    // Backwards compatibility: old flat shape -> convert to new nested shape
    if (parsed && (parsed.desktop || parsed.mobile)) {
      // Looks like new shape (maybe partial)
      return {
        desktop: { ...DEFAULT_SETTINGS.desktop, ...(parsed.desktop ?? {}) },
        mobile: { ...DEFAULT_SETTINGS.mobile, ...(parsed.mobile ?? {}) },
        mapCullingDisabled: parsed.mapCullingDisabled ?? DEFAULT_SETTINGS.mapCullingDisabled,
        characterScale: parsed.characterScale ?? DEFAULT_SETTINGS.characterScale,
      };
    }

    // Old flat object support
    const flat = parsed as Partial<any>;
    return {
      desktop: { mouseSensitivity: flat.mouseSensitivity ?? DEFAULT_SETTINGS.desktop.mouseSensitivity },
      mobile: {
        touchSensitivity: flat.touchSensitivity ?? DEFAULT_SETTINGS.mobile.touchSensitivity,
        bottomThresholdPercent: flat.bottomThresholdPercent ?? DEFAULT_SETTINGS.mobile.bottomThresholdPercent,
        leftJoystickPercent: flat.leftJoystickPercent ?? DEFAULT_SETTINGS.mobile.leftJoystickPercent,
        rightButtonPercent: flat.rightButtonPercent ?? DEFAULT_SETTINGS.mobile.rightButtonPercent,
      },
      mapCullingDisabled: flat.mapCullingDisabled ?? DEFAULT_SETTINGS.mapCullingDisabled,
      characterScale: flat.characterScale ?? DEFAULT_SETTINGS.characterScale,
    };
  } catch (e) {
    console.warn('[Settings] failed to load, using defaults', e);
    return DEFAULT_SETTINGS;
  }
}

export function savePlayerSettings(s: PlayerSettings) {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch (e) {
    console.warn('[Settings] failed to save', e);
  }
}

// Internal singleton store so multiple hook consumers stay in sync
let _currentSettings: PlayerSettings | null = null;
const _subscribers = new Set<(s: PlayerSettings) => void>();

function ensureLoadedSettings() {
  if (_currentSettings) return _currentSettings;
  _currentSettings = loadPlayerSettings();
  return _currentSettings;
}

function setPlayerSettings(s: PlayerSettings) {
  _currentSettings = s;
  // persist
  savePlayerSettings(s);
  // notify subscribers
  _subscribers.forEach((fn) => {
    try { fn(s); } catch (e) { console.warn('[Settings] subscriber error', e); }
  });
}

function updatePlayerSettings(patch: Partial<PlayerSettings>) {
  const cur = ensureLoadedSettings();
  const merged: PlayerSettings = {
    desktop: { ...cur.desktop, ...(patch.desktop ?? {}) },
    mobile: { ...cur.mobile, ...(patch.mobile ?? {}) },
    mapCullingDisabled: patch.mapCullingDisabled ?? cur.mapCullingDisabled,
    characterScale: patch.characterScale ?? cur.characterScale,
  };
  setPlayerSettings(merged);
}

// React hook to access and update settings (subscribes to singleton)
export function usePlayerSettings() {
  const [settings, setSettings] = useState<PlayerSettings>(() => ensureLoadedSettings());

  useEffect(() => {
    // subscribe
    const sub = (s: PlayerSettings) => setSettings(s);
    _subscribers.add(sub);
    return () => { _subscribers.delete(sub); };
  }, []);

  const updateSettings = (patch: Partial<PlayerSettings>) => updatePlayerSettings(patch);
  const resetSettings = () => setPlayerSettings(loadPlayerSettings());

  return { settings, updateSettings, resetSettings } as const;
}

export const DEFAULT_PLAYER_SETTINGS = DEFAULT_SETTINGS;
