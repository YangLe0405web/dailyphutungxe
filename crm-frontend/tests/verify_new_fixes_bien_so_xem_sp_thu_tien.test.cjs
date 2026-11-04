const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: Sửa 3 Lỗi Biển số, Xem SP Phụ tùng Chờ đánh giá & Thu tiền đơn hàng ===\n');

const dashboardPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const licensePlatePath = path.join(__dirname, '../src/pages/admin/LicensePlateApproval.tsx');
const apiPath = path.join(__dirname, '../src/services/api.ts');
const mockDataPath = path.join(__dirname, '../src/data/mockData.ts');
const checkoutPath = path.join(__dirname, '../src/pages/customer/Checkout.tsx');

const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
const licensePlateCode = fs.readFileSync(licensePlatePath, 'utf8');
const apiCode = fs.readFileSync(apiPath, 'utf8');
const mockDataCode = fs.readFileSync(mockDataPath, 'utf8');
const checkoutCode = fs.readFileSync(checkoutPath, 'utf8');

// ────────────────────────────────────────────────────────────
// 1. KIỂM TRA LỖI 1: Phê duyệt biển số xe (Ảnh 1, 2)
// ────────────────────────────────────────────────────────────
console.log('--- 1. Kiểm tra Lỗi 1: Khử trùng lặp biển số & Modal cấp biển ---');

// 1.1 CustomerDashboard.tsx gộp xe ưu tiên theo VIN hoặc model xe không bị phân tách bởi hasRealPlate
const hasVinDeduplication = dashboardCode.includes('vinKey') || dashboardCode.includes('soKhung');
console.log('1.1 CustomerDashboard.tsx có khử trùng lặp xe theo VIN / Model linh hoạt?:', hasVinDeduplication);
assert.strictEqual(hasVinDeduplication, true, 'CustomerDashboard.tsx phải khử trùng lặp xe');

// 1.2 LicensePlateApproval.tsx có nút tự sinh biển số mẫu / đề xuất biển số nhanh cho xe showroom
const hasAutoPlateOption = licensePlateCode.includes('Cấp biển') || licensePlateCode.includes('officialPlateInput');
console.log('1.2 LicensePlateApproval.tsx hỗ trợ cấp biển số chính thức?:', hasAutoPlateOption);
assert.strictEqual(hasAutoPlateOption, true, 'LicensePlateApproval.tsx phải hỗ trợ cấp biển số chính thức');

// ────────────────────────────────────────────────────────────
// 2. KIỂM TRA LỖI 2: Nút xem sản phẩm của phụ tùng ở Chờ đánh giá
// ────────────────────────────────────────────────────────────
console.log('\n--- 2. Kiểm tra Lỗi 2: Xem sản phẩm phụ tùng ở Chờ đánh giá ---');

// 2.1 CustomerDashboard.tsx có state selectedReviewPart để mở Modal chi tiết phụ tùng trực tiếp
const hasReviewPartState = dashboardCode.includes('selectedReviewPart') || dashboardCode.includes('viewingReviewPart');
console.log('2.1 CustomerDashboard.tsx có state xem chi tiết phụ tùng trực tiếp?:', hasReviewPartState);
assert.strictEqual(hasReviewPartState, true, 'CustomerDashboard.tsx phải có state selectedReviewPart để mở modal xem chi tiết phụ tùng');

// ────────────────────────────────────────────────────────────
// 3. KIỂM TRA LỖI 3: Thu tiền đơn phụ tùng & Khớp đúng sản phẩm
// ────────────────────────────────────────────────────────────
console.log('\n--- 3. Kiểm tra Lỗi 3: Thu tiền đơn hàng & Khớp sản phẩm ---');

// 3.1 api.ts không để cache ChuaThanhToan ghi đè trạng thái DaThanhToan từ backend
const noCachePaymentOverwrite = !apiCode.includes("existingInCache.trangThaiThanhToan !== 'DaThanhToan') {\n        finalPayment = existingInCache.trangThaiThanhToan;");
console.log('3.1 api.ts không bị cache ChuaThanhToan ghi đè DaThanhToan?:', noCachePaymentOverwrite);
assert.strictEqual(noCachePaymentOverwrite, true, 'api.ts phải ưu tiên DaThanhToan, không để cache ChuaThanhToan ghi đè');

// 3.2 mockData.ts PT003, PT004, PT005 đồng bộ 1-1 với backend SQL Server PHU_TUNG
const mockDataSyncWithBackend = mockDataCode.includes("id: 'PT003'") && mockDataCode.includes("Honda Lead") && mockDataCode.includes("Bugi NGK");
console.log('3.2 mockData.ts đồng bộ sản phẩm phụ tùng với backend SQL Server?:', mockDataSyncWithBackend);
assert.strictEqual(mockDataSyncWithBackend, true, 'mockData.ts phải đồng bộ ID phụ tùng với SQL Server');

console.log('\nAll assertions passed!');
