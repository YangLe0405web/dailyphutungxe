using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhanHoiController : ControllerBase
    {
        private readonly IDbConnection _db;

        public PhanHoiController(IDbConnection db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sql = "SELECT * FROM PHAN_HOI ORDER BY MaPH DESC";
            var result = await _db.QueryAsync<PhanHoi>(sql);
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PhanHoiCreateDto dto)
        {
            var sql = @"
                INSERT INTO PHAN_HOI (MaKH, DiemDanhGia, NoiDung, TrangThaiXuLy)
                VALUES (@MaKH, @DiemDanhGia, @NoiDung, N'Chờ xử lý');
                SELECT CAST(SCOPE_IDENTITY() AS INT);";
            var id = await _db.ExecuteScalarAsync<int>(sql, dto);
            return Ok(new { id, message = "Gửi phản hồi thành công!" });
        }
    }
}