import threading
import time
import unittest
import inspect
from unittest import mock

import server


class AgentTaskCancellationTest(unittest.TestCase):
    def tearDown(self):
        with server.HERMES_TASKS_LOCK:
            server.HERMES_TASKS.clear()
            server.HERMES_PROCESSES.clear()
        with server.SCHEDULE_RUNS_LOCK:
            server.SCHEDULE_RUNS.clear()

    def test_task_runners_have_no_wall_clock_deadline(self):
        """Long jobs end by completion/error/manual cancel, not elapsed time."""
        local_source = inspect.getsource(server._run_local_script_task)
        hermes_source = inspect.getsource(server._run_hermes_task)
        webhook_source = inspect.getsource(server._run_webhook_task)
        for source in (local_source, hermes_source, webhook_source):
            self.assertNotRegex(source, r"time\.time\(\) \+ (600|900)")
            self.assertNotIn("超過 10 分鐘", source)
            self.assertNotIn("超過 15 分鐘", source)
        self.assertNotIn("wait(timeout=900)", hermes_source)

    def test_running_hermes_task_is_marked_cancelled_and_terminated(self):
        task_id = "cancel-running-task"
        process = object()
        with server.HERMES_TASKS_LOCK:
            server.HERMES_TASKS[task_id] = {
                "task_id": task_id,
                "mode": "hermes",
                "status": "running",
                "created_at": time.time(),
                "started_at": time.time(),
                "finished_at": None,
                "pid": 123,
                "return_code": None,
                "error": "",
                "events": [],
            }
            server.HERMES_PROCESSES[task_id] = process

        with mock.patch.object(server, "_terminate_agent_process") as terminate:
            snapshot = server.cancel_agent_task(task_id)

        terminate.assert_called_once_with(process)
        self.assertEqual("cancelled", snapshot["status"])
        self.assertTrue(snapshot["finished_at"])
        self.assertTrue(snapshot["events"])

    def test_completed_task_can_be_cancelled_idempotently(self):
        task_id = "completed-task"
        with server.HERMES_TASKS_LOCK:
            server.HERMES_TASKS[task_id] = {
                "task_id": task_id,
                "mode": "hermes",
                "status": "completed",
                "created_at": time.time(),
                "started_at": time.time(),
                "finished_at": time.time(),
                "pid": 123,
                "return_code": 0,
                "error": "",
                "events": [],
            }

        snapshot = server.cancel_agent_task(task_id)
        self.assertEqual("completed", snapshot["status"])

    def test_agent_json_event_is_not_truncated_at_8000_characters(self):
        task_id = "long-agent-json"
        payload = '<FLOW_FACTORY_JSON>{"changes":[' + ('"x"' * 3000) + ']}</FLOW_FACTORY_JSON>'
        with server.HERMES_TASKS_LOCK:
            server.HERMES_TASKS[task_id] = {"events": []}

        server._task_event(task_id, payload, "agent")

        self.assertEqual(payload, server.HERMES_TASKS[task_id]["events"][0]["message"])

    def test_external_webhook_task_stops_local_queue(self):
        task_id = "webhook-task"
        with server.HERMES_TASKS_LOCK:
            server.HERMES_TASKS[task_id] = {
                "task_id": task_id,
                "mode": "webhook",
                "status": "running",
                "created_at": time.time(),
                "started_at": time.time(),
                "finished_at": None,
                "pid": None,
                "return_code": None,
                "error": "",
                "events": [],
            }

        snapshot = server.cancel_agent_task(task_id)
        self.assertEqual("cancelled", snapshot["status"])
        self.assertTrue(snapshot["cancel_requested"])
        self.assertIn("後續流程", snapshot["events"][-1]["message"])

    def test_cancelled_webhook_response_cannot_restore_completed_status(self):
        task_id = "blocking-webhook-task"
        entered = threading.Event()
        release = threading.Event()

        class BlockingResponse:
            status = 200

            def __enter__(self):
                entered.set()
                return self

            def __exit__(self, exc_type, exc, traceback):
                return False

            def read(self, limit):
                release.wait(2)
                return b'{"ok":true}'

        with server.HERMES_TASKS_LOCK:
            server.HERMES_TASKS[task_id] = {
                "task_id": task_id, "mode": "webhook", "status": "queued",
                "created_at": time.time(), "started_at": None, "finished_at": None,
                "pid": None, "return_code": None, "error": "", "events": [],
            }
        settings = {"name": "External Agent", "webhook_url": "http://127.0.0.1:9999/task", "token": ""}
        with mock.patch.object(server, "open_webhook", return_value=BlockingResponse()):
            worker = threading.Thread(target=server._run_webhook_task, args=(task_id, "test", settings))
            worker.start()
            self.assertTrue(entered.wait(1))
            server.cancel_agent_task(task_id)
            release.set()
            worker.join(2)

        snapshot = server.hermes_task_snapshot(task_id)
        self.assertEqual("cancelled", snapshot["status"])
        self.assertNotIn("Webhook 執行完成", [event["message"] for event in snapshot["events"]])

    def test_scheduled_factory_cancel_stops_current_agent_task(self):
        task_id = "scheduled-running-task"
        with server.HERMES_TASKS_LOCK:
            server.HERMES_TASKS[task_id] = {
                "task_id": task_id, "mode": "hermes", "status": "running",
                "created_at": time.time(), "started_at": time.time(), "finished_at": None,
                "pid": 456, "return_code": None, "error": "", "events": [],
            }
            server.HERMES_PROCESSES[task_id] = object()
        with server.SCHEDULE_RUNS_LOCK:
            server.SCHEDULE_RUNS["factory-1"] = {
                "factory_id": "factory-1", "cancel_requested": False,
                "current_task_id": task_id, "current_step_id": "step-2",
                "current_step_title": "第二步", "current_step_index": 1, "total_steps": 3,
            }

        with mock.patch.object(server, "_terminate_agent_process") as terminate:
            snapshot = server.cancel_scheduled_factory("factory-1")

        terminate.assert_called_once()
        self.assertTrue(snapshot["cancel_requested"])
        self.assertEqual("cancelled", server.hermes_task_snapshot(task_id)["status"])


if __name__ == "__main__":
    unittest.main()

class AsyncWebhookTest(unittest.TestCase):
    """防治：異步型 webhook（accepted + result_url）的偵測與輪詢"""

    def tearDown(self):
        with server.HERMES_TASKS_LOCK:
            server.HERMES_TASKS.clear()
            server.HERMES_PROCESSES.clear()

    def test_connection_test_detects_async_webhook(self):
        # 模擬 webhook 回應 accepted + result_url → test_agent_webhook 應標記 async
        class AsyncResponse:
            status = 202
            def __enter__(self):
                return self
            def __exit__(self, *args):
                return False
            def read(self, size):
                return b'{"ok": true, "status": "accepted", "task_id": "t1", "result_url": "http://127.0.0.1:8766/results/t1"}'
        settings = {"name": "Async Agent", "webhook_url": "http://127.0.0.1:8766/webhooks/flow-factory", "token": ""}
        with mock.patch.object(server, "open_webhook", return_value=AsyncResponse()):
            result = server.test_agent_webhook(settings)
        self.assertTrue(result.get("async"))
        self.assertIn("輪詢", result.get("message", ""))

    def test_connection_test_marks_sync_webhook(self):
        # 一般同步 webhook（直接回覆結果）→ async 應為 False
        class SyncResponse:
            status = 200
            def __enter__(self):
                return self
            def __exit__(self, *args):
                return False
            def read(self, size):
                return b'{"ok": true, "message": "connection successful"}'
        settings = {"name": "Sync Agent", "webhook_url": "http://127.0.0.1:9999/task", "token": ""}
        with mock.patch.object(server, "open_webhook", return_value=SyncResponse()):
            result = server.test_agent_webhook(settings)
        self.assertFalse(result.get("async"))

    def test_run_webhook_task_polls_result_url_until_completed(self):
        # _run_webhook_task 收到 accepted + result_url → 輪詢直到 completed 並取 result
        task_id = "poll-webhook-task"
        with server.HERMES_TASKS_LOCK:
            server.HERMES_TASKS[task_id] = {
                "task_id": task_id, "mode": "webhook", "status": "queued",
                "created_at": time.time(), "started_at": None, "finished_at": None,
                "pid": None, "return_code": None, "error": "", "events": [],
            }
        settings = {"name": "Async Agent", "webhook_url": "http://127.0.0.1:8766/webhooks/flow-factory", "token": "", "verified": True}

        poll_count = {"n": 0}
        class AcceptResponse:
            status = 202
            def __enter__(self):
                return self
            def __exit__(self, *args):
                return False
            def read(self, size):
                return b'{"ok": true, "status": "accepted", "task_id": "t1", "result_url": "http://127.0.0.1:8766/results/t1"}'

        def fake_open_webhook(request, url, timeout):
            if request.method == "POST":
                return AcceptResponse()
            # GET result_url：第一次 running，第二次 completed
            poll_count["n"] += 1
            if poll_count["n"] == 1:
                return MockResponse(b'{"ok": true, "status": "running", "task_id": "t1"}')
            return MockResponse('{"ok": true, "status": "completed", "task_id": "t1", "result": "這是最終結果"}'.encode('utf-8'))

        class MockResponse:
            status = 200
            def __init__(self, body):
                self.body = body
            def __enter__(self):
                return self
            def __exit__(self, *args):
                return False
            def read(self, size):
                return self.body

        with mock.patch.object(server, "open_webhook", side_effect=fake_open_webhook), \
             mock.patch.object(server.time, "sleep", return_value=None):
            server._run_webhook_task(task_id, "測試", settings)

        snapshot = server.hermes_task_snapshot(task_id)
        self.assertEqual("completed", snapshot["status"])
        agent_events = [e for e in snapshot["events"] if e["kind"] == "agent"]
        self.assertTrue(agent_events, "應有 agent 事件")
        self.assertIn("這是最終結果", agent_events[-1]["message"])
