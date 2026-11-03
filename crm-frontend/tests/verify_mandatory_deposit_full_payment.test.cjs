const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Test Task 3: Bắt buộc bấm thu đủ tiền mới cho hoàn tất đơn xe cọc ---');

const salesPath = path.join(__dirname, '../src/pages/admin/Sales.tsx');
const salesContent = fs.readFileSync(salesPath, 'utf8');

// 1. Kiểm tra không còn dùng window.confirm cho phép bỏ qua thu tiền
const hasLooseConfirm = salesContent.includes('const confirmPaid = window.confirm') && salesContent.includes('KHÁCH HÀNG ĐÃ NỘP ĐỦ 100% TIỀN TẠI QUẦY không');
console.log('Sales.tsx còn popup confirm lỏng lẻo cho phép bỏ qua thu tiền không?:', hasLooseConfirm);

// 2. Kiểm tra có cảnh báo chặn cứng bắt buộc bấm nút thu đủ tiền
const hasStrictBlockAlert = salesContent.includes('BẮT BUỘC THU ĐỦ TIỀN TRƯỚC KHI HOÀN TẤT ĐƠN XE') || salesContent.includes('BUỘC PHẢI BẤM NÚT');
console.log('Sales.tsx có cảnh báo chặn cứng bắt buộc bấm thu tiền không?:', hasStrictBlockAlert);

// 3. Kiểm tra có nút bấm thu đủ tiền còn lại nổi bật không
const hasCollectRemainingBtn = salesContent.includes('Thu tiền (') || salesContent.includes('Thu đủ tiền còn lại') || salesContent.includes('soTienConLai');
console.log('Sales.tsx có nút bấm thu đủ tiền còn lại không?:', hasCollectRemainingBtn);

if (hasLooseConfirm || !hasStrictBlockAlert) {
  console.log('❌ FAIL (Red): Chưa triển khai ràng buộc chặn cứng bắt buộc thu đủ tiền!');
  process.exit(1);
} else {
  console.log('✅ PASS (Green): Ràng buộc bắt buộc thu đủ tiền đã được thiết lập nghiêm ngặt!');
}
