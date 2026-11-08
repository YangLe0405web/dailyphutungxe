const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TEST: VERIFY VEHICLE SERVICE HISTORY PRICING (BẢN FIX 107) ---');

// 1. Verify that CustomerDashboard.tsx no longer has the hardcoded 2500000 fallback
const customerDashboardPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const customerDashboardCode = fs.readFileSync(customerDashboardPath, 'utf8');

assert(
  !customerDashboardCode.includes('(a.loaiDichVu === \'BaoHanh\' ? 0 : 2500000)'),
  'CustomerDashboard.tsx should NOT have hardcoded (a.loaiDichVu === \'BaoHanh\' ? 0 : 2500000)'
);

// 2. Verify logic for NhanXe and LaiThu is 0 VND
assert(
  customerDashboardCode.includes("a.loaiDichVu === 'NhanXe'") && customerDashboardCode.includes("a.loaiDichVu === 'LaiThu'"),
  'CustomerDashboard.tsx should specifically handle NhanXe and LaiThu as free services (0 VND)'
);

// 3. Verify logic extracts package price from BaoDuong note or matched order
assert(
  customerDashboardCode.includes("matchedOrder") || customerDashboardCode.includes("chiPhiThucTe"),
  'CustomerDashboard.tsx should support matchedOrder and chiPhiThucTe for vehicle service cost'
);

// 4. Verify Appointment interface in mockData.ts has chiPhiThucTe and maHoaDon
const mockDataPath = path.join(__dirname, '../src/data/mockData.ts');
const mockDataCode = fs.readFileSync(mockDataPath, 'utf8');

assert(
  mockDataCode.includes('chiPhiThucTe?: number;') && mockDataCode.includes('maHoaDon?: string;'),
  'mockData.ts Appointment interface should include chiPhiThucTe?: number and maHoaDon?: string'
);

// 5. Verify appointmentApi.getAll in api.ts preserves chiPhiThucTe and maHoaDon
const apiPath = path.join(__dirname, '../src/services/api.ts');
const apiCode = fs.readFileSync(apiPath, 'utf8');

assert(
  apiCode.includes('chiPhiThucTe: cachedMatch?.chiPhiThucTe') || apiCode.includes('chiPhiThucTe:'),
  'api.ts should map/preserve chiPhiThucTe in appointmentApi.getAll'
);

console.log('✅ ALL VEHICLE SERVICE HISTORY PRICING CHECKS PASSED!');
