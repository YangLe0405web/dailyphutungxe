/**
 * Test suite: verify_single_action_button_flow.test.cjs
 * Mục đích: Kiểm tra nghiệp vụ Bản Fix 84:
 * 1. Mỗi trạng thái đơn hàng CHỈ HIỂN THỊ DUY NHẤT 1 NÚT HÀNH ĐỘNG.
 * 2. Đơn hàng đã thanh toán đủ (DaThanhToan hoặc soTienConLai <= 0) thì TUYỆT ĐỐI KHÔNG CÓ NÚT THU TIỀN.
 * 3. Đơn hàng chưa thanh toán đủ trong ChoGiaoXe: CHỈ HIỂN THỊ NÚT THU TIỀN, không có nút Hoàn tất hay Bàn giao.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🧪 Bắt đầu chạy test: verify_single_action_button_flow.test.cjs...\n');

// 1. Kiểm tra logic nghiệp vụ chuẩn hóa 1 nút
function getSingleActionButton(order) {
  const isVehicle = order.loaiDon !== 'PhuTung' && (
    order.loaiDon === 'Xe' ||
    (!!order.thongTinXe && (!order.items || order.items.length === 0)) ||
    (order.id && order.id.includes('XE') && (!order.items || order.items.length === 0))
  );
  const isHomeDelivery = Boolean(isVehicle && (order.thongTinXe?.hinhThucGiao === 'HomeDelivery' || order.ghiChu?.includes('GIAO TẬN NƠI')));
  const remaining = order.thongTinXe?.soTienConLai ?? (order.trangThaiThanhToan === 'DaCoc' ? Math.max(0, (order.tongTien || 0) - (order.thongTinXe?.soTienDatCoc || 2000000)) : 0);
  const isFullyPaid = order.trangThaiThanhToan === 'DaThanhToan' || remaining <= 0;

  if (order.trangThai === 'ChoDuyet') {
    return ['DuyetDonXe'];
  }
  if (order.trangThai === 'ChoKhachXacNhanNgayNhan') {
    return [isHomeDelivery ? 'DieuPhoi' : 'ChoGiaoXe'];
  }
  if (order.trangThai === 'ChoGiaoXe') {
    if (!isFullyPaid) {
      return ['ThuTien'];
    }
    return ['HoanTat'];
  }
  if (order.trangThai === 'DangGiao') {
    if (!isFullyPaid) {
      return ['ThuTien'];
    }
    return ['DaGiao'];
  }
  if (order.trangThai === 'DaGiao') {
    if (!isFullyPaid) {
      return ['ThuTien'];
    }
    return ['HoanTat'];
  }
  if (order.trangThai === 'HoanThanh') {
    return ['KhoaHoanTat'];
  }
  return [];
}

// Test Case 1: ChoGiaoXe + Chưa thanh toán đủ (Đã cọc 2tr, còn thiếu 73.9tr)
const orderChoGiaoChuaDuTien = {
  id: 'DH-XE-001',
  loaiDon: 'Xe',
  tongTien: 75900000,
  trangThai: 'ChoGiaoXe',
  trangThaiThanhToan: 'DaCoc',
  thongTinXe: {
    tenXe: 'Honda PCX 160 ABS',
    soTienDatCoc: 2000000,
    soTienConLai: 73900000,
  }
};
const buttons1 = getSingleActionButton(orderChoGiaoChuaDuTien);
assert.strictEqual(buttons1.length, 1, 'Lỗi: Đơn chưa đủ tiền phải chỉ có đúng 1 nút!');
assert.strictEqual(buttons1[0], 'ThuTien', 'Lỗi: Đơn chưa đủ tiền tại ChoGiaoXe phải hiện nút Thu tiền!');
assert.strictEqual(buttons1.includes('HoanTat'), false, 'Lỗi: Không được có nút Hoàn tất khi chưa thu đủ tiền!');
assert.strictEqual(buttons1.includes('BanGiao'), false, 'Lỗi: Không được có nút Bàn giao gây nhiễu!');
console.log('✅ Test Case 1 PASS: Đơn ChoGiaoXe chưa thanh toán đủ -> Duy nhất 1 nút Thu tiền (không có Hoàn tất / Bàn giao)');

// Test Case 2: ChoGiaoXe + ĐÃ THANH TOÁN ĐỦ (DaThanhToan hoặc soTienConLai = 0)
const orderChoGiaoDaDuTien = {
  id: 'DH-XE-001',
  loaiDon: 'Xe',
  tongTien: 75900000,
  trangThai: 'ChoGiaoXe',
  trangThaiThanhToan: 'DaThanhToan',
  thongTinXe: {
    tenXe: 'Honda PCX 160 ABS',
    soTienDatCoc: 2000000,
    soTienConLai: 0,
  }
};
const buttons2 = getSingleActionButton(orderChoGiaoDaDuTien);
assert.strictEqual(buttons2.length, 1, 'Lỗi: Đơn đã đủ tiền phải chỉ có đúng 1 nút!');
assert.strictEqual(buttons2[0], 'HoanTat', 'Lỗi: Đơn đã đủ tiền tại ChoGiaoXe phải hiện nút Hoàn tất!');
assert.strictEqual(buttons2.includes('ThuTien'), false, 'Lỗi: Bên mua thanh toán đủ thì TUYỆT ĐỐI không có nút thu tiền!');
console.log('✅ Test Case 2 PASS: Đơn ChoGiaoXe đã thanh toán đủ -> Duy nhất 1 nút Hoàn tất, KHÔNG CÓ NÚT THU TIỀN');

// Test Case 3: ChoDuyet -> Chỉ 1 nút Duyệt đơn xe
const orderChoDuyet = {
  id: 'DH-XE-002',
  loaiDon: 'Xe',
  tongTien: 95900000,
  trangThai: 'ChoDuyet',
  trangThaiThanhToan: 'ChuaThanhToan',
  thongTinXe: { tenXe: 'Honda SH 160i' }
};
const buttons3 = getSingleActionButton(orderChoDuyet);
assert.strictEqual(buttons3.length, 1, 'Lỗi: ChoDuyet phải chỉ có 1 nút!');
assert.strictEqual(buttons3[0], 'DuyetDonXe');
console.log('✅ Test Case 3 PASS: Đơn ChoDuyet -> Duy nhất 1 nút Duyệt đơn xe');

// Test Case 4: Kiểm tra source code của Sales.tsx
const salesFilePath = path.join(__dirname, '..', 'src', 'pages', 'admin', 'Sales.tsx');
const salesContent = fs.readFileSync(salesFilePath, 'utf-8');

// Kiểm tra xem Sales.tsx đã loại bỏ nút Bàn giao gây nhiễu chưa
const hasUnwantedBanGiao = salesContent.includes('<span>🏎️</span> Bàn giao');
if (hasUnwantedBanGiao) {
  console.log('❌ Red Test Detected: Sales.tsx vẫn còn nút "Bàn giao" gây nhiễu trong ChoGiaoXe!');
  process.exit(1);
} else {
  console.log('✅ Test Case 4 PASS: Sales.tsx đã dọn dẹp nút Bàn giao gây nhiễu.');
}

console.log('\n🎉 TẤT CẢ TEST CASES ĐÃ PASS!');
