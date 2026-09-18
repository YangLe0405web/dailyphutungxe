namespace CrmBackend.Models
{
    // ── Bảng XE_KHACH_HANG ──
    public class XeKhachHang
    {
        public int MaXeSoHuu { get; set; }
        public int MaKH { get; set; }
        public int MaXe { get; set; }
        public string BienSoXe { get; set; } = "";
        public string SoKhung { get; set; } = "";
        public string? SoMay { get; set; }
        public DateTime NgayMua { get; set; }
        public DateTime HanBaoHanh { get; set; }

        // JOIN từ KHACH_HANG
        public string? HoTenKH { get; set; }
        public string? SoDienThoai { get; set; }

        // JOIN từ SAN_PHAM_XE
        public string? TenXe { get; set; }
        public string? HangXe { get; set; }
    }

    // ── DTO thêm xe cho khách (POST) ──
    public class XeKhachHangCreateDto
    {
        public int MaKH { get; set; }
        public int MaXe { get; set; }
        public string BienSoXe { get; set; } = "";
        public string SoKhung { get; set; } = "";
        public string? SoMay { get; set; }
        public DateTime NgayMua { get; set; }
        public DateTime HanBaoHanh { get; set; }
    }

    // ── DTO gia hạn bảo hành (PUT) ──
    public class GiaHanBaoHanhDto
    {
        public DateTime HanBaoHanhMoi { get; set; }
    }
}
