import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class OutputPreviewTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.server = (ROOT / "server.py").read_text(encoding="utf-8")

    def test_preview_uses_declared_full_output_path(self):
        self.assertIn("def declared_output_paths():", self.server)
        self.assertIn("target not in declared_output_paths()", self.server)
        self.assertNotIn("if target.is_file():\n                        pass", self.server)
        self.assertIn("if path == '/api/output-preview':", self.server)
        self.assertIn("data-output-path=", self.html)
        self.assertIn("encodeURIComponent(fullPath)", self.html)

    def test_preview_is_limited_to_safe_markdown_files(self):
        self.assertIn("target.suffix.lower() not in {'.md', '.json'}", self.server)
        self.assertIn("2 * 1024 * 1024", self.server)
        self.assertIn("read_text(encoding='utf-8')", self.server)

    def test_rich_file_renderers_and_media_launcher_are_present(self):
        self.assertIn("function renderMarkdown(source='')", self.html)
        self.assertIn("function buildJsonTree(value,label)", self.html)
        self.assertIn("JSON.parse(data.content||'null')", self.html)
        self.assertIn("id=\"launchMediaPlayer\"", self.html)
        self.assertIn("使用系統播放器播放", self.html)

    def test_markdown_tables_and_json_leaves_render_correctly(self):
        self.assertIn('class="markdown-table-wrap"', self.html)
        self.assertIn("<table><thead><tr>", self.html)
        self.assertIn("isDivider=line=>", self.html)
        self.assertIn("leaf.className='json-leaf'", self.html)
        self.assertIn("leaf.append(key,scalar);return leaf", self.html)

    def test_selected_flow_tab_persists_across_cards(self):
        self.assertIn("state.activeFlowTab=", self.html)
        self.assertIn("switchFlowTab(state.activeFlowTab,step)", self.html)
        self.assertIn("state.activeFlowTab=name;save()", self.html)

    def test_columns_are_bounded_to_the_viewport(self):
        self.assertIn("html,body{height:100%;min-height:0;overflow:hidden}", self.html)
        self.assertIn(".app{height:calc(100vh - 24px);min-height:0", self.html)
        self.assertIn(".panel{height:100%;min-height:0;max-height:100%", self.html)
        self.assertIn("max-height:calc(100vh - 16px)", self.html)


if __name__ == "__main__":
    unittest.main()
