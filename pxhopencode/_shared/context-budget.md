# Context Budget — Tối ưu Token & Quota

## Nguyên tắc vàng
- Token price phụ thuộc provider/model; không dùng một giá GPT cố định để ước lượng quota.
- Tối ưu theo thứ tự: **model requests → input context → tool output → output text**.
- Mục tiêu: một worker cho task low-risk, kiểm chứng theo rủi ro, không giảm quality gate quan trọng.

## Tiered Context Loading

| Tier | Tải khi | Nội dung | Token ước tính |
|------|---------|----------|---------------|
| **T0 — Boot** | Mỗi session | Agent role + core rules + TARGET | ~300 |
| **T1 — Phase** | Đầu phase | Workflow + contract schemas + policies | ~500 |
| **T2 — Skill** | Khi chọn skill | SKILL.md (không templates) | ~40/skill |
| **T3 — Template** | Khi code | Template files (lazy load) | ~100/template |

**Luật**: KHÔNG bao giờ load T2+T3 cùng lúc. Làm T2 → quyết định → T3 nếu cần.

## Quota-Saving Behaviors

### 1. Nói ít, làm nhiều
- Mỗi response tối đa 5 dòng text + tool calls cần thiết
- Không báo cáo "đã đọc file X" — just do it
- Không giải thích code — output kết quả là đủ

### 2. Request budget trước khi route
- Low risk: 1 worker, không meeting/QA/reviewer/historian
- Medium risk: tối đa 2 workers; QA chỉ khi code/runtime thay đổi
- High risk/release/security: tối đa 4 workers, ghi rõ lý do cho mỗi agent bổ sung
- Prompt compiler và CLI deterministic không tốn model request — ưu tiên chúng trước subagent

### 3. Batch operations
- Gom nhiều `read` / `glob` / `grep` trong 1 message
- Gom nhiều `edit` trong 1 message
- Không gọi tool 1 cái rồi chờ — làm song song

### 4. Fail fast
- Nếu task impossible sau 3 attempts → báo user NGAY, không thử thêm
- Nếu thiếu thông tin → hỏi 1 câu, không suy diễn
- Nếu TARGET trống → dừng, hỏi user

### 5. Cache awareness
- Đã đọc file nào trong session này → không đọc lại
- Đã biết project structure → không glob lại
- Template đã dùng → không đọc lại lần 2

### 6. Skill lazy loading
- KHÔNG đọc SKILL.md cho đến khi xác định chính xác skill cần dùng
- Dùng `_shared/skill-quickref.md` để chọn skill — 1 read thay vì 28
- Chỉ đọc template khi sắp code feature đó

## Token Budget per Phase

| Phase | Token budget | Cắt giảm nếu quá |
|-------|-------------|-----------------|
| analyze | 500 | Hỏi 1 câu, không phân tích dài |
| plan | 800 | Không viết document — bullet points |
| code | 4000 | Template > code tay, batch edits |
| test | 1000 | run > read, chỉ đọc test fail |
| fix | 1500 | Minimal diff, không refactor |
| review | 800 | Chỉ báo critical, bỏ suggestion |
| build | 500 | run scripts, không phân tích output dài |

## Conversation Budget

| Loại | Max rounds | Giới hạn |
|------|-----------|---------|
| Task execution | 5 rounds | Hết → tự động report |
| Meeting | 3 rounds/agent | Hết → auto consensus |
| Debug session | 8 rounds | Hết → escalate |
| User clarification | 1 question | Hết → assume + move on |

## Checklist trước mỗi tool call
- [ ] Tôi có cần đọc file này không, hay đã đọc rồi?
- [ ] Có thể gom call này với call khác không?
- [ ] Output có cần thiết không, hay tôi biết trước kết quả?
- [ ] Có template thay vì code tay không?
- [ ] Đây có phải attempt >3 không? (→ fail fast)
