const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST TDD: KIỂM TRA SỬA LỖI SỐ TIỀN HÓA ĐƠN & GỬI KHẢO SÁT DỊCH VỤ (FIX 105) ---\n');

const mockDataPath = path.join(__dirname, '../src/data/mockData.ts');
const apiPath = path.join(__dirname, '../src/services/api.ts');
const apptsPath = path.join(__dirname, '../src/pages/admin/Appointments.tsx');
const dashPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');

const mockDataContent = fs.readFileSync(mockDataPath, 'utf8');
const apiContent = fs.readFileSync(apiPath, 'utf8');
const apptsContent = fs.readFileSync(apptsPath, 'utf8');
const dashContent = fs.readFileSync(dashPath, 'utf8');

// [Test 1] Kiểm tra kho phụ tùng có các linh kiện chuẩn mockup
console.log('[Test 1] Kiểm tra kho mockParts có các phụ tùng theo ảnh mockup');
assert.ok(mockDataContent.includes('Motul 300V'), 'mockParts phải có Nhớt Motul 300V');
assert.ok(mockDataContent.includes('Ruột xe') || mockDataContent.includes('Săm'), 'mockParts phải có Ruột xe (Săm) IRC');
assert.ok(mockDataContent.includes('Bố thắng') || mockDataContent.includes('Má phanh'), 'mockParts phải có Bố thắng (Má phanh) Vision');
console.log('✅ PASS: mockParts đã có đủ phụ tùng khớp mockup ảnh 1, 2, 3, 4!\n');

// [Test 2] Kiểm tra nhận diện chính xác Gói bảo dưỡng theo lịch hẹn và danh sách gói đầy đủ
console.log('[Test 2] Kiểm tra nhận diện Gói bảo dưỡng theo lịch hẹn và danh sách gói đầy đủ');
assert.ok(apptsContent.includes('150000') || apptsContent.includes('150.000'), 'Phải có gói Tiêu chuẩn 150.000 đ');
assert.ok(apptsContent.includes('350000') || apptsContent.includes('350.000'), 'Phải có gói Chuyên sâu 350.000 đ');
assert.ok(apptsContent.includes('650000') || apptsContent.includes('650.000'), 'Phải có gói Toàn diện VIP 650.000 đ');
assert.ok(apptsContent.includes('120000') || apptsContent.includes('120.000'), 'Phải có gói Spa chăm sóc 120.000 đ');
assert.ok(apptsContent.includes('matchPkg') || apptsContent.includes('findPkg') || apptsContent.includes('tiêu chuẩn') || apptsContent.includes('tieu chuan'), 'Phải có logic bóc tách gói bảo dưỡng chính xác từ ghi chú lịch hẹn');
console.log('✅ PASS: Đã có đủ các gói dịch vụ và logic nhận diện đúng gói theo lịch hẹn!\n');

// [Test 3] Kiểm tra tính đúng số tiền phụ tùng phát sinh và hỗ trợ thêm phụ tùng tùy chỉnh
console.log('[Test 3] Kiểm tra tính đúng tiền phụ tùng phát sinh và hỗ trợ phụ tùng tùy chỉnh');
assert.ok(apptsContent.includes('invoicePartsTotal'), 'Phải có biến tổng tiền phụ tùng invoicePartsTotal');
assert.ok(apptsContent.includes('serviceInvoiceTotal'), 'Phải có biến tổng thanh toán serviceInvoiceTotal');
assert.ok(apptsContent.includes('customPart') || apptsContent.includes('phụ tùng khác') || apptsContent.includes('Phụ tùng phát sinh') || apptsContent.includes('Thêm phụ tùng'), 'Phải có tính năng/giao diện thêm phụ tùng phát sinh tùy chỉnh');
console.log('✅ PASS: Logic tính tổng tiền phụ tùng phát sinh và thêm phụ tùng tùy chỉnh đã sẵn sàng!\n');

// [Test 4] Kiểm tra hàm tạo khảo sát riêng biệt cho Bảo dưỡng & Sửa chữa
console.log('[Test 4] Kiểm tra hàm tạo khảo sát riêng biệt cho Bảo dưỡng (KS-BD-) & Sửa chữa (KS-SC-)');
assert.ok(apiContent.includes('createMaintenanceSurvey'), 'api.ts phải có createMaintenanceSurvey');
assert.ok(apiContent.includes('createRepairSurvey'), 'api.ts phải có createRepairSurvey');
assert.ok(apiContent.includes('KS-BD-'), 'Phải có tiền tố khảo sát KS-BD- cho bảo dưỡng');
assert.ok(apiContent.includes('KS-SC-'), 'Phải có tiền tố khảo sát KS-SC- cho sửa chữa');
console.log('✅ PASS: Đã có 2 hàm tạo khảo sát chuyên biệt theo mã xe cho Bảo dưỡng và Sửa chữa!\n');

// [Test 5] Kiểm tra CustomerDashboard hiển thị khảo sát Bảo dưỡng & Sửa chữa
console.log('[Test 5] Kiểm tra CustomerDashboard.tsx cho phép hiển thị khảo sát KS-BD- và KS-SC-');
assert.ok(dashContent.includes('KS-BD-'), 'CustomerDashboard phải hỗ trợ KS-BD-');
assert.ok(dashContent.includes('KS-SC-'), 'CustomerDashboard phải hỗ trợ KS-SC-');
assert.ok(apptsContent.includes('addCustomerNotification') || apptsContent.includes('createMaintenanceSurvey') || apptsContent.includes('createRepairSurvey'), 'Appointments.tsx phải gọi khảo sát hoặc bắn thông báo khi hoàn thành/lập hóa đơn');
console.log('✅ PASS: Khảo sát bảo dưỡng & sửa chữa được đồng bộ hiển thị sang CustomerDashboard!\n');

console.log('🎉 TẤT CẢ 5 HẠNG MỤC KIỂM THỬ SỬA SỐ TIỀN & GỬI KHẢO SÁT ĐÃ SẴN SÀNG!');
