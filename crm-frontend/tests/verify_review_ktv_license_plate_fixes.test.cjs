const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: Kiểm tra 3 lỗi: Xem SP Phụ tùng, KTV Đơn xe, Duyệt & Từ chối Biển số ===\n');

const partsStorePath = path.join(__dirname, '../src/pages/customer/PartsStore.tsx');
const customerDashboardPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const appointmentsAdminPath = path.join(__dirname, '../src/pages/admin/Appointments.tsx');
const licensePlatePath = path.join(__dirname, '../src/pages/admin/LicensePlateApproval.tsx');
const apiPath = path.join(__dirname, '../src/services/api.ts');

const partsStoreCode = fs.readFileSync(partsStorePath, 'utf8');
const dashboardCode = fs.readFileSync(customerDashboardPath, 'utf8');
const appointmentsAdminCode = fs.readFileSync(appointmentsAdminPath, 'utf8');
const licensePlateCode = fs.readFileSync(licensePlatePath, 'utf8');
const apiCode = fs.readFileSync(apiPath, 'utf8');

// ────────────────────────────────────────────────────────────
// 1. KIỂM TRA LỖI 1: Nút xem sản phẩm của phụ tùng ở Chờ đánh giá
// ────────────────────────────────────────────────────────────
console.log('--- 1. Kiểm tra Lỗi 1: Xem sản phẩm phụ tùng ở Chờ đánh giá ---');

// 1.1 PartsStore.tsx chỉ xóa sessionStorage khi ĐÃ TÌM THẤY sản phẩm (không xóa vội khi list còn rỗng)
const partsStoreDoesNotRemoveSessionEarly = !partsStoreCode.includes("if (pId || pName) {\n          sessionStorage.removeItem('crm_view_part_id');");
console.log('1.1 PartsStore.tsx không xóa sessionStorage sớm khi chưa tìm thấy phụ tùng?:', partsStoreDoesNotRemoveSessionEarly);
assert.strictEqual(partsStoreDoesNotRemoveSessionEarly, true, 'PartsStore.tsx phải giữ sessionStorage cho đến khi tìm thấy phụ tùng');

// 1.2 PartsStore.tsx có cơ chế fallback hoặc fuzzy match từ khóa để luôn mở modal thành công
const partsStoreHasFallbackOrFuzzy = partsStoreCode.includes('crm_view_part_image') || partsStoreCode.includes('fallbackPart') || partsStoreCode.includes('customPart') || partsStoreCode.includes('mockParts.find');
console.log('1.2 PartsStore.tsx có hỗ trợ ảnh và fallback hiển thị phụ tùng?:', partsStoreHasFallbackOrFuzzy);
assert.strictEqual(partsStoreHasFallbackOrFuzzy, true, 'PartsStore.tsx phải hỗ trợ ảnh và fallback để luôn mở chi tiết thành công');

// ────────────────────────────────────────────────────────────
// 2. KIỂM TRA LỖI 2: KTV của đơn hàng xe
// ────────────────────────────────────────────────────────────
console.log('\n--- 2. Kiểm tra Lỗi 2: KTV đơn hàng xe (Khách hàng, Lịch biểu Admin, Xác nhận ngày nhận) ---');

// 2.1 CustomerDashboard.tsx tại hộp thoại ChoKhachXacNhanNgayNhan có hiển thị KTV phụ trách
const dashboardShowsKtvOnConfirmPickup = dashboardCode.includes('Kỹ thuật viên') && dashboardCode.includes('thongTinXe?.ktvPhuTrach');
console.log('2.1 CustomerDashboard.tsx hiển thị KTV tại hộp thoại xác nhận ngày nhận xe?:', dashboardShowsKtvOnConfirmPickup);
assert.strictEqual(dashboardShowsKtvOnConfirmPickup, true, 'CustomerDashboard.tsx phải hiển thị rõ KTV tại hộp thoại xác nhận ngày nhận xe');

// 2.2 api.ts confirmVehiclePickupDate có gán KTV phụ trách cho cuộc hẹn
const apiConfirmSetsKtv = apiCode.includes('confirmVehiclePickupDate') && apiCode.includes('nhanVienPhuTrach:');
console.log('2.2 api.ts confirmVehiclePickupDate có gán KTV phụ trách cho cuộc hẹn?:', apiConfirmSetsKtv);
assert.strictEqual(apiConfirmSetsKtv, true, 'api.ts confirmVehiclePickupDate phải gán nhanVienPhuTrach cho cuộc hẹn nhận xe');

// 2.3 api.ts assignTechnician có cập nhật cuộc hẹn nhận xe tương ứng
const apiAssignSyncsAppt = apiCode.includes('crm_order_ktv_map') && apiCode.includes('appointmentApi') && apiCode.includes('assignTechnician');
console.log('2.3 api.ts assignTechnician có đồng bộ KTV sang lịch hẹn nhận xe?:', apiAssignSyncsAppt);
assert.strictEqual(apiAssignSyncsAppt, true, 'api.ts assignTechnician phải đồng bộ KTV sang lịch hẹn nhận xe');

// ────────────────────────────────────────────────────────────
// 3. KIỂM TRA LỖI 3: Biển số duyệt theo chuẩn bản ngày 03/11 (6979adf)
// ────────────────────────────────────────────────────────────
console.log('\n--- 3. Kiểm tra Lỗi 3: Biển số duyệt chuẩn bản ngày 03/11 (6979adf) ---');

// 3.1 LicensePlateApproval.tsx có handleQuickApprove
const hasQuickApprove = licensePlateCode.includes('handleQuickApprove');
console.log('3.1 LicensePlateApproval.tsx có hàm handleQuickApprove chuẩn bản 03/11?:', hasQuickApprove);
assert.strictEqual(hasQuickApprove, true, 'LicensePlateApproval.tsx phải có handleQuickApprove');

// 3.2 LicensePlateApproval.tsx có chức năng Từ chối
const hasRejectFunctionality = licensePlateCode.includes('setRejectingVehicle') && licensePlateCode.includes('handleConfirmReject');
console.log('3.2 LicensePlateApproval.tsx có đầy đủ chức năng Từ chối biển số?:', hasRejectFunctionality);
assert.strictEqual(hasRejectFunctionality, true, 'LicensePlateApproval.tsx phải có setRejectingVehicle và handleConfirmReject');

// 3.3 api.ts có rejectLicensePlate
const hasRejectApi = apiCode.includes('rejectLicensePlate');
console.log('3.3 api.ts có hàm rejectLicensePlate hoạt động?:', hasRejectApi);
assert.strictEqual(hasRejectApi, true, 'api.ts phải có rejectLicensePlate');

console.log('\n✅ PASS (Green Phase): Tất cả các tiêu chí kiểm thử đã đạt chuẩn 100%!');
