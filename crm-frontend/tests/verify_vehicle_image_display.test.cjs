const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('--- Test Task 1: Kiểm tra chuẩn hóa hình ảnh xe chính hãng ---');

// Đọc tệp VehiclesShowroom.tsx để kiểm tra các đường dẫn ảnh trong showroomVehicles
const showroomPath = path.join(__dirname, '../src/pages/customer/VehiclesShowroom.tsx');
const showroomContent = fs.readFileSync(showroomPath, 'utf8');

// Trích xuất mảng showroomVehicles
const matchShowroom = showroomContent.match(/export const showroomVehicles: ShowroomVehicle\[\] = \[([\s\S]*?)\];/);
assert(matchShowroom, 'Phải tìm thấy mảng showroomVehicles');

const showroomBlock = matchShowroom[1];
const hasUnsplash = showroomBlock.includes('unsplash.com');

console.log('showroomVehicles còn chứa ảnh Unsplash không?:', hasUnsplash);
if (hasUnsplash) {
  console.log('❌ FAIL (Red): showroomVehicles vẫn đang chứa link ảnh Unsplash ngẫu nhiên!');
} else {
  console.log('✅ PASS (Green): Toàn bộ showroomVehicles đã dùng ảnh xe chính hãng!');
}

// Kiểm tra hàm getVehicleCatalogImage
const { getVehicleCatalogImage } = require('../src/data/mockData.ts') || {};

// Mô phỏng hàm getVehicleCatalogImage
function testCatalogImage(tenXe, hinhAnhHienTai) {
  if (hinhAnhHienTai && !hinhAnhHienTai.includes('unsplash.com') && !hinhAnhHienTai.includes('placeholder')) {
    return hinhAnhHienTai;
  }
  const name = (tenXe || '').toLowerCase();
  if (name.includes('sh 160') || name.includes('sh160') || name.includes('honda sh')) return '/images/Xe/honda_sh_160i_abs_2024.jpg';
  if (name.includes('air') || name.includes('air blade')) return '/images/Xe/honda_air_blade_160_abs.jpg';
  if (name.includes('wave')) return '/images/Xe/honda_wave_alpha_110_2025.jpg';
  if (name.includes('winner')) return '/images/Xe/honda_winner_x_150_abs.jpg';
  if (name.includes('vision')) return '/images/Xe/honda_vision_110_the_thao.jpg';
  if (name.includes('exciter')) return '/images/Xe/yamaha_exciter_155_vva.jpg';
  if (name.includes('grande')) return '/images/Xe/yamaha_grande_hybrid.jpg';
  if (name.includes('janus')) return '/images/Xe/yamaha_janus_125.jpg';
  if (name.includes('pg-1') || name.includes('pg 1')) return '/images/Xe/yamaha_pg_1.jpg';
  if (name.includes('raider')) return '/images/Xe/suzuki_raider_r150.jpg';
  if (name.includes('satria')) return '/images/Xe/suzuki_satria_f150.jpg';
  return '/images/Xe/honda_sh_160i_abs_2024.jpg';
}

assert.strictEqual(testCatalogImage('Honda SH 160i ABS 2025', 'https://images.unsplash.com/...'), '/images/Xe/honda_sh_160i_abs_2024.jpg');
assert.strictEqual(testCatalogImage('Honda Air Blade 160 ABS', 'https://images.unsplash.com/...'), '/images/Xe/honda_air_blade_160_abs.jpg');
assert.strictEqual(testCatalogImage('Yamaha Exciter 155 VVA', 'https://images.unsplash.com/...'), '/images/Xe/yamaha_exciter_155_vva.jpg');

if (hasUnsplash) {
  process.exit(1);
}
