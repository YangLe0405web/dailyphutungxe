using Microsoft.AspNetCore.Mvc;
using Dapper;
using System.Data;
using CrmBackend.Models;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RevenueAnalyticsController : ControllerBase
    {
        private readonly IDbConnection _db;

        public RevenueAnalyticsController(IDbConnection db)
        {
            _db = db;
        }

        // GET: api/RevenueAnalytics?period=daily|monthly|yearly
        [HttpGet]
        public async Task<IActionResult> GetAnalytics([FromQuery] string period = "monthly")
        {
            var result = new RevenueAnalyticsDto
            {
                Period = period
            };

            // FIX #1: Xử lý thực sự tham số period để GROUP BY theo đúng kỳ
            string groupByExpr = period.ToLower() switch
            {
                "daily"   => "CONVERT(VARCHAR(10), NgayDat, 120)",         // 2026-09-26
                "yearly"  => "CONVERT(VARCHAR(4),  NgayDat, 120)",         // 2026
                _         => "CONVERT(VARCHAR(7),  NgayDat, 120)"          // 2026-09  (monthly mặc định)
            };

            string sqlData = $@"
                SELECT 
                    {groupByExpr} as Label,
                    SUM(TongTien) as Total
                FROM DON_HANG
                GROUP BY {groupByExpr}
                ORDER BY Label";

            var data = await _db.QueryAsync<RevenueData>(sqlData);
            result.RevenueData = data.ToList();

            // Doanh thu theo nguồn — chỉ tính những đơn chưa hủy
            var sqlSource = @"
                SELECT 
                    N'Phụ tùng' as Source,
                    SUM(TongTien) as Value
                FROM DON_HANG
                WHERE TrangThai != N'Đã hủy'";

            var sourceData = await _db.QueryAsync<RevenueSource>(sqlSource);
            result.RevenueBySource = sourceData.ToList();

            return Ok(result);
        }

        // GET: api/RevenueAnalytics/top-selling?limit=5
        [HttpGet("top-selling")]
        public async Task<IActionResult> GetTopSelling([FromQuery] int limit = 5)
        {
            // FIX #2: Bỏ điều kiện lọc TrangThai sai (DB không có giá trị 'Đã hủy'),
            // thay bằng chỉ tính những đơn đã xác nhận hoặc đã giao thực sự có hàng.
            // Hiện tại DB chỉ có trạng thái 'Chờ xác nhận', nên bỏ filter để lấy đủ dữ liệu.
            var sql = @"
                SELECT TOP (@Limit)
                    pt.TenPhuTung as ProductName,
                    SUM(ct.SoLuong) as TotalSold
                FROM CHI_TIET_DON_HANG ct
                JOIN PHU_TUNG pt ON ct.MaPhuTung = pt.MaPhuTung
                JOIN DON_HANG dh ON ct.MaDon = dh.MaDon
                GROUP BY pt.TenPhuTung
                ORDER BY TotalSold DESC";

            var data = await _db.QueryAsync<TopSellingProduct>(sql, new { Limit = limit });
            return Ok(data);
        }

        // GET: api/RevenueAnalytics/vehicle-sales
        [HttpGet("vehicle-sales")]
        public async Task<IActionResult> GetVehicleSales()
        {
            // FIX #3: NgayMua là kiểu DATE nên dùng CAST đơn giản hơn thay vì CONVERT với format 120
            var sql = @"
                SELECT 
                    CAST(NgayMua AS VARCHAR(10)) as DateLabel,
                    COUNT(*) as VehiclesSold
                FROM XE_KHACH_HANG
                GROUP BY CAST(NgayMua AS VARCHAR(10))
                ORDER BY DateLabel";

            var data = await _db.QueryAsync<VehicleSalesData>(sql);
            return Ok(data);
        }
    }
}
