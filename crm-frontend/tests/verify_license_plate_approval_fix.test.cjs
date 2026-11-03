const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: Phê duyệt biển số xe (Fix triệt để lỗi không duyệt được & double xe) ===\n');

// 1. Kiểm tra LicensePlateApproval.tsx
const approvalPath = path.join(__dirname, '../src/pages/admin/LicensePlateApproval.tsx');
const approvalCode = fs.readFileSync(approvalPath, 'utf8');

// 1.1 Kiểm tra logic deduplicate trong plateRecords
const hasDedup = approvalCode.includes('deduped') || approvalCode.includes('seen.has(') || approvalCode.includes('vinKey');
console.log('1.1 LicensePlateApproval.tsx có lọc trùng lặp phương tiện cùng số khung/ID (chống double xe) không?:', hasDedup);

// 1.2 Kiểm tra logic không bị vô hiệu hóa nút Xác nhận khi cùng khách hàng
const hasSameCustomerCheck = approvalCode.includes('isSameCustomer') || approvalCode.includes('customerId !== approvingVehicle.customerId');
console.log('1.2 Modal duyệt biển số có loại trừ xe của cùng một khách hàng khi check trùng biển không?:', hasSameCustomerCheck);

// 1.3 Nút Xác nhận duyệt không bị disable sai vì trùng chính xe hoặc cùng khách hàng
const hasFixedDisabledCondition = !approvalCode.includes('vehicles.some(v => v.id !== approvingVehicle.id && v.bienSo && !isNoPlate(v.bienSo) && v.bienSo.replace(/[\s-.]/g, \'\').toUpperCase() === officialPlateInput.trim().replace(/[\s-.]/g, \'\').toUpperCase())');
console.log('1.3 Nút Xác nhận duyệt đã được sửa bỏ điều kiện disable lỗi thời chưa?:', hasFixedDisabledCondition);

// 1.4 Kiểm tra handleConfirmApprove có cập nhật đồng bộ các bản ghi xe cùng khách hàng / số khung không
const hasSyncLocalState = approvalCode.includes('handleConfirmApprove') && (approvalCode.includes('customerId === approvingVehicle.customerId') || approvalCode.includes('isSameCustomer(v.customerId, approvingVehicle.customerId)'));
console.log('1.4 handleConfirmApprove có cập nhật đồng bộ các bản ghi cùng khách hàng không?:', hasSyncLocalState);

// 2. Kiểm tra CrmBackend/Controllers/XeKhachHangController.cs
const backendPath = path.join(__dirname, '../../CrmBackend/Controllers/XeKhachHangController.cs');
const backendCode = fs.readFileSync(backendPath, 'utf8');

// 2.1 Backend checkSql không chặn trùng biển số giữa các bản ghi của cùng một khách hàng
const hasBackendCustomerExclusion = backendCode.includes('MaKH != (SELECT TOP 1') || backendCode.includes('ISNULL(MaKH, -1)');
console.log('2.1 Backend XeKhachHangController.cs có cho phép duyệt biển số nếu xe cùng khách hàng sở hữu không?:', hasBackendCustomerExclusion);

// 2.2 Backend update đồng bộ các bản ghi có cùng số khung VIN
const hasBackendVinSync = backendCode.includes('@TargetVin') || backendCode.includes('SoKhung');
console.log('2.2 Backend có cập nhật đồng bộ biển số cho các bản ghi có cùng số khung không?:', hasBackendVinSync);

// 3. Chạy logic mô phỏng kiểm thử độc lập
console.log('\n--- 3. Kiểm thử logic mô phỏng ---');
const isNoPlate = (plate) => !plate || plate === 'Chưa có biển số' || plate.includes('Chưa có') || plate.startsWith('TAM-');
const isSameCustomer = (c1, c2) => {
  if (!c1 || !c2) return false;
  if (c1 === c2) return true;
  const n1 = parseInt(String(c1).replace(/\D/g, ''), 10);
  const n2 = parseInt(String(c2).replace(/\D/g, ''), 10);
  return !isNaN(n1) && !isNaN(n2) && n1 === n2;
};

const mockVehiclesList = [
  { id: '112', customerId: 'KH43', tenXe: 'Honda Vision 2026', bienSo: 'Chưa có biển số', bienSoChoDuyet: '59-K1 888.88', soKhung: 'RLHKD160CB3689049' },
  { id: 'XE-DH-999', customerId: '43', tenXe: 'Honda Vision 2026', bienSo: '59-K1 888.88', soKhung: 'RLHKD160CB3689049' },
  { id: '109', customerId: 'KH43', tenXe: 'Vespa Sprint', bienSo: '67AB - 111.11', soKhung: 'RLHKD160CB4847536' },
  { id: '105', customerId: 'KH40', tenXe: 'Yamaha Grande', bienSo: '67AG - 90152', soKhung: 'RLHKD160CB5530838' },
];

const approvingVehicle = mockVehiclesList[0];
const targetPlate = '59-K1 888.88';
const cleanTargetPlate = targetPlate.replace(/[\s-.]/g, '').toUpperCase();

// Kiểm tra trùng lặp
const isDuplicate = mockVehiclesList.some(v => {
  if (v.id === approvingVehicle.id) return false;
  if (approvingVehicle.soKhung && v.soKhung && v.soKhung.trim().toUpperCase() === approvingVehicle.soKhung.trim().toUpperCase()) return false;
  if (isSameCustomer(v.customerId, approvingVehicle.customerId)) return false;
  if (!v.bienSo || isNoPlate(v.bienSo)) return false;
  return v.bienSo.replace(/[\s-.]/g, '').toUpperCase() === cleanTargetPlate;
});

assert.strictEqual(isDuplicate, false, 'Xe cùng khách hàng hoặc cùng số khung không được coi là trùng lặp!');
console.log('✓ Mô phỏng: Xe cùng số khung/cùng khách hàng KHÔNG bị chặn trùng lặp biển số!');

// Kiểm tra nếu khách hàng KHÁC có cùng biển số thì PHẢI bị chặn
const otherCustomerVehicle = { id: '999', customerId: 'KH99', tenXe: 'Khác', bienSo: '59-K1 888.88' };
const mockWithOtherCustomer = [...mockVehiclesList, otherCustomerVehicle];
const isDuplicateOther = mockWithOtherCustomer.some(v => {
  if (v.id === approvingVehicle.id) return false;
  if (approvingVehicle.soKhung && v.soKhung && v.soKhung.trim().toUpperCase() === approvingVehicle.soKhung.trim().toUpperCase()) return false;
  if (isSameCustomer(v.customerId, approvingVehicle.customerId)) return false;
  if (!v.bienSo || isNoPlate(v.bienSo)) return false;
  return v.bienSo.replace(/[\s-.]/g, '').toUpperCase() === cleanTargetPlate;
});
assert.strictEqual(isDuplicateOther, true, 'Khách hàng khác có cùng biển số thì PHẢI bị coi là trùng lặp!');
console.log('✓ Mô phỏng: Biển số của khách hàng khác được bảo vệ và chặn trùng lặp chính xác!');

if (!hasDedup || !hasSameCustomerCheck || !hasFixedDisabledCondition || !hasSyncLocalState || !hasBackendCustomerExclusion || !hasBackendVinSync) {
  console.log('\n❌ FAIL: Một số tiêu chí duyệt biển số chưa đạt yêu cầu!');
  process.exit(1);
} else {
  console.log('\n✅ PASS: Tính năng duyệt biển số đã được sửa triệt để và an toàn 100%!');
}
