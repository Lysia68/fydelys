-- ============================================================
-- AUDIT RLS — Vérification du cloisonnement multi-tenant
-- Exécuter dans Supabase SQL Editor
-- ============================================================

-- 1. Lister TOUTES les tables et leur statut RLS
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Lister TOUTES les policies RLS par table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Tables avec studio_id SANS RLS (CRITIQUE)
SELECT t.tablename, 'MISSING RLS' as issue
FROM pg_tables t
JOIN information_schema.columns c
  ON c.table_name = t.tablename AND c.column_name = 'studio_id'
WHERE t.schemaname = 'public'
  AND t.rowsecurity = false;

-- 4. Test cross-tenant : compter les données par studio
SELECT 'studios' as tbl, id::text as studio_id, name, count(*) over() as total FROM studios
UNION ALL
SELECT 'members', studio_id::text, count(*)::text, count(*) FROM members GROUP BY studio_id
UNION ALL
SELECT 'sessions', studio_id::text, count(*)::text, count(*) FROM sessions GROUP BY studio_id
UNION ALL
SELECT 'bookings', s.studio_id::text, count(b.id)::text, count(b.id)
  FROM bookings b JOIN sessions s ON s.id = b.session_id GROUP BY s.studio_id
UNION ALL
SELECT 'disciplines', studio_id::text, count(*)::text, count(*) FROM disciplines GROUP BY studio_id
UNION ALL
SELECT 'subscriptions', studio_id::text, count(*)::text, count(*) FROM subscriptions GROUP BY studio_id
UNION ALL
SELECT 'member_payments', studio_id::text, count(*)::text, count(*) FROM member_payments GROUP BY studio_id
UNION ALL
SELECT 'rooms', studio_id::text, count(*)::text, count(*) FROM rooms GROUP BY studio_id
UNION ALL
SELECT 'member_guests', studio_id::text, count(*)::text, count(*) FROM member_guests GROUP BY studio_id;
