ALTER TABLE licenses ADD COLUMN duration_days INTEGER;
ALTER TABLE licenses ADD COLUMN activated_at INTEGER;

-- Existing monthly licenses keep their original absolute expiry date.
-- New monthly licenses leave expires_at NULL until the first activation.
CREATE INDEX IF NOT EXISTS idx_licenses_activated_at ON licenses(activated_at);
