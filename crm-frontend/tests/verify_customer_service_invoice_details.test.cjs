const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST TDD: KIỂM TRA HIỂN THỊ HÓA ĐƠN DỊCH VỤ BÊN KHÁCH HÀNG (FIX 106) ---\n');

const dashPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const apptsPath = path.join(__dirname, '../src/pages/admin/Appointments.tsx');

const dashContent = fs.readFileSync(dashPath, 'utf8');
const apptsContent = fs.readFileSync(apptsPath, 'utf8');

// [Test 1] Kiểm tra CustomerDashboard tìm kiếm matchedServiceOrder từ danh sách đơn hàng dịch vụ
console.log('[Test 1] Kiểm tra CustomerDashboard liên kết đúng hóa đơn đơn hàng dịch vụ (loaiDon === DichVu)');
assert.ok(dashContent.includes('matchedServiceOrder'), 'CustomerDashboard phải có logic tìm matchedServiceOrder cho Bảo dưỡng & Sửa chữa');
console.log('✅ PASS: Đã có liên kết matchedServiceOrder cho dịch vụ!\n');

// [Test 2] Kiểm tra hiển thị đúng chi tiết hạng mục, phụ tùng, đơn giá từ đơn hàng thực tế
console.log('[Test 2] Kiểm tra docItems render động từ matchedServiceOrder.items thay vì hardcode');
assert.ok(dashContent.includes('matchedServiceOrder.items'), 'docItems phải lấy danh sách món từ matchedServiceOrder.items');
console.log('✅ PASS: Chi tiết hạng mục hiển thị động từ đơn hàng thực tế!\n');

// [Test 3] Kiểm tra xóa bỏ giá tiền hardcode sai cho Bảo Dưỡng (350.000 đ cũ) và Sửa Chữa (450.000 đ cũ)
console.log('[Test 3] Kiểm tra không còn hardcode 350.000 đ (bảo dưỡng) và 450.000 đ (sửa chữa)');
assert.ok(!dashContent.includes("totalPaymentText = '350.000 đ';\n          invoiceNote = 'Bảo hành dịch vụ bảo dưỡng định kỳ trong 01 tháng"), 'Phải loại bỏ giá gán cứng 350.000 đ cho bảo dưỡng');
assert.ok(!dashContent.includes("totalPaymentText = '450.000 đ';\n          invoiceNote = 'Linh kiện thay thế được bảo hành chính hãng"), 'Phải loại bỏ giá gán cứng 450.000 đ cho sửa chữa');
console.log('✅ PASS: Đã xóa bỏ các số tiền hardcode sai lệch!\n');

// [Test 4] Kiểm tra hiển thị đúng tên KTV phụ trách thực tế của lịch hẹn
console.log('[Test 4] Kiểm tra KTV hiển thị đúng nhân viên phụ trách thay vì chuỗi cứng');
assert.ok(dashContent.includes('appt.nhanVienPhuTrach') && (dashContent.includes('finalKtv') || dashContent.includes('staffRole')), 'Phải ưu tiên appt.nhanVienPhuTrach cho staffRole');
console.log('✅ PASS: KTV được lấy chuẩn xác theo lịch hẹn!\n');

// [Test 5] Kiểm tra Appointments.tsx gắn maLichHen và nhanVienPhuTrach vào newOrder khi tạo hóa đơn
console.log('[Test 5] Kiểm tra Appointments.tsx lưu maLichHen và KTV vào đơn hàng dịch vụ');
assert.ok(apptsContent.includes('maLichHen: invoiceSourceAppt'), 'Appointments.tsx phải gán maLichHen cho đơn hàng dịch vụ');
assert.ok(apptsContent.includes('chiPhiThucTe: serviceInvoiceTotal') || apptsContent.includes('maHoaDon: invoiceId'), 'Appointments.tsx phải cập nhật chiPhiThucTe/maHoaDon cho lịch hẹn');
console.log('✅ PASS: Admin Appointments đã liên kết hoàn chỉnh maLichHen và chiPhiThucTe!\n');

console.log('🎉 TẤT CẢ 5 HẠNG MỤC TEST HIỂN THỊ HÓA ĐƠN KHÁCH HÀNG ĐÃ SẴN SÀNG!');
