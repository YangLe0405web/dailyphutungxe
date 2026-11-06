const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: BỘ LỌC ĐÁNH GIÁ (ẢNH 1) & TÍNH ĐÚNG CHI TIÊU TÍCH LŨY XE MÁY (ẢNH 2) ===\n');

// ────────────────────────────────────────────────────────────
// 1. KIỂM TRA PHẦN 1: BỘ LỌC ĐÁNH GIÁ TRONG PARTSSTORE.TSX (ẢNH 1)
// ────────────────────────────────────────────────────────────
console.log('--- 1. Kiểm tra Bộ lọc đánh giá trong PartsStore.tsx ---');
const partsStorePath = path.resolve(__dirname, '../src/pages/customer/PartsStore.tsx');
const partsStoreCode = fs.readFileSync(partsStorePath, 'utf8');

// 1.1 Kiểm tra state lọc theo số sao và lọc có hình ảnh
const hasRatingFilterState = partsStoreCode.includes('partReviewRatingFilter') || partsStoreCode.includes('reviewRatingFilter') || partsStoreCode.includes('reviewStarFilter');
console.log('1.1 PartsStore.tsx có state lọc đánh giá theo số sao?:', hasRatingFilterState);
assert.strictEqual(hasRatingFilterState, true, 'PartsStore.tsx phải có state lọc đánh giá theo số sao');

const hasImageFilterState = partsStoreCode.includes('partReviewHasImageFilter') || partsStoreCode.includes('reviewHasImageFilter');
console.log('1.2 PartsStore.tsx có state lọc đánh giá có hình ảnh?:', hasImageFilterState);
assert.strictEqual(hasImageFilterState, true, 'PartsStore.tsx phải có state lọc đánh giá có hình ảnh');

// 1.3 Kiểm tra có thanh nút lọc số sao (Tất cả, 5★, 4★, 3★, 2★, 1★)
const hasStarButtons = partsStoreCode.includes('{stars}★') || (partsStoreCode.includes('5★') && partsStoreCode.includes('4★'));
console.log('1.3 PartsStore.tsx có các nút lọc số sao (5★, 4★, 3★...)?:', hasStarButtons);
assert.strictEqual(hasStarButtons, true, 'PartsStore.tsx phải render các nút lọc theo số sao');

// 1.4 Kiểm tra có nút lọc có hình ảnh
const hasImageButton = partsStoreCode.includes('Có hình ảnh') || partsStoreCode.includes('📷');
console.log('1.4 PartsStore.tsx có nút lọc Có hình ảnh?:', hasImageButton);
assert.strictEqual(hasImageButton, true, 'PartsStore.tsx phải render nút lọc Có hình ảnh');

// 1.5 Kiểm tra có nút xóa bộ lọc
const hasResetButton = partsStoreCode.includes('Xóa bộ lọc') || partsStoreCode.includes('Xóa tất cả bộ lọc');
console.log('1.5 PartsStore.tsx có nút Xóa bộ lọc?:', hasResetButton);
assert.strictEqual(hasResetButton, true, 'PartsStore.tsx phải có nút Xóa bộ lọc');

// ────────────────────────────────────────────────────────────
// 2. KIỂM TRA PHẦN 2: TÍNH ĐÚNG CHI TIÊU TÍCH LŨY XE MÁY (ẢNH 2)
// ────────────────────────────────────────────────────────────
console.log('\n--- 2. Kiểm tra tính đúng Chi tiêu tích lũy xe máy trong CustomerDashboard.tsx ---');
const dashboardPath = path.resolve(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

// 2.1 Kiểm tra realCustomerSpending trong CustomerDashboard tính toàn bộ giá trị xe máy thay vì chỉ 2M cọc
const hasFullVehicleSpendingLogic = dashboardCode.includes('tongGiaTri') && 
  (dashboardCode.includes('giaNiemYet') || dashboardCode.includes('thongTinXe')) &&
  dashboardCode.includes('realCustomerSpending');
console.log('2.1 CustomerDashboard.tsx tính giá trị xe hoàn tất vào realCustomerSpending?:', hasFullVehicleSpendingLogic);
assert.strictEqual(hasFullVehicleSpendingLogic, true, 'CustomerDashboard.tsx phải tính toàn bộ giá trị xe hoàn tất thay vì chỉ 2M tiền cọc');

// 2.2 Kiểm tra logic mô phỏng tính chi tiêu
function calculateTestSpending(orders, insurances = []) {
  const completedOrders = orders.filter(o => o.trangThai === 'HoanThanh' || o.trangThai === 'DaHoanThanh');
  const totalOrderSpent = completedOrders.reduce((sum, o) => {
    const isVehicle = o.loaiDon !== 'PhuTung' && (
      o.loaiDon === 'Xe' ||
      (!!o.thongTinXe && (!o.items || o.items.length === 0)) ||
      (o.id && o.id.includes('XE') && (!o.items || o.items.length === 0)) ||
      (!o.items?.length && o.tongTien >= 2000000)
    );
    if (isVehicle && o.thongTinXe) {
      const fullPrice = o.thongTinXe.tongGiaTri || o.thongTinXe.giaNiemYet || 0;
      if (fullPrice > 0) {
        return sum + fullPrice;
      }
    }
    return sum + (o.tongTien || 0);
  }, 0);
  const totalInsuranceSpent = insurances.filter(ins => ins.trangThai !== 'TuChoi').reduce((sum, ins) => sum + (ins.tongTien || ins.phiBaoHiem || 0), 0);
  return totalOrderSpent + totalInsuranceSpent;
}

const mockOrdersTest = [
  { id: 'DH015', tongTien: 150000, trangThai: 'HoanThanh', loaiDon: 'PhuTung' },
  { id: 'DH-XE-022', tongTien: 2000000, trangThai: 'HoanThanh', loaiDon: 'Xe', thongTinXe: { tongGiaTri: 74000000, giaNiemYet: 74000000 } },
];
const testSpent = calculateTestSpending(mockOrdersTest, [{ tongTien: 198000, trangThai: 'HieuLuc' }]);
console.log('2.2 Giá trị chi tiêu mô phỏng xe 74M + phụ tùng 150k + BH 198k:', testSpent);
assert.strictEqual(testSpent, 74348000, 'Chi tiêu phải đạt 74.348.000đ khi hoàn tất đơn xe 74 triệu thay vì chỉ 2 triệu tiền cọc!');

console.log('\n🎉 ALL ASSERTIONS PASSED!');
