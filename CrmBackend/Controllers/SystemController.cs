using Microsoft.AspNetCore.Mvc;
using System.Data;
using Dapper;

namespace CrmBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SystemController : ControllerBase
    {
        private readonly IDbConnection _db;

        public SystemController(IDbConnection db)
        {
            _db = db;
        }

        // POST: api/System/reset-demo
        // Reset sạch dữ liệu test rác, đưa hệ thống về chuẩn Phương án 2 (2 đơn mẫu, 2 lịch hẹn mẫu, 2 phản hồi mẫu)
        [HttpPost("reset-demo")]
        public async Task<IActionResult> ResetDemoData()
        {
            try
            {
                // 1. Dọn sạch các bảng giao dịch phát sinh
                await _db.ExecuteAsync(@"
                    DELETE FROM CHI_TIET_DON_HANG;
                    DELETE FROM DON_HANG;
                    DBCC CHECKIDENT ('DON_HANG', RESEED, 0);

                    DELETE FROM LICH_HEN;
                    DBCC CHECKIDENT ('LICH_HEN', RESEED, 0);

                    DELETE FROM PHAN_HOI;
                    DBCC CHECKIDENT ('PHAN_HOI', RESEED, 0);
                ");

                // Lấy MaKH đầu tiên hợp lệ trong KHACH_HANG
                var khFirstId = await _db.ExecuteScalarAsync<int?>("SELECT TOP 1 MaKH FROM KHACH_HANG ORDER BY MaKH ASC") ?? 1;

                // 2. Đảm bảo bảng PHU_TUNG có ít nhất các sản phẩm chuẩn
                var ptCount = await _db.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM PHU_TUNG");
                if (ptCount == 0)
                {
                    await _db.ExecuteAsync(@"
                        INSERT INTO PHU_TUNG (TenPhuTung, LoaiPhuTung, DonGia, BaoHanhThang)
                        VALUES 
                        (N'Nhớt Motul 7100 4T 10W40 1L (100% Tổng Hợp Ester)', N'Nhớt', 255000, 12),
                        (N'Nhớt Castrol POWER1 Ultimate Scooter 10W-30 0.8L', N'Nhớt', 185000, 12),
                        (N'Lọc gió xe máy Honda Lead / Air Blade chính hãng', N'Lọc gió', 120000, 6),
                        (N'Bugi NGK Iridium Laser CPR8EAIX-9', N'Bugi', 57000, 6),
                        (N'Lốp xe Michelin Pilot Street 2 110/70-12', N'Lốp xe', 1250000, 12),
                        (N'Bộ má phanh đĩa Brembo cao cấp', N'Phanh', 850000, 12);
                    ");
                }

                // Lấy ID phụ tùng và xe đầu tiên để liên kết FK an toàn
                var ptFirstId = await _db.ExecuteScalarAsync<int?>("SELECT TOP 1 MaPhuTung FROM PHU_TUNG ORDER BY MaPhuTung ASC") ?? 1;
                var xeFirstId = await _db.ExecuteScalarAsync<int?>("SELECT TOP 1 MaXe FROM SAN_PHAM_XE ORDER BY MaXe ASC") ?? 1;

                // 3. Chèn 2 đơn hàng mẫu chuẩn (1 đơn xe đã giao/hoàn thành, 1 đơn phụ tùng hoàn thành)
                var insertOrdersSql = @"
                    -- Đơn 1: Mua xe Honda SH 160i ABS 2025
                    INSERT INTO DON_HANG (MaKH, NgayDat, TongTien, TrangThai)
                    VALUES (@MaKH, '2026-10-15 10:30:00', 104900000, N'Hoàn thành');

                    -- Đơn 2: Mua phụ tùng Nhớt Motul 7100
                    INSERT INTO DON_HANG (MaKH, NgayDat, TongTien, TrangThai)
                    VALUES (@MaKH, '2026-10-18 14:15:00', 255000, N'Hoàn thành');

                    -- Chi tiết Đơn 2
                    INSERT INTO CHI_TIET_DON_HANG (MaDon, MaPhuTung, SoLuong, DonGia)
                    VALUES (2, @MaPhuTung, 1, 255000);
                ";
                await _db.ExecuteAsync(insertOrdersSql, new { MaKH = khFirstId, MaPhuTung = ptFirstId });

                // 4. Chèn 2 lịch hẹn mẫu chuẩn (1 lịch bảo dưỡng đã hoàn thành, 1 lịch hẹn sắp tới)
                var insertApptsSql = @"
                    -- Lịch 1: Bảo dưỡng định kỳ xe (Hoàn thành)
                    INSERT INTO LICH_HEN (MaKH, LoaiDichVu, NgayHen, GhiChu, TrangThai)
                    VALUES (@MaKH, N'Bảo dưỡng định kỳ', '2026-10-16 09:00:00', 
                            N'[GÓI BẢO DƯỠNG]: Gói Tiêu Chuẩn - Thay nhớt máy và vệ sinh buồng đốt định kỳ [Phương tiện: Honda SH 150i - BS: 59S1-123.45]', 
                            N'Đã hoàn thành');

                    -- Lịch 2: Bảo dưỡng định kỳ xe (Chờ xác nhận)
                    INSERT INTO LICH_HEN (MaKH, LoaiDichVu, NgayHen, GhiChu, TrangThai)
                    VALUES (@MaKH, N'Bảo dưỡng định kỳ', '2026-10-25 10:00:00', 
                            N'Kiểm tra phanh và thay lọc gió động cơ [Phương tiện: Honda Lead 125 - BS: 59P1-888.88]', 
                            N'Chờ xác nhận');
                ";
                await _db.ExecuteAsync(insertApptsSql, new { MaKH = khFirstId });

                // 5. Chèn 2 đánh giá mẫu chuẩn (1 xe máy 5*, 1 phụ tùng 5*)
                var insertFeedbacksSql = @"
                    -- Đánh giá 1: Xe (5 sao)
                    INSERT INTO PHAN_HOI (MaKH, MaXe, MaPhuTung, DiemDanhGia, NoiDung, TrangThaiXuLy, NgayGui)
                    VALUES (@MaKH, @MaXe, NULL, 5, 
                            N'Xe chạy cực kỳ êm và bốc, phanh ABS an toàn. Dịch vụ showroom bàn giao xe rất nhiệt tình và chu đáo!', 
                            N'Đã phản hồi', '2026-10-16 11:30:00');

                    -- Đánh giá 2: Nhớt Motul 7100 (5 sao)
                    INSERT INTO PHAN_HOI (MaKH, MaXe, MaPhuTung, DiemDanhGia, NoiDung, TrangThaiXuLy, NgayGui)
                    VALUES (@MaKH, NULL, @MaPhuTung, 5, 
                            N'Nhớt Motul chính hãng chạy máy cực bốc và êm, đi đường dài máy rất mát. Đóng gói cẩn thận, giao nhanh!', 
                            N'Đã phản hồi', '2026-10-19 16:45:00');
                ";
                await _db.ExecuteAsync(insertFeedbacksSql, new { MaKH = khFirstId, MaXe = xeFirstId, MaPhuTung = ptFirstId });

                return Ok(new
                {
                    success = true,
                    message = "Đã dọn dẹp sạch sẽ dữ liệu rác và khôi phục dữ liệu mẫu chuẩn (Phương án 2) thành công!",
                    data = new
                    {
                        ordersCount = 2,
                        appointmentsCount = 2,
                        feedbacksCount = 2
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi khi reset dữ liệu: " + ex.Message });
            }
        }

        // POST: api/System/sync-catalog-vehicles
        // Đồng bộ các mẫu xe từ catalog và sửa xe hiển thị sai của khách hàng
        [HttpPost("sync-catalog-vehicles")]
        public async Task<IActionResult> SyncCatalogVehicles()
        {
            try
            {
                var sql = @"
                    IF NOT EXISTS (SELECT 1 FROM SAN_PHAM_XE WHERE TenXe LIKE '%Tuscany%')
                    BEGIN
                        INSERT INTO SAN_PHAM_XE (TenXe, HangXe, LoaiXe, GiaNiemYet, MauSac, HinhAnh, CoTheLaiThu)
                        VALUES (N'SYM Tuscany 150', N'SYM', N'Xe ga', 45000000, N'Xanh ngọc', N'/images/Xe/sym_tuscany_150.jpg', 1);
                    END

                    IF NOT EXISTS (SELECT 1 FROM SAN_PHAM_XE WHERE TenXe LIKE '%Shark%')
                    BEGIN
                        INSERT INTO SAN_PHAM_XE (TenXe, HangXe, LoaiXe, GiaNiemYet, MauSac, HinhAnh, CoTheLaiThu)
                        VALUES (N'SYM Shark 50', N'SYM', N'Xe ga', 24500000, N'Xanh nhám', N'/images/Xe/sym_shark_50.jpg', 1);
                    END

                    DECLARE @MaXeTuscany INT = (SELECT TOP 1 MaXe FROM SAN_PHAM_XE WHERE TenXe LIKE '%Tuscany%');
                    IF @MaXeTuscany IS NOT NULL
                    BEGIN
                        UPDATE XE_KHACH_HANG 
                        SET MaXe = @MaXeTuscany 
                        WHERE MaXeSoHuu = 76 OR (MaKH = 36 AND MaXe = 1);
                    END
                ";
                await _db.ExecuteAsync(sql);
                return Ok(new { success = true, message = "Đồng bộ danh mục xe và cập nhật xe khách hàng thành công!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = ex.Message });
            }
        }
    }
}
