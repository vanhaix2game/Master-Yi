# Tầng 4: Hạ tầng

**Trách nhiệm:** Lưu trạng thái, ghi sự kiện, lưu trữ artifact, phục vụ checkpoint phục hồi.

**Chủ quản:** `pxh-save-history`

**Trách nhiệm duy nhất:** Lưu trữ và truy xuất dữ liệu. Không bao giờ ra quyết định.

## Luồng

```mermaid
flowchart TD
    A[Nhận Event từ bất kỳ tầng nào] --> B["Xác định loại:<br/>phase_start / phase_end / error<br/>decision / checkpoint / reflection"]
    B --> C["Lưu vào vị trí phù hợp"]
    C --> D["STATUS.md: trạng thái<br/>.memory/{category}.json: phản ánh/ADR/bugs<br/>STATUS.md: checkpoint"]
    D --> E["Xác nhận<br/>→ Event{status: confirmed}"]
```

## Bảng lưu trữ

| Loại Event | Vị trí lưu | Định dạng |
|-----------|-----------|----------|
| phase_start / phase_end | STATUS.md | Markdown |
| error | STATUS.md + `.memory/bugs.json` | JSON |
| decision | `.memory/decisions.json` (ADR entry) | JSON |
| checkpoint | STATUS.md + `.memory/snapshots.json` | Markdown + JSON |
| reflection | `.memory/{category}.json` | JSON |
| task_result | STATUS.md (mục artifacts) | Markdown |

**Category mapping cho reflection events**: bugs → `bugs.json`, decisions → `decisions.json`, patterns → `patterns.json`, project → `project.json`, architecture → `architecture.json`, preferences → `preferences.json`, workflow → `workflow.json`, prompt → `prompt.json`, vibe → `vibe.json`, snapshots → `snapshots.json`, timeline → `timeline.json`, index → `index.json`, stats → `stats.json`.

## Tham chiếu chéo
- **Contracts:** `runtime/contracts/README.md` — Event (đầu vào), State (đầu ra)
- **Điều phối:** `runtime/layers/02-orchestration.md` — Gửi Event, yêu cầu State
- **Workers:** `runtime/layers/03-worker.md` — Gửi Event{reflection} sau tasks
- **Chính sách — Phục hồi:** `runtime/policies/recovery.md` — Hạ tầng phục vụ checkpoint cho phục hồi
- **Chính sách — Phản ánh:** `runtime/policies/reflection.md` — Hạ tầng lưu mọi bản ghi phản ánh

## Metrics & Alerting

| Metric | Source | Hành động |
|--------|--------|-----------|
| `phase_retry_count > 3` | Event{type:retry} | Ghi `alert` vào STATUS.md + báo user |
| `agent_failure_rate > 0.3` | Result{status:failure} | Đánh dấu worker degraded |
| `session_loop_count > 3` | Event{type:loop} | Force break → escalate user |
| `artifact_size > 100MB` | Event{type:artifact} | Cảnh báo dung lượng |
| `no_checkpoint > 30min` | Timer | Ghi cảnh báo, tự động checkpoint |

Mỗi metric ghi vào `Event{type:"alert", phase: "observability"}` → lưu `STATUS.md` mục `[Alerts]`.

## Quy tắc
- Append-only cho `.memory/` JSON (merge/append, không xoá). Ghi đè `STATUS.md` cho trạng thái hiện tại — đây là ngoại lệ duy nhất.
- Khi được yêu cầu checkpoint, serialize toàn bộ trạng thái Tầng 2 vào `STATUS.md`.
- Khi được yêu cầu phục hồi, trả về trạng thái checkpoint cuối cùng dưới dạng State contract.
- Mọi ghi phải idempotent nếu có thể.
