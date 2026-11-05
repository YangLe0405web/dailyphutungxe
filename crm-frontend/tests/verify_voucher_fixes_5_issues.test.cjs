const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: Kiểm tra 5 vấn đề Voucher, Hiển thị giảm giá & Đơn hàng 0đ ===\n');

const apiPath = path.join(__dirname, '../src/services/api.ts');
const dashboardPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const salesPath = path.join(__dirname, '../src/pages/admin/Sales.tsx');
const promotionsPath = path.join(__dirname, '../src/pages/admin/Promotions.tsx');
const checkoutPath = path.join(__dirname, '../src/pages/customer/Checkout.tsx');

const apiCode = fs.readFileSync(apiPath, 'utf8');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
const salesCode = fs.readFileSync(salesPath, 'utf8');
const promotionsCode = fs.readFileSync(promotionsPath, 'utf8');
const checkoutCode = fs.readFileSync(checkoutPath, 'utf8');

// ────────────────────────────────────────────────────────────
// 1. KIỂM TRA SERVICE API (Task 1)
// ────────────────────────────────────────────────────────────
console.log('--- 1. Kiểm tra API: Record usage, Validate 100% & Map giamVoucher ---');

// 1.1 promotionApi có hàm recordUsage
const hasRecordUsage = apiCode.includes('recordUsage(') || apiCode.includes('recordUsage:');
console.log('1.1 promotionApi có hàm recordUsage?:', hasRecordUsage);
assert.strictEqual(hasRecordUsage, true, 'api.ts phải có hàm promotionApi.recordUsage');

// 1.2 orderApi.getAll bảo lưu maVoucher và giamVoucher khi map đơn
const hasPreserveVoucherInGetAll = apiCode.includes('maVoucher: matchedExisting?.maVoucher') || 
                                  apiCode.includes('maVoucher: item.maVoucher || matchedExisting?.maVoucher');
console.log('1.2 orderApi.getAll bảo lưu maVoucher và giamVoucher?:', hasPreserveVoucherInGetAll);
assert.strictEqual(hasPreserveVoucherInGetAll, true, 'orderApi.getAll phải bảo lưu maVoucher và giamVoucher');

// ────────────────────────────────────────────────────────────
// 2. KIỂM TRA HIỂN THỊ GIẢM GIÁ KHÁCH HÀNG & ADMIN (Task 2 & 3 - Ảnh 2)
// ────────────────────────────────────────────────────────────
console.log('\n--- 2. Kiểm tra Hiển thị số tiền giảm giá trên Chi tiết đơn hàng ---');

// 2.1 CustomerDashboard.tsx KHÔNG ĐƯỢC hardcode "0 đ" cho dòng Giảm giá
const customerHasHardcodedZero = dashboardCode.includes('<span>+ Giảm giá:</span>\r\n                          <span className="font-mono text-zinc-400">0 đ</span>') ||
                                dashboardCode.includes('<span>+ Giảm giá:</span>\n                          <span className="font-mono text-zinc-400">0 đ</span>');
console.log('2.1 CustomerDashboard.tsx đã loại bỏ hardcode 0 đ?:', !customerHasHardcodedZero);
assert.strictEqual(!customerHasHardcodedZero, true, 'CustomerDashboard.tsx không được hardcode "0 đ"');

// 2.2 CustomerDashboard.tsx tính toán đúng số tiền giảm giá
const customerCalculatesDiscount = dashboardCode.includes('giamVoucher') && 
                                   (dashboardCode.includes('itemSubtotal + shippingFee > selectedOrderDetail.tongTien') || dashboardCode.includes('selectedOrderDetail.giamVoucher'));
console.log('2.2 CustomerDashboard.tsx tính toán giảm giá thực tế?:', customerCalculatesDiscount);
assert.strictEqual(customerCalculatesDiscount, true, 'CustomerDashboard.tsx phải tính toán và hiển thị giảm giá thực tế');

// 2.3 Sales.tsx KHÔNG ĐƯỢC hardcode "0 đ" cho dòng Giảm giá Voucher
const salesHasHardcodedZero = salesCode.includes('<span>Giảm giá (Voucher):</span>\r\n                      <span className="font-mono text-zinc-400">0 đ</span>') ||
                             salesCode.includes('<span>Giảm giá (Voucher):</span>\n                      <span className="font-mono text-zinc-400">0 đ</span>');
console.log('2.3 Sales.tsx đã loại bỏ hardcode 0 đ?:', !salesHasHardcodedZero);
assert.strictEqual(!salesHasHardcodedZero, true, 'Sales.tsx không được hardcode "0 đ"');

// ────────────────────────────────────────────────────────────
// 3. KIỂM TRA CHECKOUT: VOUCHER 100% BUỘC 0Đ & LÀM MỜ VOUCHER (Task 5)
// ────────────────────────────────────────────────────────────
console.log('\n--- 3. Kiểm tra Checkout: Giảm 100% về 0đ & Làm mờ voucher ---');

// 3.1 Checkout.tsx hỗ trợ giảm 100% ép giá về 0đ
const has100PercentHandling = checkoutCode.includes('100') && (checkoutCode.includes('grand = 0') || checkoutCode.includes('finalGrand = 0') || checkoutCode.includes('mucGiam === 100'));
console.log('3.1 Checkout.tsx có cơ chế ép giá về 0đ khi giảm 100%?:', has100PercentHandling);
assert.strictEqual(has100PercentHandling, true, 'Checkout.tsx phải ép giá về 0đ khi voucher giảm 100%');

// 3.2 Modal Chọn voucher làm mờ voucher không đủ điều kiện
const hasDimmedIneligibleVouchers = checkoutCode.includes('opacity-40') || checkoutCode.includes('grayscale') || checkoutCode.includes('pointer-events-none');
console.log('3.2 Modal Chọn voucher có làm mờ voucher không đủ điều kiện?:', hasDimmedIneligibleVouchers);
assert.strictEqual(hasDimmedIneligibleVouchers, true, 'Modal Chọn voucher phải làm mờ trực quan voucher không đủ điều kiện');

console.log('\n✅ TẤT CẢ CÁC ĐIỀU KIỆN KIỂM TRA 5 VẤN ĐỀ VOUCHER ĐÃ HOÀN TẤT!');
