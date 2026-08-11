# Workflow Họp — Agents thảo luận & quyết định

> **LUẬT NGÔN NGỮ**: Nội dung họp, biên bản, quyết định = **tiếng Việt**. Code snippets, technical terms, decision matrix = **tiếng Anh**.
> **ENFORCEMENT GATE:** Phase meeting BẮT BUỘC `enforce run meeting` TRƯỚC, `enforce pass meeting` SAU.

Triệu tập agents thảo luận, phản biện, quyết định chung.

## Agents tham gia
`@pxh-architect` (tech stack/scale), `@pxh-expert` (khả thi/perf), `@pxh-qa` (testability), `@pxh-devops` (deploy/cost), `@pxh-save-history` (thư ký).

## Quy trình
1. **Khai mạc**: PM nêu chủ đề, mục tiêu, thời gian
2. **Trình bày**: Mỗi agent: Đề xuất → Lý do → Ưu/Nhược điểm → Alternatives
3. **Phản biện**: Cross-discussion với evidence
4. **Tổng hợp & Quyết định**: Biên bản (tham gia, đồng ý/phản đối, quyết định, lý do, action items)
5. **Persist**: `Event{type: decision}` → @pxh-save-history

## Ma trận quyết định
Khi nhiều option: đánh giá theo Time/Performance/Maintainability/Scalability/Chi phí (⭐1-3). Tổng điểm → chọn.

## Xử lý bất đồng
| Tình huống | Xử lý |
|-----------|-------|
| Ý kiến trái ngược | Mỗi agent đưa thêm evidence |
| Không consensus | PM quyết định, ghi dissent |
| User có ý kiến | Làm theo user |
| Quá phức tạp | Hỏi user thêm thông tin |

## Loop/Failover
- Không đạt consensus sau 3 vòng phản biện → PM quyết định, ghi dissent
- Meeting kéo dài > 15 phút → PM force decision, ghi remaining items
- Agent không phản hồi → skip, ghi absent, tiếp tục
- Quyết định sai → ghi ADR, reconvene trong session sau

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Không cần biên bản, ai cũng nhớ" | 1 tuần sau không ai nhớ quyết định |
| "Meeting không cần facilitator" | Agent tranh luận không hồi kết |
| "Không cần metrics, intuition đủ" | Quyết định không data = guess |

## Red Flags
- Meeting không có agenda trước
- Không ai ghi biên bản
- Không có decision matrix cho nhiều option

## Verification
- [ ] Agenda + timing set trước meeting
- [ ] Minutes: participants, decisions, rationale, action items
- [ ] Decision matrix: time/perf/maintain/scale/cost

Xem `_shared/architecture-overview.md` và `_shared/agent-listing.md`.
