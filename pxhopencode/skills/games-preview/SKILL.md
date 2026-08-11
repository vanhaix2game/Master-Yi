---
name: games-preview
description: Live preview real-time cho game HTML5 (Phaser 2D, Three.js 3D, Isometric) — Vite HMR, hot-reload khi code thay đổi, browser auto-open. Dùng sau khi code xong feature, trước polish pipeline.
---

# games-preview — Live Preview Real-Time

Biến terminal thành "AI Studio" — code xong thấy ngay, không cần refresh tay.

## Setup

```bash
npm init -y
npm install -D vite
```

Copy templates:
```bash
copy skills\games-preview\templates\vite.config.ts .
copy skills\games-preview\templates\index.html .
```

## Start Preview

```bash
npx vite --open --host
```

## Hot-Reload

Mỗi lần edit file `src/`, Vite auto reload browser trong < 50ms. Không mất state game.

| Engine | HMR behavior |
|--------|-------------|
| Phaser 2D | Hot reload scene — game state giữ nguyên |
| Three.js 3D | Hot reload module — scene tự rebuild |
| Isometric | Hot reload tilemap — map update tức thì |

## Tích hợp với Workflow

Sau mỗi phase code → chạy preview → test → fix → polish → verify:

```
code feature → npm run dev → thấy kết quả → fix nếu xấu → tiếp tục
```

## Scripts (thêm vào package.json)

```json
{
  "scripts": {
    "dev": "vite --open --host",
    "build": "vite build",
    "preview": "vite preview --open"
  }
}
```

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Không cần preview, code xong build rồi xem" | Mất 30 phút debug layout, animation sai |
| "Polished cuối cùng làm" | Preview cho thấy ngay cái gì cần polish |

## Red Flags
- Không chạy preview trước polish → layout sai không biết
- Vite config thiếu HMR → manual refresh
- index.html không mount đúng `#game` hoặc `#app`

## Verification
- [ ] `npx vite --open` mở browser được
- [ ] Edit file → browser auto reload
- [ ] Game chạy 60 FPS trên preview
