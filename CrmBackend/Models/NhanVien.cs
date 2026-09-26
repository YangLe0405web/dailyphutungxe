namespace CrmBackend.Models
{
    // ── Bảng NHAN_VIEN (StaffAccount & AdminRole) ──
    public class NhanVien
    {
        public int MaNV { get; set; }
        public int? MaTK { get; set; }
        public string HoTen { get; set; } = "";
        public string Email { get; set; } = "";
        public string SoDienThoai { get; set; } = "";
        public string? ChucVu { get; set; }
        public string VaiTro { get; set; } = "NhanVienBanHang"; // SuperAdmin | NhanVienBanHang | NhanVienKyThuat | Admin
        public string TrangThai { get; set; } = "HoatDong";     // HoatDong | BiKhoa
        public string? Avatar { get; set; }
        public DateTime NgayThamGia { get; set; }
        public DateTime NgayTao { get; set; }

        // JOIN từ bảng TAI_KHOAN (nếu có)
        public string? TenDangNhap { get; set; }
    }

    // ── DTO tạo nhân viên mới (POST) ──
    public class NhanVienCreateDto
    {
        public string HoTen { get; set; } = "";
        public string Email { get; set; } = "";
        public string SoDienThoai { get; set; } = "";
        public string? ChucVu { get; set; }
        public string VaiTro { get; set; } = "NhanVienBanHang";
        public string? Avatar { get; set; }
        public DateTime? NgayThamGia { get; set; }
        public string TenDangNhap { get; set; } = "";
        public string MatKhau { get; set; } = "";
    }

    // ── DTO cập nhật thông tin nhân viên (PUT) ──
    public class NhanVienUpdateDto
    {
        public string HoTen { get; set; } = "";
        public string Email { get; set; } = "";
        public string SoDienThoai { get; set; } = "";
        public string? ChucVu { get; set; }
        public string VaiTro { get; set; } = "NhanVienBanHang";
        public string? Avatar { get; set; }
    }

    // ── DTO phân quyền / đổi vai trò nhân viên ──
    public class DoiVaiTroDto
    {
        public string VaiTroMoi { get; set; } = "";
    }
}
