namespace CrmBackend.Models
{
    public class KhaoSat
    {
        public int MaKS { get; set; }
        public string TieuDe { get; set; } = "";
        public string MoTa { get; set; } = "";
        public DateTime NgayTao { get; set; }
        public DateTime? HanKetThuc { get; set; }
    }

    public class CauHoiKhaoSat
    {
        public int MaCH { get; set; }
        public int MaKS { get; set; }
        public string NoiDungCH { get; set; } = "";
        public string LoaiCauHoi { get; set; } = "";
    }

    public class KetQuaKhaoSat
    {
        public int MaKQ { get; set; }
        public int MaKS { get; set; }
        public int MaCH { get; set; }
        public int MaKH { get; set; }
        public string CauTraLoi { get; set; } = "";
        public DateTime NgayTraLoi { get; set; }
    }
}