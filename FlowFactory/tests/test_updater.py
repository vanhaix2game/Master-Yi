import io
import tarfile
import tempfile
import unittest
import json
from pathlib import Path
from unittest import mock

import updater


class UpdaterTest(unittest.TestCase):
    def test_semantic_version_comparison(self):
        self.assertGreater(updater.version_tuple("1.10.0"), updater.version_tuple("1.2.9"))
        self.assertEqual((2, 0, 1), updater.version_tuple("v2.0.1"))
        with self.assertRaises(ValueError):
            updater.version_tuple("latest")

    def test_safe_extract_accepts_regular_files(self):
        with tempfile.TemporaryDirectory() as temp_name:
            root = Path(temp_name)
            archive = root / "ok.tar.gz"
            with tarfile.open(archive, "w:gz") as bundle:
                payload = b"ok"
                info = tarfile.TarInfo("server.py")
                info.size = len(payload)
                bundle.addfile(info, io.BytesIO(payload))
            output = root / "out"
            output.mkdir()
            updater._safe_extract(archive, output)
            self.assertEqual("ok", (output / "server.py").read_text())

    def test_safe_extract_rejects_path_traversal(self):
        with tempfile.TemporaryDirectory() as temp_name:
            root = Path(temp_name)
            archive = root / "bad.tar.gz"
            with tarfile.open(archive, "w:gz") as bundle:
                payload = b"bad"
                info = tarfile.TarInfo("../escape.txt")
                info.size = len(payload)
                bundle.addfile(info, io.BytesIO(payload))
            output = root / "out"
            output.mkdir()
            with self.assertRaises(RuntimeError):
                updater._safe_extract(archive, output)

    def test_release_info_uses_cloudflare_manifest_without_token(self):
        manifest = {"version": "2.0.0", "archive": {"url": "releases/2.0.0/flowfactory-2.0.0.tar.gz", "sha256": "a" * 64}}
        with mock.patch.object(updater, "update_base_url", return_value="https://updates.example.com/"), mock.patch.object(updater, "_read_limited", return_value=json.dumps(manifest).encode()):
            info = updater.release_info("1.4.0")
        self.assertTrue(info["update_available"])
        self.assertEqual("https://updates.example.com/releases/2.0.0/flowfactory-2.0.0.tar.gz", info["archive_url"])

    def test_placeholder_update_url_is_rejected(self):
        with mock.patch.object(updater, "CONFIG_FILE") as config:
            config.is_file.return_value = True
            config.read_text.return_value = '{"update_base_url":"__FLOWFACTORY_UPDATE_BASE_URL__"}'
            with mock.patch.dict(updater.os.environ, {}, clear=True), self.assertRaises(RuntimeError):
                updater.update_base_url()

    def test_download_uses_system_curl_without_disabling_tls(self):
        completed = mock.Mock(returncode=0, stdout=b"payload", stderr=b"")
        with mock.patch.object(updater.shutil, "which", return_value="/usr/bin/curl"), mock.patch.object(updater.subprocess, "run", return_value=completed) as run:
            self.assertEqual(b"payload", updater._read_limited("https://updates.example.com/latest.json", "application/json"))
        command = run.call_args.args[0]
        self.assertEqual("/usr/bin/curl", command[0])
        self.assertIn("--max-filesize", command)
        self.assertNotIn("-k", command)
        self.assertNotIn("--insecure", command)

    def test_update_telemetry_can_be_disabled(self):
        with mock.patch.dict(updater.os.environ, {"FLOWFACTORY_DISABLE_TELEMETRY": "1"}), \
             mock.patch.object(updater.subprocess, "run") as run:
            updater._report_update_success("1.2.3")
        run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
