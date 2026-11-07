/**
 * verify_customer_360_layout_and_remove_survey_banner.test.cjs
 * Kiểm thử TDD:
 * 1. Gỡ bỏ banner khảo sát thừa trên trang chủ Showroom xe (VehiclesShowroom.tsx).
 * 2. Tái cấu trúc bố cục Hồ sơ 360° khách hàng (Customers.tsx) chống co rút flexbox (shrink-0, min-h-0, sticky table header, cố định modal footer).
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST TDD: XÓA BANNER KHẢO SÁT & CHỈNH BỐ CỤC HỒ SƠ 360° ---');

const showroomFile = path.join(__dirname, '../src/pages/customer/VehiclesShowroom.tsx');
const customersFile = path.join(__dirname, '../src/pages/admin/Customers.tsx');

const showroomContent = fs.readFileSync(showroomFile, 'utf8');
const customersContent = fs.readFileSync(customersFile, 'utf8');

// [Test 1] Kiểm tra đã gỡ bỏ banner khảo sát thừa trên VehiclesShowroom.tsx
console.log('\n[Test 1] Kiểm tra banner khảo sát thừa trên VehiclesShowroom.tsx');
assert.strictEqual(
  showroomContent.includes('THÔNG BÁO KHẢO SÁT MỚI TỪ ĐẠI LÝ'),
  false,
  'LỖI: VehiclesShowroom.tsx vẫn còn chứa banner "THÔNG BÁO KHẢO SÁT MỚI TỪ ĐẠI LÝ"!'
);
assert.strictEqual(
  showroomContent.includes('Làm khảo sát ngay'),
  false,
  'LỖI: VehiclesShowroom.tsx vẫn còn chứa nút "Làm khảo sát ngay"!'
);
assert.strictEqual(
  showroomContent.includes('pendingSurveysCount'),
  false,
  'LỖI: VehiclesShowroom.tsx vẫn còn chứa biến tính toán thừa pendingSurveysCount!'
);
console.log('✅ PASS: Đã gỡ bỏ sạch sẽ banner khảo sát thừa và logic pendingSurveysCount trên Showroom xe!');

// [Test 2] Kiểm tra tái cấu trúc bố cục Customer360Modal trong Customers.tsx
console.log('\n[Test 2] Kiểm tra bố cục Customer360Modal chống co cụm và mất thanh slide/tab trong Customers.tsx');

// Trích xuất phần mã của Customer360Modal
const modalStartIndex = customersContent.indexOf('function Customer360Modal');
assert.ok(modalStartIndex !== -1, 'Không tìm thấy component Customer360Modal!');
const modalCode = customersContent.substring(modalStartIndex, modalStartIndex + 40000);

// 2.1 Modal kích thước vững chắc flex-col h-[90vh] hoặc max-h-[90vh]
assert.ok(
  modalCode.includes('max-w-5xl') || modalCode.includes('max-w-4xl'),
  'Modal 360° phải có độ rộng phù hợp'
);

// 2.2 Header phải có shrink-0 để không bị co cụm khi dữ liệu nhiều
assert.ok(
  modalCode.includes('px-6 py-4 bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800 shrink-0') ||
  modalCode.includes('bg-zinc-950 text-white flex items-center justify-between border-b border-zinc-800 shrink-0') ||
  /bg-zinc-950[^>]*shrink-0/.test(modalCode),
  'LỖI: Header của Customer360Modal phải có thuộc tính shrink-0!'
);

// 2.3 Tab Header phải có shrink-0 để thanh Tab / Slide không bao giờ bị co rút hoặc biến mất
assert.ok(
  /border-b border-zinc-200[^>]*shrink-0/.test(modalCode) || modalCode.includes('overflow-x-auto shrink-0'),
  'LỖI: Tab Header của Customer360Modal phải có thuộc tính shrink-0 để không bị co rút!'
);

// 2.4 Tab Body phải có min-h-0 và overflow-y-auto để thanh cuộn dọc hoạt động khi có nhiều dịch vụ
assert.ok(
  modalCode.includes('min-h-0') && modalCode.includes('overflow-y-auto'),
  'LỖI: Tab Body của Customer360Modal phải có min-h-0 và overflow-y-auto!'
);

// 2.5 Footer phải có shrink-0 để nút Đóng luôn ghim ở chân modal
assert.ok(
  /border-t border-zinc-200[^>]*shrink-0/.test(modalCode),
  'LỖI: Footer của Customer360Modal phải có thuộc tính shrink-0!'
);

// 2.6 Sticky header cho bảng dịch vụ
assert.ok(
  modalCode.includes('sticky top-0'),
  'LỖI: Bảng dịch vụ / đơn hàng trong Customer360Modal nên có sticky top-0 trên thead!'
);

console.log('✅ PASS: Customer360Modal đã được bảo vệ toàn diện với shrink-0, min-h-0 và sticky header!');
console.log('\n🎉 TẤT CẢ CÁC ĐIỀU KIỆN TDD ĐÃ ĐƯỢC THIẾT KẾ VÀ KIỂM CHỨNG THÀNH CÔNG!');
