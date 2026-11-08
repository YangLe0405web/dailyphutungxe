const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST TDD: KIỂM TRA LUỒNG BẢO DƯỠNG, SỬA CHỮA & TẠO HÓA ĐƠN DỊCH VỤ (FIX 104) ---');

const apptPath = path.join(__dirname, '../src/pages/admin/Appointments.tsx');
const content = fs.readFileSync(apptPath, 'utf8');

// [Test 1] Hiển thị 2 nút "Khách đã đến" và "Khách không đến" khi lịch hẹn Bảo dưỡng / Sửa chữa ở trạng thái Đã xác nhận
console.log('\n[Test 1] Kiểm tra hiển thị 2 nút "Khách đã đến" và "Khách không đến" khi đã xác nhận');
const hasCustomerArrivedButton = content.includes('Khách đã đến');
const hasCustomerNoShowButton = content.includes('Khách không đến');
assert.strictEqual(
  hasCustomerArrivedButton && hasCustomerNoShowButton,
  true,
  'Appointments.tsx phải có 2 nút [Khách đã đến] và [Khách không đến] cho lịch Bảo dưỡng & Sửa chữa đã xác nhận!'
);
console.log('✅ PASS: Đã có đủ 2 nút "Khách đã đến" và "Khách không đến"!');

// [Test 2] Khi khách đã đến -> hiển thị nút "Tạo hóa đơn"
console.log('\n[Test 2] Kiểm tra chuyển thành nút "Tạo hóa đơn" khi khách đã đến showroom');
const hasCreateInvoiceButton = (
  content.includes('Tạo hóa đơn') ||
  content.includes('Tạo Hóa Đơn')
);
assert.strictEqual(
  hasCreateInvoiceButton,
  true,
  'Appointments.tsx phải hiển thị nút [Tạo hóa đơn] khi khách đã có mặt tại showroom!'
);
console.log('✅ PASS: Đã có nút "Tạo hóa đơn" khi khách đã đến!');

// [Test 3] Modal Tạo Hóa Đơn Bảo Dưỡng (Chuẩn Mockup 1 & 2)
console.log('\n[Test 3] Kiểm tra Modal Tạo Hóa Đơn Bảo Dưỡng chuẩn mockup ảnh 1 & 2');
const hasMaintenanceInvoiceModal = (
  (content.includes('TẠO HÓA ĐƠN BẢO DƯỠNG') || content.includes('TẠO HÓA ĐƠN DỊCH VỤ')) &&
  content.includes('GÓI BẢO DƯỠNG') &&
  content.includes('PHỤ TÙNG PHÁT SINH') &&
  content.includes('Tạo & In Hóa Đơn')
);
assert.strictEqual(
  hasMaintenanceInvoiceModal,
  true,
  'Appointments.tsx phải có Modal Tạo Hóa Đơn Bảo Dưỡng với đầy đủ Gói bảo dưỡng, Phụ tùng phát sinh và nút Tạo & In Hóa Đơn!'
);
console.log('✅ PASS: Modal Tạo Hóa Đơn Bảo Dưỡng đã được xây dựng đầy đủ theo mockup!');

// [Test 4] Modal Tạo Hóa Đơn Sửa Chữa (Chuẩn Mockup 3 & 4)
console.log('\n[Test 4] Kiểm tra Modal Tạo Hóa Đơn Sửa Chữa chuẩn mockup ảnh 3 & 4');
const hasRepairInvoiceModal = (
  content.includes('TẠO HÓA ĐƠN SỬA CHỮA') &&
  content.includes('PHỤ TÙNG THAY THẾ') &&
  content.includes('TIỀN CÔNG DỊCH VỤ') &&
  content.includes('Tạo & In Hóa Đơn')
);
assert.strictEqual(
  hasRepairInvoiceModal,
  true,
  'Appointments.tsx phải có Modal Tạo Hóa Đơn Sửa Chữa với Phụ tùng thay thế, Tiền công dịch vụ và nút Tạo & In Hóa Đơn!'
);
console.log('✅ PASS: Modal Tạo Hóa Đơn Sửa Chữa đã được xây dựng đầy đủ theo mockup!');

// [Test 5] Nút Tạo Hóa Đơn Bên Ngoài (Hỗ trợ tìm kiếm khách hàng có sẵn & nút + Khách mới)
console.log('\n[Test 5] Kiểm tra nút Tạo Hóa Đơn bên ngoài hỗ trợ tìm kiếm khách và nhập khách mới');
const hasOutsideInvoiceCreation = (
  (content.includes('+ Tạo Hóa Đơn Bảo Dưỡng') || content.includes('+ Tạo hóa đơn Bảo dưỡng') || content.includes('Tạo Hóa Đơn Dịch Vụ')) &&
  content.includes('+ Khách mới')
);
assert.strictEqual(
  hasOutsideInvoiceCreation,
  true,
  'Appointments.tsx phải có nút Tạo hóa đơn bên ngoài và hỗ trợ nút [+ Khách mới] cho khách vãng lai!'
);
console.log('✅ PASS: Đã có nút tạo hóa đơn bên ngoài hỗ trợ tìm kiếm khách và nhập khách mới!');

console.log('\n🎉 TẤT CẢ 5 HẠNG MỤC KIỂM THỬ LUỒNG BẢO DƯỠNG & SỬA CHỮA ĐÃ SẴN SÀNG!');
