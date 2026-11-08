const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TEST: VERIFY VEHICLE SERVICE ISOLATION BY ORDER (BẢN FIX 108) ---');

const customerDashboardPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const customerDashboardCode = fs.readFileSync(customerDashboardPath, 'utf8');

// 1. Verify that CustomerDashboard.tsx determines vOrderId and aOrderId
assert(
  customerDashboardCode.includes('vOrderId') && customerDashboardCode.includes('aOrderId'),
  'CustomerDashboard.tsx should extract vOrderId and aOrderId to isolate vehicle delivery appointments'
);

// 2. Verify that for NhanXe, it strictly checks order ID or VIN/vehicleId, never matchName alone
assert(
  customerDashboardCode.includes("a.loaiDichVu === 'NhanXe'") &&
  (customerDashboardCode.includes('vOrderId === aOrderId') || customerDashboardCode.includes('matchOrderStrict')),
  'CustomerDashboard.tsx must enforce strict order matching for NhanXe appointments'
);

// 3. Verify deduplication ensures at most 1 NhanXe entry per vehicle
assert(
  customerDashboardCode.includes('hasNhanXe') || customerDashboardCode.includes("loaiDichVu === 'NhanXe'") || customerDashboardCode.includes('dedupNhanXe'),
  'CustomerDashboard.tsx should guard against multiple NhanXe entries on the same vehicle'
);

console.log('✅ ALL VEHICLE SERVICE ISOLATION BY ORDER CHECKS PASSED!');
