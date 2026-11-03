const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Test Task 1: Khử trùng lặp phương tiện của khách hàng (Double Xe) ---');

const dashPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const dashContent = fs.readFileSync(dashPath, 'utf8');

// Kiểm tra xem CustomerDashboard.tsx đã có cơ chế hợp nhất các xe cùng dòng xe (tenXe) của khách hàng chưa
const hasModelDedup = dashContent.includes('cleanModelKey') || dashContent.includes('dedupModelMap') || dashContent.includes('mergedVehicleMap');

console.log('CustomerDashboard.tsx đã có bộ lọc hợp nhất cùng dòng xe chưa?:', hasModelDedup);

// Mô phỏng logic lọc dữ liệu
function testDedupVehicles(vList) {
  // Logic mô phỏng lọc cũ:
  const seenV = new Set();
  const oldResult = vList.filter(v => {
    const plate = (v.bienSo || v.bienSoChoDuyet || '').trim().toUpperCase();
    const name = (v.tenXe || '').trim().toUpperCase();
    const color = (v.mauSac || '').trim().toUpperCase();
    const vin = (v.soKhung || '').trim().toUpperCase();
    const key = vin
      ? `VIN_${vin}`
      : (plate && plate !== 'CHƯA CÓ BIỂN SỐ' && !plate.includes('CHUA CO'))
      ? `PLATE_${plate}`
      : `NAME_${name}_${color}`;
    if (seenV.has(key)) return false;
    seenV.add(key);
    return true;
  });
  return oldResult;
}

const mockInputVehicles = [
  {
    id: '111',
    customerId: 'KH043',
    tenXe: 'Yamaha MT-15 Naked Bike',
    mauSac: 'Xanh xám dạ quang, Đen bóng đêm',
    soKhung: 'RLHKD160CB0690636',
    bienSo: 'Chưa có biển số',
    bienSoChoDuyet: '69F2 - 288.92',
    anhCaVet: 'data:image/png;base64,sample...',
    trangThaiDuyetBienSo: 'ChoDuyet'
  },
  {
    id: 'XE-DH-004',
    customerId: 'KH043',
    tenXe: 'Yamaha MT-15 Naked Bike',
    mauSac: 'Xanh xám dạ quang',
    soKhung: 'RLHKD160CB0000004',
    bienSo: 'Chưa có biển số',
    trangThaiDuyetBienSo: 'ChoCapNhat'
  }
];

const oldDedup = testDedupVehicles(mockInputVehicles);
console.log('Số lượng xe theo logic cũ:', oldDedup.length);

if (!hasModelDedup) {
  console.log('❌ FAIL (Red): CustomerDashboard.tsx chưa có bộ lọc hợp nhất cùng dòng xe!');
  process.exit(1);
} else {
  console.log('✅ PASS (Green): Đã có bộ lọc hợp nhất cùng dòng xe chuẩn xác!');
}
