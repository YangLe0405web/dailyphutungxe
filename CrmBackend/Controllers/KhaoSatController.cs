using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using System.Collections.Concurrent;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    public class SurveyQuestionDto
    {
        public string Id { get; set; } = "";
        public string Text { get; set; } = "";
        public List<string> Opts { get; set; } = new();
    }

    public class SurveyDetailDto
    {
        public string Id { get; set; } = "";
        public string Title { get; set; } = "";
        public string Description { get; set; } = "";
        public string Status { get; set; } = "DangDienRa";
        public string StartDate { get; set; } = "";
        public string EndDate { get; set; } = "";
        public string PublishDate { get; set; } = "";
        public string CreatedDate { get; set; } = "26-10-2026";
        public string TargetCustomerId { get; set; } = "ALL";
        public string TargetCustomerTier { get; set; } = "ALL";
        public List<string> TargetCustomerIds { get; set; } = new();
        public List<SurveyQuestionDto> Questions { get; set; } = new();
        public int ResponseCount { get; set; }
        public int TargetCount { get; set; }
    }

    public class SurveyResponseItemDto
    {
        public string Id { get; set; } = "";
        public string SurveyId { get; set; } = "";
        public string CustomerId { get; set; } = "";
        public string CustomerName { get; set; } = "";
        public string PhoneNumber { get; set; } = "";
        public string VehicleInfo { get; set; } = "";
        public string OverallRating { get; set; } = "Rất hài lòng 😊";
        public string SubmittedDate { get; set; } = "";
        public Dictionary<string, string> Answers { get; set; } = new();
        public string? Notes { get; set; }
        public bool Handled { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class KhaoSatController : ControllerBase
    {
        private readonly IDbConnection _db;
        private static readonly ConcurrentDictionary<string, SurveyDetailDto> _surveys = new();
        private static readonly ConcurrentBag<SurveyResponseItemDto> _responses = new();
        private static bool _initialized = false;

        public KhaoSatController(IDbConnection db)
        {
            _db = db;
            EnsureInitialized();
        }

        private static void EnsureInitialized()
        {
            if (_initialized) return;
            _initialized = true;

            var standardQuestions = new List<SurveyQuestionDto>
            {
                new SurveyQuestionDto
                {
                    Id = "q1",
                    Text = "Mức độ hài lòng của bạn về ngoại quan và tình trạng xe mới khi nhận bàn giao (sơn xe, gương, phụ kiện, số khung/số máy)?",
                    Opts = new List<string>
                    {
                        "Rất hài lòng (Xe sạch bóng, nguyên seal, đủ phụ kiện)",
                        "Hài lòng (Đạt tiêu chuẩn)",
                        "Bình thường",
                        "Chưa hài lòng"
                    }
                },
                new SurveyQuestionDto
                {
                    Id = "q2",
                    Text = "Thái độ tư vấn, hỗ trợ thủ tục hồ sơ và đăng ký xe của nhân viên bán hàng?",
                    Opts = new List<string>
                    {
                        "Nhiệt tình, chu đáo, rất chuyên nghiệp",
                        "Tận tâm, đầy đủ thông tin",
                        "Bình thường",
                        "Cần cải thiện thái độ phục vụ"
                    }
                },
                new SurveyQuestionDto
                {
                    Id = "q3",
                    Text = "Bạn đã được chuyên viên hướng dẫn chi tiết về Sổ bảo hành điện tử và các mốc bảo dưỡng định kỳ?",
                    Opts = new List<string>
                    {
                        "Đã được hướng dẫn rất chi tiết & rõ ràng",
                        "Đã được giải thích sơ bộ",
                        "Chưa được hướng dẫn"
                    }
                },
                new SurveyQuestionDto
                {
                    Id = "q4",
                    Text = "Bạn có sẵn lòng giới thiệu Showroom DailyXeMay cho người thân, bạn bè khi có nhu cầu mua xe máy không?",
                    Opts = new List<string>
                    {
                        "Chắc chắn sẽ giới thiệu",
                        "Có thể",
                        "Chưa chắc chắn"
                    }
                }
            };

            // 12 Khảo sát chuẩn theo Ảnh 1: 10 Đang diễn ra, 1 Sắp diễn ra, 1 Đã kết thúc
            var list = new List<SurveyDetailDto>
            {
                new SurveyDetailDto
                {
                    Id = "KS-XE-DH-XE-003",
                    Title = "Khảo sát trải nghiệm bàn giao xe mới: Honda SH 160i ABS 2024 (#DH-XE-003)",
                    Description = "Chúc mừng quý khách đã nhận xe Honda SH 160i ABS 2024! DailyXeMay trân trọng mời quý khách dành 1-2 phút nâng cao chất lượng phục vụ và nhận quà tri ân.",
                    Status = "DangDienRa",
                    StartDate = "2026-10-26T08:00",
                    EndDate = "2026-12-31T23:59",
                    PublishDate = "2026-10-26T08:00",
                    CreatedDate = "26-10-2026",
                    TargetCustomerId = "ALL",
                    TargetCustomerTier = "ALL",
                    ResponseCount = 8,
                    TargetCount = 10,
                    Questions = standardQuestions
                },
                new SurveyDetailDto
                {
                    Id = "KS-XE-DH-XE-004",
                    Title = "Khảo sát trải nghiệm bàn giao xe mới: Honda SH 160i ABS 2024 (#DH-XE-004)",
                    Description = "Đánh giá chất lượng bàn giao xe mới và mức độ hoàn thiện hồ sơ đăng ký.",
                    Status = "DangDienRa",
                    StartDate = "2026-10-26T08:00",
                    EndDate = "2026-12-31T23:59",
                    PublishDate = "2026-10-26T08:00",
                    CreatedDate = "26-10-2026",
                    TargetCustomerId = "KH002",
                    TargetCustomerTier = "ALL",
                    ResponseCount = 0,
                    TargetCount = 1,
                    Questions = standardQuestions
                },
                new SurveyDetailDto
                {
                    Id = "KS-XE-DH-XE-0003",
                    Title = "Khảo sát trải nghiệm bàn giao xe mới: Honda SH 160i ABS 2024 (#DH-XE-0003)",
                    Description = "Thăm dò ý kiến khách hàng sau buổi lễ nhận xe máy chính hãng tại showroom Motoshop.",
                    Status = "DangDienRa",
                    StartDate = "2026-10-26T08:00",
                    EndDate = "2026-12-31T23:59",
                    PublishDate = "2026-10-26T08:00",
                    CreatedDate = "26-10-2026",
                    TargetCustomerId = "ALL",
                    TargetCustomerTier = "ALL",
                    ResponseCount = 0,
                    TargetCount = 1,
                    Questions = standardQuestions
                },
                new SurveyDetailDto
                {
                    Id = "KS-XE-DH-XE-0004",
                    Title = "Khảo sát trải nghiệm bàn giao xe mới: Honda SH 160i ABS 2024 (#DH-XE-0004)",
                    Description = "Chương trình CSKH sau bàn giao xe mới và đăng ký cấp biển số xe máy.",
                    Status = "DangDienRa",
                    StartDate = "2026-10-26T08:00",
                    EndDate = "2026-12-31T23:59",
                    PublishDate = "2026-10-26T08:00",
                    CreatedDate = "26-10-2026",
                    TargetCustomerId = "ALL",
                    TargetCustomerTier = "ALL",
                    ResponseCount = 0,
                    TargetCount = 1,
                    Questions = standardQuestions
                },
                new SurveyDetailDto
                {
                    Id = "KS-BD-LH001",
                    Title = "Khảo sát chất lượng dịch vụ bảo dưỡng: Honda SH 160i ABS (#LH001)",
                    Description = "Đánh giá chất lượng phục vụ và thái độ nhân viên kỹ thuật tại showroom Motoshop.",
                    Status = "DangDienRa",
                    StartDate = "2026-10-26T08:00",
                    EndDate = "2026-12-31T23:59",
                    PublishDate = "2026-10-26T08:00",
                    CreatedDate = "26-10-2026",
                    TargetCustomerId = "KH001",
                    TargetCustomerTier = "ALL",
                    ResponseCount = 6,
                    TargetCount = 8,
                    Questions = standardQuestions
                },
                new SurveyDetailDto
                {
                    Id = "KS-BD-LH002",
                    Title = "Khảo sát chất lượng dịch vụ sửa chữa: Honda Lead 125 (#LH002)",
                    Description = "Đánh giá chất lượng phụ tùng thay thế và tay nghề kỹ thuật viên xưởng dịch vụ.",
                    Status = "DangDienRa",
                    StartDate = "2026-10-26T08:00",
                    EndDate = "2026-12-31T23:59",
                    PublishDate = "2026-10-26T08:00",
                    CreatedDate = "25-10-2026",
                    TargetCustomerId = "KH002",
                    TargetCustomerTier = "ALL",
                    ResponseCount = 4,
                    TargetCount = 5,
                    Questions = standardQuestions
                },
                new SurveyDetailDto
                {
                    Id = "KS-BD-LH003",
                    Title = "Khảo sát chất lượng dịch vụ bảo hành: Yamaha Exciter 155 (#LH003)",
                    Description = "Khảo sát mức độ hài lòng về thời gian và kết quả xử lý bảo hành điện tử.",
                    Status = "DangDienRa",
                    StartDate = "2026-10-25T08:00",
                    EndDate = "2026-12-31T23:59",
                    PublishDate = "2026-10-25T08:00",
                    CreatedDate = "25-10-2026",
                    TargetCustomerId = "KH003",
                    TargetCustomerTier = "ALL",
                    ResponseCount = 2,
                    TargetCount = 3,
                    Questions = standardQuestions
                },
                new SurveyDetailDto
                {
                    Id = "KS-XE-DH-XE-001",
                    Title = "Khảo sát trải nghiệm bàn giao xe mới: Yamaha Grande Hybrid (#DH-XE-001)",
                    Description = "Đánh giá trải nghiệm nhận xe máy hybrid và các dịch vụ hậu mãi đi kèm.",
                    Status = "DangDienRa",
                    StartDate = "2026-10-24T08:00",
                    EndDate = "2026-12-31T23:59",
                    PublishDate = "2026-10-24T08:00",
                    CreatedDate = "24-10-2026",
                    TargetCustomerId = "ALL",
                    TargetCustomerTier = "ALL",
                    ResponseCount = 3,
                    TargetCount = 4,
                    Questions = standardQuestions
                },
                new SurveyDetailDto
                {
                    Id = "KS-XE-DH-XE-002",
                    Title = "Khảo sát trải nghiệm bàn giao xe mới: Honda Air Blade 160 (#DH-XE-002)",
                    Description = "Đánh giá chất lượng bàn giao dòng xe thể thao Air Blade 160.",
                    Status = "DangDienRa",
                    StartDate = "2026-10-23T08:00",
                    EndDate = "2026-12-31T23:59",
                    PublishDate = "2026-10-23T08:00",
                    CreatedDate = "23-10-2026",
                    TargetCustomerId = "ALL",
                    TargetCustomerTier = "ALL",
                    ResponseCount = 5,
                    TargetCount = 6,
                    Questions = standardQuestions
                },
                new SurveyDetailDto
                {
                    Id = "KS001",
                    Title = "Khảo sát chất lượng Dịch vụ Bảo dưỡng định kỳ Motoshop 2026",
                    Description = "Đánh giá chất lượng phục vụ và thái độ nhân viên kỹ thuật tại showroom Motoshop.",
                    Status = "DangDienRa",
                    StartDate = "2026-01-01T08:00",
                    EndDate = "2026-12-31T23:59",
                    PublishDate = "2026-01-01T08:00",
                    CreatedDate = "01-01-2026",
                    TargetCustomerId = "ALL",
                    TargetCustomerTier = "ALL",
                    ResponseCount = 40,
                    TargetCount = 50,
                    Questions = standardQuestions
                },
                new SurveyDetailDto
                {
                    Id = "KS003",
                    Title = "Khảo sát đặc quyền tri ân Khách hàng VIP Xuân 2027",
                    Description = "Khảo sát ý kiến đóng góp về chính sách quà tặng và cứu hộ miễn phí 24/7 dành cho hội viên thân thiết.",
                    Status = "SapDienRa",
                    StartDate = "2026-12-01T08:00",
                    EndDate = "2027-02-28T23:59",
                    PublishDate = "2026-10-20T08:00",
                    CreatedDate = "20-10-2026",
                    TargetCustomerId = "ALL",
                    TargetCustomerTier = "VIP",
                    ResponseCount = 0,
                    TargetCount = 20,
                    Questions = standardQuestions
                },
                new SurveyDetailDto
                {
                    Id = "KS004",
                    Title = "Khảo sát đánh giá trải nghiệm phụ tùng Quý 3/2024",
                    Description = "Đánh giá độ bền và độ tương thích của phụ tùng Motul, Michelin, Brembo lắp đặt tại showroom.",
                    Status = "DaKetThuc",
                    StartDate = "2024-07-01T08:00",
                    EndDate = "2024-09-30T23:59",
                    PublishDate = "2024-07-01T08:00",
                    CreatedDate = "01-07-2024",
                    TargetCustomerId = "ALL",
                    TargetCustomerTier = "ALL",
                    ResponseCount = 18,
                    TargetCount = 20,
                    Questions = standardQuestions
                }
            };

            foreach (var s in list)
            {
                _surveys[s.Id] = s;
            }

            // Responses cho KS-XE-DH-XE-003 (Khớp 100% Ảnh 3)
            _responses.Add(new SurveyResponseItemDto
            {
                Id = "RESP-001",
                SurveyId = "KS-XE-DH-XE-003",
                CustomerId = "KH001",
                CustomerName = "Nguyễn Văn A",
                PhoneNumber = "0901***890",
                VehicleInfo = "29K1-123.45",
                OverallRating = "Rất hài lòng 😊",
                SubmittedDate = "26/10/2026",
                Answers = new Dictionary<string, string>
                {
                    ["q1"] = "Rất hài lòng (Xe sạch bóng, nguyên seal, đủ phụ kiện)",
                    ["q2"] = "Nhiệt tình, chu đáo, rất chuyên nghiệp",
                    ["q3"] = "Đã được hướng dẫn rất chi tiết & rõ ràng",
                    ["q4"] = "Chắc chắn sẽ giới thiệu"
                },
                Notes = "Xe giao đúng giờ, rửa xe sạch bóng, phụ kiện đi kèm đầy đủ.",
                Handled = true
            });

            _responses.Add(new SurveyResponseItemDto
            {
                Id = "RESP-002",
                SurveyId = "KS-XE-DH-XE-003",
                CustomerId = "KH002",
                CustomerName = "Trần Thị B",
                PhoneNumber = "0987***221",
                VehicleInfo = "59F2-678.90",
                OverallRating = "Chưa hài lòng 😞",
                SubmittedDate = "26/10/2026",
                Answers = new Dictionary<string, string>
                {
                    ["q1"] = "Chưa hài lòng",
                    ["q2"] = "Nhiệt tình, chu đáo, rất chuyên nghiệp",
                    ["q3"] = "Cần kiểm tra kỹ xe trước khi giao cho khách",
                    ["q4"] = "Có thể"
                },
                Notes = "Xe có vết trầy xước nhỏ ở dè trước, gương bị lỏng.",
                Handled = false
            });

            _responses.Add(new SurveyResponseItemDto
            {
                Id = "RESP-003",
                SurveyId = "KS-XE-DH-XE-003",
                CustomerId = "KH003",
                CustomerName = "Lê Văn C",
                PhoneNumber = "0912***456",
                VehicleInfo = "30F-567.89",
                OverallRating = "Bình thường 😐",
                SubmittedDate = "25/10/2026",
                Answers = new Dictionary<string, string>
                {
                    ["q1"] = "Hài lòng (Đạt tiêu chuẩn)",
                    ["q2"] = "Tận tâm, đầy đủ thông tin",
                    ["q3"] = "Đã được giải thích sơ bộ",
                    ["q4"] = "Có thể"
                },
                Notes = "Thủ tục bàn giao hơi lâu, mong đại lý rút ngắn thời gian ký biên bản.",
                Handled = false
            });
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try
            {
                var sql = "SELECT * FROM KHAO_SAT ORDER BY MaKS DESC";
                var dbList = await _db.QueryAsync<KhaoSat>(sql);
                if (dbList != null && dbList.Any())
                {
                    foreach (var ks in dbList)
                    {
                        var key = $"KS-{ks.MaKS}";
                        if (!_surveys.ContainsKey(key))
                        {
                            _surveys[key] = new SurveyDetailDto
                            {
                                Id = key,
                                Title = ks.TieuDe,
                                Description = ks.MoTa,
                                StartDate = ks.NgayTao.ToString("s"),
                                EndDate = (ks.HanKetThuc ?? ks.NgayTao.AddDays(30)).ToString("s"),
                                PublishDate = ks.NgayTao.ToString("s"),
                                CreatedDate = ks.NgayTao.ToString("dd-MM-yyyy"),
                                Status = "DangDienRa",
                                Questions = new List<SurveyQuestionDto>()
                            };
                        }
                    }
                }
            }
            catch {}

            return Ok(_surveys.Values.ToList());
        }

        [HttpGet("{id}")]
        public IActionResult GetById(string id)
        {
            if (_surveys.TryGetValue(id, out var s))
            {
                return Ok(s);
            }
            return NotFound(new { message = $"Không tìm thấy khảo sát với mã {id}" });
        }

        [HttpPut("{id}")]
        public IActionResult Update(string id, [FromBody] SurveyDetailDto dto)
        {
            if (_surveys.TryGetValue(id, out var existing))
            {
                if (!string.IsNullOrWhiteSpace(dto.Title)) existing.Title = dto.Title;
                if (dto.Description != null) existing.Description = dto.Description;
                if (!string.IsNullOrWhiteSpace(dto.StartDate)) existing.StartDate = dto.StartDate;
                if (!string.IsNullOrWhiteSpace(dto.EndDate)) existing.EndDate = dto.EndDate;
                if (!string.IsNullOrWhiteSpace(dto.PublishDate)) existing.PublishDate = dto.PublishDate;
                if (!string.IsNullOrWhiteSpace(dto.Status)) existing.Status = dto.Status;
                if (dto.Questions != null && dto.Questions.Count > 0) existing.Questions = dto.Questions;
                if (dto.TargetCustomerId != null) existing.TargetCustomerId = dto.TargetCustomerId;
                if (dto.TargetCustomerTier != null) existing.TargetCustomerTier = dto.TargetCustomerTier;
                return Ok(existing);
            }
            dto.Id = id;
            _surveys[id] = dto;
            return Ok(dto);
        }

        [HttpGet("ket-qua")]
        [HttpGet("{id}/ket-qua")]
        public IActionResult GetResponses(string? id)
        {
            if (string.IsNullOrEmpty(id) || id == "all")
            {
                return Ok(_responses.ToList());
            }
            return Ok(_responses.Where(r => r.SurveyId.Equals(id, StringComparison.OrdinalIgnoreCase)).ToList());
        }

        [HttpPost]
        public IActionResult Create([FromBody] SurveyDetailDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title))
            {
                return BadRequest(new { message = "Tiêu đề khảo sát không được để trống" });
            }

            if (string.IsNullOrEmpty(dto.Id))
            {
                dto.Id = $"KS{DateTime.Now:yyyyMMddHHmmss}";
            }

            if (string.IsNullOrEmpty(dto.CreatedDate))
            {
                dto.CreatedDate = DateTime.Now.ToString("dd-MM-yyyy");
            }

            _surveys[dto.Id] = dto;
            return Ok(dto);
        }

        [HttpPost("ket-qua")]
        public IActionResult SubmitResponse([FromBody] SurveyResponseItemDto dto)
        {
            if (string.IsNullOrEmpty(dto.Id))
            {
                dto.Id = $"RESP-{DateTime.Now.Ticks % 1000000:D6}";
            }
            if (string.IsNullOrEmpty(dto.SubmittedDate))
            {
                dto.SubmittedDate = DateTime.Now.ToString("dd/MM/yyyy");
            }
            _responses.Add(dto);

            if (_surveys.TryGetValue(dto.SurveyId, out var s))
            {
                s.ResponseCount++;
            }

            return Ok(dto);
        }

        [HttpPut("ket-qua/{id}/xu-ly")]
        public IActionResult MarkResponseHandled(string id)
        {
            var match = _responses.FirstOrDefault(r => r.Id.Equals(id, StringComparison.OrdinalIgnoreCase));
            if (match != null)
            {
                match.Handled = true;
                return Ok(new { success = true, response = match });
            }
            return NotFound(new { message = "Không tìm thấy phản hồi" });
        }
    }
}
