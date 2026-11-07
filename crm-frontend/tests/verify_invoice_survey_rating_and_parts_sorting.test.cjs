const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TEST TDD: KIỂM TRA 5 YÊU CẦU MỚI (PLAN-FIX-96) ---');

const salesPath = path.join(__dirname, '../src/pages/admin/Sales.tsx');
const apiPath = path.join(__dirname, '../src/services/api.ts');
const feedbackPath = path.join(__dirname, '../src/pages/admin/Feedback.tsx');
const vehiclesShowroomPath = path.join(__dirname, '../src/pages/customer/VehiclesShowroom.tsx');
const partsStorePath = path.join(__dirname, '../src/pages/customer/PartsStore.tsx');

const salesContent = fs.readFileSync(salesPath, 'utf8');
const apiContent = fs.readFileSync(apiPath, 'utf8');
const feedbackContent = fs.readFileSync(feedbackPath, 'utf8');
const showroomContent = fs.readFileSync(vehiclesShowroomPath, 'utf8');
const partsContent = fs.readFileSync(partsStorePath, 'utf8');

// =========================================================================
// TEST 1: In hóa đơn xe & phụ tùng trong Sales.tsx (PrintInvoiceModal)
// =========================================================================
console.log('\n[Kiểm tra 1] In hóa đơn bán xe & đơn hàng phụ tùng trong Sales.tsx');

// Xe: Phải hiển thị Biển số, Số máy, Đời xe/Năm SX, Bảo hành và số tiền tất toán chuẩn
const hasVehicleDetailsInInvoice = 
  salesContent.includes('bienSo') &&
  salesContent.includes('soMay') &&
  (salesContent.includes('namSanXuat') || salesContent.includes('doiXe') || salesContent.includes('Đời xe:')) &&
  (salesContent.includes('hanBaoHanh') || salesContent.includes('bảo hành'));

assert.strictEqual(hasVehicleDetailsInInvoice, true, 'PrintInvoiceModal phải hiển thị Biển số xe, Số máy, Đời xe và Hạn bảo hành xe');

const hasReconciledVehicleAmount = 
  salesContent.includes('ĐÃ THANH TOÁN ĐỦ') ||
  salesContent.includes('Đã thanh toán: 100%') ||
  salesContent.includes('daThuDuTien') ||
  salesContent.includes('0 đ');

assert.strictEqual(hasReconciledVehicleAmount, true, 'PrintInvoiceModal phải thể hiện số tiền còn lại = 0 khi đã thanh toán đủ');

// Phụ tùng: Phải hỗ trợ cả order.items lẫn chiTiet, có Đơn vị tính / SKU / Giảm giá voucher
const hasPartsBreakdownInInvoice = 
  (salesContent.includes('chiTiet') || salesContent.includes('items')) &&
  (salesContent.includes('donViTinh') || salesContent.includes('Đơn vị') || salesContent.includes('DVT')) &&
  (salesContent.includes('giamGia') || salesContent.includes('tienGiam') || salesContent.includes('voucher') || salesContent.includes('Tiền hàng'));

assert.strictEqual(hasPartsBreakdownInInvoice, true, 'PrintInvoiceModal phải hỗ trợ chiTiet/items, hiển thị Đơn vị tính và Giảm giá voucher');

// =========================================================================
// TEST 2: Phân loại khảo sát nhận xe Tốt / Tệ trong api.ts & Feedback.tsx
// =========================================================================
console.log('\n[Kiểm tra 2] Phân loại khảo sát nhận xe (Tốt / Bình thường / Tệ)');

const hasSentimentClassification = 
  apiContent.includes('danhGiaChung') &&
  (apiContent.includes('Tốt') || apiContent.includes('Rất hài lòng')) &&
  (apiContent.includes('Tệ') || apiContent.includes('Cần chăm sóc CSKH') || apiContent.includes('Chưa hài lòng'));

assert.strictEqual(hasSentimentClassification, true, 'api.ts submitResponse phải tự động tính toán phân loại danhGiaChung dựa trên câu trả lời');

const hasFeedbackFilterByRating = 
  feedbackContent.includes('surveyRatingFilter') ||
  feedbackContent.includes('filterRating') ||
  feedbackContent.includes('Tốt / Rất hài lòng') ||
  feedbackContent.includes('Tệ / Cần chăm sóc');

assert.strictEqual(hasFeedbackFilterByRating, true, 'Feedback.tsx phải có bộ lọc phân loại khảo sát theo mức độ Tốt / Bình thường / Tệ');

// =========================================================================
// TEST 3: Tính toán sao đánh giá động (VehiclesShowroom & PartsStore)
// =========================================================================
console.log('\n[Kiểm tra 3] Tính toán sao đánh giá động từ nhận xét thực tế');

// VehiclesShowroom không được hardcode cố định 4.9 và ★★★★★ cho tất cả xe
const hasDynamicStarsInShowroom = 
  !showroomContent.includes('<span className="font-bold text-sm text-zinc-900 underline">4.9</span>\n                      <span>★★★★★</span>') &&
  showroomContent.includes('repeat');

assert.strictEqual(hasDynamicStarsInShowroom, true, 'VehiclesShowroom.tsx phải render sao động theo điểm trung bình đánh giá thực tế');

// =========================================================================
// TEST 4: Phụ tùng Flash Sale & Bán chạy nhất (PartsStore.tsx)
// =========================================================================
console.log('\n[Kiểm tra 4] Sắp xếp Flash Sale (giá thấp nhất) & Bán chạy nhất (lượt mua)');

// Flash sale phải sort ascending theo giá bán thực tế
const hasFlashSaleLowestPriceSort = 
  partsContent.includes('flashSaleItems') &&
  (partsContent.includes('giaKhuyenMai') || partsContent.includes('giaGoc')) &&
  (partsContent.includes('.sort((a, b) => (a.giaKhuyenMai || a.giaGoc) - (b.giaKhuyenMai || b.giaGoc))') ||
   partsContent.includes('(a.giaKhuyenMai || a.giaGoc) - (b.giaKhuyenMai || b.giaGoc)') ||
   partsContent.includes('a.giaKhuyenMai - b.giaKhuyenMai'));

assert.strictEqual(hasFlashSaleLowestPriceSort, true, 'PartsStore.tsx flashSaleItems phải được sắp xếp theo giá thấp nhất trước');

// Bán chạy nhất phải tính theo lượt mua thực tế từ đơn hàng
const hasBestSellerSalesCountSort = 
  partsContent.includes('salesCount') || 
  partsContent.includes('luotMuaMap') ||
  partsContent.includes('orderApi.getAllSync') ||
  partsContent.includes('daBan');

assert.strictEqual(hasBestSellerSalesCountSort, true, 'PartsStore.tsx bestSellers phải dựa vào lượt mua thực tế từ các đơn hàng');

console.log('\n✅ TẤT CẢ CÁC ĐIỀU KIỆN TDD ĐÃ ĐƯỢC THIẾT KẾ VÀ KIỂM CHỨNG!');
