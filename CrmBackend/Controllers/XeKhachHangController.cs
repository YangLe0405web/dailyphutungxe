using Dapper;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class XeKhachHangController : ControllerBase
    {
        private readonly IDbConnection _db;

        public XeKhachHangController(IDbConnection db)
        {
            _db = db;
        }

        private static void NormalizeBienSo(IEnumerable<XeKhachHang> list)
        {
            if (list == null) return;
            foreach (var item in list)
            {
                if (item.BienSoXe != null && (
                    item.BienSoXe.StartsWith("TAM-") || 
                    item.BienSoXe.StartsWith("T?M-") || 
                    item.BienSoXe.StartsWith("TẠM-") || 
                    item.BienSoXe.StartsWith("CHUA-") || 
                    item.BienSoXe.Contains("Chua có") || 
                    item.BienSoXe.Contains("Chưa có") ||
                    item.BienSoXe.Contains("Chua co")
                ))
                {
                    item.BienSoXe = "Chưa có biển số";
                }
            }
        }

        // ── GET: api/XeKhachHang ── Danh sách xe của khách
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var sql = @"
                SELECT x.MaXeSoHuu, x.MaKH, x.MaXe, x.BienSoXe, x.SoKhung, 
                       x.SoMay, x.NgayMua, x.HanBaoHanh,
                       k.HoTen AS HoTenKH, k.SoDienThoai,
                       sp.TenXe, sp.HangXe
                FROM XE_KHACH_HANG x
                JOIN KHACH_HANG k ON x.MaKH = k.MaKH
                JOIN SAN_PHAM_XE sp ON x.MaXe = sp.MaXe
                ORDER BY x.NgayMua DESC";

            var result = (await _db.QueryAsync<XeKhachHang>(sql)).ToList();
            NormalizeBienSo(result);
            return Ok(result);
        }

        // ── GET: api/XeKhachHang/5 ── Chi tiết 1 xe
        [HttpGet("{maXeSoHuu}")]
        public async Task<IActionResult> GetById(int maXeSoHuu)
        {
            var sql = @"
                SELECT x.MaXeSoHuu, x.MaKH, x.MaXe, x.BienSoXe, x.SoKhung, 
                       x.SoMay, x.NgayMua, x.HanBaoHanh,
                       k.HoTen AS HoTenKH, k.SoDienThoai,
                       sp.TenXe, sp.HangXe
                FROM XE_KHACH_HANG x
                JOIN KHACH_HANG k ON x.MaKH = k.MaKH
                JOIN SAN_PHAM_XE sp ON x.MaXe = sp.MaXe
                WHERE x.MaXeSoHuu = @MaXeSoHuu";

            var xe = await _db.QueryFirstOrDefaultAsync<XeKhachHang>(sql, new { MaXeSoHuu = maXeSoHuu });
            if (xe == null) return NotFound(new { message = "Không tìm thấy xe" });
            NormalizeBienSo(new[] { xe });
            return Ok(xe);
        }

        // ── GET: api/XeKhachHang/khach-hang/1 ── Danh sách xe của 1 khách hàng
        [HttpGet("khach-hang/{maKh}")]
        public async Task<IActionResult> GetByKhachHang(int maKh)
        {
            var sql = @"
                SELECT x.MaXeSoHuu, x.MaKH, x.MaXe, x.BienSoXe, x.SoKhung, 
                       x.SoMay, x.NgayMua, x.HanBaoHanh,
                       sp.TenXe, sp.HangXe
                FROM XE_KHACH_HANG x
                JOIN SAN_PHAM_XE sp ON x.MaXe = sp.MaXe
                WHERE x.MaKH = @MaKH
                ORDER BY x.NgayMua DESC";

            var result = (await _db.QueryAsync<XeKhachHang>(sql, new { MaKH = maKh })).ToList();
            NormalizeBienSo(result);
            return Ok(result);
        }

        // ── POST: api/XeKhachHang ── Thêm xe mới cho khách
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] XeKhachHangCreateDto dto)
        {
            string bienSo = dto.BienSoXe ?? "";
            bool isChuaCoBienSo = string.IsNullOrWhiteSpace(bienSo) || bienSo.Contains("Chưa có") || bienSo.Contains("Chua có");
            if (isChuaCoBienSo)
            {
                // Dùng mã tạm thời duy nhất chuẩn ASCII để thỏa mãn UNIQUE KEY của SQL Server (tránh lỗi font VARCHAR)
                bienSo = "TAM-" + DateTime.Now.Ticks.ToString().Substring(12, 6);
            }
            else
            {
                // Kiểm tra biển số trùng nếu có biển số thực tế
                var checkBienSo = "SELECT COUNT(*) FROM XE_KHACH_HANG WHERE BienSoXe = @BienSoXe";
                var bienSoExists = await _db.ExecuteScalarAsync<int>(checkBienSo, new { BienSoXe = bienSo });
                if (bienSoExists > 0)
                    return BadRequest(new { message = "Biển số xe đã tồn tại!" });
            }

            // ĐKX01: Kiểm tra số khung trùng - nếu đã có xe cùng số khung thì trả về xe hiện tại (chống trùng lặp)
            if (!string.IsNullOrWhiteSpace(dto.SoKhung))
            {
                var checkSoKhung = "SELECT TOP 1 MaXeSoHuu FROM XE_KHACH_HANG WHERE SoKhung = @SoKhung";
                var existingId = await _db.ExecuteScalarAsync<int?>(checkSoKhung, new { dto.SoKhung });
                if (existingId.HasValue && existingId.Value > 0)
                {
                    return Ok(new { MaXeSoHuu = existingId.Value, message = "Xe đã tồn tại trong gara!" });
                }
            }

            var maXe = dto.MaXe.HasValue && dto.MaXe.Value > 0 ? dto.MaXe.Value : 1;
            if ((!dto.MaXe.HasValue || dto.MaXe.Value <= 0) && !string.IsNullOrWhiteSpace(dto.TenXe))
            {
                var matchedId = await _db.ExecuteScalarAsync<int?>(
                    "SELECT TOP 1 MaXe FROM SAN_PHAM_XE WHERE TenXe LIKE @Pattern",
                    new { Pattern = "%" + dto.TenXe.Trim() + "%" }
                );
                if (matchedId.HasValue && matchedId.Value > 0)
                {
                    maXe = matchedId.Value;
                }
            }
            var ngayMua = dto.NgayMua ?? DateTime.Now;
            var hanBaoHanh = dto.HanBaoHanh ?? new DateTime(1970, 1, 1);

            var sql = @"
                INSERT INTO XE_KHACH_HANG (MaKH, MaXe, BienSoXe, SoKhung, SoMay, NgayMua, HanBaoHanh)
                VALUES (@MaKH, @MaXe, @BienSoXe, @SoKhung, @SoMay, @NgayMua, @HanBaoHanh);
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            var id = await _db.ExecuteScalarAsync<int>(sql, new {
                dto.MaKH,
                MaXe = maXe,
                BienSoXe = bienSo,
                SoKhung = dto.SoKhung ?? ("RLHKD" + DateTime.Now.Ticks.ToString().Substring(11, 7)),
                SoMay = dto.SoMay ?? ("KF12E" + DateTime.Now.Ticks.ToString().Substring(12, 6)),
                NgayMua = ngayMua,
                HanBaoHanh = hanBaoHanh
            });
            return CreatedAtAction(nameof(GetById), new { maXeSoHuu = id }, new { MaXeSoHuu = id, message = "Thêm xe thành công!" });
        }

        // ── PUT: api/XeKhachHang/gia-han/5 ── Gia hạn bảo hành
        [HttpPut("gia-han/{maXeSoHuu}")]
        public async Task<IActionResult> GiaHanBaoHanh(int maXeSoHuu, [FromBody] GiaHanBaoHanhDto dto)
        {
            var sql = @"
                UPDATE XE_KHACH_HANG 
                SET HanBaoHanh = @HanBaoHanhMoi
                WHERE MaXeSoHuu = @MaXeSoHuu";

            var rows = await _db.ExecuteAsync(sql, new { MaXeSoHuu = maXeSoHuu, dto.HanBaoHanhMoi });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy xe" });
            return Ok(new { message = "Gia hạn bảo hành thành công!" });
        }

        // ── PUT: api/XeKhachHang/duyet-bien-so/5 ── Phê duyệt biển số xe chính thức
        [HttpPut("duyet-bien-so/{maXeSoHuu}")]
        public async Task<IActionResult> DuyetBienSo(int maXeSoHuu, [FromBody] DuyetBienSoDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.BienSoXe))
                return BadRequest(new { message = "Biển số xe không được để trống!" });

            var cleanPlate = dto.BienSoXe.Trim().ToUpper();

            // Kiểm tra trùng biển số xe khác trong DB
            var checkSql = "SELECT COUNT(1) FROM XE_KHACH_HANG WHERE BienSoXe = @BienSoXe AND MaXeSoHuu != @MaXeSoHuu";
            var exists = await _db.ExecuteScalarAsync<int>(checkSql, new { BienSoXe = cleanPlate, MaXeSoHuu = maXeSoHuu });
            if (exists > 0)
                return BadRequest(new { message = "Biển số xe này đã tồn tại trong hệ thống!" });

            var sql = @"
                UPDATE XE_KHACH_HANG 
                SET BienSoXe = @BienSoXe
                WHERE MaXeSoHuu = @MaXeSoHuu";

            var rows = await _db.ExecuteAsync(sql, new { MaXeSoHuu = maXeSoHuu, BienSoXe = cleanPlate });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy xe để duyệt biển số" });
            return Ok(new { message = "Phê duyệt biển số thành công!", bienSoXe = cleanPlate });
        }

        // ── DELETE: api/XeKhachHang/5 ── Xóa xe
        [HttpDelete("{maXeSoHuu}")]
        public async Task<IActionResult> Delete(int maXeSoHuu)
        {
            var sql = "DELETE FROM XE_KHACH_HANG WHERE MaXeSoHuu = @MaXeSoHuu";
            var rows = await _db.ExecuteAsync(sql, new { MaXeSoHuu = maXeSoHuu });
            if (rows == 0) return NotFound(new { message = "Không tìm thấy xe" });
            return Ok(new { message = "Đã xóa xe!" });
        }
    }
}
