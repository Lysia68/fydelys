-- Guest booking : un invité accompagne un membre, le crédit est déduit sur le membre hôte
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guest_name text DEFAULT NULL;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS host_member_id uuid REFERENCES members(id) DEFAULT NULL;

COMMENT ON COLUMN bookings.guest_name IS 'Nom de l''invité (si booking invité, member_id est NULL)';
COMMENT ON COLUMN bookings.host_member_id IS 'Membre hôte dont le crédit est déduit pour cet invité';
