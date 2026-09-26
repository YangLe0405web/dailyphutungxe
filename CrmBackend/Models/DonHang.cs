using System.ComponentModel.DataAnnotations;

namespace CrmBackend.Models
{
    public class DonHang
    {
        public int MaDon { get; set; }
        public int MaKH { get; set; }
        public DateTime NgayDat { get; set; }
        public decimal TongTien { get; set; }
        public string TrangThai { get; set; } = "Chờ xác nhận";

        // Thuộc tính mở rộng khi JOIN KHACH_HANG
        public string? TenKhachHang { get; set; }
        public string? SoDienThoai { get; set; }

        // Danh sách chi tiết phụ tùng đã đặt
        public List<ChiTietDonHang> ChiTiet { get; set; } = new();
    }

    public class ChiTietDonHang
    {
        public int MaDon { get; set; }
        public int MaPhuTung { get; set; }
        public int SoLuong { get; set; }
        public decimal DonGia { get; set; }

        // Thuộc tính mở rộng khi JOIN PHU_TUNG
        public string? TenPhuTung { get; set; }
        public string? LoaiPhuTung { get; set; }
    }

    // DTO cho từng món hàng trong giỏ (CartItem / Model 5)
    public class CartItemDto
    {
        [Required(ErrorMessage = "Mã phụ tùng không được để trống")]
        public int MaPhuTung { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Số lượng phải lớn hơn 0")]
        public int SoLuong { get; set; }

        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá không được âm")]
        public decimal DonGia { get; set; }
    }

    // DTO cho việc tạo Đơn hàng (Order / Model 6)
    public class DonHangCreateDto
    {
        [Required(ErrorMessage = "Mã khách hàng không được để trống")]
        public int MaKH { get; set; }

        public decimal TongTien { get; set; }

        public string TrangThai { get; set; } = "Chờ xác nhận";

        // Danh sách các mặt hàng từ giỏ hàng
        public List<CartItemDto> Items { get; set; } = new();
    }

    // DTO cập nhật trạng thái đơn hàng
    public class DonHangUpdateStatusDto
    {
        [Required(ErrorMessage = "Trạng thái không được để trống")]
        public string TrangThai { get; set; } = "";
    }
}
