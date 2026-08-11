import shutil
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import server


class ScriptTaskTest(unittest.TestCase):
    def tearDown(self):
        with server.HERMES_TASKS_LOCK:
            server.HERMES_TASKS.clear()
            server.HERMES_PROCESSES.clear()

    def test_script_command_substitutes_parameters_and_output_directory(self):
        with tempfile.TemporaryDirectory() as temp_name:
            root = Path(temp_name)
            factory = {'name': '測試員工'}
            step = {
                'title': '執行腳本',
                'outputPath': str(root / 'output'),
                'script': '#!/usr/bin/env python3\nimport sys\nprint("--url {{url}} --out ${OUT} --again {{output_dir}}")',
                'fields': [{'id': 'url', 'default': ''}],
            }
            command, output_dir, tmp_script = server._script_command_for_step(factory, step, {'url': 'https://example.com'})

        # 產生暫存檔執行指令
        self.assertTrue(command.startswith('python3 '))
        self.assertIn(tmp_script, command)
        self.assertTrue(Path(tmp_script).is_file())
        # 本體已替換參數與輸出路徑
        body = Path(tmp_script).read_text(encoding='utf-8')
        self.assertIn('https://example.com', body)
        self.assertNotIn('{{url}}', body)
        self.assertNotIn('${OUT}', body)
        self.assertIn(str(output_dir), body)
        Path(tmp_script).unlink()

    def test_start_script_task_uses_saved_step_not_agent_connection(self):
        factory = {'name': '測試員工'}
        step = {'title': '腳本', 'outputPath': 'script-test', 'script': '#!/usr/bin/env python3\nprint("hello")', 'fields': []}
        with tempfile.TemporaryDirectory() as temp_name, \
             mock.patch.object(server, 'load_app_settings', return_value={'content_root': temp_name}), \
             mock.patch.object(server.threading, 'Thread') as thread:
            thread.return_value.start.return_value = None
            task_id = server.start_script_task(factory, step, {})

        task = server.hermes_task_snapshot(task_id)
        self.assertEqual('script', task['mode'])
        self.assertEqual('queued', task['status'])
        thread.assert_called_once()

    @unittest.skipUnless(shutil.which('zsh'), '需要 zsh（macOS 本機腳本執行，CI 為 ubuntu 時跳過）')
    def test_local_script_task_writes_output_and_reports_completion(self):
        with tempfile.TemporaryDirectory() as temp_name:
            output_dir = Path(temp_name)
            task_id = 'local-script-test'
            with server.HERMES_TASKS_LOCK:
                server.HERMES_TASKS[task_id] = {
                    'task_id': task_id, 'mode': 'script', 'status': 'queued',
                    'created_at': 0, 'started_at': None, 'finished_at': None,
                    'pid': None, 'return_code': None, 'error': '', 'events': [],
                }
            server._run_local_script_task(task_id, 'printf script-ok > result.txt', output_dir)

            self.assertEqual('script-ok', (output_dir / 'result.txt').read_text(encoding='utf-8'))
            self.assertEqual('completed', server.hermes_task_snapshot(task_id)['status'])


if __name__ == '__main__':
    unittest.main()
