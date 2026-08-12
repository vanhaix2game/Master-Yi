# Hướng dẫn cài đặt & sử dụng Master-Yi (Flow Factory + pxhopencode)

Hệ thống gồm **2 thư mục đồng bộ với nhau**, phải được cài chung trên cùng 1 máy và nằm cạnh nhau:

| Thư mục | Vai trò |
|---------|---------|
| `FlowFactory/` | Web app + server Python (điều khiển, hiển thị tiến độ, lưu kết quả) |
| `pxhopencode/` | Đội ngũ 10 nhân viên AI chạy bằng CLI `opencode` (nơi thực sự làm việc) |

Hai thư mục nói chuyện với nhau qua file `FlowFactory/opencode_bridge.py`: workflow trên web gọi script → bridge chạy `opencode run --agent pxh-* --dir <đường dẫn pxhopencode>` → kết quả trả về lưu trong `FlowFactory/data/outputs/`.

---

## 1. Yêu cầu hệ thống

- Windows 10/11
- Python **3.12** (đã test với `C:\Users\CX-PC064\AppData\Local\Programs\Python\Python312\python.exe`)
- Node.js ≥ 18 (để cài opencode CLI)
- Đã cài **opencode CLI** toàn cục: `npm install -g opencode-ai`

---

## 2. Cài đặt

### 2.1 Clone repo

```powershell
git clone https://github.com/vanhaix2game/Master-Yi.git
cd Master-Yi
```

Sau bước này bạn có cả 2 thư mục `FlowFactory/` và `pxhopencode/` trong `Master-Yi/`.

### 2.2 Cài opencode CLI

```powershell
npm install -g opencode-ai
opencode --version   # kiểm tra
```

### 2.3 Thay đường dẫn máy cũ → máy mới (BẮT BUỘC)

Code hiện đang ghi cứng đường dẫn `D:\Project\LV\MASTER` (máy của tác giả). Trên máy khác phải thay bằng đường dẫn của bạn.

**Cách nhanh**: dùng PowerShell thay toàn bộ (đổi `C:\MASTER` thành thư mục thật của bạn):

```powershell
# trong thư mục Master-Yi
$old = 'D:\Project\LV\MASTER'
$new = 'C:\MASTER'
Get-ChildItem -Recurse -File -Include *.json,*.py,*.bat,*.cmd,*.md |
  Where-Object { $_.FullName -notmatch '\\\.git\\' -and $_.FullName -notmatch '\\node_modules\\' } |
  ForEach-Object {
    $c = Get-Content -Raw -LiteralPath $_.FullName
    if ($c -match [regex]::Escape($old)) {
      $c = $c -replace [regex]::Escape($old), $new
      Set-Content -LiteralPath $_.FullName -Value $c -NoNewline -Encoding utf8
      Write-Host "Fixed: $($_.FullName)"
    }
  }
```

**Các file quan trọng chứa path cứng cần kiểm tra**:
- `FlowFactory/data/workflows.json` → `project_dir` + script + output path (10 workflow)
- `FlowFactory/data/app_settings.json` → `content_root`
- `FlowFactory/opencode_bridge.py` → `OPENCODE_CMD_CANDIDATES` (đường dẫn tới opencode.exe)
- `FlowFactory/Flow Factory.bat` → biến `REPO`
- `FlowFactory/bin/python3.cmd` → đường dẫn python (nếu có)

> Nếu bạn cài opencode ở vị trí khác, sửa danh sách `OPENCODE_CMD_CANDIDATES` trong `opencode_bridge.py` (hoặc chỉ cần để `opencode` nằm trong `PATH`).

---

## 3. Khởi động

### Cách 1 — 1 click

Chạy `FlowFactory\Flow Factory.bat`. Script kiểm tra port 8765, tự khởi động server nếu chưa có, rồi mở trình duyệt.

### Cách 2 — thủ công

```powershell
cd FlowFactory
set FLOWFACTORY_DATA_DIR=D:\path\to\Master-Yi\FlowFactory\data
set FLOWFACTORY_DEV_LICENSE=1
set AUTOMONEY_NO_BROWSER=1
set PYTHONIOENCODING=utf-8
python server.py
```

Mở trình duyệt: http://127.0.0.1:8765/

---

## 4. Sử dụng

1. Mở http://127.0.0.1:8765/
2. Chọn **1 trong 10 nhân viên** (workflow): PM, Architect, UI/UX, QA, Review Code, Fix Bugs, DevOps, Expert, Help, Save History.
3. Nhập nhiệm vụ (task) vào ô của nhân viên.
4. Nhấn chạy — web hiển thị trạng thái "nhân viên đang làm việc" live.
5. Script gọi `opencode_bridge.py` → opencode chạy agent `pxh-*` trong `pxhopencode`.
6. Kết quả lưu tại `FlowFactory/data/outputs/<tên nhân viên>/...` (gồm `result.md`, `result.json`, `opencode_raw.log`).

## 5. Lưu ý

- **Hai thư mục phải đi cùng nhau** — không tách rời, không đổi tên `pxhopencode` mà không sửa path trong `workflows.json`.
- `FLOWFACTORY_DEV_LICENSE=1` để chạy không cần license (bản dev).
- Nếu lỗi "Call was rejected by callee" hoặc lỗi chạy script: mở file log `FlowFactory/logs/server.log` xem chi tiết.
- Đổi port: sửa trong `server.py` (mặc định 8765).
- Backup file gốc chưa dịch: `FlowFactory/index.html.bak`.
- Mỗi lần cập nhật code mới: `git pull` (cả 2 thư mục, vì trong cùng 1 repo).

## 6. Khắc phục sự cố nhanh

| Lỗi | Cách xử lý |
|-----|-----------|
| `'python3' is not recognized` | Máy không có python3; dùng `python` hoặc sửa biến môi trường |
| `'opencode' is not recognized` | Chưa cài opencode hoặc chưa thêm vào PATH |
| Server không mở được | Xem `FlowFactory/logs/server.log`; kiểm tra port 8765 còn trống |
| Kết quả không có / trống | Kiểm tra `data/outputs/<tên nhân viên>/result.json` để xem lỗi của agent |
