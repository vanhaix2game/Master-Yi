# Tầng 1: Giao diện

**Trách nhiệm:** Đầu vào cho mọi yêu cầu user. Phân tích prompt (classify), xác thực input, tạo Request contract cấu trúc, trình bày kết quả cuối cho user.

**Chủ quản:** `pxh-help`, user/system prompt

**Trách nhiệm duy nhất:** Phân tích prompt + xác thực đầu vào + định dạng đầu ra. Classification là phạm vi cho phép (được T2 triệu tập). Không bao giờ thực thi công việc domain (code, test, build).

## Luồng

```mermaid
flowchart TD
    A[Prompt thô] --> B{"Xác thực:<br/>có TARGET? mô tả rõ ràng?"}
    B -->|không hợp lệ| C[Trả lỗi xác thực<br/>yêu cầu user làm rõ]
    B -->|hợp lệ| D[Tạo Request contract<br/>→ gửi đến Tầng 2]
    D --> E[Nhận Response từ Tầng 2<br/>→ định dạng output cho user]
```

## Quy tắc
- Mọi Request PHẢI có trường `target`. Nếu thiếu, yêu cầu user chỉ định.
- Không bao giờ sửa đổi payload request — chỉ xác thực và chuyển tiếp.
- Định dạng đầu ra là hậu xử lý duy nhất được phép.

## Đầu vào → Đầu ra
| Đầu vào | Đầu ra |
|---------|--------|
| Text thô từ user | `Request` contract cấu trúc |
| `Response` contract | Tin nhắn đã định dạng cho user |

## Tham chiếu chéo
- **Contracts:** `runtime/contracts/README.md` — Request (đầu ra), Response (đầu vào)
- **Điều phối:** `runtime/layers/02-orchestration.md` — Nhận Request, trả Response
- **Chính sách — Phục hồi:** `runtime/policies/recovery.md` — Phục hồi request không hợp lệ
