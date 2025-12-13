# 🎬 Animasi Walk & Run - Troubleshooting Guide

## 📋 Perubahan Terbaru (Fix #3)

### ✅ Yang Sudah Di-Optimize:

1. **Velocity Smoothing**: 0.15 → 0.3 (lebih responsive)
2. **Walk Threshold**: 0.5 → 0.3 (lebih sensitif)
3. **Run Threshold**: 4 → 7 (lebih akurat dengan sprint)
4. **BVHECCTRL Config**: Disesuaikan untuk Roblox feel
   - maxWalkSpeed: 5 m/s
   - maxRunSpeed: 10 m/s
   - Gravity: 25 (natural fall)
   - Acceleration: 80 (smooth ramp up)

### 🔍 Console Log untuk Monitor:

```
[MyPlayer] Animation: Idle → Walk 
  (rawVel: 2.45, smoothVel: 1.82, jumping: false, onGround: true)

[MyPlayer] Animation: Walk → Run 
  (rawVel: 8.12, smoothVel: 7.45, jumping: false, onGround: true)
```

---

## 🚀 Cara Test Sekarang

### **Step 1: Buka Browser**
- Buka game di browser
- Buka DevTools Console (F12)
- Catat di tab "Console"

### **Step 2: Test Walk Animation**

**Action:**
```
1. Click canvas (area 3D hitam)
2. Tekan WASD pelan-pelan (jangan tekan Shift)
3. Gerak karakter slowly
```

**Expected Console Output:**
```
[MyPlayer] Animation: Idle → Walk (rawVel: X, smoothVel: 0.5-2.5, ...)
```

**Expected Behavior:**
- Model karakter bergerak dengan animasi Walking (bukan Idle)
- Karakter smooth bergerak forward/backward/left/right
- Tidak terlihat janky atau frozen

---

### **Step 3: Test Run Animation**

**Action:**
```
1. Click canvas
2. Tekan WASD + Hold SHIFT (sprint)
3. Gerak karakter cepat-cepatan
```

**Expected Console Output:**
```
[MyPlayer] Animation: Walk → Run (rawVel: X, smoothVel: 7.5-12, ...)
```

**Expected Behavior:**
- Model karakter bergerak dengan animasi Running (lebih cepat dari Walk)
- Gerakannya terlihat lebih energetic
- Speed berubah dari normal walk menjadi sprint

---

### **Step 4: Test Keyboard 1-0 Animations**

**Action:**
```
1. Click canvas
2. Tekan 1 (Attack animation)
3. Lihat karakter melakukan attack
4. Tunggu 2 detik - kembali ke Idle
```

**Expected Console Output:**
```
[Keyboard] Triggered manual animation: Attack(1h) (key 1)
[MyPlayer] Animation: Idle → Attack(1h) (...)
[Keyboard] Manual animation Attack(1h) cleared after 2s
[MyPlayer] Animation: Attack(1h) → Idle (...)
```

**Keyboard Mapping:**
```
1 = Attack(1h)
2 = Dance
3 = Cheer
4 = Wave
5 = Roll
6 = Block
7 = AttackSpinning
8 = HeavyAttack
9 = Shoot(1h)
0 = Hop
```

---

## 🐛 Troubleshooting

### ❌ **Walk/Run Animasi Tidak Muncul**

#### Check 1: Velocity Detection
```
1. Buka console
2. Bergerak pelan
3. Catat smoothVel value
```

**Jika smoothVel tidak naik:**
- Kemungkinan input tidak ter-register
- Atau character controller tidak bergerak
- **Solution**: Ensure player bisa bergerak (tidak stuck di walls)

**Jika smoothVel naik tapi animasi tidak berubah:**
- Threshold terlalu tinggi
- **Solution**: Turunkan threshold di src/app/page.tsx:
  ```typescript
  newAnim = velocityRef.current > 5 ? 'Run'    // Turun dari 7
    : velocityRef.current > 0.2 ? 'Walk'       // Turun dari 0.3
    : 'Idle';
  ```

#### Check 2: Model Has Animations
Pastikan model `Floating Character.glb` punya Walk dan Run animations.

Cek available animations:
```javascript
// Di console browser:
// Buka Network tab → Floating Character.glb → Preview
// Lihat apakah Walk dan Run ada di list
```

---

### ❌ **Animasi Smooth Tapi Tidak Sinkron di Multiplayer**

**Masalah:** Walk/Run berhasil di local tapi other players tidak lihat

**Check 1: Broadcast Animasi**
```
Console harus show:
[MyPlayer] Animation: ... → Walk
(confirm animation berubah)
```

**Check 2: Network Send**
```
Buka Network tab → Filters: "player-move"
Lihat payload:
{
  "animation": "Walk",
  "position": {...},
  ...
}
```

**Check 3: Other Player Receive**
```
Console di other player harus show:
[OtherPlayer XXXX] Animation change: Idle → Walk
```

**Jika tidak ada log:**
- Animasi tidak ter-broadcast
- Network tidak connected
- **Solution**: Cek connection di HUD (ada "Players: 1/1" atau error?)

---

## 🎯 Configuration Quick Reference

**File: `src/config/game.config.ts`**

```typescript
maxWalkSpeed: 5,      // m/s - target walk speed
maxRunSpeed: 10,      // m/s - target sprint speed
acceleration: 80,     // How fast to reach max speed
deceleration: 100,    // How fast to stop
```

**File: `src/app/page.tsx` (line ~155-160)**

```typescript
// Animation thresholds
newAnim = velocityRef.current > 7 ? 'Run'      // > 70% walk speed
  : velocityRef.current > 0.3 ? 'Walk'         // Any movement
  : 'Idle';                                     // Standing
```

---

## 🔧 Advanced Debug Mode

### Uncomment Velocity Logging

Di `src/app/page.tsx` cari line ~168, uncomment:

```typescript
// 🔍 DEBUG: Log velocity setiap beberapa frame untuk monitoring (uncomment jika perlu)
if (Math.random() < 0.02) { // ~2% frames
  console.log(`[DEBUG] rawVel: ${horizontalVel.toFixed(2)}, smoothVel: ${velocityRef.current.toFixed(2)}, anim: ${newAnim}`);
}
```

Ini akan log setiap detik lebih atau kurang, showing real velocity values.

**Expected Log Pattern:**

```
[DEBUG] rawVel: 0.00, smoothVel: 0.00, anim: Idle
[DEBUG] rawVel: 2.45, smoothVel: 0.73, anim: Idle
[DEBUG] rawVel: 2.50, smoothVel: 1.11, anim: Walk     ← thresholdnya tercapai
[DEBUG] rawVel: 2.48, smoothVel: 1.38, anim: Walk
[DEBUG] rawVel: 0.10, smoothVel: 1.04, anim: Walk
[DEBUG] rawVel: 0.05, smoothVel: 0.78, anim: Walk
[DEBUG] rawVel: 0.00, smoothVel: 0.54, anim: Walk
[DEBUG] rawVel: 0.00, smoothVel: 0.40, anim: Walk
[DEBUG] rawVel: 0.00, smoothVel: 0.30, anim: Idle     ← turun ke idle
```

---

## 📊 Expected Performance

**If everything working:**
- Idle → Walk transition: < 0.5 detik
- Walk → Run transition: < 1 detik (depends on Sprint key timing)
- Other players animation sync: < 100ms delay
- Multiplayer animation broadcast: ~20 updates/sec (50ms interval)

---

## 🎭 Model Information

**Current Model:** `/public/Floating Character.glb`

**All Available Animations (30+):**
```
Idle, Walk, Run, Jump, Jump_Start, Jump_Idle, Jump_Land,
Attack(1h), AttackCombo, AttackSpinning, HeavyAttack,
Block, Roll, DashFront, DashBack, DashLeft, DashRight,
Dance, Cheer, Wave, Defeat, Hop,
Shoot(1h), Shoot(2h), Shoot(2h)Bow, Shooting(1h), Shooting(2h),
Climbing, Interact, PickUp, Throw, LayingDownIdle, BasePose
```

---

## ✅ Final Checklist

Sebelum report issue, pastikan sudah checked:

- [ ] Browser console terbuka (F12)
- [ ] Player bisa bergerak (WASD works)
- [ ] Walk/Run log appear di console saat bergerak
- [ ] Keyboard 1-0 animations bisa di-trigger
- [ ] Multiplayer test: 2 device/tab, other player bisa lihat Walk/Run
- [ ] Uncomment debug log jika ingin more detailed info
- [ ] Scroll up di console untuk lihat semua log (jangan miss)

---

## 💬 Report Issue

Kalau masih tidak bisa, provide info:

1. **Console Log Screenshot** - tunjukkan apa yang log
2. **Browser** - Chrome/Firefox/Safari?
3. **OS** - Windows/Mac/Linux?
4. **Step to Reproduce** - tepat apa yang dilakukan
5. **Expected vs Actual** - seharusnya gimana, tapi kenapa?

Example:
```
Issue: Walk animation tidak muncul
Browser: Chrome 131 on Windows 11
Steps: 
  1. Login
  2. Click canvas
  3. Press W + hold jalan 5 detik
  4. Lihat console
Problem: Console show "Animation: Idle" tapi tidak ada "→ Walk"
Expected: Harus ada "Animation: Idle → Walk"
```

---

**Good luck testing! Let's see animasi Walk/Run finally working! 🎉**
