const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('=== TEST SUITE: Kiểm tra 4 Lỗi QA (Giá phụ tùng, Avatar, Chống XSS, Validate Ngày nhận xe) ===\n');

const partsStorePath = path.join(__dirname, '../src/pages/customer/PartsStore.tsx');
const cartContextPath = path.join(__dirname, '../src/contexts/CartContext.tsx');
const backendKhachHangPath = path.join(__dirname, '../../CrmBackend/Controllers/KhachHangController.cs');
const apiPath = path.join(__dirname, '../src/services/api.ts');
const dashboardPath = path.join(__dirname, '../src/pages/customer/CustomerDashboard.tsx');
const securityPath = path.join(__dirname, '../src/utils/security.ts');

const partsStoreCode = fs.readFileSync(partsStorePath, 'utf8');
const cartContextCode = fs.readFileSync(cartContextPath, 'utf8');
const backendKhachHangCode = fs.readFileSync(backendKhachHangPath, 'utf8');
const apiCode = fs.readFileSync(apiPath, 'utf8');
const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');
const securityExists = fs.existsSync(securityPath);
const securityCode = securityExists ? fs.readFileSync(securityPath, 'utf8') : '';

// ────────────────────────────────────────────────────────────
// 1. KIỂM TRA LỖI 1: Đồng bộ Giá gốc & Giá khuyến mãi phụ tùng
// ────────────────────────────────────────────────────────────
console.log('--- 1. Kiểm tra Lỗi 1: Đồng bộ Giá phụ tùng & Khuyến mãi ---');

// 1.1 PartsStore.tsx ưu tiên giá khuyến mãi riêng của sản phẩm cấu hình từ Admin (p.giaKhuyenMai) hơn chiến dịch chung
const preservesManualPromoPrice = partsStoreCode.includes('hasManualPromo') ||
                                  partsStoreCode.includes('p.giaKhuyenMai : (disc ? disc.giaKhuyenMai : null)') ||
                                  partsStoreCode.includes('p.giaKhuyenMai ?? null') || 
                                  partsStoreCode.includes('(p.giaKhuyenMai && p.giaKhuyenMai > 0 ? p.giaKhuyenMai : null)');
console.log('1.1 PartsStore.tsx bảo tồn giá khuyến mãi cấu hình từ Admin khi không có chiến dịch động?:', preservesManualPromoPrice);
assert.strictEqual(preservesManualPromoPrice, true, 'PartsStore.tsx phải ưu tiên p.giaKhuyenMai từ Admin');

// 1.2 PartsStore.tsx lắng nghe crm-data-refresh để reload rawParts
const reloadsRawPartsOnRefresh = partsStoreCode.includes('setRawParts(partApi.getAllSync()') || 
                                partsStoreCode.includes('loadParts()') ||
                                partsStoreCode.includes('partApi.getAllSync()');
console.log('1.2 PartsStore.tsx tự động load lại dữ liệu mới nhất từ partApi khi nhận crm-data-refresh?:', reloadsRawPartsOnRefresh);
assert.strictEqual(reloadsRawPartsOnRefresh, true, 'PartsStore.tsx phải reload dữ liệu phụ tùng khi nhận crm-data-refresh');

// ────────────────────────────────────────────────────────────
// 2. KIỂM TRA LỖI 2: Avatar khách hàng & Mất avatar sau Logout/Login
// ────────────────────────────────────────────────────────────
console.log('\n--- 2. Kiểm tra Lỗi 2: Avatar khách hàng & Đồng bộ Logout/Login ---');

// 2.1 Backend KhachHangController.cs: endpoint Login phải SELECT k.Avatar
const loginSelectsAvatar = backendKhachHangCode.includes('k.Avatar') && 
                           backendKhachHangCode.slice(backendKhachHangCode.indexOf('[HttpPost("login")]')).includes('k.Avatar');
console.log('2.1 KhachHangController.cs Login endpoint SELECT k.Avatar?:', loginSelectsAvatar);
assert.strictEqual(loginSelectsAvatar, true, 'KhachHangController.cs login query phải SELECT k.Avatar');

// 2.2 Backend KhachHangController.cs: endpoint Login phải trả về avatar trong customer object
const loginReturnsAvatar = backendKhachHangCode.slice(backendKhachHangCode.indexOf('[HttpPost("login")]')).includes('avatar = user.Avatar');
console.log('2.2 KhachHangController.cs Login endpoint trả về avatar = user.Avatar?:', loginReturnsAvatar);
assert.strictEqual(loginReturnsAvatar, true, 'KhachHangController.cs login phải trả về avatar = user.Avatar');

// 2.3 api.ts không dùng ảnh người thật làm avatar mặc định cho tài khoản mới
const hasWhitePlaceholderAvatar = apiCode.includes('default-avatar') || 
                                  apiCode.includes('svg') || 
                                  apiCode.includes("avatar: raw.avatar || raw.Avatar || ''") ||
                                  apiCode.includes("DEFAULT_WHITE_AVATAR");
console.log('2.3 api.ts hỗ trợ avatar mặc định màu trắng / placeholder trung tính?:', hasWhitePlaceholderAvatar);
assert.strictEqual(hasWhitePlaceholderAvatar, true, 'api.ts phải dùng avatar placeholder trắng/trung tính thay vì ép ảnh kh{id}.jpg');

// ────────────────────────────────────────────────────────────
// 3. KIỂM TRA LỖI 3: Chống XSS & Ký tự đặc biệt
// ────────────────────────────────────────────────────────────
console.log('\n--- 3. Kiểm tra Lỗi 3: Chống XSS & Ký tự đặc biệt ---');

console.log('3.1 File security.ts tồn tại?:', securityExists);
assert.strictEqual(securityExists, true, 'src/utils/security.ts phải tồn tại');

const hasXssProtection = securityCode.includes('containsXssOrSpecialChars') || 
                         securityCode.includes('validateSafeText') || 
                         securityCode.includes('sanitizeInput');
console.log('3.2 security.ts có hàm kiểm tra và khử ký tự nguy hiểm / script?:', hasXssProtection);
assert.strictEqual(hasXssProtection, true, 'security.ts phải có hàm kiểm tra / khử XSS và ký tự đặc biệt nguy hiểm');

// ────────────────────────────────────────────────────────────
// 4. KIỂM TRA LỖI 4: Validate Đổi ngày nhận xe
// ────────────────────────────────────────────────────────────
console.log('\n--- 4. Kiểm tra Lỗi 4: Validate Đổi ngày nhận xe ---');

// 4.1 Input ngày nhận xe phải có thuộc tính min
const hasMinAttributeOnPickupDate = dashboardCode.includes('min=') && 
                                    dashboardCode.slice(dashboardCode.indexOf('ĐỔI NGÀY NHẬN XE')).includes('min=');
console.log('4.1 Modal Đổi ngày nhận xe có ràng buộc thuộc tính min?:', hasMinAttributeOnPickupDate);
assert.strictEqual(hasMinAttributeOnPickupDate, true, 'Modal Đổi ngày nhận xe phải có thuộc tính min trên input date');

// 4.2 CustomerDashboard.tsx phải chặn submit ngày trước ngày đặt / quá khứ
const validatesPickupDateBeforeSubmit = dashboardCode.includes('dateError') || 
                                        dashboardCode.includes('Ngày nhận xe không hợp lệ') ||
                                        dashboardCode.includes('Ngày nhận xe phải');
console.log('4.2 CustomerDashboard.tsx có validate và hiển thị lỗi nếu chọn ngày nhận xe sai logic?:', validatesPickupDateBeforeSubmit);
assert.strictEqual(validatesPickupDateBeforeSubmit, true, 'CustomerDashboard.tsx phải validate và báo lỗi khi ngày nhận xe sai');

console.log('\n✅ TẤT CẢ CÁC ĐIỀU KIỆN KIỂM TRA 4 LỖI QA ĐÃ ĐẠT YÊU CẦU!');
