import unittest
from pathlib import Path


class JsonImportAndParameterDefaultsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        cls.html = (root / 'index.html').read_text(encoding='utf-8')
        cls.server = (root / 'server.py').read_text(encoding='utf-8')

    def test_flow_parameter_editor_supports_optional_default(self):
        self.assertIn('class="param-default"', self.html)
        self.assertIn("'預設值（選填）'", self.html)
        self.assertIn("default:defaultValue", self.html)
        self.assertIn("f.default??''", self.html)
        self.assertIn("field.default??''", self.html)

    def test_file_parameter_default_suggests_global_output_paths(self):
        self.assertIn('id="ff7OutputPathOptions"', self.html)
        self.assertIn("function refreshOutputPathOptions", self.html)
        self.assertIn("function syncParamDefaultInput", self.html)
        self.assertIn("list=\"${type==='file'?'ff7OutputPathOptions':''}\"", self.html)
        self.assertIn("可從下拉選擇流程輸出檔案，或手動輸入", self.html)

    def test_default_value_is_used_for_server_schedules(self):
        self.assertIn("values.get(field_id, field.get('default', ''))", self.server)
        self.assertIn("values.get(str(field.get('id')), field.get('default', ''))", self.server)

    def test_json_settings_can_download_and_accept_drop(self):
        self.assertIn('id="downloadSettingsJson"', self.html)
        self.assertIn('function downloadSettingsJson()', self.html)
        self.assertIn('function importDroppedSettingsJson(file)', self.html)
        self.assertIn('function bindSettingsJsonDrop()', self.html)
        self.assertIn("file.name.toLowerCase().endsWith('.json')", self.html)
        self.assertIn("file.size>2*1024*1024", self.html)
        self.assertIn("Array.isArray(parsed.workflows)", self.html)
        self.assertIn("点击「储存修改」才会应用", self.html)


if __name__ == '__main__':
    unittest.main()
