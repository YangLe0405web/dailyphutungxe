const assert = require('assert');

console.log('--- Test Task 4: Hóa đơn & Biên bản trong Lịch sử lịch hẹn ---');

function resolveInvoiceDetails(appt, matchedOrder, currentCustomer) {
  const isVehicleOrder = appt.loaiDichVu === 'NhanXe';

  const fullRollingPrice = matchedOrder?.thongTinXe?.tongGiaTri ||
    (matchedOrder?.thongTinXe?.giaNiemYet ? (
      (matchedOrder.thongTinXe.giaNiemYet || 0) +
      (matchedOrder.thongTinXe.phiTruocBa || 0) +
      (matchedOrder.thongTinXe.phiDangKyBienSo || 0) +
      (matchedOrder.thongTinXe.phiBaoHiem || 0)
    ) : 0) ||
    (matchedOrder?.tongTien && matchedOrder.tongTien > 10000000 ? matchedOrder.tongTien : 0) ||
    45000000;

  const isDepositOrder = (matchedOrder?.trangThaiThanhToan === 'DaCoc') ||
    Boolean(matchedOrder?.thongTinXe?.soTienDatCoc) ||
    (matchedOrder?.tongTien === 2000000) ||
    (matchedOrder?.ghiChu && matchedOrder.ghiChu.includes('Đã cọc 2.000.000'));

  const depositAmount = isDepositOrder
    ? (matchedOrder?.thongTinXe?.soTienDatCoc || 2000000)
    : 0;

  const isPaidFull = !isDepositOrder ||
    matchedOrder?.trangThaiThanhToan === 'DaThanhToan' ||
    matchedOrder?.trangThai === 'HoanThanh' ||
    matchedOrder?.thongTinXe?.soTienConLai === 0;

  const remaining = isPaidFull
    ? 0
    : (matchedOrder?.thongTinXe?.soTienConLai !== undefined
        ? matchedOrder.thongTinXe.soTienConLai
        : Math.max(0, fullRollingPrice - depositAmount));

  const isHomeDelivery = Boolean(
    matchedOrder?.thongTinXe?.hinhThucGiao === 'HomeDelivery' ||
    (matchedOrder?.ghiChu && matchedOrder.ghiChu.includes('GIAO TẬN NƠI')) ||
    (appt?.ghiChu && appt.ghiChu.includes('GIAO TẬN NƠI'))
  );

  const deliveryAddress = isHomeDelivery
    ? (matchedOrder?.diaChiGiao || matchedOrder?.thongTinXe?.diaChiGiao || currentCustomer?.diaChi || 'Địa chỉ khách hàng yêu cầu giao tận nơi')
    : 'Showroom Motoshop - 123 Nguyễn Văn Cừ, Quận 5, TP. Hồ Chí Minh';

  return {
    fullRollingPrice,
    isDepositOrder,
    depositAmount,
    remaining,
    isHomeDelivery,
    deliveryAddress,
  };
}

// Case 1: Đơn mua xe đặt cọc 2.000.000đ và giao tận nhà
const appt1 = { id: 'LH001', loaiDichVu: 'NhanXe', tenXe: 'Honda SH 160i ABS' };
const order1 = {
  id: 'ORD-XE001',
  loaiDon: 'Xe',
  tongTien: 2000000, // Cọc online
  trangThaiThanhToan: 'DaCoc',
  trangThai: 'ChoGiaoXe',
  diaChiGiao: 'Số 456 Võ Văn Tần, Phường 5, Quận 3, TP.HCM',
  thongTinXe: {
    tenXe: 'Honda SH 160i ABS',
    tongGiaTri: 95900000,
    soTienDatCoc: 2000000,
    soTienConLai: 93900000,
    hinhThucGiao: 'HomeDelivery',
    diaChiGiao: 'Số 456 Võ Văn Tần, Phường 5, Quận 3, TP.HCM',
  },
};
const res1 = resolveInvoiceDetails(appt1, order1, { diaChi: 'Nhà riêng KH' });

assert.strictEqual(res1.fullRollingPrice, 95900000, 'Giá lăn bánh phải là 95.900.000₫ thay vì 2.000.000₫');
assert.strictEqual(res1.depositAmount, 2000000, 'Tiền cọc là 2.000.000₫');
assert.strictEqual(res1.remaining, 93900000, 'Số tiền còn lại thu tại quầy/nhận xe là 93.900.000₫');
assert.strictEqual(res1.isHomeDelivery, true, 'Hình thức giao là tận nhà');
assert.strictEqual(res1.deliveryAddress, 'Số 456 Võ Văn Tần, Phường 5, Quận 3, TP.HCM', 'Địa chỉ giao phải là địa chỉ khách hàng');

// Case 2: Đơn nhận xe tại showroom
const order2 = {
  id: 'ORD-XE002',
  loaiDon: 'Xe',
  tongTien: 50490000,
  trangThaiThanhToan: 'DaThanhToan',
  trangThai: 'HoanThanh',
  thongTinXe: {
    tenXe: 'Honda Air Blade 125',
    tongGiaTri: 50490000,
    hinhThucGiao: 'Showroom',
  },
};
const res2 = resolveInvoiceDetails(appt1, order2, {});
assert.strictEqual(res2.isHomeDelivery, false);
assert(res2.deliveryAddress.includes('Showroom Motoshop'));

console.log('✅ TEST TASK 4 PASSED: Chi tiết hóa đơn và địa chỉ giao chính xác!');
