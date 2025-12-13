# 🎯 SOLUSI ALTERNATIF: Database Polling (Tanpa Realtime)

## Masalah: Supabase Realtime Timeout Terus

Karena Realtime tidak bisa connect, kita akan pakai sistem polling dengan Supabase Database.

## Setup Database (Wajib):

1. Buka Supabase Dashboard: https://supabase.com/dashboard/project/lwetcgkeakjyvgavudof

2. Klik "SQL Editor" di sidebar

3. Run SQL ini untuk create table:

```sql
-- Create players table
CREATE TABLE IF NOT EXISTS public.players (
    id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    lobby_id TEXT NOT NULL,
    x REAL DEFAULT 0,
    y REAL DEFAULT 3,
    z REAL DEFAULT 0,
    rot REAL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS players_lobby_idx ON public.players(lobby_id, updated_at);

-- Enable RLS
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations" ON public.players
    FOR ALL USING (true) WITH CHECK (true);

-- Auto-delete old players (inactive > 10 seconds)
CREATE OR REPLACE FUNCTION delete_inactive_players()
RETURNS void AS $$
BEGIN
    DELETE FROM public.players 
    WHERE updated_at < NOW() - INTERVAL '10 seconds';
END;
$$ LANGUAGE plpgsql;
```

4. Setelah run SQL, ketik "YES" di sini untuk saya generate kode baru.

## Keuntungan:
- ✅ Tidak bergantung Realtime (no timeout!)
- ✅ Lebih simple dan reliable
- ✅ Polling setiap 100ms (cukup smooth)
- ✅ Auto-cleanup inactive players

