using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DonHangController : ControllerBase
    {
        private readonly IDbConnection _db;

        public DonHangController(IDbConnection db)
        {
            _db = db;
        }

        // GET: api/DonHang -> Lấy danh sách đơn hàng kèm tên khách
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sql = @"
                SELECT d.MaDon, d.NgayDat, d.TongTien, d.TrangThai, 
                       k.HoTen AS TenKhachHang, k.SoDienThoai
                FROM DON_HANG d
                JOIN KHACH_HANG k ON d.MaKH = k.MaKH
                ORDER BY d.NgayDat DESC";

            var result = await _db.QueryAsync(sql);
            return Ok(result);
        }

        // PUT: api/DonHang/duyet/1 -> Chuyển trạng thái đơn sang 'Đang giao'
        [HttpPut("duyet/{maDon}")]
        public async Task<IActionResult> DuyetDonHang(int maDon)
        {
            var sql = @"UPDATE DON_HANG SET TrangThai = N'Đang giao' WHERE MaDon = @MaDon";
            await _db.ExecuteAsync(sql, new { MaDon = maDon });
            return Ok(new { message = "Đã duyệt đơn hàng thành công!" });
        }
    }
}