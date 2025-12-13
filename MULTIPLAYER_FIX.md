# Fix Multiplayer - Perbedaan Kode yang Berfungsi vs Kode Anda

## ❌ MASALAH DI KODE ANDA SAAT INI:

1. **Menggunakan Presence API untuk position sync** - Ini SALAH!
   - Presence API untuk track online/offline status saja
   - Presence update terlalu lambat dan bisa di-throttle oleh Supabase

2. **Broadcast terlalu cepat di useFrame** (10x/sec dengan Presence)
   - Menyebabkan rate limiting

3. **Channel setup yang kompleks**

## ✅ SOLUSI (DARI KODE YANG BERFUNGSI):

### 1. Gunakan **BROADCAST API** untuk position sync
```typescript
// DI useFrame - Broadcast position
const now = state.clock.elapsedTime;
if (now - lastBroadcastRef.current > 0.05) { // 20x per second
  const payload = { 
    id: myId, 
    position: { x: pos.x, y: pos.y, z: pos.z },
    rotation: { y: rot.y },
    username
  };
  
  channel.send({
    type: 'broadcast',
    event: 'player-move',  // ← PENTING: Event name
    payload
  });
  
  lastBroadcastRef.current = now;
}
```

### 2. Listen ke `broadcast` event (bukan presence!)
```typescript
channel
  .on('broadcast', { event: 'player-move' }, ({ payload }: any) => {
    if (payload.id === myId) return;
    
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
```

### 3. Presence API HANYA untuk join/leave
```typescript
.on('presence', { event: 'sync' }, () => {
  const state = channel.presenceState();
  const count = Object.keys(state).length;
  setPlayerCount(count);
  channelReadyRef.current = true; // Mark ready
})
.on('presence', { event: 'leave' }, ({ leftPresences }: any) => {
  leftPresences.forEach((p: any) => {
    setPlayers((prev) => {
      const newPlayers = { ...prev };
      delete newPlayers[p.id];
      return newPlayers;
    });
  });
})
```

### 4. Channel config sederhana
```typescript
const channel = supabase.channel(`lobby:${lobbyId}`, {
  config: { 
    broadcast: { self: false },  // ← Jangan broadcast ke diri sendiri
    presence: { key: myId }
  },
});
```

## 🔧 LANGKAH PERBAIKAN:

1. **Ubah useFrame** - Ganti dari `channel.track()` ke `channel.send()`
2. **Ubah listener** - Tambahkan listener `broadcast: player-move` di AWAL
3. **Pisahkan concern** - Presence untuk online status, Broadcast untuk position

## 📊 PERBANDINGAN:

| Fitur | Kode Lama (✅ Berfungsi) | Kode Anda (❌ Tidak Berfungsi) |
|-------|-------------------------|-------------------------------|
| Position Sync | `broadcast: player-move` | `presence.track()` |
| Update Rate | 20x/sec dengan broadcast | 10x/sec dengan presence |
| Join/Leave | `presence: sync/join/leave` | `presence: sync/join/leave` |
| Channel Ready | Setelah `SUBSCRIBED` | Setelah presence sync |

## 🎯 KESIMPULAN:

**Supabase Presence** = Track siapa yang online ❌ BUKAN untuk position
**Supabase Broadcast** = Kirim data real-time (position, chat, etc) ✅ INI YANG BENAR

---

Sekarang saya akan generate file fix yang bisa langsung di-copy paste!
