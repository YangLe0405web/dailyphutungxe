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

        // GET: api/DonHang -> Lấy danh sách đơn hàng kèm tên khách (hỗ trợ lọc ngày)
        [HttpGet]
        public async Task<IActionResult> GetAll([FromQuery] DateTime? fromDate, [FromQuery] DateTime? toDate, [FromQuery] int? maKH, [FromQuery] string? trangThai)
        {
            var sql = @"
                SELECT d.MaDon, d.MaKH, d.NgayDat, d.TongTien, d.TrangThai, 
                       ISNULL(d.TrangThaiThanhToan, 'ChuaThanhToan') AS TrangThaiThanhToan,
                       ISNULL(d.PhuongThucThanhToan, 'TienMat') AS PhuongThucThanhToan,
                       k.HoTen AS TenKhachHang, k.SoDienThoai
                FROM DON_HANG d
                JOIN KHACH_HANG k ON d.MaKH = k.MaKH
                WHERE (@FromDate IS NULL OR CAST(d.NgayDat AS DATE) >= CAST(@FromDate AS DATE))
                  AND (@ToDate IS NULL OR CAST(d.NgayDat AS DATE) <= CAST(@ToDate AS DATE))
                  AND (@MaKH IS NULL OR d.MaKH = @MaKH)
                  AND (@TrangThai IS NULL OR d.TrangThai = @TrangThai)
                ORDER BY d.NgayDat DESC";

            var orders = (await _db.QueryAsync<DonHang>(sql, new { FromDate = fromDate, ToDate = toDate, MaKH = maKH, TrangThai = trangThai })).ToList();

            if (orders.Count > 0)
            {
                var orderIds = orders.Select(o => o.MaDon).ToList();
                var itemsSql = @"
                    SELECT c.MaDon, c.MaPhuTung, c.SoLuong, c.DonGia,
                           p.TenPhuTung, p.LoaiPhuTung
                    FROM CHI_TIET_DON_HANG c
                    LEFT JOIN PHU_TUNG p ON c.MaPhuTung = p.MaPhuTung
                    WHERE c.MaDon IN @OrderIds";

                var items = await _db.QueryAsync<ChiTietDonHang>(itemsSql, new { OrderIds = orderIds });
                var grouped = items.GroupBy(i => i.MaDon).ToDictionary(g => g.Key, g => g.ToList());
                foreach (var ord in orders)
                {
                    if (grouped.TryGetValue(ord.MaDon, out var ordItems))
                    {
                        ord.ChiTiet = ordItems;
                    }
                }
            }

            return Ok(orders);
        }

        // GET: api/DonHang/5 -> Lấy chi tiết đơn hàng kèm danh sách phụ tùng (CartItems)
        [HttpGet("{maDon}")]
        public async Task<IActionResult> GetById(int maDon)
        {
            var orderSql = @"
                SELECT d.MaDon, d.MaKH, d.NgayDat, d.TongTien, d.TrangThai, 
                       ISNULL(d.TrangThaiThanhToan, 'ChuaThanhToan') AS TrangThaiThanhToan,
                       ISNULL(d.PhuongThucThanhToan, 'TienMat') AS PhuongThucThanhToan,
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

            var ttThanhToan = string.IsNullOrEmpty(dto.TrangThaiThanhToan) ? "ChuaThanhToan" : dto.TrangThaiThanhToan;
            var ptThanhToan = string.IsNullOrEmpty(dto.PhuongThucThanhToan) ? "TienMat" : dto.PhuongThucThanhToan;

            var insertOrderSql = @"
                INSERT INTO DON_HANG (MaKH, NgayDat, TongTien, TrangThai, TrangThaiThanhToan, PhuongThucThanhToan)
                VALUES (@MaKH, GETDATE(), @TongTien, @TrangThai, @TrangThaiThanhToan, @PhuongThucThanhToan);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            var maDon = await _db.ExecuteScalarAsync<int>(insertOrderSql, new
            {
                dto.MaKH,
                TongTien = tongTien,
                TrangThai = string.IsNullOrEmpty(dto.TrangThai) ? "Chờ duyệt" : dto.TrangThai,
                TrangThaiThanhToan = ttThanhToan,
                PhuongThucThanhToan = ptThanhToan,
            });

            // Chèn các chi tiết đơn hàng (CartItems)
            if (dto.Items != null && dto.Items.Count > 0)
            {
                var insertItemSql = @"
                    INSERT INTO CHI_TIET_DON_HANG (MaDon, MaPhuTung, SoLuong, DonGia)
                    VALUES (@MaDon, @MaPhuTung, @SoLuong, @DonGia);";

                foreach (var item in dto.Items)
                {
                    var ptExists = await _db.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM PHU_TUNG WHERE MaPhuTung = @MaPhuTung", new { item.MaPhuTung });
                    var validMaPhuTung = ptExists > 0 ? item.MaPhuTung : 1;

                    await _db.ExecuteAsync(insertItemSql, new
                    {
                        MaDon = maDon,
                        MaPhuTung = validMaPhuTung,
                        item.SoLuong,
                        item.DonGia
                    });
                }
            }

            return CreatedAtAction(nameof(GetById), new { maDon }, new { maDon, message = "Đặt hàng thành công!", tongTien, trangThaiThanhToan = ttThanhToan });
        }

        // PUT/PATCH: api/DonHang/5/thanh-toan -> Cập nhật trạng thái thanh toán trực tiếp vào SQL Server
        [HttpPut("{maDon}/thanh-toan")]
        [HttpPatch("{maDon}/thanh-toan")]
        [HttpPut("thanh-toan/{maDon}")]
        [HttpPatch("thanh-toan/{maDon}")]
        public async Task<IActionResult> UpdatePaymentStatus(int maDon, [FromBody] DonHangUpdatePaymentDto dto)
        {
            var checkSql = "SELECT COUNT(1) FROM DON_HANG WHERE MaDon = @MaDon";
            var exists = await _db.ExecuteScalarAsync<int>(checkSql, new { MaDon = maDon });
            if (exists == 0)
            {
                return NotFound(new { message = "Không tìm thấy đơn hàng!" });
            }

            var validStatus = dto.TrangThaiThanhToan switch
            {
                "DaThanhToan" or "Đã thanh toán" => "DaThanhToan",
                "DaCoc" or "Đã đặt cọc" => "DaCoc",
                _ => "ChuaThanhToan"
            };

            var updateSql = "UPDATE DON_HANG SET TrangThaiThanhToan = @TrangThaiThanhToan WHERE MaDon = @MaDon";
            await _db.ExecuteAsync(updateSql, new { MaDon = maDon, TrangThaiThanhToan = validStatus });

            return Ok(new { message = "Cập nhật trạng thái thanh toán thành công!", maDon, trangThaiThanhToan = validStatus });
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

        // PUT/PATCH: api/DonHang/trang-thai/1 hoặc api/DonHang/1/trang-thai -> Cập nhật trạng thái linh hoạt
        [HttpPut("trang-thai/{maDon}")]
        [HttpPatch("trang-thai/{maDon}")]
        [HttpPut("{maDon}/trang-thai")]
        [HttpPatch("{maDon}/trang-thai")]
        public async Task<IActionResult> UpdateTrangThai(int maDon, [FromBody] DonHangUpdateStatusDto dto)
        {
            var statusStr = dto.TrangThai ?? "";
            if (statusStr == "DaXacNhan") statusStr = "Đã xác nhận";
            else if (statusStr == "DangGiao") statusStr = "Đang giao";
            else if (statusStr == "HoanThanh" || statusStr == "DaGiao") statusStr = "Hoàn thành";
            else if (statusStr == "DaHuy") statusStr = "Đã hủy";
            else if (statusStr == "ChoDuyet") statusStr = "Chờ xác nhận";
            else if (statusStr == "ChoGiaoXe") statusStr = "Chờ giao xe";
            else if (statusStr == "ChoKhachXacNhanNgayNhan" || statusStr == "Chờ khách xác nhận ngày đặt xe") statusStr = "Chờ khách xác nhận ngày đặt xe";

            string sql;
            if (statusStr == "Hoàn thành")
            {
                sql = @"UPDATE DON_HANG SET TrangThai = @TrangThai, TrangThaiThanhToan = 'DaThanhToan' WHERE MaDon = @MaDon";
            }
            else
            {
                sql = @"UPDATE DON_HANG SET TrangThai = @TrangThai WHERE MaDon = @MaDon";
            }
            var rows = await _db.ExecuteAsync(sql, new { MaDon = maDon, TrangThai = statusStr });
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
