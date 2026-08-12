---
name: games-optimization
description: Performance optimization cho game H5 — object pool, instancing, LOD, GC tuning, profiling. 60 FPS trên mobile.
---

# games-optimization — Performance

## Object Pool (generic, zero GC)
Pool generic cho bất kỳ type nào, acquire/release, hỗ trợ pre-allocate và reset callback.
Xem: `templates/object-pool.ts`

## Instancing (Three.js — hàng ngàn object)
InstancedMesh với DynamicDrawUsage, setTransform/setColor cho từng instance, batch update.
Xem: `templates/instancing.ts`

## LOD (Level of Detail)
Chuyển mesh theo khoảng cách camera, sắp xếp theo distance. Fallback về LOD cuối nếu quá xa.
Xem: `templates/lod.ts`

## Frustum Culling (manual)
Frustum từ camera projection × view matrix, kiểm tra sphere intersection.
Xem: `templates/frustum-culling.ts`

## GC Tuning
Reuse Vector3/Matrix4, array pool cho particle, batch DOM operations trong rAF.
Xem: `templates/gc-tuning.ts`

## Profiling (FPS + Memory)
Đếm FPS mỗi giây, track heap memory trend (Chrome), phát hiện memory leak.
Xem: `templates/profiler.ts`

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Object pool khó, tạo mới cho nhanh" | GC pause = giật mỗi khi object chết |
| "Mobile chậm tại thiết bị, không phải code" | Pool + LOD = 2x FPS trên mobile |
| "Profiler sau" | Không biết bottleneck ở đâu |

## Red Flags
- new Vector3/Matrix4 trong update loop
- Không object pool cho bullet/particle
- FPS desktop < 55 hoặc mobile < 30

## Verification
- [ ] Object pool cho mọi object tạo/thường xuyên
- [ ] InstancedMesh cho repetitive 3D objects
- [ ] Profiler xác nhận FPS ≥ 55 (desktop) / ≥ 30 (mobile)
