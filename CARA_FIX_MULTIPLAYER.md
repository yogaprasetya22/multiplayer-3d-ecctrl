# 🎮 CARA FIX MULTIPLAYER - Penjelasan Lengkap

## ❌ MASALAH UTAMA DI KODE KAMU

Kode kamu **mencampur** Presence API dan Broadcast API dengan cara yang salah!

### Yang Salah:
1. ✅ **useFrame sudah pakai `channel.send()` dengan event `player-move`** (INI SUDAH BENAR!)
2. ❌ **Tapi listener masih pakai `presence: sync` untuk terima position** (INI SALAH!)

Jadi kamu **KIRIM** pakai broadcast, tapi **TERIMA** pakai presence → TIDAK NYAMBUNG!

## ✅ SOLUSI LENGKAP

### Perubahan yang Harus Dilakukan:

**1. GANTI bagian listener di `useEffect`:**

**YANG LAMA (SALAH):**
```typescript
.on('presence', { event: 'sync' }, () => {
  // Kode ini coba ambil position dari presence
  const otherPlayers: Record<string, any> = {};
  allPresences.forEach((presence: any) => {
    if (presence.id && presence.id !== myId) {
      otherPlayers[presence.id] = presence; // ← Position TIDAK ADA DI SINI!
    }
  });
  setPlayers(otherPlayers);
})
```

**YANG BARU (BENAR):**
```typescript
// TAMBAH INI DI PALING ATAS (SEBELUM .on('presence'))
.on('broadcast', { event: 'player-move' }, ({ payload }: any) => {
  if (payload.id === myId) return; // Jangan update diri sendiri
  
  console.log('👤 Terima posisi player:', payload.username, payload.position);
  
  setPlayers((prev) => ({
    ...prev,
    [payload.id]: {
      x: payload.position.x,
      y: payload.position.y,
      z: payload.position.z,
      rot: payload.rotation.y,
      username: payload.username
    }
  }));
})
.on('presence', { event: 'sync' }, () => {
  // Presence HANYA untuk count player
  const state = channel.presenceState();
  const count = Object.keys(state).length;
  
  const el = document.getElementById('player-count');
  if (el) el.textContent = count.toString();
  
  channelReadyRef.current = true; // Mark ready
  
  // Hitung other players (exclude diri sendiri)
  setOtherPlayerCount(Math.max(0, count - 1));
})
```

**2. GANTI bagian `channel.track()` di akhir:**

**YANG LAMA:**
```typescript
channel.track({ id: myId, username, x: 0, y: 3, z: 0, rot: 0 });
```

**YANG BARU:**
```typescript
// Track presence TANPA position (hanya untuk online status)
channel.track({ 
  id: myId, 
  username, 
  online_at: new Date().toISOString() 
});
```

## 🔍 PENJELASAN LENGKAP

### Kenapa Kode Lama Bisa Berfungsi?

Karena kode lama konsisten:
- **KIRIM** position pakai `broadcast: player-move` ✅
- **TERIMA** position pakai listener `broadcast: player-move` ✅
- **Presence** hanya untuk track online/offline ✅

### Kenapa Kode Kamu Tidak Berfungsi?

Karena **tidak konsisten**:
- **KIRIM** position pakai `broadcast: player-move` ✅
- **TERIMA** position pakai `presence: sync` ❌ ← SALAH!
- Presence **TIDAK MENGANDUNG** data position yang kamu kirim!

### Analogi Sederhana:

Kamu kirim WhatsApp, tapi tunggu email → **TIDAK NYAMBUNG!**

- **Broadcast** = WhatsApp (cepat, real-time, untuk data)
- **Presence** = Status Online (hijau/abu-abu, untuk tahu siapa online)

## 📝 KODE LENGKAP YANG SUDAH FIX

Ganti bagian lines 151-220 di page.tsx dengan ini:

```typescript
  // Supabase listeners - BROADCAST untuk position, PRESENCE untuk online status
  useEffect(() => {
    if (!channel) return;

    console.log('🎧 Setting up Supabase listeners...');

    channel
      // 1. LISTENER PLAYER-MOVE (INI YANG PENTING!)
      .on('broadcast', { event: 'player-move' }, ({ payload }: any) => {
        if (payload.id === myId) return;
        
        console.log(`👤 Player ${payload.username} move:`, payload.position);
        
        setPlayers((prev) => ({
          ...prev,
          [payload.id]: {
            x: payload.position.x,
            y: payload.position.y,
            z: payload.position.z,
            rot: payload.rotation.y,
            username: payload.username
          }
        }));
      })
      
      // 2. PRESENCE SYNC (untuk player count)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const allPresences = Object.values(state).flat() as any[];
        const count = allPresences.length;
        
        console.log(`👥 Presence sync: ${count} players online`);
        
        const el = document.getElementById('player-count');
        if (el) el.textContent = count.toString();
        
        if (!channelReadyRef.current) {
          channelReadyRef.current = true;
          console.log('✅ Channel ready!');
        }
        
        setOtherPlayerCount(Math.max(0, count - 1));
      })
      
      // 3. PRESENCE JOIN
      .on('presence', { event: 'join' }, ({ key, newPresences }: any) => {
        console.log('🎮 Player joined:', key, newPresences);
      })
      
      // 4. PRESENCE LEAVE (hapus dari players state)
      .on('presence', { event: 'leave' }, ({ key, leftPresences }: any) => {
        console.log('👋 Player left:', key, leftPresences);
        setPlayers((p) => {
          const newPlayers = { ...p };
          leftPresences.forEach((presence: any) => {
            delete newPlayers[presence.id];
          });
          setOtherPlayerCount(Object.keys(newPlayers).length);
          return newPlayers;
        });
      })
      
      // 5. CHAT
      .on('broadcast', { event: 'chat' }, ({ payload }: any) => {
        console.log('💬 Chat:', payload);
        setChatMessages((prev) => [
          ...prev,
          { 
            type: 'message', 
            username: payload.username, 
            message: payload.message, 
            timestamp: payload.ts, 
            isOwn: payload.id === myId 
          },
        ]);
      })
      
      // 6. GEM COLLECT
      .on('broadcast', { event: 'collect' }, ({ payload }: any) => {
        if (collectedGems.has(payload.gemId)) return;
        collectedGems.add(payload.gemId);
        if (sceneRef.current) {
          const gem = sceneRef.current.getObjectByName(payload.gemId);
          if (gem) gem.userData.collected = true;
        }
        setScore((s) => s + 1);
        setChatMessages((prev) => [
          ...prev,
          { 
            type: 'system', 
            message: `${payload.username} mengambil gem!`, 
            timestamp: Date.now() 
          },
        ]);
      });

    // Track presence (TANPA position!)
    channel.track({ 
      id: myId, 
      username, 
      online_at: new Date().toISOString() 
    });

    return () => {
      channelReadyRef.current = false;
      channel.untrack();
    };
  }, [channel, myId, username, collectedGems, setChatMessages, setScore, setOtherPlayerCount]);
```

## 🧪 CARA TEST

1. **Buka 2 tab browser**
2. **Buka Console** (F12) di kedua tab
3. **Perhatikan log:**
   - Tab 1: Harus muncul `👤 Player {nama} move: {x, y, z}`
   - Tab 2: Sama, harus muncul log dari Tab 1

4. **Jika berhasil:**
   - Other Players count naik ke 1
   - Karakter merah muncul
   - Karakter bergerak smooth

5. **Jika masih gagal:**
   - Cek console, ada error?
   - Pastikan Supabase URL & Key benar
   - Coba logout/login ulang Supabase dashboard

## 🎯 CHECKLIST

- [ ] Sudah tambah listener `broadcast: player-move` di PALING ATAS
- [ ] Sudah ganti `channel.track()` jadi tanpa position
- [ ] Sudah test dengan 2 tab browser
- [ ] Console log muncul `👤 Player {nama} move`
- [ ] Other Players count bertambah
- [ ] Karakter merah muncul dan bergerak

## 💡 TIPS

Kalau masih belum berfungsi, coba:

```typescript
// Tambah ini di useFrame untuk debug
if (broadcastCountRef.current === 1) {
  console.log('📤 FIRST BROADCAST SENT:', payload);
  console.log('📡 Channel status:', channel);
}
```

Dan di listener:

```typescript
.on('broadcast', { event: 'player-move' }, ({ payload }: any) => {
  console.log('📥 RECEIVED BROADCAST!', payload); // ← Harus muncul di tab lain!
  // ... rest of code
})
```

Kalau `📤 FIRST BROADCAST SENT` muncul tapi `📥 RECEIVED BROADCAST` TIDAK muncul di tab lain, berarti ada masalah di channel subscription atau firewall.

---

**Intinya:** Broadcast untuk DATA (position, chat), Presence untuk STATUS (online/offline)!
