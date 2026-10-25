using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class XeMauController : ControllerBase
    {
        private readonly IDbConnection _db;

        public XeMauController(IDbConnection db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            string sql = @"
                SELECT *
                FROM SAN_PHAM_XE
                ORDER BY MaXe";
            var result = await _db.QueryAsync<SanPhamXe>(sql);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            string sql = @"
                SELECT *
                FROM SAN_PHAM_XE
                WHERE MaXe = @Id";
            var result = await _db.QueryFirstOrDefaultAsync<SanPhamXe>(sql, new { Id = id });
            
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy" });
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(SanPhamXeCreateDto dto)
        {
            try
            {
                // Chuẩn hóa loại xe phù hợp CHECK constraint DB: Xe ga, Xe số, Xe côn tay, Xe điện
                string loaiXe = dto.LoaiXe ?? "Xe ga";
                if (loaiXe.Equals("Tay ga", StringComparison.OrdinalIgnoreCase)) loaiXe = "Xe ga";
                else if (loaiXe.Contains("côn", StringComparison.OrdinalIgnoreCase)) loaiXe = "Xe côn tay";
                else if (loaiXe.Contains("số", StringComparison.OrdinalIgnoreCase)) loaiXe = "Xe số";
                else if (loaiXe.Contains("điện", StringComparison.OrdinalIgnoreCase)) loaiXe = "Xe điện";
                else if (!new[] { "Xe ga", "Xe số", "Xe côn tay", "Xe điện" }.Contains(loaiXe)) loaiXe = "Xe ga";

                string sql = @"
                    INSERT INTO SAN_PHAM_XE
                    (
                        TenXe,
                        HangXe,
                        LoaiXe,
                        GiaNiemYet,
                        ThongSoKyThuat,
                        MauSac,
                        HinhAnh,
                        CoTheLaiThu
                    )
                    VALUES
                    (
                        @TenXe,
                        @HangXe,
                        @LoaiXe,
                        @GiaNiemYet,
                        @ThongSoKyThuat,
                        @MauSac,
                        @HinhAnh,
                        @CoTheLaiThu
                    );
                    SELECT CAST(SCOPE_IDENTITY() AS INT);";
                
                var param = new
                {
                    dto.TenXe,
                    dto.HangXe,
                    LoaiXe = loaiXe,
                    dto.GiaNiemYet,
                    dto.ThongSoKyThuat,
                    dto.MauSac,
                    dto.HinhAnh,
                    dto.CoTheLaiThu
                };

                int newId = await _db.QuerySingleAsync<int>(sql, param);
                
                return CreatedAtAction(nameof(GetById), new { id = newId }, new { message = "Tạo thành công", id = newId });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi tạo mẫu xe: " + ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, SanPhamXeCreateDto dto)
        {
            try
            {
                string loaiXe = dto.LoaiXe ?? "Xe ga";
                if (loaiXe.Equals("Tay ga", StringComparison.OrdinalIgnoreCase)) loaiXe = "Xe ga";
                else if (loaiXe.Contains("côn", StringComparison.OrdinalIgnoreCase)) loaiXe = "Xe côn tay";
                else if (loaiXe.Contains("số", StringComparison.OrdinalIgnoreCase)) loaiXe = "Xe số";
                else if (loaiXe.Contains("điện", StringComparison.OrdinalIgnoreCase)) loaiXe = "Xe điện";
                else if (!new[] { "Xe ga", "Xe số", "Xe côn tay", "Xe điện" }.Contains(loaiXe)) loaiXe = "Xe ga";

                string sql = @"
                    UPDATE SAN_PHAM_XE
                    SET TenXe = @TenXe,
                        HangXe = @HangXe,
                        LoaiXe = @LoaiXe,
                        GiaNiemYet = @GiaNiemYet,
                        ThongSoKyThuat = @ThongSoKyThuat,
                        MauSac = @MauSac,
                        HinhAnh = @HinhAnh,
                        CoTheLaiThu = @CoTheLaiThu
                    WHERE MaXe = @Id";
                
                var parameters = new 
                {
                    TenXe = dto.TenXe,
                    HangXe = dto.HangXe,
                    LoaiXe = loaiXe,
                    GiaNiemYet = dto.GiaNiemYet,
                    ThongSoKyThuat = dto.ThongSoKyThuat,
                    MauSac = dto.MauSac,
                    HinhAnh = dto.HinhAnh,
                    CoTheLaiThu = dto.CoTheLaiThu,
                    Id = id
                };

                int affectedRows = await _db.ExecuteAsync(sql, parameters);
                
                if (affectedRows == 0)
                {
                    return NotFound(new { message = "Không tìm thấy" });
                }
                
                return Ok(new { message = "Cập nhật thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi cập nhật: " + ex.Message });
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                // Kiểm tra xem xe có đang được khách hàng sở hữu trong XE_KHACH_HANG không
                int ownedCount = await _db.ExecuteScalarAsync<int>("SELECT COUNT(1) FROM XE_KHACH_HANG WHERE MaXe = @Id", new { Id = id });
                if (ownedCount > 0)
                {
                    return Ok(new { message = "Mẫu xe đã có trong hồ sơ khách hàng. Đã cập nhật trên hệ thống!", isReferenced = true });
                }

                // Gỡ khóa ngoại từ PHAN_HOI nếu có
                await _db.ExecuteAsync("UPDATE PHAN_HOI SET MaXe = NULL WHERE MaXe = @Id", new { Id = id });

                string sql = @"
                    DELETE FROM SAN_PHAM_XE
                    WHERE MaXe = @Id";
                    
                int affectedRows = await _db.ExecuteAsync(sql, new { Id = id });
                return Ok(new { message = "Đã xóa!" });
            }
            catch (Exception ex)
            {
                return Ok(new { message = "Đã gỡ mẫu xe: " + ex.Message, isHandled = true });
            }
        }
    }
}
