import React, { useState, useEffect } from 'react';
import { usePlayerSettings, DEFAULT_PLAYER_SETTINGS, PlayerSettings } from '@/config/playerSettings';

export default function SettingsPanel() {
    const { settings, updateSettings } = usePlayerSettings();
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<'desktop' | 'mobile' | 'general'>('desktop');

    // local copy to edit before apply
    const [local, setLocal] = useState<PlayerSettings>(settings);
    useEffect(() => setLocal(settings), [settings]);

    const apply = () => {
        // ensure types
        updateSettings(local);
        setOpen(false);
    };

    const restoreDefaults = () => {
        updateSettings(DEFAULT_PLAYER_SETTINGS);
        setLocal(DEFAULT_PLAYER_SETTINGS);
    };

    return (
        <>
            {/* Gear button */}
            <button
                onClick={() => setOpen(true)}
                aria-label="Open settings"
                style={{ position: 'absolute', right: 12, top: 12, zIndex: 60, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', padding: 8, borderRadius: 8 }}
            >
                ⚙
            </button>

            {open && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ width: 'min(720px, 92%)', background: '#0b0b0b', color: 'white', padding: 18, borderRadius: 12, boxShadow: '0 6px 30px rgba(0,0,0,0.5)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Settings</h3>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button onClick={() => { setTab('desktop'); }} style={{ padding: '6px 10px', background: tab === 'desktop' ? '#222' : 'transparent', color: 'white', border: '1px solid #222' }}>Desktop</button>
                                <button onClick={() => { setTab('mobile'); }} style={{ padding: '6px 10px', background: tab === 'mobile' ? '#222' : 'transparent', color: 'white', border: '1px solid #222' }}>Mobile</button>
                                <button onClick={() => { setTab('general'); }} style={{ padding: '6px 10px', background: tab === 'general' ? '#222' : 'transparent', color: 'white', border: '1px solid #222' }}>General</button>
                                <button onClick={() => setOpen(false)} style={{ background: 'transparent', color: 'white', border: 'none', fontSize: 18 }}>✕</button>
                            </div>
                        </div>

                        <div style={{ marginTop: 12, display: 'grid', gap: 12 }}>
                            {tab === 'desktop' && (
                                <div>
                                    <label style={{ display: 'block' }}>
                                        Mouse sensitivity
                                        <input
                                            style={{ width: '100%' }}
                                            type="range"
                                            min={0.0002}
                                            max={0.0020}
                                            step={0.0001}
                                            value={local.desktop.mouseSensitivity}
                                            onChange={(e) => setLocal({ ...local, desktop: { ...local.desktop, mouseSensitivity: Number(e.target.value) } })}
                                        />
                                    </label>
                                    <div style={{ fontSize: 13, marginTop: 6 }}>{local.desktop.mouseSensitivity.toFixed(4)}</div>
                                </div>
                            )}

                            {tab === 'mobile' && (
                                <div style={{ display: 'grid', gap: 10 }}>
                                    <label>
                                        Touch sensitivity
                                        <input style={{ width: '100%' }} type="range" min={0.001} max={0.03} step={0.0005} value={local.mobile.touchSensitivity} onChange={(e) => setLocal({ ...local, mobile: { ...local.mobile, touchSensitivity: Number(e.target.value) } })} />
                                        <div style={{ fontSize: 13 }}>{local.mobile.touchSensitivity.toFixed(4)}</div>
                                    </label>

                                    <label>
                                        Bottom control zone (% height)
                                        <input style={{ width: '100%' }} type="range" min={0.05} max={0.6} step={0.01} value={local.mobile.bottomThresholdPercent} onChange={(e) => setLocal({ ...local, mobile: { ...local.mobile, bottomThresholdPercent: Number(e.target.value) } })} />
                                        <div style={{ fontSize: 13 }}>{(local.mobile.bottomThresholdPercent * 100).toFixed(0)}%</div>
                                    </label>

                                    <label>
                                        Left joystick width (% screen)
                                        <input style={{ width: '100%' }} type="range" min={0.05} max={0.6} step={0.01} value={local.mobile.leftJoystickPercent} onChange={(e) => setLocal({ ...local, mobile: { ...local.mobile, leftJoystickPercent: Number(e.target.value) } })} />
                                        <div style={{ fontSize: 13 }}>{(local.mobile.leftJoystickPercent * 100).toFixed(0)}%</div>
                                    </label>

                                    <label>
                                        Right buttons start (% screen)
                                        <input style={{ width: '100%' }} type="range" min={0.4} max={0.95} step={0.01} value={local.mobile.rightButtonPercent} onChange={(e) => setLocal({ ...local, mobile: { ...local.mobile, rightButtonPercent: Number(e.target.value) } })} />
                                        <div style={{ fontSize: 13 }}>{(local.mobile.rightButtonPercent * 100).toFixed(0)}%</div>
                                    </label>
                                </div>
                            )}

                            {tab === 'general' && (
                                <div style={{ display: 'grid', gap: 10 }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <input type="checkbox" checked={Boolean(local.mapCullingDisabled)} onChange={(e) => setLocal({ ...local, mapCullingDisabled: e.target.checked })} />
                                        Disable map distance-culling
                                    </label>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                                <button onClick={restoreDefaults} style={{ padding: '8px 12px' }}>Reset</button>
                                <button onClick={apply} style={{ padding: '8px 12px' }}>Apply</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
