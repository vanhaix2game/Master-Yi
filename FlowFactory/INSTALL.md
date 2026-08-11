# Huong dan cai dat - Flow Factory

## Yeu cau he thong

| Yeu cau | Chi tiet |
|---------|---------|
| Python | >= 3.8 |
| OS | Windows 10/11, macOS 12+, Ubuntu 20.04+ |
| Trinh duyet | Chrome, Firefox, Safari, Edge (phien ban moi nhat) |

Kiem tra Python da cai chua:

```bash
python3 --version
```

---

## Cach 1 - Cai chinh thuc (macOS / Linux) - Khuyen nghi

```bash
curl -fsSL https://flowfactory-updates.pages.dev/install.sh | sh
```

Script tu dong:
1. Tai phien ban moi nhat tu Cloudflare Pages
2. Xac minh SHA-256 checksum
3. Cai vao ~/.flowfactory/
4. Khoi dong dich vu va mo trinh duyet tai http://127.0.0.1:8765/

Sau khi cai, cac lenh quan ly:

```bash
~/.local/bin/flowfactory start      # Khoi dong
~/.local/bin/flowfactory stop       # Dung
~/.local/bin/flowfactory update     # Cap nhat len phien ban moi
~/.local/bin/flowfactory version    # Xem phien ban hien tai
~/.local/bin/flowfactory uninstall  # Go cai dat (giu lai du lieu)
```

---

## Cach 2 - Cai thu cong tu source (Windows / Dev)

### Buoc 1 - Tai source

```bash
git clone https://github.com/gda-ai-agent/factory-flow.git
cd factory-flow
```

Hoac tai ZIP tu GitHub: Code -> Download ZIP, giai nen, doi ten thanh factory-flow.

### Buoc 2 - Nho Agent cai dat

Keo thu muc project vao cua so chat cua Agent (Claude, Cursor, Kiro...), roi paste doan sau:

```
Hay giup toi cai dat va khoi dong Flow Factory.

Thu muc project: [duong dan thu muc factory-flow]

Lam tuan tu:
1. Xac nhan he dieu hanh va Python 3 co san khong.
2. Kiem tra xem co duong dan tuyet doi cua may khac trong project khong, sua thanh duong dan may toi.
3. Dat thu muc output mac dinh la ~/Desktop/FlowFactory.
4. Dam bao start_windows.cmd (Windows) hoac factory_flow_start.command (macOS) co the chay duoc.
5. Khoi dong dich vu local, khong cai dich vu ngoai chua duoc cap phep.
6. Xac nhan http://127.0.0.1:8765/ mo duoc va khong co loi JavaScript.
7. Khong commit Token, Webhook, mat khau hay du lieu nhay cam len GitHub.
8. Sau khi xong, cho toi biet: cach khoi dong, cach dung, vi tri file cau hinh va thu muc output.
```

### Buoc 3 - Khoi dong thu cong

**Windows:**
```cmd
start_windows.cmd
```

**macOS:**
```bash
double-click factory_flow_start.command
# Hoac tu terminal:
python3 server.py
```

**Linux:**
```bash
python3 server.py
```

Mo trinh duyet tai: http://127.0.0.1:8765/

---

## Cau truc thu muc

```
factory-flow/
+-- index.html                   <- Giao dien web (single-page)
+-- server.py                    <- HTTP server local (:8765)
+-- workflows.json               <- Cau hinh nhan vien & luong cong viec
+-- app_settings.json            <- Cau hinh chung (duong dan output, ...)
+-- start_windows.cmd            <- Khoi dong Windows
+-- factory_flow_start.command   <- Khoi dong macOS
+-- stop.command                 <- Dung dich vu (macOS)
+-- autostart.py                 <- Tu dong khoi dong khi dang nhap
+-- scheduler.py                 <- Chay luong theo lich
+-- updater.py                   <- Cap nhat phien ban
+-- licensing.py                 <- Xu ly ban quyen
+-- data/                        <- Du lieu runtime (git-ignored)
+-- logs/                        <- Log dich vu (git-ignored)
+-- scripts/                     <- Scripts quan tri
```

---

## Cau hinh ban dau

### Dat thu muc output

Mo http://127.0.0.1:8765/ -> Cai dat (goc phai tren) -> dat duong dan luu noi dung.

Mac dinh: ~/.flowfactory/data/outputs

### Ket noi Agent (tuy chon)

Vao Cai dat -> Ket noi Agent, nhap dia chi Webhook cua agent (Hermes, n8n, Make, ...).

Khong co Webhook van dung duoc - dung tinh nang "Sao chep nhiem vu cho Agent".

### Nhap ban quyen (neu co)

Nhan bieu tuong khoa o dau trang -> nhap ma ban quyen -> Kich hoat.

- Mien phi: dung day du nhan vien dau tien
- Tra phi: mo khoa tat ca nhan vien

---

## Su dung co ban

1. Mo http://127.0.0.1:8765/
2. Chon nhan vien (employee) o thanh ben trai
3. Nhap tham so dau vao o tab Nhap
4. Nhan Khoi dong tat ca de chay toan bo luong
5. Xem ket qua o tab Xuat

### Dat lich tu dong

Nhan bieu tuong dong ho o dau danh sach luong -> chon tan suat -> Luu.

---

## Cap nhat

### Qua giao dien web

Cai dat -> Cap nhat phien ban -> Kiem tra cap nhat -> Tai va cai dat

### Qua terminal

```bash
flowfactory update
```

---

## Go loi thuong gap

**Cong 8765 da bi chiem:**
```bash
# macOS / Linux
lsof -i :8765
kill -9 <PID>

# Windows
netstat -ano | findstr :8765
taskkill /PID <PID> /F
```

**Trang khong mo duoc sau khi khoi dong:**
- Doi 3-5 giay roi thu lai
- Xem log trong thu muc logs/ trong thu muc cai dat

**Loi SSL / chung chi (macOS):**
```bash
/Applications/Python\ 3.x/Install\ Certificates.command
```

**Dich vu khong tu khoi dong sau khi reboot:**
Vao Cai dat -> Khoi dong he thong -> bat "Tu dong khoi dong khi dang nhap"

---

## Go cai dat

Giu lai du lieu:
```bash
flowfactory uninstall
```

Xoa toan bo bao gom du lieu va cau hinh:
```bash
flowfactory uninstall --purge
# Nhap DELETE de xac nhan
```

---

## Lien ket

- README chinh: README.md
- Changelog: CHANGELOG.md
- Phien ban hien tai: VERSION
- Quan tri ban quyen: docs/license-admin.md
- Website: https://flowfactory.xtoolbot.com/