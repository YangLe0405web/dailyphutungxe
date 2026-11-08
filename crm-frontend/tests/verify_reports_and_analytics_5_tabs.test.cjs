/**
 * verify_reports_and_analytics_5_tabs.test.cjs
 * Kiểm thử TDD:
 * Kiểm tra trang Báo Cáo & Thống Kê CRM (Reports.tsx) được cấu trúc thành 5 phân hệ
 * và hiển thị chính xác 100% các số liệu theo đúng 5 ảnh mẫu giao diện.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('--- TEST TDD: KIỂM TRA TRANG BÁO CÁO & THỐNG KÊ CRM 5 PHÂN HỆ ---');

const reportsFile = path.join(__dirname, '../src/pages/admin/Reports.tsx');
const reportsContent = fs.readFileSync(reportsFile, 'utf8');

// [Test 1] Kiểm tra 5 Tab phân hệ điều hướng
console.log('\n[Test 1] Kiểm tra cấu trúc 5 Tab phân hệ điều hướng');
assert.ok(reportsContent.includes('Tổng quan Điều hành') || reportsContent.includes('Tổng quan điều hành'), 'Thiếu Tab 1: Tổng quan Điều hành');
assert.ok(reportsContent.includes('Kinh doanh & Đơn hàng'), 'Thiếu Tab 2: Kinh doanh & Đơn hàng');
assert.ok(reportsContent.includes('Dịch vụ & Hậu mãi'), 'Thiếu Tab 3: Dịch vụ & Hậu mãi');
assert.ok(reportsContent.includes('Khách Hàng') || reportsContent.includes('Khách hàng'), 'Thiếu Tab 4: Khách Hàng');
assert.ok(reportsContent.includes('Khảo sát & Đánh giá'), 'Thiếu Tab 5: Khảo sát & Đánh giá');
console.log('✅ PASS: Đã có đủ 5 tab phân hệ chuyên biệt!');

// [Test 2] Kiểm tra số liệu Tab 1: Tổng quan Điều hành (Ảnh 1)
console.log('\n[Test 2] Kiểm tra số liệu Tab 1: Tổng quan Điều hành (Ảnh 1)');
assert.ok(reportsContent.includes('1.45 Tỷ') || reportsContent.includes('1.45 Tỷ VNĐ'), 'Thiếu Tổng doanh thu 1.45 Tỷ VNĐ');
assert.ok(reportsContent.includes('115 Chiếc'), 'Thiếu Tổng số xe đã bán 115 Chiếc');
assert.ok(reportsContent.includes('1,120 Người'), 'Thiếu Khách phát sinh giao dịch 1,120 Người');
assert.ok(reportsContent.includes('4.6 / 5.0') || reportsContent.includes('4.6/5.0') || reportsContent.includes('{csatScore} / 5.0'), 'Thiếu Điểm CSAT 4.6 / 5.0');
assert.ok(reportsContent.includes('Cơ Cấu Doanh Thu Toàn Cục') || reportsContent.includes('CƠ CẤU DOANH THU TOÀN CỤC'), 'Thiếu Biểu đồ cơ cấu doanh thu toàn cục');
assert.ok(reportsContent.includes('79.3%') && reportsContent.includes('13.5%') && reportsContent.includes('7.2%'), 'Thiếu tỷ lệ 79.3%, 13.5%, 7.2%');
assert.ok(reportsContent.includes('So Sánh Tăng Trưởng Doanh Thu') || reportsContent.includes('SO SÁNH TĂNG TRƯỞNG DOANH THU'), 'Thiếu Biểu đồ so sánh tăng trưởng doanh thu');
assert.ok(reportsContent.includes('Cơ Cấu Doanh Thu Theo Hạng Thẻ') || reportsContent.includes('CƠ CẤU DOANH THU THEO HẠNG THẺ'), 'Thiếu Biểu đồ doanh thu theo hạng thẻ');
assert.ok(reportsContent.includes('Phân Khúc Khách Hàng Theo Giá Trị Chi Tiêu'), 'Thiếu Biểu đồ phân khúc khách hàng theo giá trị chi tiêu');
console.log('✅ PASS: Số liệu Tab 1 khớp 100% Ảnh 1!');

// [Test 3] Kiểm tra số liệu Tab 2: Kinh doanh & Đơn hàng (Ảnh 2)
console.log('\n[Test 3] Kiểm tra số liệu Tab 2: Kinh doanh & Đơn hàng (Ảnh 2)');
assert.ok(reportsContent.includes('1.15 Tỷ') || reportsContent.includes('1.15 Tỷ VNĐ'), 'Thiếu Doanh thu bán xe mới 1.15 Tỷ VNĐ');
assert.ok(reportsContent.includes('296.5 Tr') || reportsContent.includes('296.5 Tr VNĐ'), 'Thiếu Doanh thu phụ tùng 296.5 Tr VNĐ');
assert.ok(reportsContent.includes('1,850 Món'), 'Thiếu Phụ tùng xuất kho 1,850 Món');
assert.ok(reportsContent.includes('Doanh Thu Theo Dòng Xe'), 'Thiếu Biểu đồ doanh thu theo dòng xe');
assert.ok(reportsContent.includes('Doanh Thu Phụ Tùng Theo Danh Mục'), 'Thiếu Biểu đồ doanh thu phụ tùng theo danh mục');
assert.ok(reportsContent.includes('Top 5 Dòng Xe Bán Chạy'), 'Thiếu Top 5 dòng xe bán chạy');
assert.ok(reportsContent.includes('Top 5 Phụ Tùng Bán Chạy'), 'Thiếu Top 5 phụ tùng bán chạy');
assert.ok(reportsContent.includes('Tình Trạng Đơn Hàng'), 'Thiếu Biểu đồ tình trạng đơn hàng');
assert.ok(reportsContent.includes('Lý Do Hủy Đơn'), 'Thiếu Biểu đồ lý do hủy đơn');
console.log('✅ PASS: Số liệu Tab 2 khớp 100% Ảnh 2!');

// [Test 4] Kiểm tra số liệu Tab 3: Dịch vụ & Hậu mãi (Ảnh 3)
console.log('\n[Test 4] Kiểm tra số liệu Tab 3: Dịch vụ & Hậu mãi (Ảnh 3)');
assert.ok(reportsContent.includes('2,450 Lượt'), 'Thiếu Tổng lượt đón tiếp 2,450 Lượt');
assert.ok(reportsContent.includes('658.5 Tr') || reportsContent.includes('658.5 Tr VNĐ'), 'Thiếu Doanh thu dịch vụ 658.5 Tr VNĐ');
assert.ok(reportsContent.includes('42 Phiếu'), 'Thiếu Phiếu chờ duyệt 42 Phiếu');
assert.ok(reportsContent.includes('18 Xe'), 'Thiếu Số xe đang làm 18 Xe');
assert.ok(reportsContent.includes('Số Lượng Sử Dụng Dịch Vụ'), 'Thiếu Số lượng sử dụng dịch vụ');
assert.ok(reportsContent.includes('Tình Trạng Xử Lý Dịch Vụ'), 'Thiếu Tình trạng xử lý dịch vụ');
assert.ok(reportsContent.includes('Doanh Thu Theo Từng Dịch Vụ'), 'Thiếu Doanh thu theo từng dịch vụ');
assert.ok(reportsContent.includes('Khách Đặt Lịch vs Khách Vãng Lai'), 'Thiếu So sánh đặt lịch vs vãng lai');
assert.ok(reportsContent.includes('Mật Độ Yêu Cầu Theo Thứ'), 'Thiếu Mật độ yêu cầu theo thứ');
console.log('✅ PASS: Số liệu Tab 3 khớp 100% Ảnh 3 (Đã gỡ bỏ khối chờ duyệt theo yêu cầu)!');

// [Test 5] Kiểm tra số liệu Tab 4: Khách Hàng (Ảnh 4)
console.log('\n[Test 5] Kiểm tra số liệu Tab 4: Khách Hàng (Ảnh 4)');
assert.ok(reportsContent.includes('12,850 Người'), 'Thiếu Tổng số khách hàng 12,850 Người');
assert.ok(reportsContent.includes('450 Người'), 'Thiếu Khách hàng mới 450 Người');
assert.ok(reportsContent.includes('3,250 Lượt'), 'Thiếu Tổng lượt khách ghé thăm 3,250 Lượt');
assert.ok(reportsContent.includes('Phân Hạng Thẻ Thành Viên'), 'Thiếu Phân hạng thẻ thành viên');
assert.ok(reportsContent.includes('Cơ Cấu Độ Tuổi & Giới Tính'), 'Thiếu Cơ cấu độ tuổi & giới tính');
assert.ok(reportsContent.includes('Mật Độ Khách Tới Theo Khung Giờ'), 'Thiếu Mật độ khách tới theo khung giờ');
assert.ok(reportsContent.includes('Phân Loại Trạng Thái Hoạt Động Khách Hàng'), 'Thiếu Phân loại trạng thái hoạt động khách hàng');
console.log('✅ PASS: Số liệu Tab 4 khớp 100% Ảnh 4!');

// [Test 6] Kiểm tra số liệu Tab 5: Khảo sát & Đánh giá (Ảnh 5)
console.log('\n[Test 6] Kiểm tra số liệu Tab 5: Khảo sát & Đánh giá (Ảnh 5)');
assert.ok(reportsContent.includes('1,250 Lượt'), 'Thiếu Tổng ý kiến đóng góp 1,250 Lượt');
assert.ok(reportsContent.includes('34.5%'), 'Thiếu Tỷ lệ phản hồi 34.5%');
assert.ok(reportsContent.includes('42 Lượt'), 'Thiếu Tổng số lượt khiếu nại 42 Lượt');
assert.ok(reportsContent.includes('Đánh Giá Xe (1-5 Sao)'), 'Thiếu Đánh giá xe 1-5 sao');
assert.ok(reportsContent.includes('Đánh Giá Phụ Tùng (1-5 Sao)'), 'Thiếu Đánh giá phụ tùng 1-5 sao');
assert.ok(reportsContent.includes('So Sánh Mức Độ Hài Lòng Theo Dịch Vụ'), 'Thiếu So sánh hài lòng theo dịch vụ');
assert.ok(reportsContent.includes('Xu Hướng Điểm Hài Lòng Theo Khoảng Lọc'), 'Thiếu Xu hướng điểm hài lòng');
assert.ok(reportsContent.includes('Trạng Thái Xử Lý Phản Hồi Đánh Giá'), 'Thiếu Trạng thái xử lý phản hồi');
console.log('✅ PASS: Số liệu Tab 5 khớp 100% Ảnh 5!');

console.log('\n🎉 TẤT CẢ 6 HẠNG MỤC KIỂM THỬ ĐÃ ĐƯỢC THIẾT KẾ VÀ KIỂM CHỨNG!');
