namespace CrmBackend.Models
{
    // ── Bảng TAI_KHOAN ──
    public class TaiKhoan
    {
        public int MaTK { get; set; }
        public string TenDangNhap { get; set; } = "";
        public string VaiTro { get; set; } = "KhachHang";
        public string TrangThai { get; set; } = "HoatDong";
        public DateTime NgayTao { get; set; }
    }

    // ── Request / Response cho Login ──
    public class LoginRequest
    {
        public string TenDangNhap { get; set; } = "";
        public string MatKhau { get; set; } = "";
    }

    public class LoginResponse
    {
        public int MaTK { get; set; }
        public string TenDangNhap { get; set; } = "";
        public string VaiTro { get; set; } = "";
        public string? HoTen { get; set; }
    }
}
