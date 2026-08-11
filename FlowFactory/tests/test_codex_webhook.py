import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "codex-flow-factory-webhook.py"
IMPORT_DATA_DIR = tempfile.mkdtemp(prefix="flowfactory-codex-webhook-import-")
os.environ["CODEX_WEBHOOK_DATA_DIR"] = IMPORT_DATA_DIR
SPEC = importlib.util.spec_from_file_location("codex_flowfactory_webhook", SCRIPT)
webhook = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(webhook)


class CodexWebhookTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.old_tasks_dir = webhook.TASKS_DIR
        webhook.TASKS_DIR = Path(self.temp.name)
        with webhook.TASKS_LOCK:
            webhook.TASKS.clear()

    def tearDown(self):
        webhook.TASKS_DIR = self.old_tasks_dir
        self.temp.cleanup()

    def test_codex_task_uses_last_message_file_and_completes(self):
        task_id = "task-1"
        with webhook.TASKS_LOCK:
            webhook.TASKS[task_id] = {
                "id": task_id, "status": "queued", "created_at": 1,
                "started_at": None, "finished_at": None, "result": "", "error": "",
            }

        def fake_run(command, **kwargs):
            result_path = Path(command[command.index("--output-last-message") + 1])
            result_path.write_text("Codex 最終回答", encoding="utf-8")
            return mock.Mock(returncode=0, stderr=b"", stdout=b"")

        with mock.patch.object(webhook.subprocess, "run", side_effect=fake_run) as run:
            webhook.run_codex_task(task_id, "請處理任務")

        task = webhook.TASKS[task_id]
        self.assertEqual("completed", task["status"])
        self.assertEqual("Codex 最終回答", task["result"])
        command = run.call_args.args[0]
        self.assertIn("--ephemeral", command)
        self.assertIn("workspace-write", command)
        self.assertIn("never", command)
        self.assertEqual("請處理任務".encode("utf-8"), run.call_args.kwargs["input"])

    def test_task_is_persisted_as_valid_json(self):
        task = {"id": "task-2", "status": "queued", "result": "", "error": ""}
        webhook.write_task(task)
        self.assertEqual(task, json.loads(webhook.task_path("task-2").read_text(encoding="utf-8")))


if __name__ == "__main__":
    unittest.main()
