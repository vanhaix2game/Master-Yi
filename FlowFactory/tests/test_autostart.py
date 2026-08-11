import plistlib
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import autostart


class AutostartTest(unittest.TestCase):
    def test_status_requires_macos_and_managed_install(self):
        with tempfile.TemporaryDirectory() as temp_name:
            install_root = Path(temp_name) / "install"
            running_root = install_root / "versions" / "1.0.0"
            plist_file = Path(temp_name) / "LaunchAgents" / "com.gda.flowfactory.plist"
            running_root.mkdir(parents=True)
            with mock.patch.object(autostart, "INSTALL_ROOT", install_root), mock.patch.object(autostart, "PLIST_FILE", plist_file), mock.patch.object(autostart.platform, "system", return_value="Darwin"):
                state = autostart.status(running_root)
            self.assertTrue(state["supported"])
            self.assertTrue(state["managed_install"])
            self.assertFalse(state["enabled"])

    def test_enable_writes_background_launch_agent(self):
        with tempfile.TemporaryDirectory() as temp_name:
            root = Path(temp_name)
            install_root = root / "install"
            plist_file = root / "LaunchAgents" / "com.gda.flowfactory.plist"
            completed = mock.Mock(returncode=0, stderr="")
            with mock.patch.object(autostart, "INSTALL_ROOT", install_root), mock.patch.object(autostart, "PLIST_FILE", plist_file), mock.patch.object(autostart, "LOG_DIR", root / "logs"), mock.patch.object(autostart.subprocess, "run", return_value=completed):
                autostart._enable(8765)
            payload = plistlib.loads(plist_file.read_bytes())
            self.assertTrue(payload["RunAtLoad"])
            self.assertTrue(payload["KeepAlive"])
            self.assertEqual(5, payload["ThrottleInterval"])
            self.assertEqual("Background", payload["ProcessType"])
            self.assertEqual("1", payload["EnvironmentVariables"]["AUTOMONEY_NO_BROWSER"])
            self.assertTrue(payload["EnvironmentVariables"]["FLOWFACTORY_PYTHON"])
            self.assertTrue(payload["ProgramArguments"][0].endswith("current/scripts/autostart.command"))

    def test_autostart_launcher_waits_then_takes_over_the_service(self):
        script = (Path(__file__).resolve().parents[1] / "scripts" / "autostart.command").read_text(encoding="utf-8")
        self.assertIn("while curl --noproxy '*'", script)
        self.assertIn('exec env FLOWFACTORY_DATA_DIR="$DATA_DIR"', script)


if __name__ == "__main__":
    unittest.main()
