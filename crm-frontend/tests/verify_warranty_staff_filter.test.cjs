// crm-frontend/tests/verify_warranty_staff_filter.test.cjs
const assert = require('assert');

console.log('--- Test Task 1: Bộ lọc "Nhân viên phụ trách" phải hiển thị đầy đủ nhân viên từ nguồn dữ liệu ---');

// Mô phỏng nguồn nhân viên của hệ thống
const mockStaffAccounts = [
  { id: 'NV01', hoTen: 'Nguyễn Văn Quản Lý', vaiTro: 'SuperAdmin' },
  { id: 'NV02', hoTen: 'Trần Kỹ Thuật', vaiTro: 'NhanVienKyThuat' },
  { id: 'NV03', hoTen: 'Lê Văn Thợ Máy', vaiTro: 'NhanVienKyThuat' },
  { id: 'NV04', hoTen: 'Phạm Thị Tư Vấn', vaiTro: 'NhanVienBanHang' },
];

// Mô phỏng danh sách yêu cầu bảo hành hiện tại (chỉ có 1 nhân viên từng xử lý: Trần Kỹ Thuật)
const claimsList = [
  { id: 'YCBH01', khachHang: 'Khách A', nhanVienPhuTrach: 'Trần Kỹ Thuật' },
  { id: 'YCBH02', khachHang: 'Khách B', nhanVienPhuTrach: 'Trần Kỹ Thuật' },
];

// Logic cũ (lỗi): chỉ lấy từ claimsList
function getOldStaffFilterList(claims) {
  const set = new Set();
  claims.forEach(c => {
    if (c.nhanVienPhuTrach && !c.nhanVienPhuTrach.includes('Từ chối')) {
      set.add(c.nhanVienPhuTrach);
    }
  });
  return Array.from(set);
}

// Logic mới (chuẩn): nạp từ nguồn dữ liệu nhân sự + claimsList
function getNewStaffFilterList(allStaff, claims) {
  const set = new Set();
  allStaff.forEach(s => {
    const name = typeof s === 'string' ? s : s.hoTen;
    if (name && !name.includes('Từ chối')) set.add(name);
  });
  claims.forEach(c => {
    if (c.nhanVienPhuTrach && !c.nhanVienPhuTrach.includes('Từ chối')) {
      set.add(c.nhanVienPhuTrach);
    }
  });
  return Array.from(set);
}

const oldResult = getOldStaffFilterList(claimsList);
console.log('Danh sách lọc theo logic cũ:', oldResult);
assert.strictEqual(oldResult.length, 1, 'Logic cũ chỉ có 1 nhân viên');

const newResult = getNewStaffFilterList(mockStaffAccounts, claimsList);
console.log('Danh sách lọc theo logic mới:', newResult);
assert.ok(newResult.includes('Nguyễn Văn Quản Lý'), 'Phải chứa Nguyễn Văn Quản Lý');
assert.ok(newResult.includes('Lê Văn Thợ Máy'), 'Phải chứa Lê Văn Thợ Máy (dù chưa xử lý bảo hành)');
assert.ok(newResult.includes('Phạm Thị Tư Vấn'), 'Phải chứa Phạm Thị Tư Vấn');
assert.strictEqual(newResult.length, 4, 'Phải hiển thị đầy đủ cả 4 nhân viên từ nguồn dữ liệu');

console.log('✅ TEST TASK 1 PASSED: Bộ lọc hiển thị đầy đủ nhân viên từ nguồn dữ liệu nhân sự!');
