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
            string sql = @"
                INSERT INTO SAN_PHAM_XE
                (
                    TenXe,
                    HangXe,
                    LoaiXe,
                    GiaNiemYet,
                    ThongSoKyThuat
                )
                VALUES
                (
                    @TenXe,
                    @HangXe,
                    @LoaiXe,
                    @GiaNiemYet,
                    @ThongSoKyThuat
                );
                SELECT CAST(SCOPE_IDENTITY() AS INT);";
            
            int newId = await _db.QuerySingleAsync<int>(sql, dto);
            
            return CreatedAtAction(nameof(GetById), new { id = newId }, new { message = "Tạo thành công", id = newId });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, SanPhamXeCreateDto dto)
        {
            string sql = @"
                UPDATE SAN_PHAM_XE
                SET TenXe = @TenXe,
                    HangXe = @HangXe,
                    LoaiXe = @LoaiXe,
                    GiaNiemYet = @GiaNiemYet,
                    ThongSoKyThuat = @ThongSoKyThuat
                WHERE MaXe = @Id";
            
            var parameters = new 
            {
                TenXe = dto.TenXe,
                HangXe = dto.HangXe,
                LoaiXe = dto.LoaiXe,
                GiaNiemYet = dto.GiaNiemYet,
                ThongSoKyThuat = dto.ThongSoKyThuat,
                Id = id
            };

            int affectedRows = await _db.ExecuteAsync(sql, parameters);
            
            if (affectedRows == 0)
            {
                return NotFound(new { message = "Không tìm thấy" });
            }
            
            return Ok(new { message = "Cập nhật thành công!" });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            string sql = @"
                DELETE FROM SAN_PHAM_XE
                WHERE MaXe = @Id";
                
            int affectedRows = await _db.ExecuteAsync(sql, new { Id = id });
            
            if (affectedRows == 0)
            {
                return NotFound(new { message = "Không tìm thấy" });
            }
            
            return Ok(new { message = "Đã xóa!" });
        }
    }
}
