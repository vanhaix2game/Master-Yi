---
name: webs-database
description: Database production — Prisma, PostgreSQL, indexing, query optimization, migration zero-downtime. Không N+1, query < 50ms.
---

# webs-database — Database

## Lược đồ Prisma (production)
User + Todo với index composite, cascade delete.
→ `templates/schema.prisma`

## Tối ưu Truy vấn (chống N+1)
Dùng `include`, `_count`, hoặc `$queryRaw` thay vì loop N+1.
→ `templates/query-optimization.ts`

## Phân trang (cursor-based)
`take: limit + 1` để phát hiện `hasMore`. Dùng `skip: 1, cursor` để lấy trang tiếp.
→ `templates/pagination.ts`

## Migration không gián đoạn
Add nullable → backfill batch → NOT NULL + default → index CONCURRENTLY.
→ `templates/migrations.sql`

## Giao dịch
`prisma.$transaction` cho atomic operations.
→ `templates/transactions.ts`

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "N+1 không đáng lo với ít data" | Khi scale, N+1 chết DB ngay |
| "Không cần index" | Full scan trên bảng lớn = timeout |
| "Migration tay cũng được" | Sai type, mất dữ liệu, downtime |

## Red Flags
- Query loop (N+1) trong API response
- Không index trên foreign key
- Migration không có rollback plan

## Verification
- [ ] include/_count dùng đúng, không N+1
- [ ] Index trên FK + field thường query
- [ ] Migration zero-downtime: add nullable → backfill → NOT NULL
