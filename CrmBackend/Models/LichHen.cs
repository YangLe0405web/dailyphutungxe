using System.ComponentModel.DataAnnotations;

namespace CrmBackend.Models
{
    public class LichHen
    {
        public int MaLich { get; set; }
        public int MaKH { get; set; }
        public string LoaiDichVu { get; set; } = "";
        public DateTime NgayHen { get; set; }
        public string? GhiChu { get; set; }
        public string TrangThai { get; set; } = "Chờ xác nhận";

        // Thuộc tính mở rộng khi JOIN KHACH_HANG
        public string? TenKhachHang { get; set; }
        public string? SoDienThoai { get; set; }
    }

    // DTO cho việc đặt lịch hẹn mới (Appointment / Model 7)
    public class LichHenCreateDto
    {
        [Required(ErrorMessage = "Mã khách hàng không được để trống")]
        public int MaKH { get; set; }

        [Required(ErrorMessage = "Loại dịch vụ không được để trống")]
        public string LoaiDichVu { get; set; } = "";

        [Required(ErrorMessage = "Ngày hẹn không được để trống")]
        public DateTime NgayHen { get; set; }

        public string? GhiChu { get; set; }
    }

    // DTO cập nhật trạng thái lịch hẹn
    public class LichHenUpdateDto
    {
        [Required(ErrorMessage = "Trạng thái không được để trống")]
        public string TrangThai { get; set; } = "";

        public string? GhiChu { get; set; }
    }
}
