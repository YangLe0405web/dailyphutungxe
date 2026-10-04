using System;

namespace CrmBackend.Models
{
    public class PhanHoi
    {
        public int MaPH { get; set; }
        public int MaKH { get; set; }
        public int? MaXe { get; set; }
        public int? MaPhuTung { get; set; }
        public int DiemDanhGia { get; set; }
        public string NoiDung { get; set; } = "";
        public DateTime? NgayGui { get; set; }
        public string TrangThaiXuLy { get; set; } = "Chờ xử lý";
        public string? HoTenKH { get; set; }
        public string? SoDienThoai { get; set; }
        public string? Email { get; set; }
        public string? DiaChi { get; set; }
        public string? TenPhuTung { get; set; }
        public string? LoaiPhuTung { get; set; }
        public string? TenXe { get; set; }
        public string? HangXe { get; set; }
        public string? LoaiXe { get; set; }
        public string? GhiChuXuLy { get; set; }
        public string? NhanVienXuLy { get; set; }
        public DateTime? NgayXuLy { get; set; }
        public List<string>? HinhAnhDinhKem { get; set; } = new();
        public int SoLanSua { get; set; } = 0;
    }

    public class PhanHoiCreateDto
    {
        public int MaKH { get; set; }
        public int? MaXe { get; set; }
        public int? MaPhuTung { get; set; }
        public int DiemDanhGia { get; set; }
        public string NoiDung { get; set; } = "";
        public string? TenSanPham { get; set; }
        public string? LoaiDoiTuong { get; set; }
        public List<string>? HinhAnhDinhKem { get; set; } = new();
    }

    public class PhanHoiUpdateDto
    {
        public int DiemDanhGia { get; set; }
        public string NoiDung { get; set; } = "";
        public List<string>? HinhAnhDinhKem { get; set; } = new();
    }

    public class ChatMessageDto
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string CustomerId { get; set; } = "";
        public string Sender { get; set; } = "staff"; // "staff" or "customer"
        public string SenderName { get; set; } = "";
        public string Content { get; set; } = "";
        public DateTime SentAt { get; set; } = DateTime.Now;
    }
}