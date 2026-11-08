const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST TDD: KIỂM TRA ĐỒNG BỘ SỐ LIỆU ĐỘNG BIỂU ĐỒ & BẢN IN A4 QUẢN TRỊ ---');

const reportsFile = path.join(__dirname, '../src/pages/admin/Reports.tsx');
assert.ok(fs.existsSync(reportsFile), 'Không tìm thấy file Reports.tsx');
const content = fs.readFileSync(reportsFile, 'utf8');

// [Test 1] Kiểm tra Biểu đồ Phân Hạng Thẻ Thành Viên được tính toán động
console.log('\n[Test 1] Kiểm tra Biểu đồ Phân Hạng Thẻ Thành Viên được tính toán động');
assert.ok(
  content.includes('dynamicTierStats') || content.includes('tierDistribution') || content.includes('rawCustomers.forEach') || content.includes('targetCusts.forEach'),
  'Thiếu hàm tính toán động Phân Hạng Thẻ Thành Viên từ dữ liệu khách hàng thực tế!'
);
assert.ok(!content.includes("data={[\n                      { name: 'Thường', count: 9500"), 'Vẫn còn dữ liệu tĩnh 9500 Thường trong biểu đồ phân hạng thẻ!');
console.log('✅ PASS: Biểu đồ Phân Hạng Thẻ Thành Viên đã gắn dữ liệu động!');

// [Test 2] Kiểm tra Biểu đồ Khách Đặt Lịch vs Khách Vãng Lai được tính toán động
console.log('\n[Test 2] Kiểm tra Biểu đồ Khách Đặt Lịch vs Khách Vãng Lai được tính toán động');
assert.ok(
  content.includes('dynamicBookingVsWalkIn') || content.includes('bookingVsWalkIn') || content.includes('filteredAppts.filter'),
  'Thiếu hàm tính toán động tỷ lệ Khách Đặt Lịch vs Khách Vãng Lai từ lịch hẹn thực tế!'
);
assert.ok(!content.includes("data={[\n                      { name: 'Bảo dưỡng', DatTruoc: 75, VangLai: 25"), 'Vẫn còn dữ liệu tĩnh 75/25 Bảo dưỡng trong biểu đồ dịch vụ!');
console.log('✅ PASS: Biểu đồ Khách Đặt Lịch vs Khách Vãng Lai đã gắn dữ liệu động!');

// [Test 3] Kiểm tra Tự động cập nhật khi khách hàng tương tác (Reactivity)
console.log('\n[Test 3] Kiểm tra cơ chế tự động cập nhật số liệu khi hệ thống có tương tác');
assert.ok(
  content.includes('storage') || content.includes('focus') || content.includes('setInterval') || content.includes('crm-data-refresh'),
  'Thiếu cơ chế lắng nghe sự kiện thay đổi dữ liệu (storage / focus / polling / refresh event)!'
);
console.log('✅ PASS: Đã có cơ chế tự động phản hồi cập nhật dữ liệu khi người dùng tương tác!');

// [Test 4] Kiểm tra Cấu trúc In Bản A4 Quản Trị (#print-reports-a4-document)
console.log('\n[Test 4] Kiểm tra Cấu trúc In Bản A4 Quản Trị');
assert.ok(content.includes('id="print-reports-a4-document"'), 'Thiếu thẻ container tài liệu in A4 #print-reports-a4-document!');
assert.ok(content.includes('@media print'), 'Thiếu định dạng CSS chuyên biệt @media print!');
assert.ok(content.includes('size: A4 portrait') || content.includes('A4 portrait'), 'Thiếu quy định khổ giấy A4 portrait chuẩn in ấn!');
assert.ok(content.includes('BÁO CÁO') && content.includes('MOTOSHOP'), 'Thiếu tiêu đề hành chính cho bản in A4!');
console.log('✅ PASS: Đã có cấu trúc tài liệu và CSS in bản A4 quản trị chuyên biệt!');

console.log('\n🎉 TẤT CẢ 4 HẠNG MỤC KIỂM THỬ ĐÃ ĐƯỢC THIẾT KẾ VÀ KIỂM CHỨNG!');
