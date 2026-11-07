const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TEST TDD: KIỂM TRA 4 YÊU CẦU MỚI (PLAN-FIX-97) ---');

const serviceBookingPath = path.join(__dirname, '../src/pages/customer/ServiceBooking.tsx');
const customerDashboardPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const appointmentsPath = path.join(__dirname, '../src/pages/admin/Appointments.tsx');

const serviceBookingContent = fs.readFileSync(serviceBookingPath, 'utf8');
const dashboardContent = fs.readFileSync(customerDashboardPath, 'utf8');
const appointmentsContent = fs.readFileSync(appointmentsPath, 'utf8');

// =========================================================================
// TEST 1: Kiểm tra trùng biển số xe khi thêm phương tiện mới trong ServiceBooking.tsx
// =========================================================================
console.log('\n[Kiểm tra 1] Chặn trùng biển số xe khi thêm phương tiện mới trong ServiceBooking.tsx');

const hasPlateDuplicateCheck = 
  serviceBookingContent.includes('Biển số xe này đã tồn tại trên hệ thống') ||
  (serviceBookingContent.includes('allVehicles') && serviceBookingContent.includes('normalizePlate') && serviceBookingContent.includes('tồn tại'));

assert.strictEqual(hasPlateDuplicateCheck, true, 'ServiceBooking.tsx phải kiểm tra và báo lỗi nếu biển số xe mới đã tồn tại trên hệ thống');

// =========================================================================
// TEST 2: Giới hạn thời gian đặt lịch hẹn tối đa 1 tháng trong ServiceBooking.tsx
// =========================================================================
console.log('\n[Kiểm tra 2] Giới hạn thời gian đặt lịch hẹn tối đa 1 tháng trong ServiceBooking.tsx');

const hasOneMonthLimit = 
  (serviceBookingContent.includes('maxBookingDate') || serviceBookingContent.includes('maxDateStr') || serviceBookingContent.includes('oneMonthLater') || serviceBookingContent.includes('1 tháng')) &&
  !serviceBookingContent.includes('max={`${new Date().getFullYear() + 2}-12-31`}');

assert.strictEqual(hasOneMonthLimit, true, 'ServiceBooking.tsx phải giới hạn ngày đặt hẹn tối đa 1 tháng và không cho phép chọn ngày quá 1 tháng');

// =========================================================================
// TEST 3: Thanh nhắc lịch hẹn chỉ hiển thị lịch DaXacNhan và trong phạm vi <= 72 tiếng trong CustomerDashboard.tsx
// =========================================================================
console.log('\n[Kiểm tra 3] Thanh nhắc lịch hẹn chuẩn 72 tiếng và chỉ lịch Đã xác nhận trong CustomerDashboard.tsx');

const has72hReminderLogic = 
  dashboardContent.includes('72') &&
  dashboardContent.includes('DaXacNhan') &&
  !dashboardContent.includes('a.trangThai === \'ChoXacNhan\' || a.trangThai === \'DaXacNhan\' || a.trangThai === \'ChoDuyet\'');

assert.strictEqual(has72hReminderLogic, true, 'CustomerDashboard.tsx thanh nhắc lịch hẹn chỉ hiển thị lịch DaXacNhan và trong vòng 72 tiếng');

// =========================================================================
// TEST 4: Nút & Modal Tạo hóa đơn khách vãng lai tại Trang quản lý lái thử trong Appointments.tsx
// =========================================================================
console.log('\n[Kiểm tra 4] Nút & Modal Tạo hóa đơn cho khách hàng vãng lai trong Appointments.tsx');

const hasWalkInInvoiceButton = 
  appointmentsContent.includes('Tạo hóa đơn cho khách vãng lai') ||
  appointmentsContent.includes('Tạo hóa đơn khách vãng lai') ||
  appointmentsContent.includes('WalkInTestDriveModal') ||
  appointmentsContent.includes('showWalkInTestDriveModal');

assert.strictEqual(hasWalkInInvoiceButton, true, 'Appointments.tsx phải có nút Tạo hóa đơn cho khách hàng vãng lai tại moduleType test-drives');

console.log('\n✅ TẤT CẢ CÁC ĐIỀU KIỆN TDD ĐÃ ĐƯỢC THIẾT KẾ VÀ KIỂM CHỨNG!');
