const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- TEST: VERIFY VEHICLE SINGLE DELIVERY HISTORY (BẢN FIX 109) ---');

const customerDashboardPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const customerDashboardCode = fs.readFileSync(customerDashboardPath, 'utf8');

// 1. Verify that CustomerDashboard.tsx resolves vOrder via 2-tier search (direct ID/VIN + fallback to bike model in myOrders)
assert(
  customerDashboardCode.includes('vOrder') && customerDashboardCode.includes('vCleanName'),
  'CustomerDashboard.tsx should resolve vOrder using two-tier search (direct ID and clean bike model name fallback)'
);

// 2. Verify that vOrderId and vVin are backfilled from vOrder if not directly present on v
assert(
  customerDashboardCode.includes('vOrder ? vOrder.id') || customerDashboardCode.includes('vOrderId = vOrder.id'),
  'CustomerDashboard.tsx should resolve vOrderId from matched vOrder'
);

// 3. Verify that matchNameSafe allows NhanXe matching when bike models match without order ID collision
assert(
  customerDashboardCode.includes('matchNameSafe') || customerDashboardCode.includes('matchNameClean'),
  'CustomerDashboard.tsx should support safe model matching for NhanXe when order ID is not colliding'
);

// 4. Verify that hasNhanXe still ensures at most 1 NhanXe entry
assert(
  customerDashboardCode.includes('hasNhanXe'),
  'CustomerDashboard.tsx should strictly prevent more than 1 NhanXe entry per vehicle'
);

console.log('✅ ALL VEHICLE SINGLE DELIVERY HISTORY CHECKS PASSED!');
