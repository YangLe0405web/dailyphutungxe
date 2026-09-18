namespace CrmBackend.Models
{
    // ── Bảng KHACH_HANG ──
    public class KhachHang
    {
        public int MaKH { get; set; }
        public int MaTK { get; set; }
        public string HoTen { get; set; } = "";
        public DateTime NgaySinh { get; set; }
        public string? GioiTinh { get; set; }
        public string SoDienThoai { get; set; } = "";
        public string? DiaChi { get; set; }
        public string? Email { get; set; }
        public string? SoThich { get; set; }
        public DateTime NgayTao { get; set; }

        // JOIN từ TAI_KHOAN
        public string? TenDangNhap { get; set; }
        public string? TrangThai { get; set; }
    }

    // ── DTO tạo khách hàng mới (POST) ──
    public class KhachHangCreateDto
    {
        public string HoTen { get; set; } = "";
        public DateTime NgaySinh { get; set; }
        public string? GioiTinh { get; set; }
        public string SoDienThoai { get; set; } = "";
        public string? DiaChi { get; set; }
        public string? Email { get; set; }
        public string? SoThich { get; set; }
        public string TenDangNhap { get; set; } = "";
        public string MatKhau { get; set; } = "";
    }

    // ── DTO cập nhật khách hàng (PUT) ──
    public class KhachHangUpdateDto
    {
        public string HoTen { get; set; } = "";
        public DateTime NgaySinh { get; set; }
        public string? GioiTinh { get; set; }
        public string SoDienThoai { get; set; } = "";
        public string? DiaChi { get; set; }
        public string? Email { get; set; }
        public string? SoThich { get; set; }
    }
}
