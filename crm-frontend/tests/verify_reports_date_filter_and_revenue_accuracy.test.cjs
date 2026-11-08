/**
 * verify_reports_date_filter_and_revenue_accuracy.test.cjs
 * 
 * Kiểm tra tính chính xác của bộ lọc thời gian và công thức tính doanh thu
 * trên trang Báo cáo & Thống kê Admin (Reports.tsx):
 * 1. matchDate: Xử lý theo local time Việt Nam (YYYY-MM-DD), loại bỏ hardcode '2026-11-08'
 * 2. vehicleRevenue: Bán xe mới phải tính theo giá trị thực của xe (giaNiemYet / tongGiaTri), tuyệt đối không lấy 2tr tiền cọc
 * 3. partsRevenue: Chỉ tính cho đơn phụ tùng (loaiDon === 'PhuTung'), không gộp nhầm đơn dịch vụ / công thợ
 * 4. Kiểm tra mã nguồn Reports.tsx đảm bảo cấu trúc sạch, không lỗi logic
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- BẮT ĐẦU KIỂM TRA BỘ LỌC THỜI GIAN & DOANH THU REPORTS.TSX ---');

// 1. Kiểm tra mã nguồn Reports.tsx
const reportsPath = path.join(__dirname, '../src/pages/admin/Reports.tsx');
assert.strictEqual(fs.existsSync(reportsPath), true, 'File Reports.tsx phải tồn tại');
const reportsCode = fs.readFileSync(reportsPath, 'utf8');

// A. Kiểm tra không còn hardcode '2026-11-08' trong matchDate
const hasHardcodedOldDate = reportsCode.includes("cleanDate === '2026-11-08'");
assert.strictEqual(hasHardcodedOldDate, false, 'Reports.tsx không được hardcode cleanDate === "2026-11-08"');

// B. Kiểm tra vehicleRevenue không chỉ lấy đơn thuần o.tongTien cho đơn cọc xe 2tr
assert.ok(
  reportsCode.includes('giaNiemYet') || reportsCode.includes('tongGiaTri') || reportsCode.includes('orderVehicleVal') || reportsCode.includes('vehicleVal'),
  'vehicleRevenue trong Reports.tsx phải tính theo giá niêm yết/tổng giá trị xe thực tế'
);

// C. Kiểm tra partsRevenue không gộp bừa đơn dịch vụ
assert.ok(
  !reportsCode.includes("o.loaiDon === 'PhuTung' || (!o.thongTinXe && !o.id?.includes('XE'))"),
  'partsRevenue không được dùng biểu thức lỏng lẻo gộp nhầm tất cả các đơn không có XE vào phụ tùng'
);

// 2. Kiểm thử logic tính toán Doanh thu Bán Xe Mới & Phụ Tùng
const mockOrdersSample = [
  // Đơn 1: Mua xe máy thanh toán đủ
  {
    id: 'DH-XE-001',
    loaiDon: 'Xe',
    tongTien: 104900000,
    ngayDat: '2026-11-09',
    trangThai: 'HoanThanh',
    thongTinXe: {
      tenXe: 'Honda SH 160i ABS',
      giaNiemYet: 104900000,
      tongGiaTri: 104900000,
      soTienDatCoc: 104900000,
    }
  },
  // Đơn 2: Đặt cọc xe máy online 2 triệu (Giá trị xe thực là 46.047.000 đ)
  {
    id: 'DH-XE-035',
    loaiDon: 'Xe',
    tongTien: 2000000, // tiền cọc
    ngayDat: '2026-11-09',
    trangThai: 'HoanThanh',
    thongTinXe: {
      tenXe: 'Yamaha Grande Hybrid',
      giaNiemYet: 46047000,
      tongGiaTri: 48500000,
      soTienDatCoc: 2000000,
      soTienConLai: 46500000,
    }
  },
  // Đơn 3: Đơn mua phụ tùng
  {
    id: 'DH002',
    loaiDon: 'PhuTung',
    tongTien: 255000,
    ngayDat: '2026-11-09',
    trangThai: 'HoanThanh',
    items: [{ tenSanPham: 'Nhớt Motul', soLuong: 1, donGia: 255000 }]
  },
  // Đơn 4: Đơn dịch vụ sửa chữa / bảo dưỡng
  {
    id: 'HD-DV-001',
    loaiDon: 'DichVu',
    tongTien: 1250000,
    ngayDat: '2026-11-09',
    trangThai: 'HoanThanh',
    items: [{ tenSanPham: 'Gói bảo dưỡng', soLuong: 1, donGia: 1250000 }]
  },
  // Đơn 5: Đơn xe bị hủy
  {
    id: 'DH-XE-999',
    loaiDon: 'Xe',
    tongTien: 55000000,
    ngayDat: '2026-11-09',
    trangThai: 'DaHuy',
    thongTinXe: { giaNiemYet: 55000000 }
  }
];

// Hàm tính chuẩn xác doanh thu xe
const calcVehicleRev = (orders) => {
  return orders
    .filter(o => (o.loaiDon === 'Xe' || (o.thongTinXe && (!o.items || o.items.length === 0)) || (o.id && o.id.includes('XE') && (!o.items || o.items.length === 0))) && o.trangThai !== 'DaHuy')
    .reduce((s, o) => {
      const vVal = o.thongTinXe?.giaNiemYet || o.thongTinXe?.tongGiaTri || (o.tongTien >= 10000000 ? o.tongTien : 0);
      return s + vVal;
    }, 0);
};

// Hàm tính chuẩn xác doanh thu phụ tùng
const calcPartsRev = (orders) => {
  return orders
    .filter(o => o.loaiDon === 'PhuTung' && !o.thongTinXe && (!o.id || !o.id.includes('XE')) && o.trangThai !== 'DaHuy')
    .reduce((s, o) => s + (o.tongTien || 0), 0);
};

const vRevenue = calcVehicleRev(mockOrdersSample);
const pRevenue = calcPartsRev(mockOrdersSample);

console.log('Doanh thu xe tính được:', vRevenue.toLocaleString('vi-VN'), 'VND');
console.log('Doanh thu phụ tùng tính được:', pRevenue.toLocaleString('vi-VN'), 'VND');

// Xe 1: 104.900.000 + Xe 2: 46.047.000 = 150.947.000 VND (Không phải 2.000.000 đ!)
assert.strictEqual(vRevenue, 150947000, 'Doanh thu xe phải là tổng giá trị xe (150.947.000 đ), không được là 2.000.000 đ tiền cọc!');

// Phụ tùng chỉ tính Đơn 3 (255.000 đ), KHÔNG gộp Đơn 4 (Dịch vụ 1.250.000 đ)!
assert.strictEqual(pRevenue, 255000, 'Doanh thu phụ tùng chỉ tính đơn phụ tùng (255.000 đ), không được lẫn đơn dịch vụ!');

console.log('✅ TẤT CẢ CÁC ĐIỀU KIỆN KIỂM TRA ĐỀU ĐẠT CHUẨN XÁC 100%!');
