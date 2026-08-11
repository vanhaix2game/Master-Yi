# Chính sách Phản ánh

## Tham chiếu chéo
- **Người tạo:** Mọi tầng (`runtime/layers/`) — Mỗi tầng gửi sự kiện phản ánh
- **Lưu trữ:** `runtime/layers/04-infrastructure.md` — Tầng 4 lưu mọi phản ánh
- **Người dùng:** `runtime/layers/02-orchestration.md` — Điều phối xem lại phản ánh trước task tương tự
- **Thử lại:** `runtime/policies/retry.md` — Thử lại nhiều lần kích hoạt phản ánh sự cố
- **Phục hồi:** `runtime/policies/recovery.md` — Phản ánh sau phục hồi ghi lại nguyên nhân gốc
- **Contracts:** `runtime/contracts/README.md` — Event{reflection} mang nội dung phản ánh

## Mức kích hoạt

| Mức | Khi nào | Loại | Đích xuất |
|-----|---------|------|-----------|
| Task hoàn tất | Sau mỗi Result Worker | Nhẹ | `.memory/{category}.json` (merge) |
| Phase hoàn tất | Sau mọi task trong phase | Tiêu chuẩn | `.memory/{category}.json` + Event→T4 |
| Workflow hoàn tất | Sau phase cuối | Đầy đủ | `.memory/` + STATUS.md + Event→T4 |
| Lỗi lặp lại | 3+ lỗi cùng phase | Sự cố | `.memory/bugs.json` + `.memory/stats.json` |

## Lược đồ

```json
{
  "type": "reflection",
  "trigger": "task|phase|workflow|incident",
  "scope": {
    "workflow": "company|web|game|ai|debug|release",
    "phase": "architect|code|fix|test|review|build",
    "task_id": "uuid"
  },
  "what_went_well": [],
  "what_went_wrong": [],
  "improvements": [],
  "decisions": [],
  "data": {
    "duration_ms": 0,
    "retries": 0,
    "errors": []
  }
}
```

## Quy tắc
1. `.memory/` là SINGLE SOURCE OF TRUTH cho mọi persistent knowledge. KHÔNG có dual-path.
2. Mọi task PHẢI tạo ít nhất một phản ánh nhẹ vào `.memory/`. Bỏ qua = violation.
3. Phản ánh là merge/append vào file JSON — không bao giờ xoá dữ liệu cũ.
4. Điều phối xem lại `.memory/` trước khi bắt đầu task tương tự trong tương lai.
5. Phản ánh sự cố PHẢI bao gồm phân tích nguyên nhân gốc.
6. File đích theo loại phản ánh:
   - `bugs.json` — bug/error details
   - `decisions.json` — ADR entries
   - `patterns.json` — code/design patterns phát hiện
   - `project.json` — framework, tools, conventions
   - `architecture.json` — modules, services, flows, tiers
   - `preferences.json` — style preferences, habits, language
   - `workflow.json` — workflow sequences, optimizations
   - `prompt.json` — repeated instructions, optimized templates
   - `vibe.json` — coding philosophy, preferred approach
   - `snapshots.json` — context snapshots (checkpoint)
   - `timeline.json` — session timeline, phase changes
   - `index.json` — memory_count, confidence, tags
   - `stats.json` — counters, timestamps, session tracking
7. Sau khi ghi `.memory/`, gửi `Event{type:"reflection", phase, category}` → T4 để T4 cập nhật STATUS.md nếu cần.
8. Nếu agent không ghi memory → xem như task incomplete.
