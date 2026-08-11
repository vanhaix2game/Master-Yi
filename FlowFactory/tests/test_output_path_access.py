import tempfile
import unittest
from pathlib import Path
from unittest import mock

import server


class OutputPathAccessTest(unittest.TestCase):
    def test_choose_output_folder_uses_current_input_path_as_default_location(self):
        with tempfile.TemporaryDirectory() as temp_name:
            root = Path(temp_name)
            completed = mock.Mock(returncode=0, stdout=f'{root / "outputs"}\n', stderr='')
            with mock.patch.object(server.sys, 'platform', 'darwin'), \
                    mock.patch.object(server.subprocess, 'run', return_value=completed) as run:
                result = server.choose_output_folder(str(root / 'missing' / 'deep' / 'outputs'))
            self.assertEqual(str(root / 'outputs'), result)
            script = run.call_args.args[0][2]
            self.assertIn('choose folder with prompt "選擇流程輸出資料夾"', script)
            self.assertIn(f'default location POSIX file "{root.resolve()}"', script)

    def test_apple_script_quote_escapes_quotes_and_backslashes(self):
        self.assertEqual(server._apple_script_quote('a"b\\c'), 'a\\"b\\\\c')

    def test_access_check_creates_and_removes_probe(self):
        with tempfile.TemporaryDirectory() as temp_name:
            target = Path(temp_name) / 'new-output'
            result = server.check_output_path_access(target)
            self.assertTrue(result['accessible'])
            self.assertTrue(target.is_dir())
            self.assertEqual([], list(target.glob('.flowfactory-access-*')))

    def test_access_check_reports_background_permission_failure(self):
        target = Path('/protected/output')
        with mock.patch.object(Path, 'mkdir', side_effect=PermissionError(1, 'Operation not permitted')):
            result = server.check_output_path_access(target)
        self.assertFalse(result['accessible'])
        self.assertIn('Operation not permitted', result['error'])

    def test_relative_path_is_resolved_from_content_root(self):
        with tempfile.TemporaryDirectory() as temp_name:
            root = Path(temp_name) / 'outputs'
            with mock.patch.object(server, 'load_app_settings', return_value={'content_root': str(root)}):
                result = server.check_output_path_access('employee/report')
            self.assertTrue(result['accessible'])
            self.assertEqual(str((root / 'employee' / 'report').resolve()), result['path'])

    def test_relative_path_cannot_escape_content_root(self):
        with tempfile.TemporaryDirectory() as temp_name:
            root = Path(temp_name) / 'outputs'
            with mock.patch.object(server, 'load_app_settings', return_value={'content_root': str(root)}):
                with self.assertRaisesRegex(ValueError, '不可離開'):
                    server.resolve_output_path('../outside')


if __name__ == '__main__':
    unittest.main()
