import json
import os
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path


VALID_MODES = {'interval', 'hourly', 'daily', 'once'}


class ScheduleRunCancelled(Exception):
    """Raised by a runner when the user explicitly stops an active schedule."""


def _next_run(schedule, now=None):
    now = now or datetime.now().astimezone()
    mode = schedule.get('mode')
    if mode == 'interval':
        interval = max(1, min(1440, int(schedule.get('interval_minutes', 60))))
        candidate = now.replace(second=0, microsecond=0) + timedelta(minutes=interval)
        return candidate.timestamp()
    if mode == 'hourly':
        interval = max(1, min(24, int(schedule.get('interval_hours', 1))))
        minute = max(0, min(59, int(schedule.get('minute', 0))))
        candidate = now.replace(minute=minute, second=0, microsecond=0)
        while candidate <= now:
            candidate += timedelta(hours=interval)
        return candidate.timestamp()
    if mode == 'daily':
        hour, minute = [int(part) for part in str(schedule.get('time', '09:00')).split(':', 1)]
        candidate = now.replace(hour=hour, minute=minute, second=0, microsecond=0)
        if candidate <= now:
            candidate += timedelta(days=1)
        return candidate.timestamp()
    if mode == 'once':
        candidate = datetime.fromisoformat(str(schedule.get('run_at', '')))
        if candidate.tzinfo is None:
            candidate = candidate.replace(tzinfo=now.tzinfo)
        return candidate.timestamp() if candidate > now else None
    return None


def normalize_schedule(factory_id, payload, now=None):
    mode = str(payload.get('mode', 'daily')).strip()
    if mode not in VALID_MODES:
        raise ValueError('不支援的排程類型')
    schedule = {
        'factory_id': str(factory_id).strip(),
        'enabled': payload.get('enabled') is True,
        'mode': mode,
        'interval_minutes': max(1, min(1440, int(payload.get('interval_minutes', 60)))),
        'interval_hours': max(1, min(24, int(payload.get('interval_hours', 1)))),
        'minute': max(0, min(59, int(payload.get('minute', 0)))),
        'time': str(payload.get('time', '09:00')).strip(),
        'run_at': str(payload.get('run_at', '')).strip(),
        'values': payload.get('values') if isinstance(payload.get('values'), dict) else {},
        'last_run_at': payload.get('last_run_at'),
        'last_status': str(payload.get('last_status', 'idle')),
        'last_error': str(payload.get('last_error', '')),
    }
    if not schedule['factory_id']:
        raise ValueError('缺少工廠 ID')
    if mode == 'daily':
        try:
            hour, minute = [int(part) for part in schedule['time'].split(':', 1)]
            if not 0 <= hour <= 23 or not 0 <= minute <= 59:
                raise ValueError
        except Exception as exc:
            raise ValueError('每天執行時間格式不正確') from exc
    if mode == 'once' and schedule['enabled']:
        try:
            if _next_run(schedule, now) is None:
                raise ValueError
        except Exception as exc:
            raise ValueError('指定時間必須晚於現在') from exc
    schedule['next_run_at'] = _next_run(schedule, now) if schedule['enabled'] else None
    return schedule


class ScheduleManager:
    def __init__(self, path, runner, poll_seconds=15):
        self.path = Path(path)
        self.runner = runner
        self.poll_seconds = poll_seconds
        self.lock = threading.Lock()
        self.running_factories = set()
        self.stop_event = threading.Event()

    def load(self):
        try:
            data = json.loads(self.path.read_text(encoding='utf-8'))
            return data if isinstance(data, dict) else {}
        except Exception:
            return {}

    def _write(self, schedules):
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temp = self.path.with_suffix(self.path.suffix + '.tmp')
        temp.write_text(json.dumps(schedules, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        os.replace(temp, self.path)

    def list(self):
        with self.lock:
            return self.load()

    def save(self, factory_id, payload):
        with self.lock:
            schedules = self.load()
            existing = schedules.get(factory_id, {})
            schedule = normalize_schedule(factory_id, {**existing, **payload})
            schedules[factory_id] = schedule
            self._write(schedules)
            return schedule

    def status(self, factory_id):
        return self.list().get(factory_id, {
            'factory_id': factory_id,
            'enabled': False,
            'mode': 'daily',
            'time': '09:00',
            'interval_minutes': 60,
            'interval_hours': 1,
            'minute': 0,
            'run_at': '',
            'next_run_at': None,
            'last_run_at': None,
            'last_status': 'idle',
            'last_error': '',
            'values': {},
        })

    def _run(self, factory_id):
        try:
            self.runner(factory_id, self.status(factory_id))
            status, error = 'completed', ''
        except ScheduleRunCancelled:
            status, error = 'cancelled', ''
        except Exception as exc:
            status, error = 'failed', str(exc)
        with self.lock:
            schedules = self.load()
            schedule = schedules.get(factory_id)
            if schedule:
                schedule['last_status'] = status
                schedule['last_error'] = error
                schedule['last_run_at'] = time.time()
                if schedule.get('mode') == 'once':
                    schedule['enabled'] = False
                    schedule['next_run_at'] = None
                elif schedule.get('enabled'):
                    schedule['next_run_at'] = _next_run(schedule)
                schedules[factory_id] = schedule
                self._write(schedules)
            self.running_factories.discard(factory_id)

    def tick(self, now=None):
        now_ts = now if isinstance(now, (int, float)) else time.time()
        with self.lock:
            schedules = self.load()
            due = []
            changed = False
            for factory_id, schedule in schedules.items():
                if not schedule.get('enabled') or factory_id in self.running_factories:
                    continue
                next_run = schedule.get('next_run_at')
                if next_run is None:
                    schedule['next_run_at'] = _next_run(schedule)
                    next_run = schedule['next_run_at']
                    changed = True
                if next_run is not None and next_run <= now_ts:
                    self.running_factories.add(factory_id)
                    schedule['last_status'] = 'running'
                    due.append(factory_id)
                    changed = True
            if changed:
                self._write(schedules)
        for factory_id in due:
            threading.Thread(target=self._run, args=(factory_id,), daemon=True).start()
        return due

    def serve(self):
        while not self.stop_event.wait(self.poll_seconds):
            self.tick()

    def recover_interrupted_runs(self):
        with self.lock:
            schedules = self.load()
            changed = False
            for factory_id, schedule in schedules.items():
                if schedule.get('last_status') != 'running':
                    continue
                schedule['last_status'] = 'interrupted'
                schedule['last_error'] = '服務曾重新啟動，先前的自動執行已中止'
                schedule['last_run_at'] = time.time()
                schedule['next_run_at'] = _next_run(schedule) if schedule.get('enabled') else None
                schedules[factory_id] = schedule
                changed = True
            if changed:
                self._write(schedules)
            return changed

    def start(self):
        self.recover_interrupted_runs()
        threading.Thread(target=self.serve, daemon=True, name='flowfactory-scheduler').start()
