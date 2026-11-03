const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Test Task 2: Kiểm tra quy trình phê duyệt biển số xe ---');

const approvalPath = path.join(__dirname, '../src/pages/admin/LicensePlateApproval.tsx');
const approvalContent = fs.readFileSync(approvalPath, 'utf8');

// 1. Kiểm tra openApproveModal có tự động điền sẵn biển số đề xuất không
const hasAutoFillInOpenModal = approvalContent.includes('setOfficialPlateInput(vehicle.bienSoChoDuyet') || approvalContent.includes('setOfficialPlateInput(defaultPlate');
console.log('LicensePlateApproval.tsx có tự động điền sẵn biển số đề xuất khi mở modal không?:', hasAutoFillInOpenModal);

// 2. Kiểm tra có nút Duyệt nhanh biển số trên bảng không
const hasQuickApprove = approvalContent.includes('handleQuickApprove') || approvalContent.includes('Duyệt nhanh');
console.log('LicensePlateApproval.tsx có nút Duyệt nhanh biển số không?:', hasQuickApprove);

// 3. Kiểm tra api.ts có hỗ trợ tra cứu linh hoạt tên xe + khách hàng không
const apiPath = path.join(__dirname, '../src/services/api.ts');
const apiContent = fs.readFileSync(apiPath, 'utf8');
const hasFlexibleLookup = apiContent.includes('includes(vehicleName.toLowerCase().trim())') || apiContent.includes('targetMaXeSoHuu');

console.log('api.ts có hỗ trợ tra cứu linh hoạt khi duyệt biển số không?:', hasFlexibleLookup);

if (!hasAutoFillInOpenModal || !hasQuickApprove) {
  console.log('❌ FAIL (Red): Quy trình duyệt biển số chưa được tối ưu!');
  process.exit(1);
} else {
  console.log('✅ PASS (Green): Quy trình duyệt biển số đã hoàn toàn trơn tru và tự động!');
}
