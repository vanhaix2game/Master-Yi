# Game H5 3D — Implementation

## Tổng quan
Skill phát triển game 3D HTML5 sử dụng **Three.js** (ưu tiên) hoặc Babylon.js. Phù hợp cho: FPS, third-person, racing, simulation 3D, open-world.

> **Bước 0: Download assets** — Chạy script ở `skills/games-assets/SKILL.md` trước. Dùng GLB models từ Poly Pizza / Sketchfab / Quaternius, fallback procedural geometry nếu không có mạng.

## Setup Three.js

Xem: `templates/setup.sh`
Xem: `templates/main.ts`

## Lighting

Xem: `templates/lighting.ts`

## Ground / Terrain

Xem: `templates/terrain.ts`

## Asset Loader (GLB + fallback)

Xem: `templates/AssetManager3D.ts`

## Animation Controller (3D)

Xem: `templates/AnimationController3D.ts`

## Player (Third-Person + animation)

Xem: `templates/Player3D.ts`

## First-Person Controls

Xem: `templates/FirstPersonController.ts`

## Shooting System

Xem: `templates/ShootingSystem.ts`

## Collision Detection (Raycaster)

Xem: `templates/CollisionSystem.ts`

## Enemy (FSM + chase)

Xem: `templates/Enemy3D.ts`

## Game Loop

Xem: `templates/GameLoop.ts`

## Performance Optimization

Xem: `templates/optimization.ts`

## Audio (dùng chung với 2D)

Xem: `templates/audio-reference.ts`

## Build

Xem: `templates/build.sh`

## Tham khảo
- Assets: `skills/games-assets/SKILL.md`
- Design: `game-design-h5-3d.md`
- Main game skill: `skills/games-core/SKILL.md`
