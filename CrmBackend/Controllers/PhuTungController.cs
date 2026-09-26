using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhuTungController : ControllerBase
    {
        private readonly IDbConnection _db;

        public PhuTungController(IDbConnection db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            string sql = @"
                SELECT *
                FROM PHU_TUNG
                ORDER BY MaPhuTung";
            var result = await _db.QueryAsync<PhuTung>(sql);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            string sql = @"
                SELECT *
                FROM PHU_TUNG
                WHERE MaPhuTung = @Id";
            var result = await _db.QueryFirstOrDefaultAsync<PhuTung>(sql, new { Id = id });
            
            if (result == null)
            {
                return NotFound(new { message = "Không tìm thấy" });
            }
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create(PhuTungCreateDto dto)
        {
            string sql = @"
                INSERT INTO PHU_TUNG
                (
                    TenPhuTung,
                    LoaiPhuTung,
                    DonGia,
                    BaoHanhThang
                )
                VALUES
                (
                    @TenPhuTung,
                    @LoaiPhuTung,
                    @DonGia,
                    @BaoHanhThang
                );
                SELECT CAST(SCOPE_IDENTITY() AS INT);";
            
            int newId = await _db.QuerySingleAsync<int>(sql, dto);
            
            return CreatedAtAction(nameof(GetById), new { id = newId }, new { message = "Tạo thành công", id = newId });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, PhuTungCreateDto dto)
        {
            string sql = @"
                UPDATE PHU_TUNG
                SET TenPhuTung = @TenPhuTung,
                    LoaiPhuTung = @LoaiPhuTung,
                    DonGia = @DonGia,
                    BaoHanhThang = @BaoHanhThang
                WHERE MaPhuTung = @Id";
            
            var parameters = new 
            {
                TenPhuTung = dto.TenPhuTung,
                LoaiPhuTung = dto.LoaiPhuTung,
                DonGia = dto.DonGia,
                BaoHanhThang = dto.BaoHanhThang,
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
                DELETE FROM PHU_TUNG
                WHERE MaPhuTung = @Id";
                
            int affectedRows = await _db.ExecuteAsync(sql, new { Id = id });
            
            if (affectedRows == 0)
            {
                return NotFound(new { message = "Không tìm thấy" });
            }
            
            return Ok(new { message = "Đã xóa!" });
        }
    }
}
