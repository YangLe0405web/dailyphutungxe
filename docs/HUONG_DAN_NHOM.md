# 📋 HƯỚNG DẪN LÀM VIỆC NHÓM — MOTOSHOP CRM BACKEND

> **Repo:** https://github.com/YangLe0405web/dailyphutungxe.git
> **Ngày cập nhật:** 18/09/2026
> **Người viết:** Giang (Team Lead)

---

## MỤC LỤC

1. [Yêu cầu phần mềm](#1-yêu-cầu-phần-mềm)
2. [Clone project về máy](#2-clone-project-về-máy)
3. [Chạy Docker SQL Server](#3-chạy-docker-sql-server)
4. [Khởi tạo Database](#4-khởi-tạo-database)
5. [Build & chạy Backend](#5-build--chạy-backend)
6. [Phân chia công việc theo Model](#6-phân-chia-công-việc-theo-model)
7. [Hướng dẫn code Model & Controller](#7-hướng-dẫn-code-model--controller)
8. [Test API trên Swagger](#8-test-api-trên-swagger)
9. [Git Push lên GitHub](#9-git-push-lên-github)
10. [⚠️ LƯU Ý QUAN TRỌNG](#10-️-lưu-ý-quan-trọng)

---

## 1. Yêu cầu phần mềm

Đảm bảo máy đã cài đặt:

| Phần mềm | Phiên bản | Tải về |
|-----------|-----------|--------|
| **Docker Desktop** | Mới nhất | https://www.docker.com/products/docker-desktop/ |
| **.NET SDK** | 10.0+ | https://dotnet.microsoft.com/download |
| **Git** | Mới nhất | https://git-scm.com/downloads |
| **Visual Studio Code** hoặc **Visual Studio** | Mới nhất | https://code.visualstudio.com/ |

> 💡 Kiểm tra nhanh bằng terminal:
> ```bash
> docker --version
> dotnet --version
> git --version
> ```

---

## 2. Clone project về máy

```bash
# Clone repo
git clone https://github.com/YangLe0405web/dailyphutungxe.git

# Vào thư mục project
cd dailyphutungxe

# Chuyển sang nhánh develop
git checkout develop

# Tạo nhánh riêng cho mình (xem bảng phân công ở Mục 6)
git checkout -b feature/<ten-ban>-<model>
```

**Ví dụ tên nhánh theo từng người:**

| Thành viên | Lệnh tạo nhánh |
|------------|----------------|
| Phương | `git checkout -b feature/phuong-phutung-xemau` |
| Minh | `git checkout -b feature/minh-donhang-lichhen` |
| Nghĩa | `git checkout -b feature/nghia-phanhoi-khaosat` |
| Lộc | `git checkout -b feature/loc-staff-revenue` |

---

## 3. Chạy Docker SQL Server

**Bước 1:** Mở Docker Desktop, đợi nó chạy xong (icon xanh lá).

**Bước 2:** Mở terminal tại thư mục gốc project, chạy:

```bash
docker compose up -d
```

**Bước 3:** Kiểm tra container đang chạy:

```bash
docker ps
```

Phải thấy container `crm_sql_server` với port `14333`:

```
NAMES              STATUS         PORTS
crm_sql_server     Up X minutes   0.0.0.0:14333->1433/tcp
```

> ⚠️ Nếu lỗi port 14333 đã bị chiếm, kiểm tra Docker Desktop hoặc đổi port trong `docker-compose.yml`.

---

## 4. Khởi tạo Database

Chạy file `init.sql` để tạo database + bảng + dữ liệu mẫu:

**Cách 1 — Dùng lệnh Docker:**

```bash
docker exec -i crm_sql_server /opt/mssql-tools2/bin/sqlcmd -S localhost -U sa -P "YourStrong@Password123" -i /init.sql
```

**Cách 2 — Dùng Azure Data Studio / SSMS:**

1. Kết nối: `Server = localhost,14333` | `User = sa` | `Password = YourStrong@Password123`
2. Mở file `init-db/init.sql`
3. Bấm Execute (F5)

**Kiểm tra đã có database chưa:**

```bash
docker exec -it crm_sql_server /opt/mssql-tools2/bin/sqlcmd -S localhost -U sa -P "YourStrong@Password123" -Q "SELECT name FROM sys.databases WHERE name = 'CRM_XeMayPhuTung'"
```

---

## 5. Build & chạy Backend

```bash
# Vào thư mục Backend
cd CrmBackend

# Restore packages
dotnet restore

# Build kiểm tra lỗi
dotnet build

# Chạy server
dotnet run
```

Nếu thành công sẽ thấy:

```
Now listening on: http://localhost:5208
Application started. Press Ctrl+C to shut down.
```

👉 Mở trình duyệt: **http://localhost:5208/swagger** để xem API

---

## 6. Phân chia công việc theo Model

> 📊 Tham khảo file `crm-frontend/BANG_MODEL_CHIA_VIEC.csv` để xem chi tiết

| STT | Model | Thành viên | Deadline | Ưu tiên |
|:---:|-------|:----------:|:--------:|:-------:|
| 1 | **Customer** | ✅ Giang (XONG) | 21/9 | P0 |
| 2 | **Vehicle** (xe KH) | ✅ Giang (XONG) | 21/9 | P0 |
| 3 | **ShowroomVehicle** (xe mẫu) | Phương | 23/9 | P1 |
| 4 | **Part** (phụ tùng) | Phương | 23/9 | P0 |
| 5 | **CartItem / Cart** | Minh | 25/9 | P1 |
| 6 | **Order** (đơn hàng) | Minh | 25/9 | P0 |
| 7 | **Appointment** (lịch hẹn) | Minh | 25/9 | P1 |
| 8 | **Feedback** (phản hồi) | Nghĩa | 27/9 | P2 |
| 9 | **Survey & Question** | Nghĩa | 27/9 | P1 |
| 10 | **SurveyResponse** | Nghĩa | 27/9 | P1 |
| 11 | **StaffAccount & AdminRole** | Lộc | 29/9 | P0 |
| 12 | **RevenueAnalytics** | Lộc | 29/9 | P0 |

---

## 7. Hướng dẫn code Model & Controller

### 📁 Bạn CHỈ cần tạo/sửa file trong 2 thư mục này:

```
CrmBackend/
├── Models/          ← Tạo file .cs ở đây
│   ├── TaiKhoan.cs      (✅ có sẵn)
│   ├── KhachHang.cs     (✅ có sẵn)
│   ├── XeKhachHang.cs   (✅ có sẵn)
│   ├── PhuTung.cs       ← Phương tạo
│   ├── SanPhamXe.cs     ← Phương tạo
│   ├── DonHang.cs       ← Minh tạo
│   ├── LichHen.cs       ← Minh tạo
│   ├── PhanHoi.cs       ← Nghĩa tạo
│   └── KhaoSat.cs       ← Nghĩa tạo
│
├── Controllers/     ← Tạo file .cs ở đây
│   ├── KhachHangController.cs      (✅ có sẵn - KHÔNG SỬA)
│   ├── XeKhachHangController.cs    (✅ có sẵn - KHÔNG SỬA)
│   ├── DonHangController.cs        ← Minh cải tiến
│   ├── LichHenController.cs        ← Minh cải tiến
│   ├── PhuTungController.cs        ← Phương tạo
│   ├── XeMauController.cs          ← Phương tạo
│   ├── PhanHoiController.cs        ← Nghĩa tạo
│   ├── KhaoSatController.cs        ← Nghĩa tạo
│   └── TaiKhoanController.cs       ← Lộc tạo
```

### 📝 Mẫu code tạo Model

```csharp
// File: Models/PhuTung.cs
namespace CrmBackend.Models
{
    public class PhuTung
    {
        public int MaPhuTung { get; set; }
        public string TenPhuTung { get; set; } = "";
        public string LoaiPhuTung { get; set; } = "";
        public decimal DonGia { get; set; }
        public int BaoHanhThang { get; set; }
    }

    // DTO cho POST (thêm mới)
    public class PhuTungCreateDto
    {
        public string TenPhuTung { get; set; } = "";
        public string LoaiPhuTung { get; set; } = "";
        public decimal DonGia { get; set; }
        public int BaoHanhThang { get; set; }
    }
}
```

### 📝 Mẫu code tạo Controller

```csharp
// File: Controllers/PhuTungController.cs
using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhuTungController : ControllerBase
    {
        private readonly IDbConnection _db;

        public PhuTungController(IDbConnection db)
        {
            _db = db;
        }

        // GET: api/PhuTung → Lấy danh sách
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sql = "SELECT * FROM PHU_TUNG ORDER BY MaPhuTung";
            var result = await _db.QueryAsync<PhuTung>(sql);
            return Ok(result);
        }

        // GET: api/PhuTung/5 → Chi tiết
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var sql = "SELECT * FROM PHU_TUNG WHERE MaPhuTung = @Id";
            var item = await _db.QueryFirstOrDefaultAsync<PhuTung>(sql, new { Id = id });
            if (item == null) return NotFound(new { message = "Không tìm thấy" });
            return Ok(item);
        }

        // POST: api/PhuTung → Thêm mới
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PhuTungCreateDto dto)
        {
            var sql = @"
                INSERT INTO PHU_TUNG (TenPhuTung, LoaiPhuTung, DonGia, BaoHanhThang)
                VALUES (@TenPhuTung, @LoaiPhuTung, @DonGia, @BaoHanhThang);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";
            var id = await _db.ExecuteScalarAsync<int>(sql, dto);
            return CreatedAtAction(nameof(GetById), new { id }, new { id, message = "Thêm thành công!" });
        }

        // PUT: api/PhuTung/5 → Cập nhật
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PhuTungCreateDto dto)
        {
            var sql = @"
                UPDATE PHU_TUNG 
                SET TenPhuTung = @TenPhuTung, LoaiPhuTung = @LoaiPhuTung, 
                    DonGia = @DonGia, BaoHanhThang = @BaoHanhThang
                WHERE MaPhuTung = @Id";
            var rows = await _db.ExecuteAsync(sql, new { Id = id, dto.TenPhuTung, dto.LoaiPhuTung, dto.DonGia, dto.BaoHanhThang });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy" });
            return Ok(new { message = "Cập nhật thành công!" });
        }

        // DELETE: api/PhuTung/5 → Xóa
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var sql = "DELETE FROM PHU_TUNG WHERE MaPhuTung = @Id";
            var rows = await _db.ExecuteAsync(sql, new { Id = id });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy" });
            return Ok(new { message = "Đã xóa!" });
        }
    }
}
```

---

## 8. Test API trên Swagger

**Bước 1:** Chạy `dotnet run` trong thư mục `CrmBackend`

**Bước 2:** Mở trình duyệt → **http://localhost:5208/swagger**

**Bước 3:** Click vào endpoint muốn test → bấm **Try it out**

**Bước 4:** Nhập giá trị JSON (nếu là POST/PUT) → bấm **Execute**

**Bước 5:** Kiểm tra kết quả:
- ✅ `200` = Thành công
- ✅ `201` = Tạo mới thành công
- ❌ `400` = Sai dữ liệu đầu vào
- ❌ `404` = Không tìm thấy
- ❌ `500` = Lỗi server (kiểm tra SQL hoặc connection)

### Ví dụ JSON test cho từng model:

**Phụ tùng (Phương):**
```json
{
  "tenPhuTung": "Nhớt Motul 10W-40",
  "loaiPhuTung": "Nhớt",
  "donGia": 185000,
  "baoHanhThang": 6
}
```

**Đơn hàng (Minh):**
```json
{
  "maKH": 1,
  "tongTien": 500000,
  "trangThai": "Chờ xác nhận"
}
```

**Lịch hẹn (Minh):**
```json
{
  "maKH": 1,
  "loaiDichVu": "Bảo dưỡng định kỳ",
  "ngayHen": "2026-10-01T09:00:00",
  "ghiChu": "Thay nhớt và kiểm tra phanh"
}
```

**Phản hồi (Nghĩa):**
```json
{
  "maKH": 1,
  "diemDanhGia": 5,
  "noiDung": "Dịch vụ rất tốt, nhân viên nhiệt tình!",
  "maXe": 1,
  "maPhuTung": null
}
```

---

## 9. Git Push lên GitHub

Sau khi code xong + test OK trên Swagger:

```bash
# 1. Kiểm tra những file đã thay đổi
git status

# 2. Thêm các file mới/sửa vào staging
git add .

# 3. Commit với message mô tả rõ ràng
git commit -m "feat: thêm Model + Controller PhuTung, XeMau - Phương"

# 4. Push nhánh lên GitHub
git push -u origin feature/<ten-ban>-<model>
```

**Sau khi push xong:**

1. Vào GitHub: https://github.com/YangLe0405web/dailyphutungxe
2. Bấm nút **"Compare & pull request"** (sẽ tự hiện)
3. Đổi base branch thành **`develop`** (KHÔNG phải `main`)
4. Viết mô tả ngắn về những gì đã làm
5. Bấm **"Create pull request"**
6. **Báo Giang** để review & merge

---

## 10. ⚠️ LƯU Ý QUAN TRỌNG

### 🔴 TUYỆT ĐỐI KHÔNG LÀM

| # | Điều cấm | Lý do |
|---|----------|-------|
| 1 | ❌ **KHÔNG sửa file của người khác** trong `Controllers/` và `Models/` | Gây conflict, mất code |
| 2 | ❌ **KHÔNG đụng vào thư mục `crm-frontend/`** | Frontend đã xong, chỉ làm Backend |
| 3 | ❌ **KHÔNG push thẳng lên `main` hoặc `develop`** | Luôn tạo nhánh `feature/` riêng |
| 4 | ❌ **KHÔNG sửa `Program.cs`** | File config dùng chung, sửa sẽ ảnh hưởng tất cả |
| 5 | ❌ **KHÔNG sửa `docker-compose.yml`** | Cấu hình DB dùng chung |
| 6 | ❌ **KHÔNG sửa `init-db/init.sql`** | Schema DB đã cố định, nếu cần thêm bảng hỏi Giang |
| 7 | ❌ **KHÔNG commit thư mục `bin/`, `obj/`, `node_modules/`** | Đã có `.gitignore` chặn, nhưng cẩn thận |

### 🟢 NÊN LÀM

| # | Nên làm | Mô tả |
|---|---------|-------|
| 1 | ✅ **Luôn `git pull origin develop`** trước khi code | Lấy code mới nhất từ nhóm |
| 2 | ✅ **Build trước khi push** (`dotnet build`) | Đảm bảo 0 errors |
| 3 | ✅ **Test trên Swagger** trước khi push | Đảm bảo API chạy đúng |
| 4 | ✅ **Commit message rõ ràng** | VD: `feat: thêm CRUD PhuTungController` |
| 5 | ✅ **Tạo Pull Request → develop** | Không merge trực tiếp |
| 6 | ✅ **Hỏi nhóm khi không chắc** | Tránh làm sai rồi sửa tốn thời gian |

### 🟡 THÔNG TIN KẾT NỐI DATABASE

```
Server:    localhost,14333
Database:  CRM_XeMayPhuTung
User:      sa
Password:  YourStrong@Password123
```

### 🟡 CẤU TRÚC BẢNG SQL (tham khảo khi viết query)

| Bảng | Cột chính | Ai dùng |
|------|-----------|---------|
| `TAI_KHOAN` | MaTK, TenDangNhap, MatKhau, VaiTro, TrangThai | Giang, Lộc |
| `KHACH_HANG` | MaKH, MaTK, HoTen, NgaySinh, GioiTinh, SoDienThoai, DiaChi | Giang ✅ |
| `XE_KHACH_HANG` | MaXeSoHuu, MaKH, MaXe, BienSoXe, SoKhung, NgayMua, HanBaoHanh | Giang ✅ |
| `SAN_PHAM_XE` | MaXe, TenXe, HangXe, LoaiXe, GiaNiemYet, ThongSoKyThuat | Phương |
| `PHU_TUNG` | MaPhuTung, TenPhuTung, LoaiPhuTung, DonGia, BaoHanhThang | Phương |
| `DON_HANG` | MaDon, MaKH, NgayDat, TongTien, TrangThai | Minh |
| `CHI_TIET_DON_HANG` | MaDon, MaPhuTung, SoLuong, DonGia | Minh |
| `LICH_HEN` | MaLich, MaKH, LoaiDichVu, NgayHen, GhiChu, TrangThai | Minh |
| `PHAN_HOI` | MaPH, MaKH, DiemDanhGia, NoiDung, TrangThaiXuLy | Nghĩa |
| `KHAO_SAT` | MaKS, TieuDe, MoTa, NgayTao, HanKetThuc | Nghĩa |
| `CAU_HOI_KHAO_SAT` | MaCH, MaKS, NoiDungCH, LoaiCauHoi | Nghĩa |
| `KET_QUA_KHAO_SAT` | MaKQ, MaKS, MaCH, MaKH, CauTraLoi, NgayTraLoi | Nghĩa |

---

## 📞 Liên hệ khi gặp lỗi

| Loại lỗi | Hỏi ai |
|----------|--------|
| Git conflict / push lỗi | Giang |
| Docker không chạy | Giang |
| SQL query sai | Tự kiểm tra trên Swagger, nếu ko fix được hỏi nhóm |
| Không biết viết API | Xem Controller mẫu của Giang: `KhachHangController.cs` |

---

> **Chúc cả nhóm code vui! 🚀**
> 
> Nhớ: **Clone → Docker → Build → Code → Test Swagger → Push → Pull Request**
