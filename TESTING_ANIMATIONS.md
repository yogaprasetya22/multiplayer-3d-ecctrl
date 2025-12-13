# 🎬 Testing Animasi Walk/Run

## ✅ Checklist Debug

### 1. **Console Log Monitoring**
Buka Browser Console (F12) dan perhatikan:

```
[MyPlayer] Animation: Idle → Walk (rawVel: 2.45, smoothVel: 1.82, jumping: false, onGround: true)
[MyPlayer] Animation: Walk → Run (rawVel: 8.12, smoothVel: 7.45, jumping: false, onGround: true)
```

**Artinya:**
- `rawVel` = velocity raw per frame (sangat berfluktuasi)
- `smoothVel` = velocity yang di-smooth (lebih stabil)
- `jumping` = apakah dalam kondisi melompat
- `onGround` = apakah kaki menyentuh tanah

---

## 🎯 Threshold Animation

Saat ini:
```
smoothVel > 7   → Run
smoothVel > 0.3 → Walk
smoothVel < 0.3 → Idle
```

Config:
```
maxWalkSpeed = 5    (m/s)
maxRunSpeed = 10    (m/s)
```

---

## 🧪 Testing Steps

### Test 1: Walk Animation
```
1. Tekan WASD pelan-pelan (jangan tekan Shift)
2. Lihat console: harus ada log "Walk"
3. Console harus show smoothVel antara 0.3-7
4. Model karakter harus bergerak dengan animasi Walk
```

### Test 2: Run Animation  
```
1. Tekan WASD + Shift (sprint)
2. Lihat console: harus ada log "Run"
3. Console harus show smoothVel > 7
4. Model karakter harus bergerak dengan animasi Run
5. Gerakan harus lebih cepat dari Walk
```

### Test 3: Idle Animation
```
1. Berhenti gerak (jangan tekan WASD)
2. Lihat console: harus ada log "Idle"
3. Console harus show smoothVel < 0.3
4. Model karakter harus diam dan idle
```

### Test 4: Jump Animation
```
1. Tekan Space untuk loncat
2. Lihat console: harus ada log "Jump_Start" (naik) → "Jump_Idle" (turun)
3. Setelah mendarat: kembali ke Idle/Walk/Run
```

### Test 5: Multiplayer Animation Sync
```
1. Buka 2 browser tab (atau beda device)
2. Login dengan user berbeda
3. Player 1 bergerak (Walk/Run)
4. Player 2 lihat: Player 1 harus animate Walk/Run
5. Console di Player 2: harus ada log "[OtherPlayer] Animation change: Idle → Walk"
```

### Test 6: Keyboard 1-0 Animations
```
1. Tekan 1-0 untuk trigger manual animasi
2. Lihat console: "[Keyboard] Triggered manual animation: Attack(1h)"
3. Model harus melakukan gerakan yang sesuai
4. Setelah 2 detik: otomatis kembali ke gerakan normal
```

---

## 🔧 Jika Animation Masih Tidak Muncul

### Opsi 1: Uncomment Debug Log
Di `src/app/page.tsx` line ~168, uncomment:
```typescript
// 🔍 DEBUG: Log velocity setiap beberapa frame untuk monitoring (uncomment jika perlu)
if (Math.random() < 0.02) { // ~2% frames
  console.log(`[DEBUG] rawVel: ${horizontalVel.toFixed(2)}, smoothVel: ${velocityRef.current.toFixed(2)}, anim: ${newAnim}`);
}
```

Ini akan log setiap frame sehingga bisa lihat velocity pattern-nya.

### Opsi 2: Turunkan Threshold
Jika velocity terlihat terlalu kecil, turunkan threshold:
```typescript
// Di src/app/page.tsx
newAnim = velocityRef.current > 5 ? 'Run'      // Turun dari 7
  : velocityRef.current > 0.1 ? 'Walk'         // Turun dari 0.3
  : 'Idle';
```

### Opsi 3: Check Model Animations
Pastikan model GLB memiliki animasi Walk dan Run:
```
Model: /Floating Character.glb
Cek: apakah Walk dan Run ada di animasi list
```

---

## 📊 Expected Values

Jika semua normal:
- Walk speed: smoothVel ~1-5 (depending acceleration)
- Run speed: smoothVel ~7-12 (depending sprint)
- Idle: smoothVel < 0.3

Kalau threshold tidak trigger:
- Mungkin acceleration config terlalu rendah
- Atau smoothing factor terlalu besar (0.3)
- Atau delta time sangat kecil (causing velocity spike calculation)

---

## 🎭 Model Files

Current model: `/public/Floating Character.glb`

Animasi yang tersedia:
```
'Idle', 'Walk', 'Run', 'Jump', 'Jump_Start', 'Jump_Idle', 'Jump_Land',
'Attack(1h)', 'AttackCombo', 'AttackSpinning', 'HeavyAttack',
'Block', 'Roll', 'DashFront', 'DashBack', 'DashLeft', 'DashRight',
'Dance', 'Cheer', 'Wave', 'Defeat', 'Hop',
'Shoot(1h)', 'Shoot(2h)', 'Shoot(2h)Bow', 'Shooting(1h)', 'Shooting(2h)',
'Climbing', 'Interact', 'PickUp', 'Throw', 'LayingDownIdle', 'BasePose'
```

---

## 🚀 Kalau Masih Stuck

Lapor issue dengan:
1. Screenshot console log
2. Browser/OS yang digunakan
3. Describe step apa yang dilakukan
4. Apakah Walk/Run muncul sesekali atau tidak sama sekali?
5. Apakah model bisa animation lain (Idle, Jump, Attack)?
