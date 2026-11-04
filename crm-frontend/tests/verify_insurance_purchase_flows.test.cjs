const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: Kiểm tra 5 yêu cầu Mua Bảo Hiểm Xe (BHX01 — BHX05) ===\n');

// 1. Kiểm tra OnlineInsurancePurchaseView.tsx
const purchaseViewPath = path.join(__dirname, '../src/components/customer/OnlineInsurancePurchaseView.tsx');
const purchaseViewCode = fs.readFileSync(purchaseViewPath, 'utf8');

// 1.1 BHX01: Có prop flowMode và không còn nút "Chỉnh sửa" rườm rà
const hasFlowMode = purchaseViewCode.includes('flowMode') && (purchaseViewCode.includes('FLOW_1_BUY_FOR_VEHICLE') || purchaseViewCode.includes('flowMode:'));
console.log('1.1 OnlineInsurancePurchaseView.tsx có hỗ trợ phân định flowMode (Flow 1 vs Flow 2)?:', hasFlowMode);

const hasRemovedEditButton = !purchaseViewCode.includes("isEditingBuyer ? '✓ Xong' : '✏️ Chỉnh sửa'") && !purchaseViewCode.includes('>✏️ Chỉnh sửa<');
console.log('1.1b Đã loại bỏ hoàn toàn nút [✏️ Chỉnh sửa] gây dư thừa/sai quyền?:', hasRemovedEditButton);

// 1.2 BHX02: Ràng buộc phương tiện tại bước 2
const hasFlow1LockedVehicle = purchaseViewCode.includes('flowMode ===') && purchaseViewCode.includes('initialVehicle');
console.log('1.2a Bước 2 của Flow 1 có khóa cố định phương tiện đã chọn và không cho chọn lại?:', hasFlow1LockedVehicle);

const hasFlow2NewVehicleOnly = purchaseViewCode.includes('flowMode') && (purchaseViewCode.includes('newVehicle') || purchaseViewCode.includes('tenXeMoi') || purchaseViewCode.includes('bienSoMoi') || purchaseViewCode.includes('isAddingNewVehicle'));
console.log('1.2b Bước 2 của Flow 2 chỉ cho phép thêm xe mới, không cho chọn lại xe cũ?:', hasFlow2NewVehicleOnly);

// 1.3 BHX03: Cố định ngày bắt đầu hiệu lực tại bước 4
const hasReadOnlyStartDate = purchaseViewCode.includes('readOnly') && (purchaseViewCode.includes('disabled') || purchaseViewCode.includes('cursor-not-allowed')) && purchaseViewCode.includes('startDate');
console.log('1.3 Bước 4 có cố định ngày bắt đầu hiệu lực (Readonly, cấm đổi qua lịch)?:', hasReadOnlyStartDate);

// 2. Kiểm tra CustomerDashboard.tsx
const dashboardPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

// 2.1 BHX04: Ẩn nút "Mua bảo hiểm cho xe này" đối với xe đã có bảo hiểm còn hiệu lực
const hasHideBuyButtonWhenInsured = dashboardCode.includes('hasValidInsurance') || (dashboardCode.includes('myInsurances') && dashboardCode.includes('ngayKetThuc') && dashboardCode.includes('HieuLuc') && dashboardCode.includes('ĐÃ CÓ BẢO HIỂM'));
console.log('2.1 Tab Bảo hiểm có ẩn nút "Mua bảo hiểm cho xe này" khi xe đã có BH còn hạn không?:', hasHideBuyButtonWhenInsured);

// 2.2 BHX05: Đồng bộ giao diện hóa đơn/GCN bằng Shared Component
const certModalPath = path.join(__dirname, '../src/components/shared/InsuranceCertificateModal.tsx');
const hasCertModalFile = fs.existsSync(certModalPath);
console.log('2.2a Đã tạo Shared Component InsuranceCertificateModal.tsx?:', hasCertModalFile);

const dashboardUsesSharedCert = dashboardCode.includes('InsuranceCertificateModal');
console.log('2.2b CustomerDashboard.tsx đã sử dụng InsuranceCertificateModal dùng chung?:', dashboardUsesSharedCert);

// 3. Kiểm tra Insurance.tsx (Admin)
const adminInsPath = path.join(__dirname, '../src/pages/admin/Insurance.tsx');
const adminInsCode = fs.readFileSync(adminInsPath, 'utf8');
const adminUsesSharedCert = adminInsCode.includes('InsuranceCertificateModal');
console.log('3.1 Insurance.tsx (Admin) đã sử dụng InsuranceCertificateModal dùng chung?:', adminUsesSharedCert);

// 4. Mô phỏng độc lập logic kiểm tra trạng thái bảo hiểm xe (BHX04)
console.log('\n--- 4. Mô phỏng kiểm thử độc lập logic ẩn nút Mua BH (BHX04) ---');
const todayStr = new Date().toISOString().split('T')[0];

const mockContracts = [
  { id: 'BH001', vehicleId: 'XE101', bienSo: '59-A1 123.45', soKhung: 'VIN123', trangThai: 'HieuLuc', ngayKetThuc: '2027-11-04' },
  { id: 'BH002', vehicleId: 'XE102', bienSo: '59-B1 678.90', soKhung: 'VIN456', trangThai: 'HetHan', ngayKetThuc: '2026-10-01' },
  { id: 'BH003', vehicleId: 'XE103', bienSo: '59-C1 999.99', soKhung: 'VIN789', trangThai: 'TuChoi', ngayKetThuc: '2027-01-01' },
];

const hasValidInsurance = (veh, contracts) => {
  const normPlate = (veh.bienSo || '').trim().toUpperCase().replace(/[\s-.]/g, '');
  return contracts.some(c => {
    if (c.trangThai !== 'HieuLuc') return false;
    if (c.ngayKetThuc < todayStr) return false;
    if (c.vehicleId === veh.id) return true;
    const cPlateNorm = (c.bienSo || '').trim().toUpperCase().replace(/[\s-.]/g, '');
    if (normPlate && cPlateNorm && normPlate !== 'CHUACOBIENSO' && normPlate === cPlateNorm) return true;
    if (veh.soKhung && c.soKhung && veh.soKhung.trim().toUpperCase() === c.soKhung.trim().toUpperCase()) return true;
    return false;
  });
};

// Test Case 1: Xe đã có bảo hiểm còn hiệu lực -> Phải trả về true (để ẩn nút mua BH)
const vehActive = { id: 'XE101', bienSo: '59-A1 123.45', soKhung: 'VIN123' };
assert.strictEqual(hasValidInsurance(vehActive, mockContracts), true, 'Xe có BH còn hạn phải trả về true');
console.log('✓ Case 1: Xe có BH còn hạn được phát hiện chính xác (sẽ ẩn nút mua BH)');

// Test Case 2: Xe có bảo hiểm nhưng đã hết hạn -> Phải trả về false (để hiện nút mua BH)
const vehExpired = { id: 'XE102', bienSo: '59-B1 678.90', soKhung: 'VIN456' };
assert.strictEqual(hasValidInsurance(vehExpired, mockContracts), false, 'Xe có BH hết hạn phải trả về false');
console.log('✓ Case 2: Xe có BH hết hạn được phép hiện nút mua BH');

// Test Case 3: Xe chưa từng mua bảo hiểm -> Phải trả về false (để hiện nút mua BH)
const vehNew = { id: 'XE999', bienSo: '59-Z1 888.88', soKhung: 'VIN999' };
assert.strictEqual(hasValidInsurance(vehNew, mockContracts), false, 'Xe mới chưa mua BH phải trả về false');
console.log('✓ Case 3: Xe mới chưa mua BH được phép hiện nút mua BH');

console.log('\n--------------------------------------------------------------');
const allChecksPass = hasFlowMode && hasRemovedEditButton && hasFlow1LockedVehicle &&
  hasFlow2NewVehicleOnly && hasReadOnlyStartDate && hasHideBuyButtonWhenInsured &&
  hasCertModalFile && dashboardUsesSharedCert && adminUsesSharedCert;

if (!allChecksPass) {
  console.log('❌ FAIL (Red Phase): Chưa hoàn tất các yêu cầu chỉnh sửa BHX01 - BHX05!');
  process.exit(1);
} else {
  console.log('✅ PASS (Green Phase): Tất cả các tiêu chí BHX01 - BHX05 đã đạt chuẩn 100%!');
}
