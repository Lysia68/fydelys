-- Soft delete : ajouter deleted_at sur members
ALTER TABLE members ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

-- Index pour filtrer rapidement les membres actifs
CREATE INDEX IF NOT EXISTS idx_members_deleted_at ON members (studio_id) WHERE deleted_at IS NULL;
