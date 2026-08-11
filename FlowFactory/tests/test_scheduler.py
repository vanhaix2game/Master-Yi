import json
import tempfile
import time
import unittest
from datetime import datetime
from pathlib import Path

from scheduler import ScheduleManager, ScheduleRunCancelled, normalize_schedule


class SchedulerTests(unittest.TestCase):
    def test_daily_schedule_calculates_next_local_run(self):
        now = datetime.fromisoformat('2026-07-24T10:30:00+08:00')
        schedule = normalize_schedule('factory-1', {
            'enabled': True,
            'mode': 'daily',
            'time': '09:15',
        }, now)
        next_run = datetime.fromtimestamp(schedule['next_run_at'], now.tzinfo)
        self.assertEqual('2026-07-25T09:15:00+08:00', next_run.isoformat())

    def test_hourly_schedule_accepts_interval_and_minute(self):
        now = datetime.fromisoformat('2026-07-24T10:31:00+08:00')
        schedule = normalize_schedule('factory-1', {
            'enabled': True,
            'mode': 'hourly',
            'interval_hours': 3,
            'minute': 45,
        }, now)
        next_run = datetime.fromtimestamp(schedule['next_run_at'], now.tzinfo)
        self.assertEqual('2026-07-24T10:45:00+08:00', next_run.isoformat())

    def test_interval_schedule_accepts_minutes(self):
        now = datetime.fromisoformat('2026-07-24T10:31:20+08:00')
        schedule = normalize_schedule('factory-1', {
            'enabled': True,
            'mode': 'interval',
            'interval_minutes': 60,
        }, now)
        next_run = datetime.fromtimestamp(schedule['next_run_at'], now.tzinfo)
        self.assertEqual('2026-07-24T11:31:00+08:00', next_run.isoformat())

    def test_past_one_time_schedule_is_rejected(self):
        now = datetime.fromisoformat('2026-07-24T10:30:00+08:00')
        with self.assertRaisesRegex(ValueError, '指定時間'):
            normalize_schedule('factory-1', {
                'enabled': True,
                'mode': 'once',
                'run_at': '2026-07-24T10:00',
            }, now)

    def test_due_schedule_runs_and_one_time_disables_itself(self):
        calls = []
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'schedules.json'
            manager = ScheduleManager(path, lambda factory_id, schedule: calls.append(factory_id), poll_seconds=1)
            schedule = normalize_schedule('factory-1', {
                'enabled': False,
                'mode': 'once',
                'run_at': '',
            })
            schedule.update({'enabled': True, 'next_run_at': time.time() - 1})
            path.write_text(json.dumps({'factory-1': schedule}), encoding='utf-8')
            self.assertEqual(['factory-1'], manager.tick())
            for _ in range(50):
                if calls and not manager.running_factories:
                    break
                time.sleep(.01)
            saved = manager.status('factory-1')
            self.assertEqual(['factory-1'], calls)
            self.assertFalse(saved['enabled'])
            self.assertEqual('completed', saved['last_status'])

    def test_cancelled_schedule_is_not_reported_as_failed(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'schedules.json'
            manager = ScheduleManager(path, lambda factory_id, schedule: (_ for _ in ()).throw(ScheduleRunCancelled()))
            schedule = normalize_schedule('factory-1', {'enabled': False, 'mode': 'interval'})
            schedule.update({'enabled': True, 'next_run_at': time.time() - 1})
            path.write_text(json.dumps({'factory-1': schedule}), encoding='utf-8')
            manager.tick()
            for _ in range(50):
                if not manager.running_factories:
                    break
                time.sleep(.01)
            saved = manager.status('factory-1')
            self.assertEqual('cancelled', saved['last_status'])
            self.assertEqual('', saved['last_error'])

    def test_startup_recovers_stale_running_schedule(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'schedules.json'
            manager = ScheduleManager(path, lambda factory_id, schedule: None)
            schedule = normalize_schedule('factory-1', {'enabled': True, 'mode': 'interval', 'interval_minutes': 60})
            schedule['last_status'] = 'running'
            path.write_text(json.dumps({'factory-1': schedule}), encoding='utf-8')

            self.assertTrue(manager.recover_interrupted_runs())

            saved = manager.status('factory-1')
            self.assertEqual('interrupted', saved['last_status'])
            self.assertIn('已中止', saved['last_error'])
            self.assertTrue(saved['next_run_at'])


class SchedulerUiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        cls.html = (root / 'index.html').read_text(encoding='utf-8')
        cls.server = (root / 'server.py').read_text(encoding='utf-8')

    def test_timer_button_modal_and_status_are_present(self):
        self.assertIn('id="factoryScheduleBtn"', self.html)
        self.assertIn('id="factoryScheduleStatus"', self.html)
        self.assertIn('id="scheduleDialog"', self.html)
        self.assertIn('data-schedule-mode="interval"', self.html)
        self.assertIn('id="scheduleIntervalMinutes"', self.html)
        self.assertIn('60 分鐘 = 1 小時', self.html)
        self.assertIn('data-schedule-mode="daily"', self.html)
        self.assertIn('data-schedule-mode="once"', self.html)

    def test_add_flow_is_a_bottom_card_not_a_header_button(self):
        self.assertNotIn('id="addFlowBtn"', self.html)
        self.assertIn('class="add-flow-card"', self.html)
        self.assertIn("document.getElementById('addFlowCard').onclick", self.html)

    def test_schedule_api_is_server_backed(self):
        self.assertIn("if path == '/api/schedule':", self.server)
        self.assertIn("if parsed.path == '/api/schedule':", self.server)
        self.assertIn('SCHEDULE_MANAGER.start()', self.server)
        self.assertIn("if parsed.path == '/api/schedule/cancel':", self.server)
        self.assertIn('def cancel_scheduled_factory(factory_id):', self.server)
        self.assertIn('停止目前步驟並結束自動流程', self.html)


if __name__ == '__main__':
    unittest.main()
