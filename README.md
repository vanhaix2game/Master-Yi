# Master-Yi

Bộ 2 thành phần **đồng bộ với nhau** dùng để vận hành "nhà máy AI" — 10 nhân viên AI chạy bằng CLI `opencode` (pxhopencode), điều khiển và giám sát qua web app **Flow Factory**.

```
┌─────────────────────────┐     ┌──────────────────────────────┐
│  FlowFactory  (folder 1)│     │  pxhopencode (folder 2)      │
│  Web UI + server Python │     │  opencode agents + skills    │
│  port 8765              │     │  10 nhân viên AI (pxh-*)     │
└───────────┬─────────────┘     └──────────────┬───────────────┘
            │                                  │
            │  gọi opencode_bridge.py          │
            │  → chạy `opencode run --dir`     │
            └──────────────────────────────────┘
```

- **Vai trò**: `FlowFactory` là "văn phòng + bộ não điều khiển"; `pxhopencode` là "đội ngũ lao động". Hai thư mục **phải nằm cạnh nhau** trong cùng repo và **được đồng bộ (sync) với nhau** khi cài trên máy khác.
- **Luồng hoạt động**: user nhập việc trên web → một trong 10 workflow (Pseudocode/PM/Architect/…) gọi script → `opencode_bridge.py` chạy `opencode run --agent pxh-* --dir <pxhopencode>` → kết quả lưu về `FlowFactory/data/outputs/<tên nhân viên>/...`.

## Hai thư mục

| Thư mục | Là gì |
|---------|-------|
| `FlowFactory/` | Web app + Python server. `server.py` (port 8765), `index.html` (đã dịch tiếng Việt), `data/workflows.json` (10 workflow → 10 nhân viên), `opencode_bridge.py` (cầu nối gọi opencode). |
| `pxhopencode/` | Đội ngũ nhân viên AI. `opencode.json` (config + 10 agents `pxh-pm`, `pxh-architect`, `pxh-ui-ux`, `pxh-qa`, …), `agents/*.md` (định nghĩa từng nhân viên), `skills/` (223 skill). |

## Liên kết giữa 2 thư mục (QUAN TRỌNG)

`FlowFactory/data/workflows.json` chứa **đường dẫn cứng** trỏ sang `pxhopencode`:

- Field `project_dir` default → `D:\Project\LV\MASTER\pxhopencode` (mỗi workflow)
- Script trong workflow → trỏ thẳng `...\FlowFactory\opencode_bridge.py --dir <pxhopencode path> --agent pxh-*`
- Output → `D:/Project/LV/MASTER/FlowFactory/data/outputs/<tên nhân viên>/...`

Khi cài trên máy khác: xem [HUONG_DAN_CAI_DAT.md](docs/HUONG_DAN_CAI_DAT.md) — phải **thay toàn bộ `D:\Project\LV\MASTER`** bằng đường dẫn máy mới.