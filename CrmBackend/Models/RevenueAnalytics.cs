namespace CrmBackend.Models
{
    public class RevenueAnalyticsDto
    {
        public string Period { get; set; } = "";
        public List<RevenueData> RevenueData { get; set; } = new();
        public List<RevenueSource> RevenueBySource { get; set; } = new();
    }

    public class RevenueData
    {
        public string Label { get; set; } = "";
        public decimal Total { get; set; }
    }

    public class RevenueSource
    {
        public string Source { get; set; } = "";
        public decimal Value { get; set; }
    }

    public class TopSellingProduct
    {
        public string ProductName { get; set; } = "";
        public int TotalSold { get; set; }
    }

    public class VehicleSalesData
    {
        public string DateLabel { get; set; } = "";
        public int VehiclesSold { get; set; }
    }
}
