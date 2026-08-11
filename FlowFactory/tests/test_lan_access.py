import hashlib
import unittest
from pathlib import Path
from unittest import mock

import server


ROOT = Path(__file__).resolve().parents[1]


class LanAccessTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.server_source = (ROOT / "server.py").read_text(encoding="utf-8")

    def test_password_digest_is_salted_and_slow(self):
        salt = "11" * 16
        digest = server.password_digest("correct-horse", salt)
        expected = hashlib.pbkdf2_hmac(
            "sha256", b"correct-horse", bytes.fromhex(salt), 240000
        ).hex()
        self.assertEqual(expected, digest)
        self.assertNotEqual(digest, server.password_digest("wrong-password", salt))

    def test_remote_clients_receive_a_password_login_page(self):
        self.assertIn("LAN_LOGIN_HTML", self.server_source)
        self.assertIn("def _require_lan_auth(self, path):", self.server_source)
        self.assertIn("flowfactory_lan=", self.server_source)
        self.assertIn("HttpOnly; SameSite=Strict", self.server_source)
        self.assertIn("嘗試次數過多", self.server_source)
        self.assertIn("hmac.compare_digest", self.server_source)

    def test_lan_mode_binds_all_interfaces_only_when_protected(self):
        self.assertIn("bind_host = '0.0.0.0'", self.server_source)
        self.assertIn("app_settings['lan_enabled'] and app_settings['lan_password_hash']", self.server_source)
        self.assertIn("ThreadingHTTPServer((bind_host, PORT), Handler)", self.server_source)

    def test_settings_page_exposes_lan_controls_and_url(self):
        self.assertIn('id="lanAccessToggle"', self.html)
        self.assertIn('id="lanAccessPassword"', self.html)
        self.assertIn('id="lanAccessUrl"', self.html)
        self.assertIn('id="saveLanAccess"', self.html)
        self.assertIn("/api/network", self.html)
        self.assertIn("function waitForNetworkRestart(data)", self.html)

    def test_macos_prefers_physical_lan_address_over_virtual_route(self):
        replies = [
            mock.Mock(stdout="10.168.1.121\n"),
        ]
        with mock.patch.object(server.sys, "platform", "darwin"), mock.patch.object(
            server.subprocess, "run", side_effect=replies
        ):
            self.assertEqual("10.168.1.121", server.lan_ip_address())

    def test_virtual_benchmark_address_is_not_presented_as_lan_url(self):
        fake_socket = mock.MagicMock()
        fake_socket.__enter__.return_value.getsockname.return_value = ("198.18.0.1", 9999)
        with mock.patch.object(server.sys, "platform", "linux"), mock.patch.object(
            server.socket, "socket", return_value=fake_socket
        ), mock.patch.object(server.socket, "gethostbyname", return_value="10.168.1.121"):
            self.assertEqual("10.168.1.121", server.lan_ip_address())


if __name__ == "__main__":
    unittest.main()
