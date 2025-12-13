# 🎮 Roblox-like Config + Animation Walk/Run Testing

## ✅ Update Terbaru

### 1. **Config Baru (Roblox-like)**
```
✅ gravity: 32 (jauh lebih kuat dari 9.81)
✅ floatSpringK: 2000 (kaki selalu nempel tanah)
✅ floatDampingC: 200 (no bounce)
✅ floatHeight: 0.08 (sangat dekat ke tanah)
✅ delay: 0.1 (instant start)
✅ maxWalkSpeed: 6.5
✅ maxRunSpeed: 13
✅ acceleration: 200 (instant ramp up)
✅ deceleration: 250 (instant stop)
```

**Hasil:**
- ✅ Jump bisa di-spam ketika di tanah (float system snap cepat)
- ✅ Movement snappy seperti Roblox
- ✅ Tidak ada delay atau floaty feel

### 2. **Velocity Calculation Fix**
- Sebelumnya: `velocity = distance / delta` (bisa spike besar)
- Sekarang: `velocity = distance / Math.max(delta, 0.016)` (normalized)
- Smoothing: `vel * 0.6 + rawVel * 0.4` (stable exponential moving average)

### 3. **Animation Threshold Baru**
```
smoothVel > 4   → RUN animation
smoothVel > 0.5 → WALK animation
smoothVel < 0.5 → IDLE animation
```

### 4. **Debug Logging Enabled**
```
[MyPlayer] Animation: Idle → Walk (rawVel: 1.23, smoothVel: 0.85, onGround: true)
[DEBUG] rawVel: 1.20, smoothVel: 0.82, anim: Walk
[DEBUG] rawVel: 1.25, smoothVel: 0.83, anim: Walk
```

---

## 🧪 Testing Steps

### Test 1: Jump Spam
```
1. Buka game
2. Click canvas
3. Tekan SPACE berulang kali CEPAT (spam)
4. Karakter harus loncat-loncat tanpa stuck
5. Tidak perlu tunggu landing sebelum loncat lagi
```

✅ **Expected:** Karakter bisa jump spam dengan cepat

---

### Test 2: Walk Animation
```
1. Click canvas
2. Tekan WASD pelan-pelan (sustained movement)
3. Buka console (F12)
4. Lihat karakter bergerak
```

✅ **Expected Console Log:**
```
[MyPlayer] Animation: Idle → Walk (rawVel: 1.2, smoothVel: 0.8, onGround: true)
[DEBUG] rawVel: 1.20, smoothVel: 0.82, anim: Walk
[DEBUG] rawVel: 1.18, smoothVel: 0.81, anim: Walk
```

✅ **Expected Behavior:**
- Model karakter punya animasi Walking
- Movement smooth
- Log menunjukkan smoothVel antara 0.5 - 4

---

### Test 3: Run Animation
```
1. Click canvas
2. Tekan WASD + SHIFT (sprint)
3. Buka console
4. Lari cepat
```

✅ **Expected Console Log:**
```
[MyPlayer] Animation: Walk → Run (rawVel: 5.2, smoothVel: 4.8, onGround: true)
[DEBUG] rawVel: 5.15, smoothVel: 4.82, anim: Run
[DEBUG] rawVel: 5.18, smoothVel: 4.85, anim: Run
```

✅ **Expected Behavior:**
- Model karakter punya animasi Running
- Lebih cepat dari Walk
- Log menunjukkan smoothVel > 4

---

### Test 4: Idle Animation
```
1. Click canvas
2. Berdiri diam (jangan gerak)
3. Buka console
```

✅ **Expected Console Log:**
```
[MyPlayer] Animation: Walk → Idle (rawVel: 0.0, smoothVel: 0.12, onGround: true)
```

✅ **Expected Behavior:**
- Model karakter diam (tidak jalan/lari)
- Smooth transition dari Walk ke Idle

---

### Test 5: Jump Animation
```
1. Click canvas
2. Tekan SPACE
3. Buka console
```

✅ **Expected Console Log:**
```
[MyPlayer] Animation: Idle → Jump_Start (rawVel: 0.0, smoothVel: 0.0, onGround: false)
[MyPlayer] Animation: Jump_Start → Jump_Idle (...)
[MyPlayer] Animation: Jump_Idle → Idle (...)
```

✅ **Expected Behavior:**
- Jump_Start animasi (going up)
- Jump_Idle animasi (in air)
- Idle animasi (landed)

---

### Test 6: Keyboard 1-0
```
1. Click canvas
2. Tekan 1, 2, 3, dst
3. Lihat custom animations trigger
```

✅ **Expected:**
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

## 📊 Debug Info

### Jika Walk/Run Masih Tidak Muncul

**Check 1: Velocity sudah berubah?**
- Buka console F12
- Lihat `[DEBUG]` log saat bergerak
- Jika smoothVel tidak naik = character tidak bergerak atau terlalu lambat

**Check 2: Threshold cocok?**
```
Saat Walk: smoothVel harus 0.5 - 4
Saat Run:  smoothVel harus > 4
```

Jika smoothVel tidak sampe threshold:
```typescript
// Ubah threshold di src/app/page.tsx:
newAnim = velocityRef.current > 3 ? 'Run'    // Turun dari 4
  : velocityRef.current > 0.2 ? 'Walk'       // Turun dari 0.5
  : 'Idle';
```

**Check 3: Character Model Animasi**
- Model: `/public/Floating Character.glb`
- Pastikan punya Walk dan Run animations
- Cek di Blender atau model viewer

---

## 🚀 Quick Debug Commands

Paste di browser console untuk debug:

```javascript
// Lihat current velocity smooth real-time
setInterval(() => {
  const logs = document.querySelectorAll('[data-log]');
  console.clear();
}, 1000);

// Atau cek animation changes
window.addEventListener('animationChange', (e) => {
  console.log('Animation changed:', e.detail);
});
```

---

## 📝 Config Reference

**Current Values:**
```typescript
maxWalkSpeed: 6.5      // Max walk speed m/s
maxRunSpeed: 13        // Max run speed m/s
jumpVel: 8             // Jump velocity
gravity: 32            // Physics gravity
acceleration: 200      // Instant acceleration
floatSpringK: 2000     // Ground snap force (KUAT!)
floatDampingC: 200     // Damping (no bounce)
```

**Animation Thresholds:**
```
Walk threshold:  0.5 m/s
Run threshold:   4.0 m/s
```

---

## ✨ Expected Behavior Summary

| Action | Expected | Status |
|--------|----------|--------|
| WASD move slow | Walk animation | 🔄 Testing |
| WASD + Shift | Run animation | 🔄 Testing |
| Jump spam | Multiple jumps fast | ✅ Should work |
| Standing still | Idle animation | 🔄 Testing |
| Keyboard 1-0 | Trigger animations | ✅ Should work |

---

## 🎯 Next Steps

1. **Run game**: `bun run dev`
2. **Open console**: F12 → Console tab
3. **Test Walk**: WASD slow → Check console & animation
4. **Test Run**: WASD + Shift → Check console & animation
5. **Report**: Screenshot console output + describe what happened

**Jika Walk/Run sudah muncul → SUKSES! 🎉**
**Jika belum → Report dengan screenshot console log!**
