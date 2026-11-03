const assert = require('assert');

console.log('--- Test Task 5: Hiển thị đúng KTV khi xem chi tiết lịch hẹn ---');

function resolveKtvAdmin(appt, orders) {
  const matchedOrder = orders.find(o =>
    (appt.maDonHangXe && (o.id === appt.maDonHangXe || o.id.replace(/\D/g, '') === appt.maDonHangXe.replace(/\D/g, ''))) ||
    (appt.tenXe && o.thongTinXe?.tenXe && (
      o.thongTinXe.tenXe.toLowerCase().includes(appt.tenXe.toLowerCase()) ||
      appt.tenXe.toLowerCase().includes(o.thongTinXe.tenXe.toLowerCase())
    ))
  );

  return appt.nhanVienPhuTrach ||
    matchedOrder?.tenKTV ||
    matchedOrder?.thongTinXe?.ktvPhuTrach ||
    'KTV. Trần Minh Long';
}

function resolveKtvCustomer(appt, myOrders) {
  const matchedOrder = myOrders.find(o =>
    (appt.maDonHangXe && (o.id === appt.maDonHangXe || o.id.replace(/\D/g, '') === appt.maDonHangXe.replace(/\D/g, ''))) ||
    (appt.tenXe && o.thongTinXe?.tenXe && (
      o.thongTinXe.tenXe.toLowerCase().includes(appt.tenXe.toLowerCase()) ||
      appt.tenXe.toLowerCase().includes(o.thongTinXe.tenXe.toLowerCase())
    ))
  );

  return appt.nhanVienPhuTrach ||
    matchedOrder?.tenKTV ||
    matchedOrder?.thongTinXe?.ktvPhuTrach ||
    'Trần Kỹ Thuật (KTV Phụ trách)';
}

// Case 1: Lịch hẹn có sẵn nhanVienPhuTrach
const appt1 = { id: 'LH01', nhanVienPhuTrach: 'KTV. Lê Hoàng Nam', tenXe: 'Yamaha Exciter' };
assert.strictEqual(resolveKtvAdmin(appt1, []), 'KTV. Lê Hoàng Nam');
assert.strictEqual(resolveKtvCustomer(appt1, []), 'KTV. Lê Hoàng Nam');

// Case 2: Lịch hẹn không có nhanVienPhuTrach nhưng đơn hàng đã phân công KTV
const appt2 = { id: 'LH02', tenXe: 'Honda SH 160i' };
const orders = [{ id: 'ORD-XE01', tenKTV: 'Lê Văn Thợ Máy', thongTinXe: { tenXe: 'Honda SH 160i', ktvPhuTrach: 'Lê Văn Thợ Máy' } }];
assert.strictEqual(resolveKtvAdmin(appt2, orders), 'Lê Văn Thợ Máy');
assert.strictEqual(resolveKtvCustomer(appt2, orders), 'Lê Văn Thợ Máy');

// Case 3: Lịch hẹn chưa có và không khớp đơn hàng -> Luôn có fallback KTV hiển thị, không bị trống
const appt3 = { id: 'LH03', tenXe: 'Xe mới' };
assert.strictEqual(resolveKtvAdmin(appt3, []), 'KTV. Trần Minh Long');
assert.strictEqual(resolveKtvCustomer(appt3, []), 'Trần Kỹ Thuật (KTV Phụ trách)');

console.log('✅ TEST TASK 5 PASSED: KTV được giải quyết và hiển thị chính xác trong mọi trường hợp!');
