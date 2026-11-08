const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST TDD: KIỂM TRA ĐỒNG BỘ GIAO DIỆN PHẢN HỒI & ĐÁNH GIÁ (LIGHT SLATE CRM THEME) ---');

const feedbackFile = path.join(__dirname, '../src/pages/admin/Feedback.tsx');
assert.ok(fs.existsSync(feedbackFile), 'Không tìm thấy file Feedback.tsx');
const content = fs.readFileSync(feedbackFile, 'utf8');

// [Test 1] Kiểm tra tiêu đề trang đã chuyển sang màu chữ đậm sắc nét (không dùng text-white trên nền sáng)
console.log('\n[Test 1] Kiểm tra tiêu đề trang không bị chìm màu / tàng hình');
assert.ok(
  content.includes('text-zinc-950') || content.includes('text-zinc-900'),
  'Tiêu đề trang phải dùng chữ đậm (text-zinc-950 / text-zinc-900) để hiển thị sắc nét trên nền sáng!'
);
assert.ok(
  !content.includes('tracking-tight text-white uppercase flex items-center gap-2.5'),
  'Vẫn còn class text-white trên tiêu đề trang chính!'
);
console.log('✅ PASS: Tiêu đề trang đã dùng màu chữ tương phản cao, sắc nét!');

// [Test 2] Kiểm tra đã thay thế các khối thẻ phản hồi sang nền trắng viền sáng chuẩn Admin
console.log('\n[Test 2] Kiểm tra thẻ phản hồi chuyển sang bg-white border-zinc-200');
assert.ok(
  content.includes("bg-white border-zinc-200") || content.includes("bg-white border"),
  'Thẻ phản hồi phải dùng nền trắng bg-white đồng bộ với các trang Admin khác!'
);
console.log('✅ PASS: Thẻ phản hồi đã dùng nền trắng chuẩn Admin!');

// [Test 3] Kiểm tra thanh tìm kiếm và dropdown dùng nền sáng bg-white
console.log('\n[Test 3] Kiểm tra ô tìm kiếm và dropdown bộ lọc');
assert.ok(
  content.includes("bg-white text-zinc-900 placeholder-zinc-400") || content.includes("bg-white border border-zinc-200"),
  'Ô tìm kiếm phải có nền sáng bg-white và chữ đen rõ ràng!'
);
console.log('✅ PASS: Ô tìm kiếm và dropdown đã dùng nền sáng chuẩn!');

// [Test 4] Kiểm tra hộp sản phẩm và bình luận khách hàng dùng nền xám sáng nhạt tinh tế
console.log('\n[Test 4] Kiểm tra hộp thông tin sản phẩm và bình luận khách hàng');
assert.ok(
  content.includes("bg-zinc-50") || content.includes("bg-zinc-100"),
  'Hộp sản phẩm và bình luận khách hàng phải dùng nền sáng nhạt (bg-zinc-50 / bg-zinc-100)!'
);
console.log('✅ PASS: Hộp sản phẩm và bình luận đã chuyển sang tông màu sáng hài hòa!');

console.log('\n🎉 TẤT CẢ 4 HẠNG MỤC KIỂM THỬ GIAO DIỆN ĐÃ ĐƯỢC THIẾT KẾ VÀ KIỂM CHỨNG!');
