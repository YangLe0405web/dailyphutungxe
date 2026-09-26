using System.ComponentModel.DataAnnotations;

namespace CrmBackend.Models
{
    public class PhuTung
    {
        public int MaPhuTung { get; set; }
        public string TenPhuTung { get; set; } = "";
        public string LoaiPhuTung { get; set; } = "";
        public decimal DonGia { get; set; }
        public int BaoHanhThang { get; set; }
    }

    public class PhuTungCreateDto
    {
        [Required(ErrorMessage = "Tên phụ tùng không được để trống")]
        public string TenPhuTung { get; set; } = "";
        
        [Required(ErrorMessage = "Loại phụ tùng không được để trống")]
        public string LoaiPhuTung { get; set; } = "";
        
        [Range(0, double.MaxValue, ErrorMessage = "Đơn giá không được âm")]
        public decimal DonGia { get; set; }
        
        [Range(0, int.MaxValue, ErrorMessage = "Bảo hành tháng không được âm")]
        public int BaoHanhThang { get; set; }
    }
}
