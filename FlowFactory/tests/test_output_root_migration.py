import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import server


class OutputRootMigrationTest(unittest.TestCase):
    def test_legacy_default_is_copied_and_paths_are_rewritten_with_backup(self):
        with tempfile.TemporaryDirectory() as temp_name:
            root = Path(temp_name)
            old_root = root / 'Desktop' / 'FlowFactory'
            new_root = root / 'data' / 'outputs'
            data_dir = root / 'data'
            old_file = old_root / 'employee' / 'step' / 'result.json'
            old_file.parent.mkdir(parents=True)
            old_file.write_text('{"ok": true}', encoding='utf-8')
            workflows_file = data_dir / 'workflows.json'
            workflows_file.parent.mkdir(parents=True)
            workflows_file.write_text(json.dumps({'workflows': [{
                'id': 'employee', 'steps': [{
                    'id': 'step', 'outputPath': str(old_file.parent),
                    'outputs': [{'filename': 'result.json', 'path': str(old_file.parent)}],
                }],
            }]}), encoding='utf-8')
            settings_file = data_dir / 'app_settings.json'
            settings_file.write_text(json.dumps({'content_root': str(old_root)}), encoding='utf-8')

            with mock.patch.object(server, 'DATA_DIR', data_dir), \
                 mock.patch.object(server, 'WORKFLOWS_FILE', workflows_file), \
                 mock.patch.object(server, 'APP_SETTINGS_FILE', settings_file), \
                 mock.patch.object(server, 'LEGACY_CONTENT_ROOT', old_root), \
                 mock.patch.object(server, 'SAFE_CONTENT_ROOT', new_root):
                self.assertTrue(server.migrate_legacy_content_root())

            migrated = json.loads(workflows_file.read_text(encoding='utf-8'))
            step = migrated['workflows'][0]['steps'][0]
            self.assertEqual(str(new_root / 'employee' / 'step'), step['outputPath'])
            self.assertEqual(step['outputPath'], step['outputs'][0]['path'])
            self.assertTrue((new_root / 'employee' / 'step' / 'result.json').is_file())
            self.assertTrue(workflows_file.with_name('workflows.json.bak').is_file())
            self.assertEqual(str(new_root), json.loads(settings_file.read_text())['content_root'])

    def test_custom_content_root_is_not_changed(self):
        with tempfile.TemporaryDirectory() as temp_name:
            root = Path(temp_name)
            data_dir = root / 'data'
            data_dir.mkdir()
            settings_file = data_dir / 'app_settings.json'
            custom_root = root / 'custom'
            settings_file.write_text(json.dumps({'content_root': str(custom_root)}), encoding='utf-8')
            workflows_file = data_dir / 'workflows.json'
            workflows_file.write_text(json.dumps({'workflows': []}), encoding='utf-8')
            with mock.patch.object(server, 'WORKFLOWS_FILE', workflows_file), \
                 mock.patch.object(server, 'APP_SETTINGS_FILE', settings_file), \
                 mock.patch.object(server, 'LEGACY_CONTENT_ROOT', root / 'Desktop' / 'FlowFactory'), \
                 mock.patch.object(server, 'SAFE_CONTENT_ROOT', data_dir / 'outputs'):
                self.assertFalse(server.migrate_legacy_content_root())
            self.assertEqual(str(custom_root), json.loads(settings_file.read_text())['content_root'])


if __name__ == '__main__':
    unittest.main()
