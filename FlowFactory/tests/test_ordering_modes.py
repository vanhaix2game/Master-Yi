import json
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class OrderingModesTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")

    def test_new_install_defaults_to_news_factory(self):
        config = json.loads((ROOT / "workflows.json").read_text(encoding="utf-8"))
        self.assertEqual(["新聞收集員（阿明）"], [factory["name"] for factory in config["workflows"]])

    def test_factory_ordering_requires_factory_edit_mode(self):
        # v1.52.1：員工列表移除鎖按鈕，drag-handle 常駐可拖（與流程卡片一致）
        self.assertIn('draggable="true" data-wf=', self.html)
        self.assertIn('class="drag-handle" draggable="true"', self.html)
        self.assertNotIn("factoryLockBtn", self.html)
        self.assertNotIn("factoryEditMode", self.html)
        self.assertNotIn("員工排序與設定", self.html)
        self.assertNotIn("data-move-factory", self.html)
        self.assertNotIn("async function moveFactory(", self.html)

    def test_flow_ordering_requires_flow_edit_mode(self):
        # v1.52.0：流程卡片 hover 顯示 drag-handle 即可拖動排序（移除 flowEditMode/lockFlowBtn）
        self.assertIn('draggable="true" data-step-id', self.html)
        self.assertNotIn("lockFlowBtn", self.html)
        self.assertNotIn("flowEditMode", self.html)
        # hover 顯示 handle：常駐半透明（28px 可點區域），hover 變明顯
        self.assertIn(".generic-flow-card .drag-handle{width:28px", self.html)
        self.assertIn(".generic-flow-card:hover .drag-handle", self.html)

    def test_clicking_elsewhere_closes_both_modes(self):
        # v1.52.1：兩個排序鎖都移除，無需點擊關閉模式
        self.assertNotIn("factoryEditMode=false", self.html)
        self.assertNotIn("flowEditMode=false", self.html)


if __name__ == "__main__":
    unittest.main()
