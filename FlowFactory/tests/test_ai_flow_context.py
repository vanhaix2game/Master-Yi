import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import server


class AiFlowContextTest(unittest.TestCase):
    def test_context_includes_employee_revision_without_duplicate_step_json(self):
        with tempfile.TemporaryDirectory() as temp_name:
            root = Path(temp_name)
            output = root / 'outputs' / 'writer' / 'collect'
            output.mkdir(parents=True)
            (output / 'result.md').write_text('# Output\nHello', encoding='utf-8')
            workflows = root / 'workflows.json'
            workflows.write_text(json.dumps({'workflows': [{
                'id': 'writer', 'name': '內容員工', 'steps': [{
                    'id': 'collect', 'title': '收集', 'outputPath': 'writer/collect',
                    'outputs': [{'filename': 'result.md'}],
                }],
            }]}), encoding='utf-8')
            with mock.patch.object(server, 'WORKFLOWS_FILE', workflows), \
                 mock.patch.object(server, 'load_app_settings', return_value={'content_root': str(root / 'outputs')}):
                context = server.ai_flow_context('writer')
            self.assertEqual('writer', context['employee_id'])
            self.assertEqual(64, len(context['revision']))
            self.assertEqual('collect', context['employee_json']['steps'][0]['id'])
            self.assertEqual('collect', context['flows'][0]['step_id'])
            self.assertNotIn('step_json', context['flows'][0])
            self.assertEqual('# Output\nHello', context['flows'][0]['outputs'][0]['content'])

    def test_replace_employee_updates_only_target_and_rejects_stale_revision(self):
        with tempfile.TemporaryDirectory() as temp_name:
            root = Path(temp_name)
            workflows = root / 'workflows.json'
            original = {'workflows': [
                {'id': 'writer', 'name': '內容員工', 'steps': []},
                {'id': 'researcher', 'name': '研究員', 'steps': [{'id': 'keep'}]},
            ]}
            workflows.write_text(json.dumps(original), encoding='utf-8')
            revision = server._employee_revision(original['workflows'][0])
            updated = {'id': 'writer', 'name': '內容員工', 'steps': [{'id': 'new'}]}
            with mock.patch.object(server, 'WORKFLOWS_FILE', workflows), \
                 mock.patch.object(server, '_require_workflows_write_license', return_value={}):
                employee, next_revision = server._replace_employee_workflow('writer', updated, revision)
                with self.assertRaisesRegex(RuntimeError, '對話期間變更'):
                    server._replace_employee_workflow('writer', updated, revision)
            stored = json.loads(workflows.read_text(encoding='utf-8'))
            self.assertEqual([{'id': 'keep'}], stored['workflows'][1]['steps'])
            self.assertEqual([{'id': 'new'}], employee['steps'])
            self.assertEqual(server._employee_revision(employee), next_revision)

    def test_context_rejects_missing_employee(self):
        with tempfile.TemporaryDirectory() as temp_name:
            workflows = Path(temp_name) / 'workflows.json'
            workflows.write_text('{"workflows": []}', encoding='utf-8')
            with mock.patch.object(server, 'WORKFLOWS_FILE', workflows):
                with self.assertRaisesRegex(ValueError, '找不到指定員工'):
                    server.ai_flow_context('missing')


if __name__ == '__main__':
    unittest.main()
