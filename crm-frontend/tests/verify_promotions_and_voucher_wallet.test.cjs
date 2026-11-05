const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: Kiểm tra Toàn diện Khuyến mãi, Modal 3 loại & Kho Voucher Khách hàng ===\n');

const promotionsPagePath = path.join(__dirname, '../src/pages/admin/Promotions.tsx');
const apiPath = path.join(__dirname, '../src/services/api.ts');
const dashboardPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const checkoutPath = path.join(__dirname, '../src/pages/customer/Checkout.tsx');

const promotionsCode = fs.readFileSync(promotionsPagePath, 'utf8');
const apiCode = fs.readFileSync(apiPath, 'utf8');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
const checkoutCode = fs.readFileSync(checkoutPath, 'utf8');

// ────────────────────────────────────────────────────────────
// 1. KIỂM TRA PHÍA ADMIN: TRUNG TÂM KHUYẾN MÃI & MARKETING (Ảnh 1, 2, 3, 4)
// ────────────────────────────────────────────────────────────
console.log('--- 1. Kiểm tra Admin: Giao diện Khuyến mãi & Modal 3 loại ---');

// 1.1 Có nút "Tạo mã khuyến mãi"
const hasCreatePromoBtn = promotionsCode.includes('Tạo mã khuyến mãi') || promotionsCode.includes('+ Tạo mã khuyến mãi');
console.log('1.1 Promotions.tsx có nút "Tạo mã khuyến mãi"?:', hasCreatePromoBtn);
assert.strictEqual(hasCreatePromoBtn, true, 'Promotions.tsx phải có nút "Tạo mã khuyến mãi"');

// 1.2 Có 5 thẻ KPI thống kê chuẩn Ảnh 1
const has5KpiCards = promotionsCode.includes('Số lượng Voucher') && 
                     promotionsCode.includes('Đang diễn ra') && 
                     promotionsCode.includes('Sắp diễn ra') && 
                     promotionsCode.includes('Đã kết thúc') && 
                     promotionsCode.includes('Đã tạm dừng');
console.log('1.2 Promotions.tsx có đủ 5 thẻ KPI chuẩn Ảnh 1?:', has5KpiCards);
assert.strictEqual(has5KpiCards, true, 'Promotions.tsx phải có đủ 5 thẻ KPI theo thiết kế Ảnh 1');

// 1.3 Modal hỗ trợ đủ 3 loại khuyến mãi: Theo sản phẩm, Theo đợt, Theo loại khách hàng (Ảnh 2, 3, 4)
const has3PromoTypes = promotionsCode.includes('Khuyến mãi theo sản phẩm') && 
                       promotionsCode.includes('Khuyến mãi theo đợt') && 
                       promotionsCode.includes('Khuyến mãi theo loại khách hàng');
console.log('1.3 Modal hỗ trợ đủ 3 loại khuyến mãi chuyên biệt?:', has3PromoTypes);
assert.strictEqual(has3PromoTypes, true, 'Modal phải có 3 tab: Theo sản phẩm, Theo đợt, Theo loại khách hàng');

// 1.4 Hỗ trợ bảng chọn sản phẩm thực tế và preview voucher
const hasProductTableAndPreview = promotionsCode.includes('Chọn sản phẩm từ hệ thống') && 
                                  promotionsCode.includes('XEM TRƯỚC VOUCHER');
console.log('1.4 Modal có bảng chọn sản phẩm thực tế và thẻ xem trước voucher?:', hasProductTableAndPreview);
assert.strictEqual(hasProductTableAndPreview, true, 'Modal phải có bảng chọn sản phẩm thực tế và preview voucher');

// ────────────────────────────────────────────────────────────
// 2. KIỂM TRA SERVICE API & MODEL DỮ LIỆU
// ────────────────────────────────────────────────────────────
console.log('\n--- 2. Kiểm tra API & Model Dữ liệu Voucher ---');

// 2.1 promotionApi có hàm getVouchersForCustomer
const hasGetVouchersForCustomer = apiCode.includes('getVouchersForCustomer');
console.log('2.1 api.ts có hàm getVouchersForCustomer?:', hasGetVouchersForCustomer);
assert.strictEqual(hasGetVouchersForCustomer, true, 'api.ts phải có hàm getVouchersForCustomer');

// 2.2 promotionApi có hàm validateVoucher tính tiền giảm chính xác
const hasValidateVoucher = apiCode.includes('validateVoucher');
console.log('2.2 api.ts có hàm validateVoucher?:', hasValidateVoucher);
assert.strictEqual(hasValidateVoucher, true, 'api.ts phải có hàm validateVoucher');

// ────────────────────────────────────────────────────────────
// 3. KIỂM TRA KHO VOUCHER KHÁCH HÀNG (Ảnh 5)
// ────────────────────────────────────────────────────────────
console.log('\n--- 3. Kiểm tra Khách hàng: Kho Voucher của tôi ---');

// 3.1 Sidebar có menu Kho Voucher
const hasSidebarVoucherNav = dashboardCode.includes('Kho Voucher') && dashboardCode.includes('KHO VOUCHER CỦA TÔI');
console.log('3.1 CustomerDashboard.tsx có mục Kho Voucher trên sidebar và giao diện Kho Voucher?:', hasSidebarVoucherNav);
assert.strictEqual(hasSidebarVoucherNav, true, 'CustomerDashboard.tsx phải có mục Kho Voucher');

// 3.2 Có các tab phân loại voucher và nút "Dùng ngay"
const hasVoucherTabsAndUseBtn = dashboardCode.includes('Phụ tùng & Phụ kiện') && 
                               dashboardCode.includes('Dịch vụ & Bảo dưỡng') && 
                               dashboardCode.includes('Dùng ngay');
console.log('3.2 Kho Voucher có các tabs phân loại và nút "Dùng ngay"?:', hasVoucherTabsAndUseBtn);
assert.strictEqual(hasVoucherTabsAndUseBtn, true, 'Kho Voucher phải có phân loại và nút Dùng ngay');

// ────────────────────────────────────────────────────────────
// 4. KIỂM TRA ÁP DỤNG VOUCHER KHI THANH TOÁN (Ảnh 6, 7)
// ────────────────────────────────────────────────────────────
console.log('\n--- 4. Kiểm tra Thanh toán: Áp dụng Voucher & Modal Chọn mã ---');

// 4.1 Checkout.tsx có nút "CHỌN MÃ" và hiển thị Giảm giá (Voucher)
const hasSelectCodeBtnAndDiscountRow = checkoutCode.includes('CHỌN MÃ') && 
                                      checkoutCode.includes('Giảm giá (Voucher)');
console.log('4.1 Checkout.tsx có nút CHỌN MÃ và dòng Giảm giá (Voucher)?:', hasSelectCodeBtnAndDiscountRow);
assert.strictEqual(hasSelectCodeBtnAndDiscountRow, true, 'Checkout.tsx phải có nút CHỌN MÃ và dòng Giảm giá Voucher');

// 4.2 Checkout.tsx có Modal Chọn Voucher / Mã giảm giá chuẩn Ảnh 7
const hasVoucherSelectionModal = checkoutCode.includes('CHỌN VOUCHER / MÃ GIẢM GIÁ') || 
                                checkoutCode.includes('VoucherModal');
console.log('4.2 Checkout.tsx có modal "CHỌN VOUCHER / MÃ GIẢM GIÁ"?:', hasVoucherSelectionModal);
assert.strictEqual(hasVoucherSelectionModal, true, 'Checkout.tsx phải có modal CHỌN VOUCHER / MÃ GIẢM GIÁ');

console.log('\n✅ TẤT CẢ CÁC ĐIỀU KIỆN KIỂM TRA KHUYẾN MÃI & KHO VOUCHER ĐÃ ĐẠT YÊU CẦU!');
