using System.ComponentModel.DataAnnotations;

namespace CrmBackend.Models
{
    public class SanPhamXe
    {
        public int MaXe { get; set; }
        public string TenXe { get; set; } = "";
        public string HangXe { get; set; } = "";
        public string LoaiXe { get; set; } = "";
        public decimal GiaNiemYet { get; set; }
        public string ThongSoKyThuat { get; set; } = "";
    }

    public class SanPhamXeCreateDto
    {
        [Required(ErrorMessage = "Tên xe không được để trống")]
        public string TenXe { get; set; } = "";
        
        [Required(ErrorMessage = "Hãng xe không được để trống")]
        public string HangXe { get; set; } = "";
        
        [Required(ErrorMessage = "Loại xe không được để trống")]
        public string LoaiXe { get; set; } = "";
        
        [Range(0, double.MaxValue, ErrorMessage = "Giá niêm yết không được âm")]
        public decimal GiaNiemYet { get; set; }
        
        public string ThongSoKyThuat { get; set; } = "";
    }
}
