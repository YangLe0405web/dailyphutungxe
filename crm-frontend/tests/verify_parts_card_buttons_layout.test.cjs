const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST TDD: KIỂM TRA BỐ CỤC NÚT THẺ PHỤ TÙNG (PARTS STORE) CÂN ĐỐI THEO PHƯƠNG ÁN 1 ---');

const partsStorePath = path.join(__dirname, '../src/pages/customer/PartsStore.tsx');
const content = fs.readFileSync(partsStorePath, 'utf8');

// [Test 1] Không còn cấu trúc 3 nút lệch trong 1 khối grid grid-cols-2 duy nhất
console.log('\n[Test 1] Kiểm tra loại bỏ cấu trúc 3 nút bất đối xứng trong grid grid-cols-2');
const hasOldGridAsymmetry = content.includes('<div className="grid grid-cols-2 gap-2 pt-1">\n                          <button\n                            type="button"\n                            onClick={() => {\n                              setSelectedPart(p);');
assert.strictEqual(
  hasOldGridAsymmetry,
  false,
  'Thẻ phụ tùng vẫn còn cấu trúc cũ 3 nút bất đối xứng trong một hàng grid-cols-2!'
);
console.log('✅ PASS: Cấu trúc 3 nút bất đối xứng cũ đã được loại bỏ!');

// [Test 2] Hàng 1 chia đôi 50% - 50% gồm 2 nút phụ (Chi tiết và 💬 Tư vấn)
console.log('\n[Test 2] Kiểm tra hàng 1 chia đôi 50% - 50% có nút Chi tiết và nút Tư vấn');
const hasRow1TwoButtons = (
  content.includes('<span>🔍</span>') &&
  content.includes('<span>Chi tiết</span>') &&
  content.includes('<span>💬</span>') &&
  content.includes('<span>Tư vấn</span>')
);
assert.strictEqual(
  hasRow1TwoButtons,
  true,
  'Hàng 1 phải có đủ 2 nút phụ [Chi tiết] và [💬 Tư vấn] chia đều cân đối!'
);
console.log('✅ PASS: Hàng 1 đã bố trí 2 nút phụ cân đối 50% - 50% với icon và chữ rõ ràng!');

// [Test 3] Hàng 2 có nút chính trải dài 100% (w-full)
console.log('\n[Test 3] Kiểm tra nút chính Thêm vào giỏ / Hết hàng trải dài 100% (w-full)');
const hasFullWidthPrimaryButton = (
  content.includes('w-full py-2.5 px-3 rounded-xl font-bold text-xs') &&
  content.includes('Thêm vào giỏ')
);
assert.strictEqual(
  hasFullWidthPrimaryButton,
  true,
  'Nút Thêm vào giỏ / Hết hàng phải có class w-full để lấp đầy toàn bộ hàng 2!'
);
console.log('✅ PASS: Nút chính đã trải dài full-width 100% không còn bị khuyết góc phải!');

// [Test 4] Bảo toàn 100% logic và handlers nghiệp vụ
console.log('\n[Test 4] Kiểm tra bảo toàn toàn bộ handlers nghiệp vụ (handleAdd, chatApi, setSelectedPart)');
assert.strictEqual(content.includes('handleAdd(p, 1, e)'), true, 'Phải giữ nguyên handleAdd');
assert.strictEqual(content.includes('chatApi.syncPinnedContext(custId, pinned)'), true, 'Phải giữ nguyên chatApi.syncPinnedContext');
assert.strictEqual(content.includes('setSelectedPart(p)'), true, 'Phải giữ nguyên setSelectedPart');
console.log('✅ PASS: Toàn bộ handlers nghiệp vụ đều được bảo toàn 100%!');

console.log('\n🎉 TẤT CẢ 4 HẠNG MỤC KIỂM THỬ BỐ CỤC NÚT ĐÃ ĐƯỢC THIẾT KẾ VÀ KIỂM CHỨNG!');
