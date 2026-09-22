using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class KhaoSatController : ControllerBase
    {
        private readonly IDbConnection _db;

        public KhaoSatController(IDbConnection db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sql = "SELECT * FROM KHAO_SAT ORDER BY MaKS DESC";
            var result = await _db.QueryAsync<KhaoSat>(sql);
            return Ok(result);
        }
    }
}