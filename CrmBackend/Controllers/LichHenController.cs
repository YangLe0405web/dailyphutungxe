using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;

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

        // GET: api/LichHen -> Lấy danh sách lịch hẹn
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sql = @"
                SELECT l.MaLich, l.LoaiDichVu, l.NgayHen, l.GhiChu, l.TrangThai,
                       k.HoTen AS TenKhachHang, k.SoDienThoai
                FROM LICH_HEN l
                JOIN KHACH_HANG k ON l.MaKH = k.MaKH
                ORDER BY l.NgayHen ASC";

            var result = await _db.QueryAsync(sql);
            return Ok(result);
        }

        // PUT: api/LichHen/xac-nhan/1 -> Cập nhật trạng thái lịch hẹn
        [HttpPut("xac-nhan/{maLich}")]
        public async Task<IActionResult> XacNhanLichHen(int maLich)
        {
            var sql = @"UPDATE LICH_HEN SET TrangThai = N'Đã xác nhận' WHERE MaLich = @MaLich";
            await _db.ExecuteAsync(sql, new { MaLich = maLich });
            return Ok(new { message = "Lịch hẹn đã được xác nhận!" });
        }
    }
}