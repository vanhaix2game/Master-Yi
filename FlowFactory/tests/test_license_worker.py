import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class LicenseWorkerActivationExpiryTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.worker = (ROOT / "cloudflare/license-worker/src/index.js").read_text(encoding="utf-8")
        cls.migration = (ROOT / "cloudflare/license-worker/migrations/0003_activation_based_expiry.sql").read_text(encoding="utf-8")
        cls.telemetry_migration = (ROOT / "cloudflare/license-worker/migrations/0004_install_telemetry.sql").read_text(encoding="utf-8")
        cls.cli = (ROOT / "scripts/create_license.py").read_text(encoding="utf-8")

    def test_new_monthly_license_has_duration_but_no_expiry(self):
        self.assertIn("durationMonths * 31", self.worker)
        self.assertIn("const legacyMonths = body.expires_at", self.worker)
        self.assertIn("VALUES (?, ?, ?, NULL, ?, NULL, 1, ?, ?)", self.worker)
        self.assertIn("expires_at: null, activated_at: null", self.worker)
        self.assertIn('payload["duration_months"]', self.cli)
        self.assertNotIn('payload["expires_at"]', self.cli)

    def test_admin_can_create_batch_in_one_d1_request(self):
        self.assertIn("Math.min(100, Number(body.count || 1))", self.worker)
        self.assertIn("await env.DB.batch(statements)", self.worker)
        self.assertIn("body.count === undefined ? licenses[0] : {licenses}", self.worker)

    def test_first_activation_sets_expiry_once(self):
        self.assertIn("if (license.plan === 'monthly' && !license.expires_at)", self.worker)
        self.assertIn("WHERE id = ? AND expires_at IS NULL", self.worker)
        self.assertIn("current + durationDays * 86400", self.worker)
        self.assertIn("activated_at = ?", self.worker)

    def test_schema_preserves_legacy_expiry_and_adds_activation_fields(self):
        self.assertIn("ADD COLUMN duration_days", self.migration)
        self.assertIn("ADD COLUMN activated_at", self.migration)
        self.assertIn("Existing monthly licenses keep their original", self.migration)

    def test_anonymous_install_telemetry_is_deduplicated_and_admin_only_to_read(self):
        self.assertIn("CREATE TABLE IF NOT EXISTS installations", self.telemetry_migration)
        self.assertIn("event_id_hash TEXT NOT NULL UNIQUE", self.telemetry_migration)
        self.assertIn("POST' && url.pathname === '/v1/telemetry/install'", self.worker)
        self.assertIn("GET' && url.pathname === '/v1/admin/install-stats'", self.worker)
        self.assertIn("await sha256(installationId)", self.worker)
        self.assertIn("INSERT OR IGNORE INTO installation_events", self.worker)
        self.assertIn("if (!isAdmin(request, env))", self.worker)

    def test_admin_lists_are_paginated_in_d1(self):
        self.assertIn("page_size", self.worker)
        self.assertIn("LIMIT ? OFFSET ?", self.worker)
        self.assertIn("pagination: {page, page_size: pageSize", self.worker)
        self.assertIn("sortColumns", self.worker)
        self.assertIn("GET' && url.pathname === '/v1/admin/install-events'", self.worker)
        self.assertNotIn("ORDER BY l.id DESC LIMIT 500", self.worker)
        self.assertNotIn("ORDER BY occurred_at DESC, id DESC LIMIT 30", self.worker)

    def test_store_publish_and_download_sanitize_local_output_paths(self):
        self.assertIn("function portableOutputPath", self.worker)
        self.assertIn("function sanitizeStoreFactory", self.worker)
        self.assertIn("factory = sanitizeStoreFactory(body.factory)", self.worker)
        self.assertIn("sanitizeStoreFactory(JSON.parse(row.factory_json))", self.worker)
        self.assertIn("return `${portableSegment(factoryName)}/${portableSegment(stepTitle)}`", self.worker)


if __name__ == "__main__":
    unittest.main()
