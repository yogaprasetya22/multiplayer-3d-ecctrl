# 🚨 PENTING: Setup Supabase Realtime

## Masalah: Multiplayer tidak bekerja (Other Players: 0)

### ✅ Solusi: Aktifkan Realtime Broadcast di Supabase

1. **Buka Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Login dan pilih project: `lwetcgkeakjyvgavudof`

2. **Enable Realtime Broadcast**
   - Klik **Database** di sidebar kiri
   - Klik **Replication** tab
   - **PENTING:** Scroll ke bawah ke bagian **"Realtime"**
   - Pastikan **Broadcast** is enabled ✅
   
   ATAU

   - Klik **Project Settings** (gear icon)
   - Klik **API** tab
   - Scroll ke **"Realtime"** section
   - Enable **Broadcast messages**

3. **Verify Realtime is Enabled**
   - Go to: https://supabase.com/dashboard/project/lwetcgkeakjyvgavudof/settings/api
   - Under "Realtime API" section
   - Make sure it says: "Realtime is enabled" ✅

4. **Restart Dev Server**
   ```bash
   # Stop current server (Ctrl+C)
   bun run dev
   ```

5. **Test dengan 2 Tabs:**
   - Tab 1: Username: "Player1", Lobby: "test"
   - Tab 2: Username: "Player2", Lobby: "test"
   - Klik tombol 🧪 Test Broadcast di kedua tab
   - Check console untuk "📥 Received move broadcast"

---

## 🐛 Debug Steps:

### Test 1: Klik Tombol "🧪 Test Broadcast"
- Buka 2 tabs dengan lobby yang sama
- Klik tombol hijau "Test Broadcast" di Tab 1
- Lihat Console di Tab 2: Harus ada "📥 Received move broadcast"

### Test 2: Check Console Logs
**Tab 1 (Pengirim):**
```
✅ Supabase channel subscribed!
🎧 Setting up Supabase listeners...
👥 Presence sync: 1 players
📡 Broadcast #100: {id: "...", x: 0, y: 3, z: 0, ...}
```

**Tab 2 (Penerima):**
```
✅ Supabase channel subscribed!
🎧 Setting up Supabase listeners...
👥 Presence sync: 2 players  <-- Harus 2!
📥 Received move broadcast: {id: "...", x: 0, y: 3, z: 0, ...}
🎮 Updated players, now tracking 1 other players
```

### Test 3: Check Network Tab
1. Buka DevTools (F12) > Network tab
2. Filter: "realtime"
3. Should see WebSocket connection to Supabase
4. Status: 101 Switching Protocols (success)

---

## ❌ Jika Masih Tidak Bekerja:

### Option A: Gunakan Supabase Presence (Fallback)
Jika broadcast tidak bisa diaktifkan, kita bisa pakai Presence API untuk sync position.

### Option B: Buat Project Supabase Baru
1. https://supabase.com/dashboard
2. New Project
3. Pastikan pilih region terdekat
4. Copy URL & anon key baru ke `.env.local`
5. Enable Realtime dari awal

---

## 📋 Checklist:
- [ ] Supabase Dashboard > Realtime > Broadcast ENABLED
- [ ] Restart dev server
- [ ] 2 tabs dengan lobby ID yang SAMA
- [ ] Presence sync menunjukkan 2 players
- [ ] Test Broadcast button mengirim & menerima
- [ ] Console log menunjukkan "📥 Received move broadcast"
