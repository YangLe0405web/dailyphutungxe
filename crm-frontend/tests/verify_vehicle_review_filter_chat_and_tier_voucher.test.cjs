const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('=== TEST SUITE: BỘ LỌC ĐÁNH GIÁ XE, LIVE CHAT CSKH & VOUCHER HẠNG THÀNH VIÊN ===\n');

// ────────────────────────────────────────────────────────────
// 1. KIỂM TRA PHẦN 1: BỘ LỌC ĐÁNH GIÁ TRONG VEHICLESSHOWROOM.TSX
// ────────────────────────────────────────────────────────────
console.log('--- 1. Kiểm tra Bộ lọc đánh giá xe máy trong VehiclesShowroom.tsx ---');
const showroomPath = path.resolve(__dirname, '../src/pages/customer/VehiclesShowroom.tsx');
const showroomCode = fs.readFileSync(showroomPath, 'utf8');

const hasRatingFilter = showroomCode.includes('vehicleReviewRatingFilter') || showroomCode.includes('vReviewRatingFilter') || showroomCode.includes('reviewRatingFilter');
console.log('1.1 VehiclesShowroom.tsx có state lọc đánh giá xe theo số sao?:', hasRatingFilter);
assert.strictEqual(hasRatingFilter, true, 'VehiclesShowroom.tsx phải có state lọc đánh giá xe theo số sao');

const hasImageFilter = showroomCode.includes('vehicleReviewHasImageFilter') || showroomCode.includes('vReviewHasImageFilter') || showroomCode.includes('reviewHasImageFilter');
console.log('1.2 VehiclesShowroom.tsx có state lọc đánh giá xe có hình ảnh/video?:', hasImageFilter);
assert.strictEqual(hasImageFilter, true, 'VehiclesShowroom.tsx phải có state lọc đánh giá xe có hình ảnh/video');

const hasStarButtons = showroomCode.includes('{stars}★') || (showroomCode.includes('5★') && showroomCode.includes('4★'));
console.log('1.3 VehiclesShowroom.tsx có các nút lọc số sao (5★, 4★, 3★...)?:', hasStarButtons);
assert.strictEqual(hasStarButtons, true, 'VehiclesShowroom.tsx phải render các nút lọc theo số sao');

const hasImageButton = showroomCode.includes('Có hình ảnh') || showroomCode.includes('📷');
console.log('1.4 VehiclesShowroom.tsx có nút lọc Có hình ảnh?:', hasImageButton);
assert.strictEqual(hasImageButton, true, 'VehiclesShowroom.tsx phải render nút lọc Có hình ảnh/video');

const hasResetButton = showroomCode.includes('Xóa bộ lọc');
console.log('1.5 VehiclesShowroom.tsx có nút Xóa bộ lọc?:', hasResetButton);
assert.strictEqual(hasResetButton, true, 'VehiclesShowroom.tsx phải có nút Xóa bộ lọc');

// ────────────────────────────────────────────────────────────
// 2. KIỂM TRA PHẦN 2: NÂNG CẤP LIVE CHAT & NÚT LIÊN HỆ KÈM ẢNH
// ────────────────────────────────────────────────────────────
console.log('\n--- 2. Kiểm tra Live Chat CSKH & Nút liên hệ với shop ---');
const apiPath = path.resolve(__dirname, '../src/services/api.ts');
const apiCode = fs.readFileSync(apiPath, 'utf8');

const hasChatAdminNotif = apiCode.includes('customer_chat_message') || (apiCode.includes('addAdminNotification') && apiCode.includes('chatApi'));
console.log('2.1 chatApi.sendMessage có gọi addAdminNotification khi khách nhắn tin?:', hasChatAdminNotif);
assert.strictEqual(hasChatAdminNotif, true, 'chatApi.sendMessage phải tự động bắn thông báo cho Admin khi khách hàng nhắn tin');

const partsStorePath = path.resolve(__dirname, '../src/pages/customer/PartsStore.tsx');
const partsStoreCode = fs.readFileSync(partsStorePath, 'utf8');
const partsHasContactBtn = partsStoreCode.includes('crm-open-chat') && (partsStoreCode.includes('Liên hệ') || partsStoreCode.includes('Tư vấn'));
console.log('2.2 PartsStore.tsx có nút liên hệ tư vấn sản phẩm mở chat?:', partsHasContactBtn);
assert.strictEqual(partsHasContactBtn, true, 'PartsStore.tsx phải có nút liên hệ shop mở chat kèm ngữ cảnh sản phẩm');

const showroomHasContactBtn = showroomCode.includes('crm-open-chat') && (showroomCode.includes('Liên hệ') || showroomCode.includes('Tư vấn'));
console.log('2.3 VehiclesShowroom.tsx có nút liên hệ tư vấn xe mở chat?:', showroomHasContactBtn);
assert.strictEqual(showroomHasContactBtn, true, 'VehiclesShowroom.tsx phải có nút liên hệ shop mở chat kèm ngữ cảnh xe máy');

const custLayoutPath = path.resolve(__dirname, '../src/layouts/CustomerLayout.tsx');
const custLayoutCode = fs.readFileSync(custLayoutPath, 'utf8');
const chatHasProductPreview = custLayoutCode.includes('pinnedContext') && custLayoutCode.includes('productImage');
console.log('2.4 Khung chat hiển thị ảnh và thông tin sản phẩm thảo luận?:', chatHasProductPreview);
assert.strictEqual(chatHasProductPreview, true, 'Khung chat phải hiển thị thẻ ảnh và thông tin sản phẩm');

// ────────────────────────────────────────────────────────────
// 3. KIỂM TRA PHẦN 3: VOUCHER HẠNG THÀNH VIÊN TỰ ĐỘNG GỬI VỀ TÀI KHOẢN
// ────────────────────────────────────────────────────────────
console.log('\n--- 3. Kiểm tra Voucher theo Hạng thành viên (VIP / Thân thiết) ---');

const hasTierVoucherRecognition = apiCode.includes('getCustomerTier') &&
  (apiCode.includes('getVouchersForCustomer') || apiCode.includes('doiTuongKhachHang === \'VIP\'')) &&
  apiCode.includes('10000000');
console.log('3.1 api.ts nhận diện Voucher VIP theo chi tiêu / getCustomerTier?:', hasTierVoucherRecognition);
assert.strictEqual(hasTierVoucherRecognition, true, 'api.ts phải nhận diện voucher VIP chuẩn theo getCustomerTier / chi tiêu');

const dashboardPath = path.resolve(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
const hasAutoTierVoucherGift = dashboardCode.includes('saveVoucherToCustomerWallet') &&
  (dashboardCode.includes('VIP') || dashboardCode.includes('tier'));
console.log('3.2 CustomerDashboard.tsx tự động gửi voucher vào ví khi khách đạt hạng?:', hasAutoTierVoucherGift);
assert.strictEqual(hasAutoTierVoucherGift, true, 'CustomerDashboard.tsx phải tự động tặng voucher vào kho khi đạt hạng thành viên');

console.log('\n🎉 ALL CHECKS PASSED FOR FIX 94 TEST SUITE!');
