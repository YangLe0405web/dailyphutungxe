using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LichHenController : ControllerBase
    {
        private readonly IDbConnection _db;

        public LichHenController(IDbConnection db)
        {
            _db = db;
        }

        // GET: api/LichHen -> Lấy danh sách lịch hẹn kèm thông tin khách hàng
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sql = @"
                SELECT l.MaLich, l.MaKH, l.LoaiDichVu, l.NgayHen, l.GhiChu, l.TrangThai,
                       k.HoTen AS TenKhachHang, k.SoDienThoai
                FROM LICH_HEN l
                JOIN KHACH_HANG k ON l.MaKH = k.MaKH
                ORDER BY l.NgayHen ASC";

            var result = await _db.QueryAsync<LichHen>(sql);
            return Ok(result);
        }

        // GET: api/LichHen/5 -> Lấy chi tiết một lịch hẹn
        [HttpGet("{maLich}")]
        public async Task<IActionResult> GetById(int maLich)
        {
            var sql = @"
                SELECT l.MaLich, l.MaKH, l.LoaiDichVu, l.NgayHen, l.GhiChu, l.TrangThai,
                       k.HoTen AS TenKhachHang, k.SoDienThoai
                FROM LICH_HEN l
                JOIN KHACH_HANG k ON l.MaKH = k.MaKH
                WHERE l.MaLich = @MaLich";

            var item = await _db.QueryFirstOrDefaultAsync<LichHen>(sql, new { MaLich = maLich });
            if (item == null)
            {
                return NotFound(new { message = "Không tìm thấy lịch hẹn!" });
            }

            return Ok(item);
        }

        // POST: api/LichHen -> Đặt lịch hẹn dịch vụ / lái thử mới
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] LichHenCreateDto dto)
        {
            if (dto.MaKH <= 0)
            {
                return BadRequest(new { message = "Mã khách hàng không hợp lệ!" });
            }

            var sql = @"
                INSERT INTO LICH_HEN (MaKH, LoaiDichVu, NgayHen, GhiChu, TrangThai)
                VALUES (@MaKH, @LoaiDichVu, @NgayHen, @GhiChu, N'Chờ xác nhận');
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            var maLich = await _db.ExecuteScalarAsync<int>(sql, dto);
            return CreatedAtAction(nameof(GetById), new { maLich }, new { maLich, message = "Đặt lịch hẹn thành công!" });
        }

        // PUT: api/LichHen/xac-nhan/1 -> Cập nhật trạng thái lịch hẹn thành 'Đã xác nhận'
        [HttpPut("xac-nhan/{maLich}")]
        public async Task<IActionResult> XacNhanLichHen(int maLich)
        {
            var sql = @"UPDATE LICH_HEN SET TrangThai = N'Đã xác nhận' WHERE MaLich = @MaLich";
            var rows = await _db.ExecuteAsync(sql, new { MaLich = maLich });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy lịch hẹn!" });
            return Ok(new { message = "Lịch hẹn đã được xác nhận!" });
        }

        // PUT: api/LichHen/trang-thai/1 -> Cập nhật trạng thái linh hoạt
        [HttpPut("trang-thai/{maLich}")]
        public async Task<IActionResult> UpdateTrangThai(int maLich, [FromBody] LichHenUpdateDto dto)
        {
            var sql = @"
                UPDATE LICH_HEN 
                SET TrangThai = @TrangThai,
                    GhiChu = COALESCE(@GhiChu, GhiChu)
                WHERE MaLich = @MaLich";

            var rows = await _db.ExecuteAsync(sql, new { MaLich = maLich, dto.TrangThai, dto.GhiChu });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy lịch hẹn!" });
            return Ok(new { message = "Cập nhật lịch hẹn thành công!" });
        }

        // DELETE: api/LichHen/5 -> Hủy hoặc xóa lịch hẹn
        [HttpDelete("{maLich}")]
        public async Task<IActionResult> Delete(int maLich)
        {
            var sql = @"DELETE FROM LICH_HEN WHERE MaLich = @MaLich";
            var rows = await _db.ExecuteAsync(sql, new { MaLich = maLich });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy lịch hẹn!" });
            return Ok(new { message = "Đã xóa lịch hẹn thành công!" });
        }
    }
}