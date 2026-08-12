---
name: games-physics
description: Physics & collision — AABB, spatial hash, raycast, response. Tối ưu cho hàng ngàn object, không overshoot.
---

# games-physics — Physics & Collision

## AABB Collision (nhanh nhất)
`aabbOverlap` cho kiểm tra nhanh, `sweptAABB` chống xuyên object khi di chuyển nhanh.
Xem: `templates/aabb-collision.ts`

## Spatial Hash (va chạm hàng ngàn object)
Chia grid, chỉ kiểm tra object trong cell liền kề. Insert bằng AABB, query trả về Set<id>.
Xem: `templates/spatial-hash.ts`

## Raycast
Duyệt objects, tìm giao điểm sớm nhất với AABB dùng ray vs box test.
Xem: `templates/raycast.ts`

## Collision Response (không overshoot, không stuck)
Phân giải x và y riêng theo overlap nhỏ nhất, zero vận tốc khi chạm.
Xem: `templates/collision-response.ts`

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "AABB đơn giản là đủ, không cần swept" | Bullet bay nhanh xuyên object |
| "Spatial hash cho game nhỏ tốn thời gian" | 100 object mỗi frame check nhau = 4950 phép tính |
| "Raycast không cần" | Không aim, không bắn, không phát hiện va chạm xa |

## Red Flags
- Bullet xuyên object (thiếu sweptAABB)
- Object > 50 mà không spatial hash
- Collision response stuck trong tường

## Verification
- [ ] sweptAABB cho fast-moving objects
- [ ] Spatial hash nếu > 50 collidable objects
- [ ] Collision response: resolve riêng x/y, zero velocity on contact
