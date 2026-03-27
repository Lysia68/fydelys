-- Quota SMS mensuel par plan
ALTER TABLE plans ADD COLUMN IF NOT EXISTS sms_monthly_quota int DEFAULT 0;

-- Définir les quotas
UPDATE plans SET sms_monthly_quota = 50 WHERE slug = 'essentiel';
UPDATE plans SET sms_monthly_quota = 200 WHERE slug = 'standard';
UPDATE plans SET sms_monthly_quota = 500 WHERE slug = 'pro';
