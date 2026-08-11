---
name: tools-automation
description: Automation script — file watcher, batch processor, pipeline, retry, logging. Chạy ổn định 24/7, không memory leak.
---

# tools-automation — Automation Scripts

## File Watcher (debounced, không double-fire)
See `templates/file-watcher.ts`.

Uses chokidar + lodash debounce. Detects change/add/unlink. Ignores dotfiles by default. Call `close()` to cleanup.

## Batch Processor (concurrency control)
See `templates/batch-processor.ts`.

Process items with bounded concurrency. Returns `{ results, errors }`. Optional `onProgress` callback.

## Retry với Backoff
See `templates/retry.ts`.

Exponential backoff: baseDelay * 2^attempt + jitter. Max 3 retries by default. Throws last error when exhausted.

## Logger (không blocking I/O)
See `templates/logger.ts`.

Async buffered writer with JSON output. Auto-flush every 5s or on buffer full (50). Handles exit and uncaughtException.

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "File watcher không cần debounce" | Save 1 file → fire 3 events → chạy 3 lần |
| "Retry fixed delay đủ" | Rate limit → retry ngay → lại rate limit → chết |
| "Logger đồng bộ cho đơn giản" | Block I/O mỗi log → chậm cả pipeline |

## Red Flags
- File watcher không debounce
- Retry không exponential backoff + jitter
- Logger blocking I/O

## Verification
- [ ] File watcher debounced > 100ms
- [ ] Retry: exp backoff baseDelay * 2^attempt + jitter
- [ ] Logger async, buffer, auto-flush
