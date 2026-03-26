-- Invités récurrents liés à un membre hôte
CREATE TABLE IF NOT EXISTS member_guests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  studio_id uuid NOT NULL REFERENCES studios(id),
  name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_guests_member ON member_guests(member_id);
