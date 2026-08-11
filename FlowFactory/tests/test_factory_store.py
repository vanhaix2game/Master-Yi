import json
import tempfile
import unittest
from pathlib import Path
from unittest import mock

import server


ROOT = Path(__file__).resolve().parents[1]


class FactoryStoreTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.worker = (ROOT / "cloudflare/license-worker/src/index.js").read_text(encoding="utf-8")
        cls.migration = (ROOT / "cloudflare/license-worker/migrations/0005_factory_store.sql").read_text(encoding="utf-8")

    def test_header_uses_store_modal_instead_of_json_export(self):
        self.assertIn('id="factoryStoreBtn"', self.html)
        self.assertIn('id="factoryStoreDialog"', self.html)
        self.assertNotIn('id="exportBtn"', self.html)

    def test_labor_market_uses_master_detail_employee_layout(self):
        self.assertIn('data-lucide="briefcase-business"', self.html)
        self.assertIn(">勞務市場</button>", self.html)
        self.assertNotIn("💼 勞務市場", self.html)
        self.assertNotIn("💼【勞務市場】", self.html)
        self.assertIn('class="market-layout"', self.html)
        self.assertIn('id="storeDetailPane"', self.html)
        self.assertIn('class="market-list-card', self.html)
        self.assertIn("renderStoreFactoryDetail(activeStoreFactory)", self.html)
        self.assertIn("↓ 安裝此員工", self.html)
        self.assertIn("查看運作流程", self.html)
        self.assertIn("function renderMarketResume(factory)", self.html)
        self.assertIn("function renderMarketWorkflow(factory)", self.html)
        self.assertIn("← 返回簡歷", self.html)
        self.assertNotIn("⭐", self.html)

    def test_factory_description_is_saved_in_workflows(self):
        self.assertIn('id="factoryDescriptionInput"', self.html)
        self.assertIn('id="factoryResumeInput"', self.html)
        self.assertIn("factory.description=description", self.html)
        self.assertIn("factory.resume=resume", self.html)
        self.assertIn("factory.employee_icon=employeeIcon", self.html)
        default = json.loads((ROOT / "workflows.json").read_text(encoding="utf-8"))
        self.assertTrue(default["workflows"][0]["description"])
        self.assertTrue(default["workflows"][0]["resume"])
        self.assertEqual("assistant_b", default["workflows"][0]["employee_icon"])

    def test_upload_converts_local_output_paths_to_portable_relative_paths(self):
        source = {
            "id": "shared-id",
            "name": "示範工廠",
            "description": "示範簡介",
            "steps": [{
                "id": "shared-step",
                "title": "第一步",
                "outputPath": "/Users/someone/.flowfactory/data/outputs/示範工廠/第一步",
                "outputs": [{"filename": "result.md", "path": "/Users/someone/.flowfactory/data/outputs/示範工廠/第一步"}],
            }],
        }
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with mock.patch.object(server, "load_app_settings", return_value={"content_root": str(root / "outputs")}):
                cleaned = server._store_safe_factory(source)
        self.assertEqual("示範工廠/第一步", cleaned["steps"][0]["outputPath"])
        self.assertEqual("示範工廠/第一步", cleaned["steps"][0]["outputs"][0]["path"])

    def test_upload_falls_back_to_canonical_path_for_arbitrary_absolute_path(self):
        source = {
            "id": "shared-id",
            "name": "示範工廠",
            "description": "示範簡介",
            "steps": [{"id": "shared-step", "title": "第一步", "outputPath": "/Users/someone/private", "outputs": []}],
        }
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with mock.patch.object(server, "load_app_settings", return_value={"content_root": str(root / "outputs")}):
                cleaned = server._store_safe_factory(source)
        self.assertEqual("示範工廠/第一步", cleaned["steps"][0]["outputPath"])

    def test_upload_preserves_safe_relative_output_path(self):
        source = {
            "id": "shared-id",
            "name": "示範工廠",
            "description": "示範簡介",
            "steps": [{"id": "shared-step", "title": "第一步", "outputPath": "示範工廠/第一步", "outputs": []}],
        }
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            with mock.patch.object(server, "load_app_settings", return_value={"content_root": str(root / "outputs")}):
                cleaned = server._store_safe_factory(source)
        self.assertEqual("示範工廠/第一步", cleaned["steps"][0]["outputPath"])

    def test_store_browsing_is_public_but_install_and_publish_are_authorized(self):
        self.assertIn("GET' && url.pathname === '/v1/store/factories'", self.worker)
        self.assertIn("await authorizeStore(body, env)", self.worker)
        self.assertIn("downloadStoreFactory", self.worker)
        self.assertIn("publishStoreFactory", self.worker)
        self.assertIn("status: 'pending'", self.worker)
        self.assertIn("withdrawOwnStoreFactory", self.worker)
        self.assertIn("listAdminStoreFactories", self.worker)
        self.assertIn("reviewStoreFactory", self.worker)
        self.assertIn("access-control-allow-origin", self.worker)
        self.assertIn("employee_icon", self.worker)
        self.assertIn("fetchPublicStore", self.html)
        self.assertIn("json_extract(factory_json, '$.id') = ?", self.worker)
        self.assertIn("WHERE id = ? AND owner_license_id = ?", self.worker)
        self.assertIn("updated: true", self.worker)
        self.assertIn("通過後將覆蓋原市場內容", self.worker)

    def test_public_store_browsing_falls_back_to_direct_connection(self):
        licensing_source = (ROOT / "licensing.py").read_text(encoding="utf-8")
        self.assertIn('if not authenticated and method == "GET"', licensing_source)
        self.assertIn("ProxyHandler({})", licensing_source)

    def test_migration_keeps_private_owner_and_download_records(self):
        self.assertIn("owner_license_id INTEGER NOT NULL", self.migration)
        self.assertIn("CREATE TABLE IF NOT EXISTS store_downloads", self.migration)
        self.assertIn("status TEXT NOT NULL DEFAULT 'pending'", self.migration)
        self.assertIn("reviewed_at INTEGER", self.migration)

    def test_user_and_admin_interfaces_support_review_and_withdrawal(self):
        admin_html = (ROOT / "scripts/license_admin.html").read_text(encoding="utf-8")
        admin_proxy = (ROOT / "scripts/license_admin.py").read_text(encoding="utf-8")
        self.assertIn('data-admin-tab="store"', admin_html)
        self.assertIn("loadStore()", admin_html)
        self.assertIn("reviewStore(", admin_html)
        self.assertIn("/v1/admin/store", admin_proxy)
        self.assertIn('id="storeMineBtn"', self.html)
        self.assertIn("showMyStoreFactories", self.html)
        self.assertIn("withdrawStoreFactory", self.html)
        self.assertIn("factory.status!=='withdrawn'", self.html)
        self.assertIn("setStoreView", self.html)

    def test_install_rewrites_ids_and_output_paths_atomically(self):
        source = {
            "id": "shared-id",
            "name": "示範工廠",
            "description": "示範簡介",
            "steps": [{
                "id": "shared-step",
                "title": "第一步",
                "outputPath": "/Users/someone/private",
                "outputs": [{"filename": "result.md", "path": "/Users/someone/private"}],
            }],
        }
        with tempfile.TemporaryDirectory() as directory:
            data_dir = Path(directory)
            workflows = data_dir / "workflows.json"
            settings = data_dir / "app_settings.json"
            workflows.write_text(json.dumps({"workflows": []}), encoding="utf-8")
            settings.write_text(json.dumps({"content_root": str(data_dir / "outputs")}), encoding="utf-8")
            with mock.patch.object(server, "WORKFLOWS_FILE", workflows), mock.patch.object(server, "APP_SETTINGS_FILE", settings), mock.patch.object(server.licensing, "status", return_value={"licensed": True}):
                installed = server._install_store_factory(source)
            saved = json.loads(workflows.read_text(encoding="utf-8"))["workflows"][0]
            self.assertEqual("shared-id", installed["id"])
            self.assertNotEqual("shared-step", saved["steps"][0]["id"])
            self.assertTrue(saved["steps"][0]["outputPath"].startswith(str(data_dir / "outputs")))
            self.assertNotIn("/Users/someone", workflows.read_text(encoding="utf-8"))

    def test_install_adds_copy_markers_for_conflicting_id_and_name(self):
        source = {
            "id": "shared-id",
            "name": "示範工廠",
            "description": "示範簡介",
            "steps": [{"id": "shared-step", "title": "第一步", "outputs": []}],
        }
        with tempfile.TemporaryDirectory() as directory:
            data_dir = Path(directory)
            workflows = data_dir / "workflows.json"
            settings = data_dir / "app_settings.json"
            workflows.write_text(json.dumps({"workflows": [source]}), encoding="utf-8")
            settings.write_text(json.dumps({"content_root": str(data_dir / "outputs")}), encoding="utf-8")
            with mock.patch.object(server, "WORKFLOWS_FILE", workflows), mock.patch.object(server, "APP_SETTINGS_FILE", settings), mock.patch.object(server.licensing, "status", return_value={"licensed": True}):
                first = server._install_store_factory(source)
                second = server._install_store_factory(source)
            self.assertEqual("shared-id-copy", first["id"])
            self.assertEqual("示範工廠 Copy", first["name"])
            self.assertEqual("shared-id-copy-3", second["id"])
            self.assertEqual("示範工廠 Copy 3", second["name"])

    def test_limited_view_write_preserves_hidden_workflows(self):
        original = {"workflows": [{"id": "one"}, {"id": "two"}]}
        merged = server._merge_limited_workflow_view(original, {"workflows": [{"id": "one", "name": "已修改"}]})
        self.assertEqual(merged["workflows"], [{"id": "one", "name": "已修改"}, {"id": "two"}])
        with self.assertRaises(PermissionError):
            server._merge_limited_workflow_view(original, {"workflows": []})

    def test_licensed_workflow_write_rotates_backups_before_replace(self):
        with tempfile.TemporaryDirectory() as directory:
            workflows = Path(directory) / "workflows.json"
            first = {"workflows": [{"id": "first"}]}
            second = {"workflows": [{"id": "second"}]}
            third = {"workflows": [{"id": "third"}]}
            workflows.write_text(json.dumps(first), encoding="utf-8")
            with mock.patch.object(server, "WORKFLOWS_FILE", workflows), mock.patch.object(
                server.licensing, "status", return_value={"licensed": True}
            ):
                server._write_workflows(second)
                server._write_workflows(third)
            backup = json.loads(workflows.with_name("workflows.json.bak").read_text(encoding="utf-8"))
            older_backup = json.loads(workflows.with_name("workflows.json.bak.1").read_text(encoding="utf-8"))
            self.assertEqual(second, backup)
            self.assertEqual(first, older_backup)
            self.assertEqual(third, json.loads(workflows.read_text(encoding="utf-8")))

    def test_upload_migrates_command_to_script_body(self):
        # v1.50：script 卡片上傳時，執行指令格式（python3 <path>）自動讀檔回填成本體
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            script_file = root / "backup_workflows.py"
            script_file.write_text("#!/usr/bin/env python3\nprint('backup')\n", encoding="utf-8")
            source = {
                "id": "shared-id",
                "name": "示範工廠",
                "description": "示範簡介",
                "steps": [{
                    "id": "shared-step",
                    "title": "第一步",
                    "type": "script",
                    "script": f"python3 {script_file} --out \"${{OUT}}\"",
                    "script_name": "backup_workflows",
                    "outputPath": "示範工廠/第一步",
                    "outputs": [],
                }],
            }
            with mock.patch.object(server, "load_app_settings", return_value={"content_root": str(root / "outputs")}):
                cleaned = server._store_safe_factory(source)
            step = cleaned["steps"][0]
            # 本體回填、舊欄位移除
            self.assertIn("print('backup')", step["script"])
            self.assertNotIn("script_source", step)
            self.assertNotIn("script_name", step)
            self.assertNotIn("script_args", step)

    def test_upload_keeps_body_when_file_missing(self):
        # 指令指向不存在的檔案 → 保留原指令（不內嵌、不誤判）
        source = {
            "id": "shared-id",
            "name": "示範工廠",
            "description": "示範簡介",
            "steps": [{
                "id": "shared-step",
                "title": "第一步",
                "type": "script",
                "script": "python3 /nonexistent/script.py --out \"${OUT}\"",
                "outputPath": "示範工廠/第一步",
                "outputs": [],
            }],
        }
        with mock.patch.object(server, "load_app_settings", return_value={"content_root": "/tmp/outputs"}):
            cleaned = server._store_safe_factory(source)
        step = cleaned["steps"][0]
        self.assertEqual(step["script"], "python3 /nonexistent/script.py --out \"${OUT}\"")
        self.assertNotIn("script_source", step)

    def test_install_keeps_script_body_in_json(self):
        # v1.50：安裝時 script 本體原樣保留（JSON 內），不落地檔案
        source = {
            "id": "shared-id",
            "name": "示範工廠",
            "description": "示範簡介",
            "steps": [{
                "id": "shared-step",
                "title": "第一步",
                "type": "script",
                "script": "#!/usr/bin/env python3\nprint('backup')\n",
                "outputPath": "/Users/someone/private",
                "outputs": [],
            }],
        }
        with tempfile.TemporaryDirectory() as directory:
            data_dir = Path(directory)
            workflows = data_dir / "workflows.json"
            settings = data_dir / "app_settings.json"
            workflows.write_text(json.dumps({"workflows": []}), encoding="utf-8")
            settings.write_text(json.dumps({"content_root": str(data_dir / "outputs")}), encoding="utf-8")
            with mock.patch.object(server, "WORKFLOWS_FILE", workflows), mock.patch.object(server, "APP_SETTINGS_FILE", settings), mock.patch.object(server.licensing, "status", return_value={"licensed": True}):
                installed = server._install_store_factory(source)
            step = installed["steps"][0]
            # 本體保留、無 script_source/script_name/script_args
            self.assertIn("print('backup')", step["script"])
            self.assertNotIn("script_source", step)
            self.assertNotIn("script_name", step)
            self.assertNotIn("script_args", step)

    def test_install_accepts_legacy_script_source(self):
        # 舊版上傳（帶 script_source）→ 安裝時回填成本體，不落地
        source = {
            "id": "shared-id",
            "name": "示範工廠",
            "description": "示範簡介",
            "steps": [{
                "id": "shared-step",
                "title": "第一步",
                "type": "script",
                "script": "python3 /old/path/backup_workflows.py --out \"${OUT}\"",
                "script_name": "backup_workflows",
                "script_source": "#!/usr/bin/env python3\nprint('backup')\n",
                "outputPath": "/Users/someone/private",
                "outputs": [],
            }],
        }
        with tempfile.TemporaryDirectory() as directory:
            data_dir = Path(directory)
            workflows = data_dir / "workflows.json"
            settings = data_dir / "app_settings.json"
            workflows.write_text(json.dumps({"workflows": []}), encoding="utf-8")
            settings.write_text(json.dumps({"content_root": str(data_dir / "outputs")}), encoding="utf-8")
            with mock.patch.object(server, "WORKFLOWS_FILE", workflows), mock.patch.object(server, "APP_SETTINGS_FILE", settings), mock.patch.object(server.licensing, "status", return_value={"licensed": True}):
                installed = server._install_store_factory(source)
            step = installed["steps"][0]
            # 舊版 script_source → 本體
            self.assertIn("print('backup')", step["script"])
            self.assertNotIn("script_source", step)
            self.assertNotIn("script_name", step)


if __name__ == "__main__":
    unittest.main()
