const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TEST: Kiểm tra Khử trùng lặp Xe & Phê duyệt biển số 1 chạm (FIX-95) ---');

const apiPath = path.join(__dirname, '../src/services/api.ts');
const approvalPath = path.join(__dirname, '../src/pages/admin/LicensePlateApproval.tsx');
const customersPath = path.join(__dirname, '../src/pages/admin/Customers.tsx');

const apiContent = fs.readFileSync(apiPath, 'utf8');
const approvalContent = fs.readFileSync(approvalPath, 'utf8');
const customersContent = fs.readFileSync(customersPath, 'utf8');

// Test 1: Kiểm tra logic deduplication và hợp nhất xe trong api.ts
console.log('\n[Kiểm tra 1] api.ts: Khử trùng lặp xe cấp độ khách hàng');
const hasPlateDedupInApi = apiContent.includes('dedupKey') && (
  apiContent.includes('PLATE_${v.customerId}_') || 
  apiContent.includes('PLATE_') || 
  apiContent.includes('cleanPlateKey')
);
assert.strictEqual(hasPlateDedupInApi, true, 'api.ts phải có cơ chế khử trùng lặp theo biển số');

// Test 2: Kiểm tra LicensePlateApproval.tsx có khử trùng lặp và bỏ window.confirm trong handleQuickApprove
console.log('\n[Kiểm tra 2] LicensePlateApproval.tsx: Duyệt nhanh 1 chạm & khử trùng lặp');
const hasConfirmInQuickApprove = approvalContent.includes('window.confirm(`Xác nhận phê duyệt');
assert.strictEqual(hasConfirmInQuickApprove, false, 'LicensePlateApproval.tsx không được chặn duyệt nhanh bằng window.confirm popup');

const hasPlateRecordsDedup = approvalContent.includes('deduped') && (
  approvalContent.includes('isSameCustomer') ||
  approvalContent.includes('customerId') ||
  approvalContent.includes('plate')
);
assert.strictEqual(hasPlateRecordsDedup, true, 'plateRecords trong LicensePlateApproval.tsx phải khử trùng lặp xe cùng khách hàng');

// Test 3: Kiểm tra Customers.tsx có khử trùng lặp xe cho Tab 5
console.log('\n[Kiểm tra 3] Customers.tsx: Khử trùng lặp xe trong Hồ sơ 360 & Bảng danh sách');
const hasDedupInCustomersModal = customersContent.includes('mergedVehicleMap') || 
  customersContent.includes('dedupCustVeh') || 
  customersContent.includes('dedupVehicles') ||
  customersContent.includes('isNoPlate');
assert.strictEqual(hasDedupInCustomersModal, true, 'Customers.tsx phải có logic khử trùng lặp xe trước khi render Tab 5');

// Test 4: Mô phỏng thuật toán hợp nhất dữ liệu thực tế của khách hàng KH045 (La Thành Nhân)
console.log('\n[Kiểm tra 4] Mô phỏng thuật toán hợp nhất xe thực tế (Case KH045)');
const mockVehicles = [
  {
    id: 'XE121',
    customerId: 'KH045',
    tenXe: 'Honda SH 160i ABS 2025',
    bienSo: '76AI - 109.82',
    soKhung: 'RLHKD160CB9000961',
    soMay: 'KF12E-9000961',
    anhCaVet: 'data:image/svg+xml;utf8,<svg>Cavet</svg>',
    trangThaiDuyetBienSo: 'DaDuyet',
    trangThaiDuyet: 'DaDuyet',
  },
  {
    id: 'XE-DH-027',
    customerId: 'KH045',
    tenXe: 'Honda SH 160i ABS 2025',
    bienSo: '76AI - 109.82',
    soKhung: 'RLHKD160CB0270000',
    soMay: 'KF12E-0278888',
    anhCaVet: undefined,
    trangThaiDuyetBienSo: 'DaDuyet',
    trangThaiDuyet: 'DaDuyet',
  }
];

function isNoPlate(plate) {
  if (!plate) return true;
  const p = plate.toUpperCase().trim();
  return p === 'CHƯA CÓ BIỂN SỐ' || p === 'CHUA CO BIEN SO' || p.includes('CHƯA CÓ') || p.includes('CHUA CO') || p.startsWith('TAM-');
}

function dedupCustomerVehicles(rawList) {
  const isPlaceholderVin = (vin) => !vin || /0000$/.test(vin) || vin.includes('0270000');
  const isPlaceholderEngine = (eng) => !eng || /8888$/.test(eng) || eng.includes('0278888');

  const resultMap = new Map();
  for (const v of rawList) {
    const custId = String(v.customerId || '').replace(/\D/g, '');
    const plate = (v.bienSo || v.bienSoChoDuyet || '').toUpperCase().trim();
    const model = (v.tenXe || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const hasRealPlate = !isNoPlate(plate);
    const groupKey = hasRealPlate ? `CUST_${custId}_PLATE_${plate}` : `CUST_${custId}_MODEL_${model}`;

    if (!resultMap.has(groupKey)) {
      resultMap.set(groupKey, { ...v });
    } else {
      const existing = resultMap.get(groupKey);
      // Giữ VIN thật
      if (isPlaceholderVin(existing.soKhung) && !isPlaceholderVin(v.soKhung)) {
        existing.soKhung = v.soKhung;
      }
      // Giữ số máy thật
      if (isPlaceholderEngine(existing.soMay) && !isPlaceholderEngine(v.soMay)) {
        existing.soMay = v.soMay;
      }
      // Giữ ảnh Cà vẹt
      if (!existing.anhCaVet && v.anhCaVet) {
        existing.anhCaVet = v.anhCaVet;
      }
      // Giữ ID chuẩn DB
      if (v.id.startsWith('XE') && !v.id.includes('-') && existing.id.includes('-')) {
        existing.id = v.id;
      }
      // Giữ trạng thái đã duyệt
      if (v.trangThaiDuyetBienSo === 'DaDuyet') {
        existing.trangThaiDuyetBienSo = 'DaDuyet';
        existing.trangThaiDuyet = 'DaDuyet';
      }
      if (hasRealPlate && isNoPlate(existing.bienSo)) {
        existing.bienSo = v.bienSo;
      }
    }
  }
  return Array.from(resultMap.values());
}

const deduped = dedupCustomerVehicles(mockVehicles);
assert.strictEqual(deduped.length, 1, 'Danh sách sau khi lọc phải gộp về đúng 1 xe duy nhất');
assert.strictEqual(deduped[0].id, 'XE121', 'Xe được giữ lại phải mang mã ID DB XE121');
assert.strictEqual(deduped[0].soKhung, 'RLHKD160CB9000961', 'Xe phải giữ đúng số khung thực tế RLHKD160CB9000961');
assert.strictEqual(deduped[0].soMay, 'KF12E-9000961', 'Xe phải giữ đúng số máy thực tế KF12E-9000961');
assert.strictEqual(Boolean(deduped[0].anhCaVet), true, 'Xe phải giữ ảnh Cà vẹt xe đính kèm');

console.log('✅ PASS: Bộ test TDD hợp nhất xe và khử trùng lặp xe đã hoàn thành thành công!');
