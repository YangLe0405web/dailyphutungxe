using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KhachHangController : ControllerBase
    {
        private readonly IDbConnection _db;

        public KhachHangController(IDbConnection db)
        {
            _db = db;
        }

        // ── GET: api/KhachHang ── Danh sách khách hàng
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sql = @"
                SELECT k.MaKH, k.MaTK, k.HoTen, k.NgaySinh, k.GioiTinh, 
                       k.SoDienThoai, k.Email, k.DiaChi, k.SoThich, k.NgayTao,
                       t.TenDangNhap, t.TrangThai
                FROM KHACH_HANG k
                JOIN TAI_KHOAN t ON k.MaTK = t.MaTK
                ORDER BY k.MaKH";

            var result = await _db.QueryAsync<KhachHang>(sql);
            return Ok(result);
        }

        // ── GET: api/KhachHang/5 ── Chi tiết 1 khách hàng
        [HttpGet("{maKh}")]
        public async Task<IActionResult> GetById(int maKh)
        {
            var sql = @"
                SELECT k.MaKH, k.MaTK, k.HoTen, k.NgaySinh, k.GioiTinh, 
                       k.SoDienThoai, k.Email, k.DiaChi, k.SoThich, k.NgayTao,
                       t.TenDangNhap, t.TrangThai
                FROM KHACH_HANG k
                JOIN TAI_KHOAN t ON k.MaTK = t.MaTK
                WHERE k.MaKH = @MaKH";

            var kh = await _db.QueryFirstOrDefaultAsync<KhachHang>(sql, new { MaKH = maKh });
            if (kh == null) return NotFound(new { message = "Không tìm thấy khách hàng" });
            return Ok(kh);
        }

        // ── POST: api/KhachHang ── Thêm khách hàng mới (tạo TAI_KHOAN + KHACH_HANG)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] KhachHangCreateDto dto)
        {
            // 1. Kiểm tra định dạng số điện thoại (ĐK01: đúng 10 số, bắt đầu bằng 0)
            if (string.IsNullOrWhiteSpace(dto.SoDienThoai) || !System.Text.RegularExpressions.Regex.IsMatch(dto.SoDienThoai.Trim(), @"^0\d{9}$"))
            {
                return BadRequest(new { message = "Số điện thoại không hợp lệ! Phải gồm đúng 10 chữ số và bắt đầu bằng số 0." });
            }

            // 2. Kiểm tra trùng số điện thoại (ĐK02)
            var phoneCount = await _db.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM KHACH_HANG WHERE SoDienThoai = @SoDienThoai", 
                new { SoDienThoai = dto.SoDienThoai.Trim() }
            );
            if (phoneCount > 0)
            {
                return BadRequest(new { message = "Số điện thoại này đã được đăng ký tài khoản!" });
            }

            // 3. Kiểm tra trùng email (ĐK02)
            if (!string.IsNullOrWhiteSpace(dto.Email))
            {
                var emailCount = await _db.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM KHACH_HANG WHERE LOWER(Email) = LOWER(@Email)", 
                    new { Email = dto.Email.Trim() }
                );
                if (emailCount > 0)
                {
                    return BadRequest(new { message = "Email này đã được đăng ký tài khoản!" });
                }
            }

            // 4. Kiểm tra tên đăng nhập (hoặc email/sđt) trong TAI_KHOAN
            var username = string.IsNullOrWhiteSpace(dto.TenDangNhap) 
                ? (dto.Email?.Trim() ?? dto.SoDienThoai.Trim()) 
                : dto.TenDangNhap.Trim();

            var exists = await _db.ExecuteScalarAsync<int>(
                "SELECT COUNT(*) FROM TAI_KHOAN WHERE LOWER(TenDangNhap) = LOWER(@TenDangNhap)", 
                new { TenDangNhap = username }
            );
            if (exists > 0)
            {
                return BadRequest(new { message = "Tên đăng nhập hoặc tài khoản đã tồn tại!" });
            }

            // 5. Kiểm tra mật khẩu (ĐK06: độ dài >= 8, chữ hoa, chữ thường, số, ký tự đặc biệt)
            var password = dto.MatKhau;
            if (string.IsNullOrWhiteSpace(password) || password.Length < 8 ||
                !password.Any(char.IsUpper) ||
                !password.Any(char.IsLower) ||
                !password.Any(char.IsDigit) ||
                !password.Any(ch => !char.IsLetterOrDigit(ch)))
            {
                return BadRequest(new { message = "Mật khẩu phải từ 8 ký tự trở lên, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt!" });
            }

            // 6. Tạo tài khoản trong TAI_KHOAN
            var insertTK = @"
                INSERT INTO TAI_KHOAN (TenDangNhap, MatKhau, VaiTro, TrangThai)
                VALUES (@TenDangNhap, @MatKhau, N'KhachHang', N'HoatDong');
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            var maTK = await _db.ExecuteScalarAsync<int>(insertTK, new { TenDangNhap = username, MatKhau = password });

            // 7. Tạo khách hàng trong KHACH_HANG (ĐK04)
            var insertKH = @"
                INSERT INTO KHACH_HANG (MaTK, HoTen, NgaySinh, GioiTinh, SoDienThoai, Email, DiaChi, SoThich)
                VALUES (@MaTK, @HoTen, @NgaySinh, @GioiTinh, @SoDienThoai, @Email, @DiaChi, @SoThich);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            var maKH = await _db.ExecuteScalarAsync<int>(insertKH, new
            {
                MaTK = maTK,
                HoTen = dto.HoTen.Trim(),
                NgaySinh = dto.NgaySinh == default ? new DateTime(2000, 1, 1) : dto.NgaySinh,
                GioiTinh = string.IsNullOrWhiteSpace(dto.GioiTinh) ? "Nam" : dto.GioiTinh,
                SoDienThoai = dto.SoDienThoai.Trim(),
                Email = dto.Email?.Trim(),
                DiaChi = dto.DiaChi?.Trim(),
                SoThich = string.IsNullOrWhiteSpace(dto.SoThich) ? "Xe máy, phụ tùng chính hãng" : dto.SoThich.Trim()
            });

            return CreatedAtAction(nameof(GetById), new { maKh = maKH }, new { MaKH = maKH, message = "Thêm khách hàng thành công!" });
        }

        // ── PUT: api/KhachHang/5 ── Cập nhật thông tin khách hàng
        [HttpPut("{maKh}")]
        public async Task<IActionResult> Update(int maKh, [FromBody] KhachHangUpdateDto dto)
        {
            var sql = @"
                UPDATE KHACH_HANG 
                SET HoTen = @HoTen, NgaySinh = @NgaySinh, GioiTinh = @GioiTinh,
                    SoDienThoai = @SoDienThoai, Email = @Email, DiaChi = @DiaChi, SoThich = @SoThich
                WHERE MaKH = @MaKH";

            var rows = await _db.ExecuteAsync(sql, new
            {
                MaKH = maKh,
                dto.HoTen,
                dto.NgaySinh,
                dto.GioiTinh,
                dto.SoDienThoai,
                dto.Email,
                dto.DiaChi,
                dto.SoThich
            });

            if (rows == 0) return NotFound(new { message = "Không tìm thấy khách hàng" });
            return Ok(new { message = "Cập nhật thành công!" });
        }

        // ── DELETE: api/KhachHang/5 ── Xóa khách hàng (cascade xóa TAI_KHOAN)
        [HttpDelete("{maKh}")]
        public async Task<IActionResult> Delete(int maKh)
        {
            // Xóa TAI_KHOAN → cascade xóa KHACH_HANG
            var sql = @"
                DELETE FROM TAI_KHOAN 
                WHERE MaTK = (SELECT MaTK FROM KHACH_HANG WHERE MaKH = @MaKH)";

            var rows = await _db.ExecuteAsync(sql, new { MaKH = maKh });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy khách hàng" });
            return Ok(new { message = "Đã xóa khách hàng!" });
        }

        // ── PUT: api/KhachHang/khoa/5 ── Khóa / Mở khóa tài khoản
        [HttpPut("khoa/{maKh}")]
        public async Task<IActionResult> ToggleKhoa(int maKh)
        {
            var sql = @"
                UPDATE TAI_KHOAN 
                SET TrangThai = CASE WHEN TrangThai = N'HoatDong' THEN N'BiKhoa' ELSE N'HoatDong' END
                WHERE MaTK = (SELECT MaTK FROM KHACH_HANG WHERE MaKH = @MaKH)";

            var rows = await _db.ExecuteAsync(sql, new { MaKH = maKh });
            if (rows > 0) return Ok(new { message = "Đã cập nhật trạng thái tài khoản!" });
            return NotFound(new { message = "Không tìm thấy khách hàng" });
        }

        // ── GET: api/KhachHang/thong-ke-tuoi ── Biểu đồ phân bố độ tuổi
        [HttpGet("thong-ke-tuoi")]
        public async Task<IActionResult> ThongKeTuoi()
        {
            var sql = @"
                SELECT 
                    CASE 
                        WHEN DATEDIFF(YEAR, NgaySinh, GETDATE()) < 25 THEN N'Dưới 25 tuổi'
                        WHEN DATEDIFF(YEAR, NgaySinh, GETDATE()) BETWEEN 25 AND 40 THEN N'25 - 40 tuổi'
                        ELSE N'Trên 40 tuổi'
                    END AS NhomTuoi,
                    COUNT(*) AS SoLuong
                FROM KHACH_HANG
                GROUP BY 
                    CASE 
                        WHEN DATEDIFF(YEAR, NgaySinh, GETDATE()) < 25 THEN N'Dưới 25 tuổi'
                        WHEN DATEDIFF(YEAR, NgaySinh, GETDATE()) BETWEEN 25 AND 40 THEN N'25 - 40 tuổi'
                        ELSE N'Trên 40 tuổi'
                    END";

            var data = await _db.QueryAsync(sql);
            return Ok(data);
        }
    }
}