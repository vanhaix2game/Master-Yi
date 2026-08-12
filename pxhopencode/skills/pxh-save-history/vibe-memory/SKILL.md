---
name: vibe-memory
description: Vibe Coding Memory Engine — dùng khi cần tra cứu/lưu knowledge project. Tự động load ở mỗi session.
---

# Vibe Coding Memory Engine Skill

> **Loaded via** `runtime/memory/README.md` (instruction) — file này là skill reference để tra cứu API cụ thể.

## Khi nào load skill này

Skill này đã được load tự động qua instruction. Chỉ cần load thủ công khi:
- Cần tra cứu API memory cụ thể (`memory:query`, `memory:update`, etc.)
- Cần init lại `.memory/` do lỗi

## API

| Lệnh | Mục đích |
|------|----------|
| `memory:query <intent> <target>` | Semantic search — gọi TRƯỚC mỗi task để lấy context |
| `memory:update <category> <data>` | Ghi/merge vào category — gọi SAU task |
| `memory:snapshot` | Save context snapshot — gọi khi kết thúc session |
| `memory:reflect` | Chạy reflection sau task — tự động trích xuất knowledge |
| `memory:get <category>` | Đọc toàn bộ category (khi cần deep context) |

## Startup checklist (đã có trong instruction)

```
[ ] Xác định workspace_root + memory_root theo mode
[ ] .memory/ tồn tại? (standalone: workspace_root/.memory/, embedded: .opencode/.memory/) → load index
[ ] .memory/ chưa tồn tại? → chạy init script (script tự detect mode)
[ ] Nếu script lỗi → init thủ công từ runtime/memory/init.json → copy vào đúng thư mục .memory/
[ ] Task intent → dùng Prompt Compiler IR → lookup intent→categories
[ ] Task → reflection → update memory
```

## Anti-Rationalization

| Excuse | Reality |
|---------|---------|
| "Memory không cần, tôi tự nhớ" | Mỗi session mới = mất context cũ |
| "Tạo .memory/ thủ công cũng được" | Bước này phải tự động, không cần user |
| "Load hết memory cho chắc" | Tốn token, chậm startup |

## Red Flags

- `.memory/` không tồn tại (standalone: workspace_root, embedded: .opencode/) → chưa chạy startup step
- Index có confidence = 0 → chưa có dữ liệu, cần học dần
- Không chạy reflection sau task → memory không tiến hóa
- Dùng sai path cho mode (vd: dùng `.opencode/.memory/` ở standalone mode)

## Verification

- [ ] .memory/ tồn tại ở đúng path theo mode (standalone: workspace_root, embedded: .opencode/)
- [ ] index.json loaded với memory_count + confidence
- [ ] Intent matched ≥ 1 category (fallback: unknown)
- [ ] Injected ≤ 3 categories, ≤ 1 dòng/category
- [ ] Confidence filter applied (skip < 60)
- [ ] Reflection executed và .memory/ updated sau task
