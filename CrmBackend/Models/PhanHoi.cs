namespace CrmBackend.Models
{
    public class PhanHoi
    {
        public int MaPH { get; set; }
        public int MaKH { get; set; }
        public int DiemDanhGia { get; set; }
        public string NoiDung { get; set; } = "";
        public string TrangThaiXuLy { get; set; } = "Chờ xử lý";
    }

    public class PhanHoiCreateDto
    {
        public int MaKH { get; set; }
        public int DiemDanhGia { get; set; }
        public string NoiDung { get; set; } = "";
    }
}