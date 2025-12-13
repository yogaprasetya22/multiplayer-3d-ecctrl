-- DISABLE RLS untuk testing
-- Jalankan ini di Supabase SQL Editor jika ada error "new row violates row-level security policy"

ALTER TABLE players DISABLE ROW LEVEL SECURITY;

-- Atau jika mau tetap pakai RLS tapi allow all:
DROP POLICY IF EXISTS "Enable all access for players" ON players;

CREATE POLICY "Enable all access for players" 
ON players 
FOR ALL 
USING (true) 
WITH CHECK (true);
