-- RLS pour member_guests
ALTER TABLE member_guests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "member_guests_studio_access" ON member_guests
  FOR ALL USING (studio_id IN (
    SELECT studio_id FROM profiles WHERE id = auth.uid()
  ));

-- RLS pour member_payments (si la table existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'member_payments') THEN
    EXECUTE 'ALTER TABLE member_payments ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY IF NOT EXISTS "member_payments_studio_access" ON member_payments FOR ALL USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()))';
  END IF;
END $$;

-- RLS pour reminder_logs (si la table existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reminder_logs') THEN
    EXECUTE 'ALTER TABLE reminder_logs ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY IF NOT EXISTS "reminder_logs_studio_access" ON reminder_logs FOR ALL USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()))';
  END IF;
END $$;

-- RLS pour rooms (si la table existe)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rooms') THEN
    EXECUTE 'ALTER TABLE rooms ENABLE ROW LEVEL SECURITY';
    EXECUTE 'CREATE POLICY IF NOT EXISTS "rooms_studio_access" ON rooms FOR ALL USING (studio_id IN (SELECT studio_id FROM profiles WHERE id = auth.uid()))';
  END IF;
END $$;
