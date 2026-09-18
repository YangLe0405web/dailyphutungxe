using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class XeKhachHangController : ControllerBase
    {
        private readonly IDbConnection _db;

        public XeKhachHangController(IDbConnection db)
        {
            _db = db;
        }

        // ── GET: api/XeKhachHang ── Danh sách tất cả xe đang sở hữu
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sql = @"
                SELECT x.MaXeSoHuu, x.MaKH, x.MaXe, x.BienSoXe, x.SoKhung, 
                       x.SoMay, x.NgayMua, x.HanBaoHanh,
                       k.HoTen AS HoTenKH, k.SoDienThoai,
                       sp.TenXe, sp.HangXe
                FROM XE_KHACH_HANG x
                JOIN KHACH_HANG k ON x.MaKH = k.MaKH
                JOIN SAN_PHAM_XE sp ON x.MaXe = sp.MaXe
                ORDER BY x.NgayMua DESC";

            var result = await _db.QueryAsync<XeKhachHang>(sql);
            return Ok(result);
        }

        // ── GET: api/XeKhachHang/5 ── Chi tiết 1 xe
        [HttpGet("{maXeSoHuu}")]
        public async Task<IActionResult> GetById(int maXeSoHuu)
        {
            var sql = @"
                SELECT x.MaXeSoHuu, x.MaKH, x.MaXe, x.BienSoXe, x.SoKhung, 
                       x.SoMay, x.NgayMua, x.HanBaoHanh,
                       k.HoTen AS HoTenKH, k.SoDienThoai,
                       sp.TenXe, sp.HangXe
                FROM XE_KHACH_HANG x
                JOIN KHACH_HANG k ON x.MaKH = k.MaKH
                JOIN SAN_PHAM_XE sp ON x.MaXe = sp.MaXe
                WHERE x.MaXeSoHuu = @MaXeSoHuu";

            var xe = await _db.QueryFirstOrDefaultAsync<XeKhachHang>(sql, new { MaXeSoHuu = maXeSoHuu });
            if (xe == null) return NotFound(new { message = "Không tìm thấy xe" });
            return Ok(xe);
        }

        // ── GET: api/XeKhachHang/khach-hang/1 ── Danh sách xe của 1 khách hàng
        [HttpGet("khach-hang/{maKh}")]
        public async Task<IActionResult> GetByKhachHang(int maKh)
        {
            var sql = @"
                SELECT x.MaXeSoHuu, x.MaKH, x.MaXe, x.BienSoXe, x.SoKhung, 
                       x.SoMay, x.NgayMua, x.HanBaoHanh,
                       sp.TenXe, sp.HangXe
                FROM XE_KHACH_HANG x
                JOIN SAN_PHAM_XE sp ON x.MaXe = sp.MaXe
                WHERE x.MaKH = @MaKH
                ORDER BY x.NgayMua DESC";

            var result = await _db.QueryAsync<XeKhachHang>(sql, new { MaKH = maKh });
            return Ok(result);
        }

        // ── POST: api/XeKhachHang ── Thêm xe mới cho khách
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] XeKhachHangCreateDto dto)
        {
            // Kiểm tra biển số trùng
            var checkBienSo = "SELECT COUNT(*) FROM XE_KHACH_HANG WHERE BienSoXe = @BienSoXe";
            var bienSoExists = await _db.ExecuteScalarAsync<int>(checkBienSo, new { dto.BienSoXe });
            if (bienSoExists > 0)
                return BadRequest(new { message = "Biển số xe đã tồn tại!" });

            // Kiểm tra số khung trùng
            var checkSoKhung = "SELECT COUNT(*) FROM XE_KHACH_HANG WHERE SoKhung = @SoKhung";
            var soKhungExists = await _db.ExecuteScalarAsync<int>(checkSoKhung, new { dto.SoKhung });
            if (soKhungExists > 0)
                return BadRequest(new { message = "Số khung xe đã tồn tại!" });

            var sql = @"
                INSERT INTO XE_KHACH_HANG (MaKH, MaXe, BienSoXe, SoKhung, SoMay, NgayMua, HanBaoHanh)
                VALUES (@MaKH, @MaXe, @BienSoXe, @SoKhung, @SoMay, @NgayMua, @HanBaoHanh);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            var id = await _db.ExecuteScalarAsync<int>(sql, dto);
            return CreatedAtAction(nameof(GetById), new { maXeSoHuu = id }, new { MaXeSoHuu = id, message = "Thêm xe thành công!" });
        }

        // ── PUT: api/XeKhachHang/gia-han/5 ── Gia hạn bảo hành
        [HttpPut("gia-han/{maXeSoHuu}")]
        public async Task<IActionResult> GiaHanBaoHanh(int maXeSoHuu, [FromBody] GiaHanBaoHanhDto dto)
        {
            var sql = @"
                UPDATE XE_KHACH_HANG 
                SET HanBaoHanh = @HanBaoHanhMoi
                WHERE MaXeSoHuu = @MaXeSoHuu";

            var rows = await _db.ExecuteAsync(sql, new { MaXeSoHuu = maXeSoHuu, dto.HanBaoHanhMoi });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy xe" });
            return Ok(new { message = "Gia hạn bảo hành thành công!" });
        }

        // ── DELETE: api/XeKhachHang/5 ── Xóa xe
        [HttpDelete("{maXeSoHuu}")]
        public async Task<IActionResult> Delete(int maXeSoHuu)
        {
            var sql = "DELETE FROM XE_KHACH_HANG WHERE MaXeSoHuu = @MaXeSoHuu";
            var rows = await _db.ExecuteAsync(sql, new { MaXeSoHuu = maXeSoHuu });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy xe" });
            return Ok(new { message = "Đã xóa xe!" });
        }
    }
}
