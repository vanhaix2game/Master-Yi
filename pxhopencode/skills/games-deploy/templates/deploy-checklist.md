# Pre-deploy Checklist

## Build
- [ ] `npm run build` success, không lỗi
- [ ] `dist/` không quá 10MB (game HTML5)
- [ ] Assets compressed (texture atlas, Draco 3D, mp3/ogg audio)
- [ ] Source maps tắt trong production build

## PWA
- [ ] Manifest đúng `start_url`, `display: fullscreen`
- [ ] Icon 192×192 + 512×512
- [ ] Service worker cached assets
- [ ] Lighthouse PWA ≥ 90

## Performance
- [ ] FPS ≥ 55 desktop
- [ ] FPS ≥ 30 mobile
- [ ] Draw calls < 200 (3D)
- [ ] Game load < 3s trên 3G (emulate Slow 3G)
- [ ] Memory: không leak sau 5 phút chơi

## Quality
- [ ] Không console error
- [ ] Touch controls hoạt động
- [ ] Audio play khi user interaction đầu tiên
- [ ] Responsive: 800×600, 375×667, 1024×768

## Deploy target
- [ ] GitHub Pages: repo settings → Pages → source GitHub Actions
- [ ] Itch.io: thêm `BUTLER_API_KEY`, `ITCH_USER`, `ITCH_GAME` vào GitHub Secrets
- [ ] Vercel: `vercel --prod` hoặc kết nối GitHub repo
