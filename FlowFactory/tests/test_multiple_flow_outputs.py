import re
import unittest
from pathlib import Path


INDEX = Path(__file__).resolve().parents[1] / "index.html"


class MultipleFlowOutputsRegressionTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = INDEX.read_text(encoding="utf-8")

    def test_flow_dialog_has_repeatable_output_editor(self):
        self.assertIn('id="addOutputBtn"', self.html)
        self.assertIn('id="outputList"', self.html)
        self.assertIn('function addOutputRow(seed = {})', self.html)

    def test_edit_dialog_loads_every_existing_output(self):
        self.assertRegex(
            self.html,
            re.compile(r"\(step\.outputs\|\|\[\]\)\.forEach\(addOutputRow\)"),
        )

    def test_submit_serializes_all_output_rows(self):
        self.assertIn("document.querySelectorAll('.output-row')", self.html)
        self.assertRegex(
            self.html,
            re.compile(r"outputs\s*=\s*\[\.\.\.document\.querySelectorAll\('\.output-row'\)\]"),
        )
        self.assertNotIn("document.getElementById('flowOutputFileInput')", self.html)

    def test_saved_outputs_feed_prompt_preview_and_output_box(self):
        self.assertIn("outputs=step.outputs||[]", self.html)
        self.assertIn("buildGenericPrompt(step)", self.html)
        self.assertIn('class="output-file-tabs"', self.html)
        self.assertIn("outputs=(step.outputs||[]).map", self.html)

    def test_right_workspace_has_settings_and_output_tabs(self):
        self.assertIn('data-flow-tab="settings"', self.html)
        self.assertIn('data-flow-tab="output"', self.html)
        self.assertIn('data-flow-panel="settings"', self.html)
        self.assertIn('data-flow-panel="output"', self.html)
        self.assertIn("function loadOutputPreviews(step)", self.html)
        self.assertIn("/api/output-preview?path=", self.html)
        self.assertIn("classList.toggle('output-mode',name==='output')", self.html)
        self.assertIn(".workspace.output-mode", self.html)
        self.assertIn(".markdown-preview{min-height:0;max-height:none;flex:1", self.html)
        self.assertIn(".json-tree{min-height:0;max-height:none;flex:1", self.html)

    def test_output_tab_keeps_open_file_and_folder_actions(self):
        self.assertIn("openOutputPath('/api/open-file'", self.html)
        self.assertIn("openOutputPath('/api/open-folder'", self.html)
        self.assertIn('title="打開檔案"', self.html)
        self.assertIn('title="打開資料夾"', self.html)

    def test_sidebar_links_to_discord(self):
        self.assertIn('class="sidebar-discord"', self.html)
        self.assertIn('href="https://discord.gg/MXsNQpPZ9E"', self.html)

    def test_edit_dialog_displays_and_preserves_existing_output_path(self):
        self.assertIn("pathInput.dataset.savedPath=step?.outputPath||''", self.html)
        self.assertIn("delete pathInput.dataset.userEdited", self.html)
        self.assertIn("pathInput.dataset.savedPath||flowOutputDir", self.html)
        self.assertIn("flowOutputPathInput", self.html)
        self.assertIn("/api/output-path/check", self.html)
        self.assertIn("已改用 FlowFactory 安全路徑", self.html)
        self.assertIn("/api/output-path/select", self.html)
        self.assertIn("瀏覽...", self.html)
        self.assertIn("body:JSON.stringify({path:pathInput.value.trim()})", self.html)
        self.assertIn("function resolveOutputPath", self.html)

    def test_toast_uses_top_layer_above_modal_backdrop(self):
        self.assertIn('id="toast" class="toast" popover="manual"', self.html)
        self.assertIn("t.showPopover()", self.html)
        self.assertIn("t.hidePopover()", self.html)

    def test_flow_editor_only_persists_on_form_submit(self):
        self.assertIn("document.getElementById('flowForm').onsubmit=async event=>", self.html)
        self.assertNotIn("flowOutputPathInput').onchange=persistWorkflowConfig", self.html)
        self.assertNotIn("flowOutputPathInput').oninput=persistWorkflowConfig", self.html)


if __name__ == "__main__":
    unittest.main()
