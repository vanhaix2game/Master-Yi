# Huong dan cai dat - pxhopencode

## Yeu cau he thong

| Yeu cau | Phien ban toi thieu |
|---------|-------------------|
| Node.js | >= 18 |
| npm | >= 9 |
| Git | >= 2.x |
| OS | Windows 10/11, macOS 12+, Ubuntu 20.04+ |

Kiem tra Node.js da cai chua:

```bash
node --version
npm --version
```

---

## Buoc 1 - Cai OpenCode CLI

```bash
npm install -g opencode-ai
```

Xac nhan cai thanh cong:

```bash
opencode --version
```

Tham khao them: https://opencode.ai/docs

---

## Buoc 2 - Nhung vao project cua ban

Di chuyen vao thu muc project, roi clone pxhopencode vao thu muc .opencode:

```bash
cd your-project
git clone https://github.com/kitajima2910/pxhopencode.git .opencode
```

---

## Buoc 3 - Khoi dong

### Windows

```bat
.opencode\start.bat
```

start.bat tu dong thuc hien:
1. Khoi tao thu muc .memory/ voi 13 file JSON
2. Merge cac entry can thiet vao .gitignore cua project
3. Xoa .opencode/.git/ de tranh nested git
4. Launch opencode

### macOS / Linux

```bash
cd .opencode
npm run setup
opencode
```

---

## Buoc 4 - Chon model

Sau khi opencode chay, goc lenh sau de chon model:

```
/models
```

Chon model free hoac local dang co tai provider cua ban. pxhopencode khong hardcode model ID.

---

## Buoc 5 - Bat dau dung

Go thang y tuong bang tieng Viet:

```
Xay dung web blog ca nhan voi React, co dark mode
```

He thong tu dong: phan tich -> chon workflow -> route agent -> code -> test -> fix.

---

## Cau truc sau khi cai

```
your-project/
+-- .opencode/
|   +-- opencode.json       <- Config agents, commands, skills
|   +-- start.bat           <- Khoi dong Windows
|   +-- agents/             <- 10 AI agents (T1-T4)
|   +-- runtime/            <- Engine, memory, contracts, policies
|   +-- workflows/          <- 8 workflow templates
|   +-- skills/             <- 50 skills
|   +-- _shared/            <- Shared templates & scripts
+-- .memory/                <- Memory engine (git-ignored, tu dong tao)
+-- .gitignore              <- Da duoc merge tu dong
```

---

## Cac lenh hay dung

| Lenh | Chuc nang |
|------|----------|
| /status | Xem memory + pipeline hien tai |
| /pipeline watch | Live cap nhat tung phase |
| /diff | Xem file da thay doi |
| /detect | Phat hien framework (React, Phaser, ...) |
| /rollback src/App.tsx | Hoan tac file ve commit cuoi |
| /secret set KEY=value | Luu secret vao .opencode/.env |
| /feedback noi dung | Ghi feedback vao memory |
| /context | Xem session context gan day |

---

## Chay tests

```bash
cd .opencode

# Tat ca tests (119 tests)
npm test

# Chi runtime engine
npm run test:engine

# Chi prompt compiler
npm run test:compiler

# Build + test toan bo
npm run verify
```

---

## Go loi thuong gap

**opencode khong tim thay sau khi cai:**
```bash
npm list -g opencode-ai
npm install -g opencode-ai
```

**JSON parse error khi khoi dong:**
```bash
node .opencode/runtime/bin/persist.mjs repair
```

**Pipeline bi ket:**
```bash
node .opencode/runtime/bin/pipeline.mjs reset
```

**Xem log chi tiet:**
```bash
node .opencode/runtime/bin/vibe.mjs status
```

---

## Go cai dat

```bash
# Windows
rmdir /s /q .opencode

# macOS / Linux
rm -rf .opencode
```

---

## Lien ket

- README chinh: README.md
- Trang thai va Changelog: STATUS.md
- OpenCode Docs: https://opencode.ai/docs