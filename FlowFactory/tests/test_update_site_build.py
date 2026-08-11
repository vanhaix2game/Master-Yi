import json
import tarfile
import tempfile
import unittest
from pathlib import Path

from scripts import build_update_site


class UpdateSiteBuildTest(unittest.TestCase):
    def test_build_outputs_pages_manifest_and_archive(self):
        with tempfile.TemporaryDirectory() as temp_name:
            output = Path(temp_name)
            manifest = build_update_site.build(output)
            version = manifest["version"]
            archive = output / manifest["archive"]["url"]
            self.assertTrue((output / "install.sh").is_file())
            with tarfile.open(archive, "r:gz") as bundle:
                names = bundle.getnames()
            self.assertIn("factory_flow_start.command", names)
            self.assertIn("start.command", names)
            self.assertEqual(manifest, json.loads((output / "latest.json").read_text()))
            self.assertTrue(archive.is_file())
            self.assertTrue(archive.with_name(archive.name + ".sha256").is_file())
            with tarfile.open(archive, "r:gz") as bundle:
                names = bundle.getnames()
            self.assertIn("server.py", names)
            self.assertNotIn(".git", names)
            self.assertFalse(any(name.startswith(".git/") for name in names))
            self.assertFalse(any("/outputs/" in f"/{name}/" for name in names))


if __name__ == "__main__":
    unittest.main()
