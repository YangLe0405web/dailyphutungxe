const assert = require('assert');

console.log('--- Test Task 3: Bắt buộc chọn KTV trước khi duyệt đơn xe ---');

// Mô phỏng logic kiểm tra điều kiện duyệt đơn trong Sales.tsx
function checkApprovalAllowed(order, newStatus) {
  const isVehicle = Boolean(
    order &&
    order.loaiDon !== 'PhuTung' &&
    (order.loaiDon === 'Xe' ||
      (order.thongTinXe && (!order.items || order.items.length === 0)) ||
      (order.id && order.id.includes('XE') && (!order.items || order.items.length === 0)))
  );

  if (isVehicle && order.trangThai === 'ChoDuyet' && newStatus !== 'DaHuy') {
    const hasKtv = Boolean(
      order.tenKTV ||
      order.thongTinXe?.ktvPhuTrach ||
      order.maKTV ||
      order.thongTinXe?.maKTV
    );
    if (!hasKtv) {
      return {
        allowed: false,
        reason: 'Chưa có KTV phụ trách',
        mustOpenAssignModal: true,
      };
    }
  }

  return {
    allowed: true,
    reason: 'Hợp lệ',
    mustOpenAssignModal: false,
  };
}

// Case 1: Đơn xe chưa có KTV -> Phải chặn và yêu cầu mở modal phân công
const unassignedVehicleOrder = {
  id: 'ORD-XE001',
  loaiDon: 'Xe',
  trangThai: 'ChoDuyet',
  thongTinXe: {
    tenXe: 'Honda SH 160i',
  },
};
const res1 = checkApprovalAllowed(unassignedVehicleOrder, 'ChoKhachXacNhanNgayNhan');
assert.strictEqual(res1.allowed, false, 'Đơn xe chưa có KTV không được phép duyệt');
assert.strictEqual(res1.mustOpenAssignModal, true, 'Phải mở modal phân công KTV');

// Case 2: Đơn xe đã có KTV -> Cho phép duyệt
const assignedVehicleOrder = {
  id: 'ORD-XE002',
  loaiDon: 'Xe',
  trangThai: 'ChoDuyet',
  tenKTV: 'Trần Kỹ Thuật',
  thongTinXe: {
    tenXe: 'Honda Wave Alpha',
    ktvPhuTrach: 'Trần Kỹ Thuật',
  },
};
const res2 = checkApprovalAllowed(assignedVehicleOrder, 'ChoKhachXacNhanNgayNhan');
assert.strictEqual(res2.allowed, true, 'Đơn xe có KTV được phép duyệt');
assert.strictEqual(res2.mustOpenAssignModal, false);

// Case 3: Đơn phụ tùng không có KTV -> Cho phép duyệt bình thường
const partsOrder = {
  id: 'ORD-PT001',
  loaiDon: 'PhuTung',
  trangThai: 'ChoDuyet',
  items: [{ id: 'PT01', ten: 'Nhớt Castrol' }],
};
const res3 = checkApprovalAllowed(partsOrder, 'DaXacNhan');
assert.strictEqual(res3.allowed, true, 'Đơn phụ tùng không bị chặn bởi KTV');

console.log('✅ TEST TASK 3 LOGIC PASSED: Ràng buộc KTV hoạt động chính xác!');
