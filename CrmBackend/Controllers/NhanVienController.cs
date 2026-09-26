using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NhanVienController : ControllerBase
    {
        private readonly IDbConnection _db;

        public NhanVienController(IDbConnection db)
        {
            _db = db;
        }

        // ── GET: api/NhanVien ── Lấy danh sách nhân viên cho trang StaffRoles
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sql = @"
                SELECT nv.MaNV, nv.MaTK, nv.HoTen, nv.Email, nv.SoDienThoai, 
                       nv.ChucVu, nv.VaiTro, nv.TrangThai, nv.Avatar, 
                       nv.NgayThamGia, nv.NgayTao, t.TenDangNhap
                FROM NHAN_VIEN nv
                LEFT JOIN TAI_KHOAN t ON nv.MaTK = t.MaTK
                ORDER BY nv.MaNV";

            var result = await _db.QueryAsync<NhanVien>(sql);
            return Ok(result);
        }

        // ── GET: api/NhanVien/5 ── Chi tiết 1 nhân viên
        [HttpGet("{maNv}")]
        public async Task<IActionResult> GetById(int maNv)
        {
            var sql = @"
                SELECT nv.MaNV, nv.MaTK, nv.HoTen, nv.Email, nv.SoDienThoai, 
                       nv.ChucVu, nv.VaiTro, nv.TrangThai, nv.Avatar, 
                       nv.NgayThamGia, nv.NgayTao, t.TenDangNhap
                FROM NHAN_VIEN nv
                LEFT JOIN TAI_KHOAN t ON nv.MaTK = t.MaTK
                WHERE nv.MaNV = @MaNV";

            var nv = await _db.QueryFirstOrDefaultAsync<NhanVien>(sql, new { MaNV = maNv });
            if (nv == null) return NotFound(new { message = "Không tìm thấy nhân viên!" });
            return Ok(nv);
        }

        // ── POST: api/NhanVien ── Thêm nhân viên mới (tạo TAI_KHOAN + NHAN_VIEN)
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] NhanVienCreateDto dto)
        {
            // 1. Kiểm tra tên đăng nhập đã tồn tại chưa
            var checkTk = "SELECT COUNT(*) FROM TAI_KHOAN WHERE TenDangNhap = @TenDangNhap";
            var tkExists = await _db.ExecuteScalarAsync<int>(checkTk, new { dto.TenDangNhap });
            if (tkExists > 0)
                return BadRequest(new { message = "Tên đăng nhập đã tồn tại!" });

            // 2. Kiểm tra email đã tồn tại chưa
            var checkEmail = "SELECT COUNT(*) FROM NHAN_VIEN WHERE Email = @Email";
            var emailExists = await _db.ExecuteScalarAsync<int>(checkEmail, new { dto.Email });
            if (emailExists > 0)
                return BadRequest(new { message = "Email nhân viên đã tồn tại!" });

            // 3. Tạo TAI_KHOAN cho nhân viên
            var insertTK = @"
                INSERT INTO TAI_KHOAN (TenDangNhap, MatKhau, VaiTro, TrangThai)
                VALUES (@TenDangNhap, @MatKhau, @VaiTro, N'HoatDong');
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            var maTK = await _db.ExecuteScalarAsync<int>(insertTK, new
            {
                dto.TenDangNhap,
                dto.MatKhau,
                dto.VaiTro
            });

            // 4. Tạo NHAN_VIEN
            var insertNV = @"
                INSERT INTO NHAN_VIEN (MaTK, HoTen, Email, SoDienThoai, ChucVu, VaiTro, TrangThai, Avatar, NgayThamGia)
                VALUES (@MaTK, @HoTen, @Email, @SoDienThoai, @ChucVu, @VaiTro, N'HoatDong', @Avatar, @NgayThamGia);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            var maNV = await _db.ExecuteScalarAsync<int>(insertNV, new
            {
                MaTK = maTK,
                dto.HoTen,
                dto.Email,
                dto.SoDienThoai,
                dto.ChucVu,
                dto.VaiTro,
                dto.Avatar,
                NgayThamGia = dto.NgayThamGia ?? DateTime.Today
            });

            return CreatedAtAction(nameof(GetById), new { maNv = maNV }, new { MaNV = maNV, message = "Thêm nhân viên thành công!" });
        }

        // ── PUT: api/NhanVien/5 ── Cập nhật thông tin nhân viên
        [HttpPut("{maNv}")]
        public async Task<IActionResult> Update(int maNv, [FromBody] NhanVienUpdateDto dto)
        {
            var sql = @"
                UPDATE NHAN_VIEN 
                SET HoTen = @HoTen, Email = @Email, SoDienThoai = @SoDienThoai,
                    ChucVu = @ChucVu, VaiTro = @VaiTro, Avatar = @Avatar
                WHERE MaNV = @MaNV;

                -- Đồng bộ vai trò sang TAI_KHOAN
                UPDATE TAI_KHOAN
                SET VaiTro = @VaiTro
                WHERE MaTK = (SELECT MaTK FROM NHAN_VIEN WHERE MaNV = @MaNV);";

            var rows = await _db.ExecuteAsync(sql, new
            {
                MaNV = maNv,
                dto.HoTen,
                dto.Email,
                dto.SoDienThoai,
                dto.ChucVu,
                dto.VaiTro,
                dto.Avatar
            });

            if (rows == 0) return NotFound(new { message = "Không tìm thấy nhân viên!" });
            return Ok(new { message = "Cập nhật nhân viên thành công!" });
        }

        // ── PUT: api/NhanVien/phan-quyen/5 ── Đổi vai trò / phân quyền RBAC
        [HttpPut("phan-quyen/{maNv}")]
        public async Task<IActionResult> DoiVaiTro(int maNv, [FromBody] DoiVaiTroDto dto)
        {
            var sql = @"
                UPDATE NHAN_VIEN 
                SET VaiTro = @VaiTroMoi 
                WHERE MaNV = @MaNV;

                UPDATE TAI_KHOAN 
                SET VaiTro = @VaiTroMoi 
                WHERE MaTK = (SELECT MaTK FROM NHAN_VIEN WHERE MaNV = @MaNV);";

            var rows = await _db.ExecuteAsync(sql, new { MaNV = maNv, dto.VaiTroMoi });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy nhân viên!" });
            return Ok(new { message = "Đã cập nhật phân quyền nhân viên!" });
        }

        // ── PUT: api/NhanVien/khoa/5 ── Khóa / Mở khóa tài khoản nhân viên
        [HttpPut("khoa/{maNv}")]
        public async Task<IActionResult> ToggleKhoa(int maNv)
        {
            var sql = @"
                UPDATE NHAN_VIEN 
                SET TrangThai = CASE WHEN TrangThai = N'HoatDong' THEN N'BiKhoa' ELSE N'HoatDong' END
                WHERE MaNV = @MaNV;

                UPDATE TAI_KHOAN 
                SET TrangThai = (SELECT TrangThai FROM NHAN_VIEN WHERE MaNV = @MaNV)
                WHERE MaTK = (SELECT MaTK FROM NHAN_VIEN WHERE MaNV = @MaNV);";

            var rows = await _db.ExecuteAsync(sql, new { MaNV = maNv });
            if (rows > 0) return Ok(new { message = "Đã cập nhật trạng thái nhân viên!" });
            return NotFound(new { message = "Không tìm thấy nhân viên!" });
        }

        // ── DELETE: api/NhanVien/5 ── Xóa nhân viên
        [HttpDelete("{maNv}")]
        public async Task<IActionResult> Delete(int maNv)
        {
            var sql = @"
                DECLARE @MaTK INT;
                SELECT @MaTK = MaTK FROM NHAN_VIEN WHERE MaNV = @MaNV;

                DELETE FROM NHAN_VIEN WHERE MaNV = @MaNV;
                IF @MaTK IS NOT NULL
                BEGIN
                    DELETE FROM TAI_KHOAN WHERE MaTK = @MaTK;
                END";

            var rows = await _db.ExecuteAsync(sql, new { MaNV = maNv });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy nhân viên!" });
            return Ok(new { message = "Đã xóa nhân viên thành công!" });
        }
    }
}
