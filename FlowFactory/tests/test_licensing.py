import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import licensing


class LicensingTest(unittest.TestCase):
    def test_missing_license_is_clean_free_state(self):
        with mock.patch.object(licensing, "_read_cache", return_value={}):
            state = licensing.status(refresh=False)
        self.assertFalse(state["licensed"])
        self.assertEqual(state["plan"], "free")
        self.assertEqual(state["message"], "目前使用免費版")

    def test_free_plan_only_exposes_first_factory(self):
        config = {"workflows": [{"id": "first"}, {"id": "paid"}], "other": True}
        limited = licensing.limit_workflows(config, {"licensed": False})
        self.assertEqual([{"id": "first"}], limited["workflows"])
        self.assertEqual(2, len(config["workflows"]))

    def test_paid_plan_exposes_every_factory(self):
        config = {"workflows": [{"id": "first"}, {"id": "paid"}]}
        self.assertIs(config, licensing.limit_workflows(config, {"licensed": True}))

    def test_lifetime_cache_remains_valid_offline(self):
        with tempfile.TemporaryDirectory() as temp_name:
            device_file = Path(temp_name) / "device_id"
            device_file.write_text("device-test\n", encoding="utf-8")
            payload = {"device_id": "device-test", "plan": "lifetime", "active": True, "expires_at": None, "offline_until": None}
            envelope = {"payload": "ignored", "signature": "ignored"}
            with mock.patch.object(licensing, "DEVICE_FILE", device_file), mock.patch.object(licensing, "_b64url_decode", side_effect=[json.dumps(payload).encode(), b"signature"]), mock.patch.object(licensing, "verify_signature", return_value=True):
                state = licensing._validate_envelope(envelope, now=9999999999)
            self.assertTrue(state["licensed"])
            self.assertEqual("lifetime", state["plan"])

    def test_monthly_cache_stops_after_offline_grace(self):
        with tempfile.TemporaryDirectory() as temp_name:
            device_file = Path(temp_name) / "device_id"
            device_file.write_text("device-test\n", encoding="utf-8")
            payload = {"device_id": "device-test", "plan": "monthly", "active": True, "expires_at": 2000, "offline_until": 1500}
            with mock.patch.object(licensing, "DEVICE_FILE", device_file), mock.patch.object(licensing, "_b64url_decode", side_effect=[json.dumps(payload).encode(), b"signature"]), mock.patch.object(licensing, "verify_signature", return_value=True):
                state = licensing._validate_envelope({"payload": "x", "signature": "y"}, now=1501)
            self.assertFalse(state["licensed"])


if __name__ == "__main__":
    unittest.main()
