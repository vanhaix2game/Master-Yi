ALTER TABLE licenses ADD COLUMN code_suffix TEXT;
CREATE INDEX IF NOT EXISTS idx_licenses_created_at ON licenses(created_at DESC);
