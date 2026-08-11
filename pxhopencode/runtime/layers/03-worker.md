# Tầng 3: Nhân công

**Trách nhiệm:** Thực thi các tác vụ theo domain. Mỗi worker có ĐÚNG MỘT công việc.

**Chủ quản:** `pxh-architect`, `pxh-expert`, `pxh-fix-bugs`, `pxh-qa`, `pxh-review-code`, `pxh-devops`, `pxh-ui-ux`

**Trách nhiệm duy nhất mỗi Worker:**

| Worker | Công việc |
|--------|----------|
| `pxh-architect` | Thiết kế kiến trúc, tech stack, schema |
| `pxh-expert` | Viết code production |
| `pxh-fix-bugs` | Chẩn đoán và sửa lỗi |
| `pxh-qa` | Chạy test, xác thực chất lượng |
| `pxh-review-code` | Rà soát bảo mật, hiệu năng, quy ước |
| `pxh-devops` | Lint, typecheck, build, đóng gói |
| `pxh-ui-ux` | UI/UX design cho web (React/Tailwind), game (Phaser/Three.js HUD), tool (CLI output) |

## Luồng

```mermaid
flowchart TD
    A[Nhận Task contract từ Tầng 2] --> B{"Xác thực:<br/>mục tiêu rõ ràng?<br/>đủ context?"}
    B --> C[Thực thi trong TARGET]
    C --> D{"Tự kiểm tra:<br/>output đáp ứng yêu cầu?<br/>code cũ vẫn chạy?"}
    D --> E[Tạo Result contract<br/>→ trả về Tầng 2]
    E --> F[Chạy memory reflection<br/>→ ghi .memory/ (định dạng compact)]
    F --> G[Gửi Event phản ánh<br/>→ Tầng 4]
```

## Quy tắc
- KHÔNG BAO GIỜ sửa code ngoài phạm vi TARGET.
- KHÔNG BAO GIỜ tự quyết định thử lại hoặc hủy bỏ — trả Result và để Điều phối quyết định.
- Ưu tiên thay đổi tối thiểu: thêm, không viết lại.
- Đọc `STATUS.md` trước khi bắt đầu bất kỳ task nào.
- Sau code project: luôn tạo `.gitignore` trong TARGET với `.opencode/` và `.github/` (xem template `_shared/templates/gitignore-template.md`)
- **BẮT BUỘC: SAU MỖI TASK, chạy MEMORY REFLECTION** — xem `## MEMORY REFLECTION` trong agent file → mở file `.memory/` tương ứng → append/merge → cập nhật `updated` timestamp. Dùng định dạng compact `runtime/memory/README.md`. Không bao giờ skip.
- Gửi `Event{reflection}` đến Tầng 4 sau mỗi task.
- Nếu không thể hoàn thành, trả về `Result{status:"failure"}` kèm lỗi rõ ràng, mức độ nghiêm trọng, và các bước tái hiện.

## Tham chiếu chéo
- **Contracts:** `runtime/contracts/README.md` — Task (đầu vào), Result (đầu ra), Event (phản ánh)
- **Chính sách — Thử lại:** `runtime/policies/retry.md` — Điều phối thử lại, không phải worker
- **Chính sách — Phục hồi:** `runtime/policies/recovery.md` — Điều phối phục hồi qua checkpoint
- **Chính sách — Phản ánh:** `runtime/policies/reflection.md` — Worker gửi phản ánh nhẹ sau mỗi task
- **Điều phối:** `runtime/layers/02-orchestration.md` — Gửi Task, nhận Result
- **Hạ tầng:** `runtime/layers/04-infrastructure.md` — Nhận Event, lưu phản ánh
