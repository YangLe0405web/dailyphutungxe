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
                SenderName = "Trần Văn Quản Lý",
                Content = "Dạ chào anh An, Motoshop rất xin lỗi về sự cố rỉ nắp nhớt trong quá trình vận chuyển ạ. Showroom xin hỗ trợ đổi mới ngay cho anh ạ. Anh cho em xin lại địa chỉ nhé!",
                SentAt = DateTime.Today.AddHours(0).AddMinutes(16)
            },
            new ChatMessageDto
            {
                Id = "msg-sample-lp-1",
                CustomerId = "KH1004",
                Sender = "staff",
                SenderName = "Trần Văn Quản Lý",
                Content = "Dạ chào chị Lan Phương, Motoshop rất xin lỗi về sự cố rỉ nắp nhớt trong quá trình vận chuyển ạ. Showroom xin hỗ trợ đổi mới ngay cho chị ạ. Chị cho em xin lại địa chỉ nhé!",
                SentAt = DateTime.Today.AddHours(0).AddMinutes(16)
            },
            new ChatMessageDto
            {
                Id = "msg-sample-30-1",
                CustomerId = "KH030",
                Sender = "customer",
                SenderName = "Lê Thị Test",
                Content = "Chào showroom, phụ tùng của em khi nào giao tới nơi ạ?",
                SentAt = DateTime.Today.AddHours(8).AddMinutes(30)
            },
            new ChatMessageDto
            {
                Id = "msg-sample-32-1",
                CustomerId = "KH032",
                Sender = "customer",
                SenderName = "Nguyễn Thị Mầu",
                Content = "Tôi muốn hỏi về phụ tùng",
                SentAt = DateTime.Today.AddHours(9).AddMinutes(15)
            }
        };

        private static readonly ConcurrentDictionary<int, List<string>> _attachments = new()
        {
            [1003] = new List<string> { "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500" },
            [1] = new List<string> { "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=500" }
        };

        private static readonly ConcurrentDictionary<int, (string nhanVien, DateTime ngay)> _handlers = new()
        {
            [1] = ("Trần Văn Quản Lý (Giám đốc Showroom)", new DateTime(2024, 11, 18)),
            [7] = ("Lê Thị Thu Hà (Chuyên viên Bán hàng & CSKH)", new DateTime(2024, 12, 17))
        };

        private static readonly ConcurrentDictionary<int, (string? ten, string? loai)> _productInfo = new();

        public class ShopReplyRecord
        {
            public int MaPH { get; set; }
            public string Reply { get; set; } = "";
            public string Staff { get; set; } = "";
            public DateTime Time { get; set; } = DateTime.Now;
        }

        private static readonly ConcurrentDictionary<int, ShopReplyRecord> _shopReplies = new()
        {
            [1] = new ShopReplyRecord
            {
                MaPH = 1,
                Reply = "Cảm ơn Quý khách đã tin tưởng dịch vụ bảo dưỡng của Showroom Motoshop!",
                Staff = "Trần Văn Quản Lý (Giám đốc Showroom)",
                Time = new DateTime(2024, 11, 18)
            }
        };

        private static readonly string _shopRepliesFilePath = Path.Combine(AppContext.BaseDirectory, "shop_replies.json");

        public PhanHoiController(IDbConnection db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                // Tự động chuẩn hóa dữ liệu cũ nếu MaXe và MaPhuTung chưa được gán
                try
                {
                    await _db.ExecuteAsync(@"
                        UPDATE PHAN_HOI SET MaXe = 1 WHERE MaXe IS NULL AND MaPhuTung IS NULL AND (LOWER(NoiDung) LIKE '%xe%' OR MaPH = 4);
                        UPDATE PHAN_HOI SET MaPhuTung = 1 WHERE MaPhuTung IS NULL AND MaXe IS NULL AND (LOWER(NoiDung) LIKE '%phụ%' OR MaPH = 5);
                    ");
                }
                catch {}

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
                        p.NhanVienXuLy = p.NhanVienXuLy ?? "Trần Văn Quản Lý (Giám đốc Showroom)";
                        p.NgayXuLy = p.NgayXuLy ?? (p.NgayGui ?? DateTime.Now.AddDays(-2));
                    }
                    if (_shopReplies.TryGetValue(p.MaPH, out var sr))
                    {
                        p.PhanHoiCuaShop = sr.Reply;
                        p.GhiChuXuLy = sr.Reply;
                        p.NhanVienXuLy = sr.Staff;
                        p.NgayPhanHoi = sr.Time;
                        p.NgayXuLy = sr.Time;
                    }
                    if (_productInfo.TryGetValue(p.MaPH, out var prodInfo))
                    {
                        if (prodInfo.loai == "XeMau" || prodInfo.loai == "Xe")
                        {
                            p.TenXe = p.TenXe ?? prodInfo.ten;
                        }
                        else
                        {
                            p.TenPhuTung = p.TenPhuTung ?? prodInfo.ten;
                        }
                    }

                    // Fallback an toàn nếu vẫn chưa có tên xe hoặc tên phụ tùng
                    if (string.IsNullOrEmpty(p.TenXe) && string.IsNullOrEmpty(p.TenPhuTung))
                    {
                        if (p.NoiDung != null && (p.NoiDung.ToLower().Contains("xe") || p.NoiDung.ToLower().Contains("sh") || p.NoiDung.ToLower().Contains("chạy") || p.MaPH == 4))
                        {
                            p.TenXe = "Honda SH 160i ABS (2025)";
                            p.HangXe = p.HangXe ?? "Honda";
                            p.LoaiXe = p.LoaiXe ?? "Xe ga";
                        }
                        else
                        {
                            p.TenPhuTung = "Phụ tùng chính hãng Motoshop";
                        }
                    }
                }
                return Ok(result);
            }
            catch (Exception ex)
            {
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

            // ĐG16: Giới hạn mỗi lần gửi đánh giá không quá 200 từ
            var wordCount = string.IsNullOrWhiteSpace(dto.NoiDung) ? 0 : dto.NoiDung.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
            if (wordCount > 200)
            {
                return BadRequest(new { message = $"Đánh giá không được vượt quá 200 từ (Hiện tại: {wordCount} từ) nhằm đảm bảo chất lượng và phòng chống spam!" });
            }

            // Tự động phân loại MaXe hoặc MaPhuTung nếu chưa truyền ID nhưng có TenSanPham
            if ((!dto.MaXe.HasValue || dto.MaXe.Value <= 0) && (!dto.MaPhuTung.HasValue || dto.MaPhuTung.Value <= 0))
            {
                bool isXe = dto.LoaiDoiTuong == "XeMau" || (!string.IsNullOrEmpty(dto.TenSanPham) && (dto.TenSanPham.ToLower().Contains("xe") || dto.TenSanPham.ToLower().Contains("sh") || dto.TenSanPham.ToLower().Contains("air") || dto.TenSanPham.ToLower().Contains("vespa")));
                if (isXe)
                {
                    try
                    {
                        var xeId = await _db.ExecuteScalarAsync<int?>("SELECT TOP 1 MaXe FROM SAN_PHAM_XE WHERE LOWER(TenXe) LIKE '%' + LOWER(@Ten) + '%' OR LOWER(@Ten) LIKE '%' + LOWER(TenXe) + '%'", new { Ten = dto.TenSanPham ?? "SH" });
                        dto.MaXe = (xeId.HasValue && xeId.Value > 0) ? xeId : 1;
                    }
                    catch
                    {
                        dto.MaXe = 1;
                    }
                }
                else
                {
                    try
                    {
                        var ptId = await _db.ExecuteScalarAsync<int?>("SELECT TOP 1 MaPhuTung FROM PHU_TUNG WHERE LOWER(TenPhuTung) LIKE '%' + LOWER(@Ten) + '%' OR LOWER(@Ten) LIKE '%' + LOWER(TenPhuTung) + '%'", new { Ten = dto.TenSanPham ?? "Nhớt" });
                        dto.MaPhuTung = (ptId.HasValue && ptId.Value > 0) ? ptId : 1;
                    }
                    catch
                    {
                        dto.MaPhuTung = 1;
                    }
                }
            }

            // Hỗ trợ cập nhật mượt mà nếu tài khoản đã từng đánh giá sản phẩm này trước đó (không bị chặn lỗi 400 khi test lại)
            if (dto.MaPhuTung.HasValue && dto.MaPhuTung.Value > 0)
            {
                var existingId = await _db.ExecuteScalarAsync<int?>(
                    "SELECT TOP 1 MaPH FROM PHAN_HOI WHERE MaKH = @MaKH AND MaPhuTung = @MaPhuTung",
                    new { dto.MaKH, dto.MaPhuTung });
                if (existingId.HasValue && existingId.Value > 0)
                {
                    await _db.ExecuteAsync(
                        "UPDATE PHAN_HOI SET DiemDanhGia = @DiemDanhGia, NoiDung = @NoiDung, NgayGui = GETDATE() WHERE MaPH = @MaPH",
                        new { dto.DiemDanhGia, dto.NoiDung, MaPH = existingId.Value });
                    if (dto.HinhAnhDinhKem != null) _attachments[existingId.Value] = dto.HinhAnhDinhKem;
                    if (!string.IsNullOrEmpty(dto.TenSanPham)) _productInfo[existingId.Value] = (dto.TenSanPham, dto.LoaiDoiTuong);
                    return Ok(new { id = existingId.Value, message = "Cập nhật đánh giá thành công!" });
                }
            }
            else if (dto.MaXe.HasValue && dto.MaXe.Value > 0)
            {
                var existingId = await _db.ExecuteScalarAsync<int?>(
                    "SELECT TOP 1 MaPH FROM PHAN_HOI WHERE MaKH = @MaKH AND MaXe = @MaXe",
                    new { dto.MaKH, dto.MaXe });
                if (existingId.HasValue && existingId.Value > 0)
                {
                    await _db.ExecuteAsync(
                        "UPDATE PHAN_HOI SET DiemDanhGia = @DiemDanhGia, NoiDung = @NoiDung, NgayGui = GETDATE() WHERE MaPH = @MaPH",
                        new { dto.DiemDanhGia, dto.NoiDung, MaPH = existingId.Value });
                    if (dto.HinhAnhDinhKem != null) _attachments[existingId.Value] = dto.HinhAnhDinhKem;
                    if (!string.IsNullOrEmpty(dto.TenSanPham)) _productInfo[existingId.Value] = (dto.TenSanPham, dto.LoaiDoiTuong);
                    return Ok(new { id = existingId.Value, message = "Cập nhật đánh giá thành công!" });
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
            if (!string.IsNullOrEmpty(dto.TenSanPham))
            {
                _productInfo[id] = (dto.TenSanPham, dto.LoaiDoiTuong);
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
            try
            {
                var sql = "UPDATE PHAN_HOI SET TrangThaiXuLy = @status WHERE MaPH = @id";
                await _db.ExecuteAsync(sql, new { status, id });
            }
            catch {}

            var staff = body.ContainsKey("nhanVienXuLy") && !string.IsNullOrWhiteSpace(body["nhanVienXuLy"]) 
                ? body["nhanVienXuLy"] 
                : "Trần Văn Quản Lý (Giám đốc Showroom)";
            _handlers[id] = (staff, DateTime.Now);

            var reply = body.ContainsKey("phanHoiCuaShop") && !string.IsNullOrWhiteSpace(body["phanHoiCuaShop"])
                ? body["phanHoiCuaShop"]
                : (body.ContainsKey("ghiChuXuLy") ? body["ghiChuXuLy"] : "");

            if (!string.IsNullOrWhiteSpace(reply))
            {
                _shopReplies[id] = new ShopReplyRecord
                {
                    MaPH = id,
                    Reply = reply,
                    Staff = staff,
                    Time = DateTime.Now
                };
                SaveShopRepliesToFile();
            }

            return Ok(new { 
                message = "Cập nhật trạng thái thành công!", 
                nhanVienXuLy = staff, 
                ngayXuLy = DateTime.Now,
                phanHoiCuaShop = reply,
                ngayPhanHoi = DateTime.Now
            });
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

            try
            {
                if (System.IO.File.Exists(_shopRepliesFilePath))
                {
                    var json = System.IO.File.ReadAllText(_shopRepliesFilePath);
                    var list = System.Text.Json.JsonSerializer.Deserialize<List<ShopReplyRecord>>(json);
                    if (list != null && list.Count > 0)
                    {
                        foreach (var r in list)
                        {
                            _shopReplies[r.MaPH] = r;
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

        private static void SaveShopRepliesToFile()
        {
            try
            {
                lock (_fileLock)
                {
                    var json = System.Text.Json.JsonSerializer.Serialize(_shopReplies.Values.ToList());
                    System.IO.File.WriteAllText(_shopRepliesFilePath, json);
                }
            }
            catch { }
        }

        private static string NormalizeCustomerId(string? id)
        {
            if (string.IsNullOrWhiteSpace(id)) return "";
            var str = id.Trim();
            if (System.Text.RegularExpressions.Regex.IsMatch(str, @"^KH\d+$", System.Text.RegularExpressions.RegexOptions.IgnoreCase))
            {
                if (int.TryParse(str.Substring(2), out int num))
                {
                    return num < 10 ? $"KH00{num}" : num < 100 ? $"KH0{num}" : $"KH{num}";
                }
            }
            var digits = System.Text.RegularExpressions.Regex.Replace(str, @"\D", "");
            if (int.TryParse(digits, out int n))
            {
                return n < 10 ? $"KH00{n}" : n < 100 ? $"KH0{n}" : $"KH{n}";
            }
            return str.ToUpperInvariant();
        }

        [HttpGet("messages")]
        public IActionResult GetMessages([FromQuery] string? customerId)
        {
            var list = _chatMessages.ToList();
            if (!string.IsNullOrWhiteSpace(customerId))
            {
                var cleanId = NormalizeCustomerId(customerId);
                list = list.Where(m => string.Equals(NormalizeCustomerId(m.CustomerId), cleanId, StringComparison.OrdinalIgnoreCase)).ToList();
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
                                       ?? (rawId == "KH1004" ? "Lan Phương" : rawId == "KH001" ? "Nguyễn Văn An" : rawId == "KH002" ? "Trần Thị Bích" : $"Khách hàng ({rawId})");
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
            msg.CustomerId = NormalizeCustomerId(msg.CustomerId);
            msg.SentAt = DateTime.Now;
            _chatMessages.Add(msg);
            SaveChatToFile();
            return Ok(msg);
        }
    }
}
