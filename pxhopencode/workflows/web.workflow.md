# Workflow Web — Phát triển web app

> **LUẬT NGÔN NGỮ**: UI text (nút, tiêu đề, label, placeholder, menu, error message) = **tiếng Việt**. Code, variable, comments, API routes = **tiếng Anh**.
> **KHÔNG START SERVER**: Tuyệt đối không tự ý chạy `npm run dev`, `npx vite`, `npx serve`, hay bất kỳ dev server nào. Chỉ hướng dẫn user cách chạy. Để user tự quyết định khi nào start server.
> **ENFORCEMENT GATE:** Mỗi phase BẮT BUỘC chạy `enforce run <phase>` TRƯỚC, `enforce pass/fail <phase>` SAU. Bỏ qua = violation.

## Bước 1: Tech stack

| Stack | Khi nào |
|-------|---------|
| React + Vite + TypeScript | Mặc định |
| Next.js 14+ App Router | Cần SEO/SSR |
| Tailwind CSS | Mặc định styling |
| SCSS / CSS Modules | Design system phức tạp / isolation |
| Next.js + Prisma + PostgreSQL | Mặc định full-stack |
| FastAPI + SQLAlchemy | Python project |
| Node.js + Express + Prisma | Node API thuần |
| tRPC | Type-safe end-to-end |

## Bước 2: Setup
```bash
npm create vite@latest ./ -- --template react-ts
npm install -D tailwindcss @tailwindcss/vite
```
`.gitignore`: `.opencode/`, `.github/`, `.gitignore`, `node_modules/`, `.env`, `dist/`, `*.log`. Nếu Next.js: thêm `.next/`, `out/`.
Favicon: `_shared/favicon-svg.md` — `[COLOR_1]=#6366f1, [COLOR_2]=#8b5cf6`

## Bước 3: Cấu trúc
```
src/components/ui/ → shared/ → pages/ → features/auth|billing/ → lib/ → hooks/ → types/ → styles/ → server/
```

## Bước 4: Flow code
```
Setup → Components UI → Pages → API Routes → Database → Auth → Deploy
```

## Post-code: chạy company workflow phase 7-11
Code xong → route qua `workflows/company.workflow.md` phase 7-11 (Test→Fix→Review→Build→Persist)

## Anti-Rationalization
| Excuse | Reality |
|--------|---------|
| "Setup thủ công, không cần template" | Thiếu .gitignore, thiếu favicon → lỗi commit |
| "Flow code không cần theo thứ tự" | API viết trước UI → không có component để test |
| "Security review sau" | Auth/XSS lỗi đi production = incident |

## Red Flags
- Không dùng template scaffold
- Component không dark mode
- API không validate input

## Verification
- [ ] Template scaffold dùng đúng stack
- [ ] .gitignore + favicon setup
- [ ] Security checklist chạy phase review

## Loop/Failover
- Setup fail (npm create vite lỗi) → retry với flag `--force`, max 2 lần
- TypeScript compile error → fix type → rebuild, max 3 lần
- Test fail → fix → rerun, max 3 lần
- Security review critical > 0 → fix → re-review, max 3 lần
- Quá 3 lần → báo user + snapshot state

### Security checklist (tích hợp trong phase review)
Khi `pxh-review-code` chạy, load `skills/webs-security/SKILL.md` + `security-checklist.ts` để kiểm tra: auth, XSS, CSRF, SQLi, rate limit, URL bypass, secure headers, dependency audit. Một pass, không thêm phase.
