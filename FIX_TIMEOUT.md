# 🔧 FIX TIMEOUT SUPABASE REALTIME

## ❌ PENYEBAB TIMEOUT:

1. **Firewall/Network** blokir WebSocket
2. **Supabase Project Settings** - Realtime belum enable
3. **Config salah** - `ack: true` bisa menyebabkan timeout
4. **Supabase Region** terlalu jauh dari lokasi kamu

---

## ✅ SOLUSI 1: Ganti Config Channel (PALING PENTING!)

**Buka file `page.tsx`, cari baris ini:**

```typescript
const channel = supabase.channel(`lobby:${lobbyId}`, {
  config: {
    broadcast: { self: true, ack: true }, // ← INI MASALAHNYA!
    presence: { key: myId },
  },
});
```

**GANTI JADI:**

```typescript
const channel = supabase.channel(`lobby:${lobbyId}`, {
  config: {
    broadcast: { 
      self: false,    // Jangan kirim ke diri sendiri
      ack: false      // ← DISABLE ACK! Ini penyebab timeout!
    },
    presence: { key: myId },
  },
});
```

**KENAPA?**
- `ack: true` = Tunggu konfirmasi dari server (bisa timeout kalau server lambat)
- `ack: false` = Fire and forget (lebih cepat, tidak timeout)

---

## ✅ SOLUSI 2: Enable Realtime di Supabase Dashboard

1. **Buka** https://supabase.com/dashboard
2. **Pilih project** kamu (lwetcgkeakjyvgavudof)
3. **Klik "Database"** di sidebar
4. **Klik "Replication"**
5. **Enable "Realtime"** untuk semua tables (atau minimal enable Realtime feature)
6. **Klik "Settings" → "API"**
7. **Cek "Realtime" section**, pastikan ada URL WebSocket
8. **Test connection** dengan:
   ```javascript
   console.log('Realtime endpoint:', supabase.realtime.endpoint)
   ```

---

## ✅ SOLUSI 3: Test Koneksi WebSocket

Tambahkan kode test ini di **browser console** (F12):

```javascript
// Test WebSocket connection
const ws = new WebSocket('wss://lwetcgkeakjyvgavudof.supabase.co/realtime/v1/websocket?apikey=YOUR_ANON_KEY&vsn=1.0.0');

ws.onopen = () => console.log('✅ WebSocket Connected!');
ws.onerror = (err) => console.error('❌ WebSocket Error:', err);
ws.onclose = () => console.log('🔒 WebSocket Closed');

// Test 30 detik
setTimeout(() => {
  if (ws.readyState === 1) {
    console.log('✅ Connection stable!');
  } else {
    console.error('❌ Connection unstable:', ws.readyState);
  }
  ws.close();
}, 30000);
```

Kalau error "ERR_CONNECTION_REFUSED" → **Firewall/Network blokir WebSocket**

---

## ✅ SOLUSI 4: Tambah Retry Logic (Auto Reconnect)

Kalau masih timeout, gunakan kode ini di `page.tsx`:

```typescript
useEffect(() => {
  if (!started) return;

  let retryCount = 0;
  const maxRetries = 5;
  let subscribed = false;

  const connectChannel = () => {
    console.log(`🔄 Connecting... (Attempt ${retryCount + 1}/${maxRetries})`);
    
    const channel = supabase.channel(`lobby:${lobbyId}`, {
      config: {
        broadcast: { self: false, ack: false },
        presence: { key: myId },
      },
    });

    channelRef.current = channel;

    channel.subscribe(async (status, err) => {
      console.log('📡 Status:', status);

      if (status === 'SUBSCRIBED') {
        subscribed = true;
        retryCount = 0;
        setConnectionStatus('✅ Connected');
        await channel.track({ id: myId, username });
        console.log('✅ Connected successfully!');
      }

      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || err) {
        console.error('❌ Error:', status, err);
        setConnectionStatus(`❌ ${status}`);

        // Auto retry
        if (!subscribed && retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(2000 * retryCount, 10000); // Exponential backoff
          console.log(`🔄 Retry in ${delay/1000}s...`);
          
          setTimeout(() => {
            channel.unsubscribe();
            connectChannel();
          }, delay);
        } else if (retryCount >= maxRetries) {
          setConnectionStatus('❌ Failed - Refresh page');
          console.error('❌ Max retries reached!');
        }
      }
    });
  };

  connectChannel();

  return () => {
    subscribed = false;
    channelRef.current?.unsubscribe();
  };
}, [started, lobbyId, myId, username]);
```

---

## ✅ SOLUSI 5: Fallback ke Polling (Kalau WebSocket Gagal Total)

Kalau Realtime benar-benar tidak bisa (firewall strict), gunakan **Database Polling**:

1. Buat table `player_positions` di Supabase
2. Gunakan `setInterval` untuk update position setiap 100ms
3. Query database untuk ambil position player lain

**Lihat file:** `MULTIPLAYER_ALTERNATIVE.md` untuk kode lengkap!

---

## 🧪 DEBUG CHECKLIST:

- [ ] Ganti `ack: true` → `ack: false` di channel config
- [ ] Ganti `self: true` → `self: false`
- [ ] Enable Realtime di Supabase Dashboard
- [ ] Test WebSocket di console (lihat solusi 3)
- [ ] Cek firewall/VPN (matikan VPN kalau ada)
- [ ] Coba ganti WiFi/network (coba hotspot HP)
- [ ] Cek Supabase project region (kalau jauh, latency tinggi)
- [ ] Lihat browser console untuk error detail
- [ ] Coba buka di browser lain (Chrome vs Firefox)

---

## 🎯 KODE LENGKAP YANG SUDAH FIX:

```typescript
// Channel config yang BENAR (tanpa timeout)
const channel = supabase.channel(`lobby:${lobbyId}`, {
  config: {
    broadcast: { 
      self: false,   // ✅ Jangan kirim ke diri sendiri
      ack: false     // ✅ DISABLE ACK untuk hindari timeout!
    },
    presence: { key: myId },
  },
});

// Subscribe dengan timeout handler
channel.subscribe(async (status, err) => {
  console.log('📡 Status:', status);

  if (status === 'SUBSCRIBED') {
    console.log('✅ Connected!');
    await channel.track({ id: myId, username });
  }

  if (status === 'TIMED_OUT') {
    console.error('⏱️ Timeout! Retrying...');
    // Unsubscribe and retry
    setTimeout(() => {
      channel.unsubscribe();
      channel.subscribe(); // Retry
    }, 2000);
  }

  if (status === 'CHANNEL_ERROR' || err) {
    console.error('❌ Error:', err);
    // Handle error
  }
});
```

---

## 💡 TIPS TERAKHIR:

1. **Paling penting:** `ack: false` di config!
2. **Cek Supabase dashboard** - pastikan Realtime enabled
3. **Coba network lain** - kadang ISP blokir WebSocket
4. **Matikan VPN/Proxy** kalau ada
5. **Coba region Supabase** yang lebih dekat (kalau bisa ganti project)

---

**INTINYA:** Ganti `ack: true` jadi `ack: false` di channel config!

Itu penyebab #1 timeout! 🎯
