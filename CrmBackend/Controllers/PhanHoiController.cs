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

        private static readonly ConcurrentDictionary<int, List<string>> _attachments = new()
        {
            [1003] = new List<string> { "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500" },
            [1] = new List<string> { "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500" }
        };

        private static readonly ConcurrentDictionary<int, (string nhanVien, DateTime ngay)> _handlers = new()
        {
            [1] = ("Nguyễn Minh Tuấn (Chuyên viên CSKH)", new DateTime(2024, 11, 18)),
            [7] = ("Lê Thanh Thảo (Quản lý CSKH)", new DateTime(2024, 12, 17))
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
                var result = (await _db.QueryAsync<PhanHoi>(sql)).ToList();
                foreach (var p in result)
                {
                    if (_attachments.TryGetValue(p.MaPH, out var imgs))
                    {
                        p.HinhAnhDinhKem = imgs;
                    }
                    if (_handlers.TryGetValue(p.MaPH, out var h))
                    {
                        p.NhanVienXuLy = h.nhanVien;
                        p.NgayXuLy = h.ngay;
                    }
                    else if (p.TrangThaiXuLy == "Đã phản hồi" || p.TrangThaiXuLy == "DaXuLy")
                    {
                        p.NhanVienXuLy = p.NhanVienXuLy ?? "Nguyễn Minh Tuấn (Chuyên viên CSKH)";
                        p.NgayXuLy = p.NgayXuLy ?? (p.NgayGui ?? DateTime.Now.AddDays(-2));
                    }
                }
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

            // ĐG16: Giới hạn mỗi lần đánh giá không quá 200 từ và cảnh báo chống spam
            var wordCount = dto.NoiDung.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
            if (wordCount > 200)
            {
                return BadRequest(new { message = $"Đánh giá không được vượt quá 200 từ (Hiện tại: {wordCount} từ) nhằm đảm bảo chất lượng và phòng chống spam!" });
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

            if (dto.HinhAnhDinhKem != null && dto.HinhAnhDinhKem.Count > 0)
            {
                _attachments[id] = dto.HinhAnhDinhKem;
            }

            return Ok(new { id, message = "Gửi đánh giá thành công!" });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] PhanHoiUpdateDto dto)
        {
            if (dto.DiemDanhGia < 1 || dto.DiemDanhGia > 5)
            {
                return BadRequest(new { message = "Điểm đánh giá phải từ 1 đến 5 sao." });
            }

            // ĐG16: Giới hạn mỗi lần sửa đánh giá không quá 200 từ
            var wordCount = string.IsNullOrWhiteSpace(dto.NoiDung) ? 0 : dto.NoiDung.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
            if (wordCount > 200)
            {
                return BadRequest(new { message = $"Đánh giá không được vượt quá 200 từ (Hiện tại: {wordCount} từ) nhằm đảm bảo chất lượng và phòng chống spam!" });
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

            if (dto.HinhAnhDinhKem != null && dto.HinhAnhDinhKem.Count > 0)
            {
                _attachments[id] = dto.HinhAnhDinhKem;
            }

            return Ok(new { message = "Cập nhật đánh giá thành công!" });
        }

        [HttpPatch("{id}/trang-thai")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] Dictionary<string, string> body)
        {
            var status = body.ContainsKey("trangThai") ? body["trangThai"] : "Đã phản hồi";
            var sql = "UPDATE PHAN_HOI SET TrangThaiXuLy = @status WHERE MaPH = @id";
            await _db.ExecuteAsync(sql, new { status, id });

            var staff = body.ContainsKey("nhanVienXuLy") ? body["nhanVienXuLy"] : "Nguyễn Minh Tuấn (Chuyên viên CSKH)";
            _handlers[id] = (staff, DateTime.Now);

            return Ok(new { message = "Cập nhật trạng thái thành công!", nhanVienXuLy = staff, ngayXuLy = DateTime.Now });
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
                var cleanId = customerId.Trim();
                list = list.Where(m => string.Equals(m.CustomerId?.Trim(), cleanId, StringComparison.OrdinalIgnoreCase)).ToList();
            }
            return Ok(list.OrderBy(m => m.SentAt));
        }

        [HttpGet("conversations")]
        public async Task<IActionResult> GetConversations()
        {
            Dictionary<int, string> dbCustomers = new();
            try
            {
                var rows = await _db.QueryAsync<(int MaKH, string HoTen)>("SELECT MaKH, HoTen FROM KHACH_HANG");
                dbCustomers = rows.ToDictionary(r => r.MaKH, r => r.HoTen);
            }
            catch { }

            var list = _chatMessages.ToList();
            var grouped = list
                .Where(m => !string.IsNullOrWhiteSpace(m.CustomerId))
                .GroupBy(m => m.CustomerId.Trim().ToUpperInvariant())
                .Select(g =>
                {
                    var lastMsg = g.OrderByDescending(m => m.SentAt).First();
                    var rawId = g.Key;
                    string custName = "";

                    // Try to match from database by extracting numeric ID
                    var numPart = System.Text.RegularExpressions.Regex.Match(rawId, @"\d+").Value;
                    if (int.TryParse(numPart, out var maKh) && dbCustomers.TryGetValue(maKh, out var dbName))
                    {
                        custName = dbName;
                    }

                    if (string.IsNullOrWhiteSpace(custName))
                    {
                        custName = g.FirstOrDefault(m => m.Sender == "customer" && !string.IsNullOrWhiteSpace(m.SenderName))?.SenderName
                                       ?? (rawId == "KH001" ? "Nguyễn Văn An" : rawId == "KH002" ? "Trần Thị Bích" : $"Khách hàng ({rawId})");
                    }

                    return new
                    {
                        customerId = rawId,
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
                return BadRequest(new { message = "Mã khách hàng (CustomerId) không được để trống." });
            }
            msg.CustomerId = msg.CustomerId.Trim().ToUpperInvariant();
            msg.SentAt = DateTime.Now;
            _chatMessages.Add(msg);
            SaveChatToFile();
            return Ok(msg);
        }
    }
}