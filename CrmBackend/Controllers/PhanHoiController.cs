using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using System.Collections.Concurrent;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PhanHoiController : ControllerBase
    {
        private readonly IDbConnection _db;
        private static readonly ConcurrentBag<ChatMessageDto> _chatMessages = new()
        {
            new ChatMessageDto
            {
                Id = "msg-sample-1",
                CustomerId = "KH001",
                Sender = "customer",
                SenderName = "Nguyễn Văn An",
                Content = "Chào showroom, em vừa bảo dưỡng xe và thay nhớt Motul hôm qua, dịch vụ rất tốt ạ!",
                SentAt = DateTime.Now.AddHours(-3)
            },
            new ChatMessageDto
            {
                Id = "msg-sample-2",
                CustomerId = "KH001",
                Sender = "staff",
                SenderName = "CSKH Showroom Motoshop",
                Content = "Dạ cảm ơn anh An đã tin tưởng showroom Motoshop! Chúc anh luôn có những chuyến đi an toàn ạ ❤️",
                SentAt = DateTime.Now.AddHours(-2).AddMinutes(45)
            }
        };

        public PhanHoiController(IDbConnection db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var sql = @"
                    SELECT 
                        p.MaPH, p.MaKH, p.MaXe, p.MaPhuTung, p.DiemDanhGia, p.NoiDung, p.NgayGui, p.TrangThaiXuLy,
                        kh.HoTen AS HoTenKH, kh.SoDienThoai, kh.Email, kh.DiaChi,
                        pt.TenPhuTung, pt.LoaiPhuTung,
                        xm.TenXe, xm.HangXe, xm.LoaiXe
                    FROM PHAN_HOI p
                    LEFT JOIN KHACH_HANG kh ON p.MaKH = kh.MaKH
                    LEFT JOIN PHU_TUNG pt ON p.MaPhuTung = pt.MaPhuTung
                    LEFT JOIN SAN_PHAM_XE xm ON p.MaXe = xm.MaXe
                    ORDER BY p.MaPH DESC";
                var result = await _db.QueryAsync<PhanHoi>(sql);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Fallback simpler query if joins fail
                try
                {
                    var fallbackSql = "SELECT * FROM PHAN_HOI ORDER BY MaPH DESC";
                    var fallbackResult = await _db.QueryAsync<PhanHoi>(fallbackSql);
                    return Ok(fallbackResult);
                }
                catch
                {
                    return StatusCode(500, new { message = "Lỗi truy vấn phản hồi: " + ex.Message });
                }
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] PhanHoiCreateDto dto)
        {
            if (dto.DiemDanhGia < 1 || dto.DiemDanhGia > 5)
            {
                return BadRequest(new { message = "Điểm đánh giá phải từ 1 đến 5 sao." });
            }

            if (string.IsNullOrWhiteSpace(dto.NoiDung))
            {
                return BadRequest(new { message = "Nội dung đánh giá không được để trống." });
            }

            // ĐG05: Kiểm tra mỗi tài khoản chỉ được đánh giá 1 lần trên cùng sản phẩm
            if (dto.MaPhuTung.HasValue && dto.MaPhuTung.Value > 0)
            {
                var countPt = await _db.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM PHAN_HOI WHERE MaKH = @MaKH AND MaPhuTung = @MaPhuTung",
                    new { dto.MaKH, dto.MaPhuTung });
                if (countPt > 0)
                {
                    return BadRequest(new { message = "Mỗi tài khoản chỉ được đánh giá 1 lần trên cùng sản phẩm!" });
                }
            }
            else if (dto.MaXe.HasValue && dto.MaXe.Value > 0)
            {
                var countXe = await _db.ExecuteScalarAsync<int>(
                    "SELECT COUNT(*) FROM PHAN_HOI WHERE MaKH = @MaKH AND MaXe = @MaXe",
                    new { dto.MaKH, dto.MaXe });
                if (countXe > 0)
                {
                    return BadRequest(new { message = "Mỗi tài khoản chỉ được đánh giá 1 lần trên cùng dòng xe!" });
                }
            }

            var sql = @"
                INSERT INTO PHAN_HOI (MaKH, MaXe, MaPhuTung, DiemDanhGia, NoiDung, TrangThaiXuLy, NgayGui)
                VALUES (@MaKH, @MaXe, @MaPhuTung, @DiemDanhGia, @NoiDung, N'Chờ xử lý', GETDATE());
                SELECT CAST(SCOPE_IDENTITY() AS INT);";

            var id = await _db.ExecuteScalarAsync<int>(sql, new
            {
                dto.MaKH,
                dto.MaXe,
                dto.MaPhuTung,
                dto.DiemDanhGia,
                dto.NoiDung
            });

            return Ok(new { id, message = "Gửi đánh giá thành công!" });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PhanHoiUpdateDto dto)
        {
            if (dto.DiemDanhGia < 1 || dto.DiemDanhGia > 5)
            {
                return BadRequest(new { message = "Điểm đánh giá phải từ 1 đến 5 sao." });
            }

            var sql = @"
                UPDATE PHAN_HOI 
                SET DiemDanhGia = @DiemDanhGia, NoiDung = @NoiDung
                WHERE MaPH = @Id";

            var affected = await _db.ExecuteAsync(sql, new { dto.DiemDanhGia, dto.NoiDung, Id = id });
            if (affected == 0)
            {
                return NotFound(new { message = "Không tìm thấy đánh giá cần sửa." });
            }

            return Ok(new { message = "Cập nhật đánh giá thành công!" });
        }

        [HttpPatch("{id}/trang-thai")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] Dictionary<string, string> body)
        {
            var status = body.ContainsKey("trangThai") ? body["trangThai"] : "Đã phản hồi";
            var sql = "UPDATE PHAN_HOI SET TrangThaiXuLy = @status WHERE MaPH = @id";
            await _db.ExecuteAsync(sql, new { status, id });
            return Ok(new { message = "Cập nhật trạng thái thành công!" });
        }

        // ĐG07: Tin nhắn trực tiếp giữa Web CSKH và Khách hàng
        private static readonly object _fileLock = new();
        private static readonly string _chatFilePath = Path.Combine(AppContext.BaseDirectory, "chat_history.json");

        static PhanHoiController()
        {
            try
            {
                if (System.IO.File.Exists(_chatFilePath))
                {
                    var json = System.IO.File.ReadAllText(_chatFilePath);
                    var list = System.Text.Json.JsonSerializer.Deserialize<List<ChatMessageDto>>(json);
                    if (list != null && list.Count > 0)
                    {
                        foreach (var m in list)
                        {
                            if (!_chatMessages.Any(existing => existing.Id == m.Id))
                            {
                                _chatMessages.Add(m);
                            }
                        }
                    }
                }
            }
            catch { }
        }

        private static void SaveChatToFile()
        {
            try
            {
                lock (_fileLock)
                {
                    var json = System.Text.Json.JsonSerializer.Serialize(_chatMessages.ToList());
                    System.IO.File.WriteAllText(_chatFilePath, json);
                }
            }
            catch { }
        }

        [HttpGet("messages")]
        public IActionResult GetMessages([FromQuery] string? customerId)
        {
            var list = _chatMessages.ToList();
            if (!string.IsNullOrWhiteSpace(customerId))
            {
                list = list.Where(m => m.CustomerId == customerId || m.CustomerId == "ALL").ToList();
            }
            return Ok(list.OrderBy(m => m.SentAt));
        }

        [HttpGet("conversations")]
        public IActionResult GetConversations()
        {
            var grouped = _chatMessages
                .GroupBy(m => string.IsNullOrWhiteSpace(m.CustomerId) ? "KH001" : m.CustomerId)
                .Select(g =>
                {
                    var lastMsg = g.OrderByDescending(m => m.SentAt).First();
                    var custName = g.FirstOrDefault(m => m.Sender == "customer" && !string.IsNullOrWhiteSpace(m.SenderName))?.SenderName
                                   ?? (g.Key == "KH001" ? "Nguyễn Văn An" : g.Key == "KH002" ? "Trần Thị Bích" : $"Khách hàng ({g.Key})");
                    return new
                    {
                        customerId = g.Key,
                        customerName = custName,
                        lastMessage = lastMsg.Content,
                        lastSentAt = lastMsg.SentAt,
                        totalMessages = g.Count(),
                        lastSender = lastMsg.Sender
                    };
                })
                .OrderByDescending(c => c.lastSentAt)
                .ToList();

            return Ok(grouped);
        }

        [HttpPost("messages")]
        public IActionResult SendMessage([FromBody] ChatMessageDto msg)
        {
            if (string.IsNullOrWhiteSpace(msg.Content))
            {
                return BadRequest(new { message = "Nội dung tin nhắn không được để trống." });
            }

            if (string.IsNullOrWhiteSpace(msg.Id))
            {
                msg.Id = "msg-" + DateTime.Now.Ticks;
            }
            if (string.IsNullOrWhiteSpace(msg.CustomerId))
            {
                msg.CustomerId = "KH001";
            }
            msg.SentAt = DateTime.Now;
            _chatMessages.Add(msg);
            SaveChatToFile();
            return Ok(msg);
        }
    }
}