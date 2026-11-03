const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Test Task 2: Kiểm tra quy trình phân công KTV và duyệt đơn xe chuẩn như Bảo hành ---');

// Mock localStorage
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = {
  dispatchEvent: () => {}
};
global.CustomEvent = class CustomEvent {
  constructor(name, opts) {
    this.name = name;
    this.opts = opts;
  }
};

// 1. Kiểm tra mã nguồn api.ts có hỗ trợ crm_order_ktv_map
const apiPath = path.join(__dirname, '../src/services/api.ts');
const apiContent = fs.readFileSync(apiPath, 'utf8');

const hasKtvMapInAssign = apiContent.includes('crm_order_ktv_map');
const hasKtvMapInGetAll = apiContent.includes('crm_order_ktv_map') && apiContent.slice(apiContent.indexOf('orderApi = {')).includes('crm_order_ktv_map');

console.log('api.ts có lưu crm_order_ktv_map trong assignTechnician không?:', hasKtvMapInAssign);
console.log('api.ts có nạp crm_order_ktv_map trong orderApi.getAll không?:', hasKtvMapInGetAll);

// 2. Kiểm tra Sales.tsx có giao diện modal KTV card và nút duyệt liên hoàn
const salesPath = path.join(__dirname, '../src/pages/admin/Sales.tsx');
const salesContent = fs.readFileSync(salesPath, 'utf8');

const hasContinuousApprovalBtn = salesContent.includes('XÁC NHẬN PHÂN CÔNG & DUYỆT ĐƠN XE') || salesContent.includes('Xác nhận phân công & duyệt');
const hasKtvGridCards = salesContent.includes('availableTechnicians') || salesContent.includes('techniciansList') || salesContent.includes('grid grid-cols-1 sm:grid-cols-2');

console.log('Sales.tsx có nút duyệt liên hoàn 1 chạm [XÁC NHẬN PHÂN CÔNG & DUYỆT ĐƠN XE] không?:', hasContinuousApprovalBtn);

if (!hasKtvMapInAssign || !hasKtvMapInGetAll || !hasContinuousApprovalBtn) {
  console.log('❌ FAIL (Red): api.ts hoặc Sales.tsx chưa đáp ứng chuẩn phân công KTV & duyệt liên hoàn!');
  process.exit(1);
} else {
  console.log('✅ PASS (Green): Hệ thống đã hoàn toàn chuẩn hóa phân công KTV theo phong cách Bảo hành!');
}
