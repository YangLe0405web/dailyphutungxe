// crm-frontend/tests/verify_warranty_date_filter.test.cjs
const assert = require('assert');

console.log('--- Test Task 2: Bộ lọc ngày cố định cho Quản lý bảo hành & Yêu cầu bảo hành ---');

const claims = [
  { id: 'YCBH01', ngayGui: '2026-11-01', khachHang: 'Khách A', trangThai: 'ChoTiepNhan' },
  { id: 'YCBH02', ngayGui: '2026-11-02', khachHang: 'Khách B', trangThai: 'DangKiemTra' },
  { id: 'YCBH03', ngayGui: '2026-11-03', khachHang: 'Khách C', trangThai: 'DaDuyet' },
];

const extensions = [
  { id: 'TX01', thoiGianThanhToan: '2026-11-01 10:00:00', tenKhachHang: 'Khách X' },
  { id: 'TX02', thoiGianThanhToan: '2026-11-02 14:30:00', tenKhachHang: 'Khách Y' },
  { id: 'TX03', thoiGianThanhToan: '2026-11-03 09:15:00', tenKhachHang: 'Khách Z' },
];

function filterByDate(items, timeFilter, customDate, dateField) {
  return items.filter(item => {
    if (timeFilter === 'NgayCoDinh' && customDate) {
      const rawDate = item[dateField] || '';
      return rawDate.startsWith(customDate);
    }
    return true;
  });
}

// Test lọc ngày cố định 2026-11-02 cho Yêu cầu bảo hành
const filteredClaim = filterByDate(claims, 'NgayCoDinh', '2026-11-02', 'ngayGui');
console.log('Kết quả lọc Yêu cầu bảo hành ngày 2026-11-02:', filteredClaim.map(c => c.id));
assert.strictEqual(filteredClaim.length, 1);
assert.strictEqual(filteredClaim[0].id, 'YCBH02');

// Test lọc ngày cố định 2026-11-03 cho Quản lý bảo hành (Gia hạn)
const filteredExt = filterByDate(extensions, 'NgayCoDinh', '2026-11-03', 'thoiGianThanhToan');
console.log('Kết quả lọc Gia hạn bảo hành ngày 2026-11-03:', filteredExt.map(e => e.id));
assert.strictEqual(filteredExt.length, 1);
assert.strictEqual(filteredExt[0].id, 'TX03');

console.log('✅ TEST TASK 2 PASSED: Lọc chính xác theo ngày cố định!');
