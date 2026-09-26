using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using CrmBackend.Models;

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
                SELECT d.MaDon, d.MaKH, d.NgayDat, d.TongTien, d.TrangThai, 
                       k.HoTen AS TenKhachHang, k.SoDienThoai
                FROM DON_HANG d
                JOIN KHACH_HANG k ON d.MaKH = k.MaKH
                ORDER BY d.NgayDat DESC";

            var result = await _db.QueryAsync<DonHang>(sql);
            return Ok(result);
        }

        // GET: api/DonHang/5 -> Lấy chi tiết đơn hàng kèm danh sách phụ tùng (CartItems)
        [HttpGet("{maDon}")]
        public async Task<IActionResult> GetById(int maDon)
        {
            var orderSql = @"
                SELECT d.MaDon, d.MaKH, d.NgayDat, d.TongTien, d.TrangThai, 
                       k.HoTen AS TenKhachHang, k.SoDienThoai
                FROM DON_HANG d
                JOIN KHACH_HANG k ON d.MaKH = k.MaKH
                WHERE d.MaDon = @MaDon";

            var donHang = await _db.QueryFirstOrDefaultAsync<DonHang>(orderSql, new { MaDon = maDon });
            if (donHang == null)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng!" });
            }

            var itemsSql = @"
                SELECT c.MaDon, c.MaPhuTung, c.SoLuong, c.DonGia,
                       p.TenPhuTung, p.LoaiPhuTung
                FROM CHI_TIET_DON_HANG c
                LEFT JOIN PHU_TUNG p ON c.MaPhuTung = p.MaPhuTung
                WHERE c.MaDon = @MaDon";

            var items = await _db.QueryAsync<ChiTietDonHang>(itemsSql, new { MaDon = maDon });
            donHang.ChiTiet = items.AsList();

            return Ok(donHang);
        }

        // POST: api/DonHang -> Tạo đơn hàng mới kèm chi tiết các mặt hàng trong giỏ
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DonHangCreateDto dto)
        {
            if (dto.MaKH <= 0)
            {
                return BadRequest(new { message = "Mã khách hàng không hợp lệ!" });
            }

            // Tính tổng tiền nếu chưa được truyền
            decimal tongTien = dto.TongTien;
            if (tongTien <= 0 && dto.Items != null && dto.Items.Count > 0)
            {
                tongTien = dto.Items.Sum(x => x.SoLuong * x.DonGia);
            }

            var insertOrderSql = @"
                INSERT INTO DON_HANG (MaKH, NgayDat, TongTien, TrangThai)
                VALUES (@MaKH, GETDATE(), @TongTien, @TrangThai);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            var maDon = await _db.ExecuteScalarAsync<int>(insertOrderSql, new
            {
                dto.MaKH,
                TongTien = tongTien,
                TrangThai = string.IsNullOrEmpty(dto.TrangThai) ? "Chờ xác nhận" : dto.TrangThai
            });

            // Chèn các chi tiết đơn hàng (CartItems)
            if (dto.Items != null && dto.Items.Count > 0)
            {
                var insertItemSql = @"
                    INSERT INTO CHI_TIET_DON_HANG (MaDon, MaPhuTung, SoLuong, DonGia)
                    VALUES (@MaDon, @MaPhuTung, @SoLuong, @DonGia);";

                foreach (var item in dto.Items)
                {
                    await _db.ExecuteAsync(insertItemSql, new
                    {
                        MaDon = maDon,
                        item.MaPhuTung,
                        item.SoLuong,
                        item.DonGia
                    });
                }
            }

            return CreatedAtAction(nameof(GetById), new { maDon }, new { maDon, message = "Đặt hàng thành công!", tongTien });
        }

        // PUT: api/DonHang/duyet/1 -> Chuyển trạng thái đơn sang 'Đang giao'
        [HttpPut("duyet/{maDon}")]
        public async Task<IActionResult> DuyetDonHang(int maDon)
        {
            var sql = @"UPDATE DON_HANG SET TrangThai = N'Đang giao' WHERE MaDon = @MaDon";
            var rows = await _db.ExecuteAsync(sql, new { MaDon = maDon });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy đơn hàng!" });
            return Ok(new { message = "Đã duyệt đơn hàng thành công!" });
        }

        // PUT: api/DonHang/trang-thai/1 -> Cập nhật trạng thái linh hoạt
        [HttpPut("trang-thai/{maDon}")]
        public async Task<IActionResult> UpdateTrangThai(int maDon, [FromBody] DonHangUpdateStatusDto dto)
        {
            var sql = @"UPDATE DON_HANG SET TrangThai = @TrangThai WHERE MaDon = @MaDon";
            var rows = await _db.ExecuteAsync(sql, new { MaDon = maDon, dto.TrangThai });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy đơn hàng!" });
            return Ok(new { message = "Cập nhật trạng thái đơn hàng thành công!" });
        }

        // DELETE: api/DonHang/5 -> Xóa đơn hàng và chi tiết đơn
        [HttpDelete("{maDon}")]
        public async Task<IActionResult> Delete(int maDon)
        {
            var deleteDetailsSql = @"DELETE FROM CHI_TIET_DON_HANG WHERE MaDon = @MaDon";
            await _db.ExecuteAsync(deleteDetailsSql, new { MaDon = maDon });

            var deleteOrderSql = @"DELETE FROM DON_HANG WHERE MaDon = @MaDon";
            var rows = await _db.ExecuteAsync(deleteOrderSql, new { MaDon = maDon });

            if (rows == 0) return NotFound(new { message = "Không tìm thấy đơn hàng!" });
            return Ok(new { message = "Đã xóa đơn hàng thành công!" });
        }
    }
}