/* ───────────────────────── TYPES ───────────────────────── */
export type CustomerStatus = 'HoatDong' | 'BiKhoa';
export type OrderStatus = 'ChoDuyet' | 'ChoKhachXacNhanNgayNhan' | 'DaXacNhan' | 'DangGiao' | 'DaGiao' | 'HoanThanh' | 'DaHuy' | 'ChoGiaoXe';
export type PaymentStatus = 'ChuaThanhToan' | 'DaCoc' | 'DaThanhToan';
export type OrderChannel = 'TaiQuay' | 'Online';
export type OrderType = 'PhuTung' | 'Xe';
export type AppointmentStatus = 'ChoXacNhan' | 'DaXacNhan' | 'TuChoi' | 'DaHoanThanh' | 'DaHuy' | 'ChoDuyet' | 'DangThucHien' | 'HoanThanh';
export type ServiceType = 'BaoDuong' | 'SuaChua' | 'LaiThu' | 'NhanXe' | 'BaoHanh';
export type AdminRole = 'SuperAdmin' | 'NhanVienBanHang' | 'NhanVienKyThuat';

export interface StaffAccount {
  id: string;
  hoTen: string;
  email: string;
  soDienThoai: string;
  chucVu: string;
  vaiTro: AdminRole;
  trangThai: 'HoatDong' | 'BiKhoa';
  avatar?: string;
  ngayThamGia: string;
  // NV01: Bổ sung các thông tin nhân sự đầy đủ
  gioiTinh?: 'Nam' | 'Nu' | 'Khac';
  ngaySinh?: string;
  diaChi?: string;
  cccd?: string;
  loaiNhanVien?: 'Full-time' | 'Part-time';
  luongCoBan?: number;
  nganHang?: string;
  soTaiKhoan?: string;
  matKhau?: string; // Mật khẩu đăng nhập
}

export const PRESET_CUSTOMER_AVATARS = [
  '/images/KH/kh1.jpg',
  '/images/KH/kh2.jpg',
  '/images/KH/kh3.jpg',
  '/images/KH/kh4.jpg',
  '/images/KH/kh5.jpg',
  '/images/KH/kh6.jpg',
  '/images/KH/kh7.jpg',
  '/images/KH/kh8.jpg',
];

export const STANDARD_STAFF_TITLES = [
  'Quản lý Showroom',
  'Chuyên viên Tư vấn & CSKH',
  'Chuyên viên Bán xe & Trả góp',
  'Chuyên viên Marketing & CRM',
  'Kế toán Bán hàng & Thu ngân',
  'Thủ kho & Quản lý phụ tùng',
  'Kỹ thuật viên Trưởng xưởng',
  'Kỹ thuật viên Sửa chữa máy',
  'Kỹ thuật viên Bảo dưỡng định kỳ',
  'Kỹ thuật viên Điện & Phụ tùng xe',
] as const;

export const POPULAR_BANKS = [
  'Vietcombank',
  'MB Bank',
  'Techcombank',
  'BIDV',
  'Agribank',
  'ACB',
  'VPBank',
  'TPBank',
  'Sacombank',
  'VIB',
] as const;

export type CustomerTierType = 'VIP' | 'ThanThiet' | 'Moi';

export interface CustomerTierInfo {
  tier: CustomerTierType;
  label: string;
  shortLabel: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  discountPercent: number;
  minSpending: number;
  nextTierSpending?: number;
  nextTierLabel?: string;
  description: string;
}

export function getCustomerTier(tongChiTieu: number): CustomerTierInfo {
  if (tongChiTieu >= 10000000) {
    return {
      tier: 'VIP',
      label: '👑 Khách Hàng VIP',
      shortLabel: '👑 VIP',
      badgeColor: '#7c3aed',
      badgeBg: '#f5f3ff',
      badgeBorder: '#ddd6fe',
      discountPercent: 10,
      minSpending: 10000000,
      description: 'Ưu tiên xếp lịch hẹn trước, giảm 10% công thợ bảo dưỡng & phụ tùng.',
    };
  }
  if (tongChiTieu >= 4000000) {
    return {
      tier: 'ThanThiet',
      label: '⭐ Khách Thân Thiết',
      shortLabel: '⭐ Thân thiết',
      badgeColor: '#2563eb',
      badgeBg: '#eff6ff',
      badgeBorder: '#bfdbfe',
      discountPercent: 5,
      minSpending: 4000000,
      nextTierSpending: 10000000 - tongChiTieu,
      nextTierLabel: 'VIP',
      description: 'Giảm 5% khi mua phụ tùng, tặng voucher kiểm tra định kỳ miễn phí.',
    };
  }
  return {
    tier: 'Moi',
    label: '🌱 Khách Hàng Mới',
    shortLabel: '🌱 Khách mới',
    badgeColor: '#16a34a',
    badgeBg: '#f0fdf4',
    badgeBorder: '#bbf7d0',
    discountPercent: 0,
    minSpending: 0,
    nextTierSpending: 4000000 - tongChiTieu,
    nextTierLabel: 'Thân thiết',
    description: 'Tích lũy chi tiêu thêm để thăng hạng Thân thiết và nhận ưu đãi giảm giá.',
  };
}

export interface Customer {
  id: string; hoTen: string; email: string; soDienThoai: string;
  diaChi: string; ngaySinh: string; gioiTinh: 'Nam' | 'Nu';
  trangThai: CustomerStatus; ngayDangKy: string; soXe: string;
  tongChiTieu: number; avatar?: string; soThich?: string;
  matKhau?: string; // Mật khẩu tài khoản
}

export interface Vehicle {
  id: string; customerId: string; tenXe: string; bienSo: string;
  namSanXuat: number; hanBaoHanh: string; mauSac: string;
  hangXe?: string;
  trangThaiBaoHanh: 'ConHan' | 'HetHan' | 'ChuaCo' | 'KhongApDung'; soKhung?: string; hinhAnh?: string;
  trangThaiDuyet?: 'ChoDuyet' | 'DaDuyet' | 'TuChoi';
  nguonGoc?: 'CuaHang' | 'NgoaiHeThong'; // Mua tại cửa hàng vs Xe mua ngoài hệ thống
  ngayMua?: string;
  soMay?: string;
  anhCaVet?: string; // Ảnh chụp giấy tờ / Cà vẹt xe
  bienSoChoDuyet?: string; // Biển số khách cập nhật đang chờ phê duyệt
  trangThaiDuyetBienSo?: 'ChoCapNhat' | 'ChoDuyet' | 'DaDuyet' | 'TuChoi';
  lyDoTuChoiBienSo?: string; // Trạng thái quy trình biển số
}

/* ───────────────────────── MOTORBIKE CATALOGS (ĐKX01) ───────────────────────── */
export const MOTORBIKE_BRANDS: { brand: string; models: string[] }[] = [
  {
    brand: 'Honda',
    models: [
      'Wave Alpha',
      'Vision',
      'Air Blade',
      'SH 125i/160i',
      'SH Mode',
      'Lead',
      'Winner X',
      'Future',
      'Wave RSX',
      'Blade',
      'Vario',
      'PCX',
      'CBR150R',
      'CB300R',
    ],
  },
  {
    brand: 'Yamaha',
    models: [
      'Exciter',
      'Grande',
      'Janus',
      'NVX',
      'Sirius',
      'Jupiter',
      'Latte',
      'FreeGo',
      'XS155R',
      'MT-15',
      'YZF-R15',
    ],
  },
  {
    brand: 'Piaggio',
    models: [
      'Vespa Primavera',
      'Vespa Sprint',
      'Vespa GTS',
      'Liberty',
      'Medley',
      'Beverly',
    ],
  },
  {
    brand: 'Suzuki',
    models: [
      'Raider R150',
      'Satria F150',
      'Burgman Street',
      'GSX-R150',
      'GSX-S150',
      'Address',
      'Viva',
    ],
  },
  {
    brand: 'SYM',
    models: [
      'Attila',
      'Galaxy',
      'Elegant',
      'Star SR',
      'Shark',
      'Passing',
    ],
  },
  {
    brand: 'VinFast (Xe điện)',
    models: [
      'Feliz S',
      'Klara S',
      'Evo 200',
      'Vento S',
      'Theon S',
    ],
  },
  {
    brand: 'Khác',
    models: ['Tự nhập mẫu xe'],
  },
];

export const ENGINE_CAPACITIES = [
  '50cc',
  '110cc',
  '125cc',
  '150cc',
  '155cc',
  '160cc',
  '300cc',
  '350cc',
  'Xe điện (Động cơ điện)',
];

// Ảnh mẫu Cà vẹt xe máy chuẩn Bộ Công An (SVG sắc nét, chuẩn biểu mẫu giấy đăng ký xe)
export const SAMPLE_CA_VET_IMAGE = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='600' height='400' rx='16' fill='%23fef9c3' stroke='%23ca8a04' stroke-width='4'/><rect x='12' y='12' width='576' height='376' rx='10' fill='none' stroke='%23eab308' stroke-dasharray='6,4' stroke-width='2'/><text x='300' y='42' font-family='Arial,sans-serif' font-size='12' font-weight='bold' text-anchor='middle' fill='%231f2937'>CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</text><text x='300' y='58' font-family='Arial,sans-serif' font-size='10' text-anchor='middle' fill='%234b5563'>Độc lập - Tự do - Hạnh phúc</text><line x1='220' y1='65' x2='380' y2='65' stroke='%234b5563' stroke-width='1'/><text x='300' y='95' font-family='Arial,sans-serif' font-size='15' font-weight='900' text-anchor='middle' fill='%23b91c1c'>CHỨNG NHẬN ĐĂNG KÝ XE MÔ TÔ, XE MÁY</text><text x='300' y='112' font-family='Arial,sans-serif' font-size='10' font-style='italic' text-anchor='middle' fill='%236b7280'>(Motorcycle Registration Certificate)</text><g font-family='Arial,sans-serif' font-size='12' fill='%231f2937'><text x='40' y='150' font-weight='bold'>Tên chủ xe (Owner):</text><text x='210' y='150' font-weight='bold' fill='%230369a1'>NGUYỄN MINH ANH</text><text x='40' y='180'>Địa chỉ (Address):</text><text x='210' y='180'>Quận 1, TP. Hồ Chí Minh</text><text x='40' y='210'>Nhãn hiệu (Brand):</text><text x='210' y='210' font-weight='bold'>HONDA / YAMAHA</text><text x='40' y='240'>Số loại (Model):</text><text x='210' y='240'>Xe 2 bánh gắn máy</text><text x='40' y='270'>Số máy (Engine No):</text><text x='210' y='270' font-family='monospace' font-weight='bold'>KF12E-8934521</text><text x='40' y='300'>Số khung (Chassis No):</text><text x='210' y='300' font-family='monospace' font-weight='bold'>RLHKD160CB7352794</text><text x='40' y='335' font-weight='bold'>Biển số đăng ký:</text><text x='210' y='335' font-family='monospace' font-size='16' font-weight='900' fill='%23b91c1c'>69AB - 111.11</text></g><circle cx='490' cy='270' r='48' fill='none' stroke='%23dc2626' stroke-width='3' stroke-dasharray='2,1'/><text x='490' y='255' font-family='Arial,sans-serif' font-size='8' font-weight='bold' text-anchor='middle' fill='%23dc2626'>CÔNG AN TP.HCM</text><text x='490' y='275' font-family='Arial,sans-serif' font-size='14' text-anchor='middle' fill='%23dc2626'>★</text><text x='490' y='295' font-family='Arial,sans-serif' font-size='8' font-weight='bold' text-anchor='middle' fill='%23dc2626'>PHÒNG CSGT</text></svg>";

// Định dạng trực tiếp khi người dùng đang gõ phím (Realtime typing formatter)
export function liveFormatVietnameseLicensePlate(input: string): string {
  if (!input) return '';
  const str = input.toUpperCase().trim();
  const clean = str.replace(/[^0-9A-Z]/g, '');
  if (clean.length === 0) return '';

  const prov = clean.slice(0, 2).replace(/[^0-9]/g, '');
  const rest = clean.slice(prov.length);
  if (rest.length === 0) return prov;

  const mSeries = rest.match(/^([A-Z][0-9A-Z]?)(.*)$/);
  if (!mSeries) return prov + rest;

  const series = mSeries[1];
  let num = mSeries[2].replace(/[^0-9]/g, '');
  // Giới hạn số hiệu biển số tối đa 5 chữ số (chống gõ tràn lan như 111111111111)
  if (num.length > 5) num = num.slice(0, 5);

  if (num.length === 0) return `${prov}${series}`;
  if (num.length <= 4) return `${prov}${series} - ${num}`;
  return `${prov}${series} - ${num.slice(0, 3)}.${num.slice(3, 5)}`;
}

export function formatVietnameseLicensePlate(input: string): string {
  if (!input) return '';
  const str = input.trim().toUpperCase();
  // Lọc chỉ giữ chữ cái và số, giới hạn tối đa 9 ký tự chuẩn
  const clean = str.replace(/[^0-9A-Z]/g, '').slice(0, 9);
  if (clean.length <= 2) return clean;
  if (clean.length === 3) return clean;

  // Kiểm tra nếu là biển ô tô nhập có dấu gạch sau 3 ký tự (VD: 51K - 123.45)
  const isCarSeries = /^[0-9]{2}[A-Z][\s\-]/.test(str);
  if (isCarSeries) {
    const series = clean.slice(0, 3);
    const rest = clean.slice(3);
    if (rest.length > 3) return `${series} - ${rest.slice(0, 3)}.${rest.slice(3)}`;
    if (rest.length > 0) return `${series} - ${rest}`;
    return series;
  }

  // Biển xe máy (chiếm 95% xe trong hệ thống): Series 4 ký tự (VD: 59P1, 69AB, 59F1, 29AA)
  const series = clean.slice(0, 4);
  const rest = clean.slice(4);

  // Biển 4 số xe máy (VD: 59F1-1234)
  if (rest.length === 4 && (str.includes('-') && !str.includes('.'))) {
    return `${series} - ${rest}`;
  }

  // Biển 5 số xe máy (VD: 69AB - 111.11, 59P1 - 246.88)
  if (rest.length > 3) {
    return `${series} - ${rest.slice(0, 3)}.${rest.slice(3)}`;
  }
  if (rest.length > 0) {
    return `${series} - ${rest}`;
  }
  return series;
}

export function isValidLicensePlate(plate: string): boolean {
  if (!plate || !plate.trim()) return false;
  const clean = plate.toUpperCase().replace(/[^0-9A-Z]/g, '');
  // Chấp nhận biển số xe máy 4 hoặc 5 số (59P1-1234, 59P1-123.45, 69AB-111.11), ô tô (51K-123.45), xe điện / 50cc (29AA-123.45)
  return /^[0-9]{2}[A-Z][0-9A-Z]?[0-9]{4,5}$/.test(clean) || /^[0-9]{2}[A-Z]{2}[0-9]{4,5}$/.test(clean);
}

export interface Part {
  id: string; tenSanPham: string; thuongHieu: string; giaGoc: number;
  giaKhuyenMai: number | null; soLuongTon: number; danhMuc: string;
  moTa: string; hinhAnh: string; rating: number; luotDanh: number;
  dongXePhuHop?: string; xuatXu?: string; baoHanh?: string;
  nhaCungCap?: string; // PT06: Nhà cung cấp phụ tùng
  trangThaiHienThi?: 'Hien' | 'An'; // PT12: Ẩn/Hiện trên Web
}

export interface CartItem {
  part: Part; soLuong: number;
}

export interface VehicleChecklist {
  xacThucKH: boolean;
  thuThapCCCD: boolean;
  kyHopDong: boolean;
  nhapSoKhungVIN: boolean;
  dangKyBienSo: boolean;
  thuTienCoc: boolean;
  hoSoVay: boolean;
  capBaoHiem: boolean;
  kiemTraPDI: boolean;
  banGiaoXe: boolean;
}

export interface VehicleOrderDetails {
  customerType: 'Individual' | 'Business';
  idCardTaxNo?: string; // CCCD / Mã số thuế
  customerNotes?: string;
  maXe?: string;
  tenXe: string;
  mauSac: string;
  phienBan?: string;
  dongCo?: string;
  hinhAnh?: string;
  soKhungVIN?: string;
  soMay?: string;
  giaNiemYet: number;
  phiTruocBa: number;
  phiDangKyBienSo: number;
  tinhThanhDangKy?: string;
  goiBaoHiem?: string;
  phiBaoHiem: number;
  khuyenMai: number;
  tongGiaTri: number;
  soTienDatCoc: number;
  ngayDatCoc?: string;
  soTienConLai: number;
  phuongThucThanhToan: 'TienMat' | 'ChuyenKhoan' | 'TraGop';
  taiKhoanNhan?: string;
  trangThaiDonHang?: string;
  hinhThucGiao: 'Showroom' | 'HomeDelivery';
  ngayGiaoXe: string;
  khungGioGiao?: string;
  diaChiGiao?: string;
  maLichHen?: string;
  bienSo?: string;
  daXacNhanNgayNhan?: boolean;
  ngayNhanXacNhan?: string;
  gioNhanXacNhan?: string;
  checklist: VehicleChecklist;
  bienSoChoDuyet?: string;
  trangThaiDuyetBienSo?: 'ChoCapNhat' | 'ChoDuyet' | 'DaDuyet' | 'TuChoi';
  anhCaVet?: string;
}

export interface Order {
  id: string;
  customerId: string;
  hoTenKH: string;
  soDienThoai?: string;
  email?: string;
  ngayDat: string;
  trangThai: OrderStatus;
  trangThaiThanhToan?: PaymentStatus;
  kenhBan?: OrderChannel;
  loaiDon?: OrderType;
  tongTien: number;
  diaChiGiao: string;
  items: { tenSanPham: string; soLuong: number; donGia: number; maPhuTung?: number }[];
  maNV?: string;
  tenNV?: string;
  phuongThucThanhToan?: 'TienMat' | 'ChuyenKhoan' | 'TraGop';
  thongTinXe?: VehicleOrderDetails;
  daXacNhanNgayNhan?: boolean;
  ghiChu?: string;
  lyDoHuy?: string;
  maLichHen?: string;
  qrCodeUrl?: string;
}

export interface AppointmentTimelineItem {
  id: string;
  thoiGian?: string;
  tieuDe?: string;
  trangThai?: AppointmentStatus | 'HoanThanh' | 'HienTai' | 'ChoXuLy' | 'done' | 'current' | 'pending' | string;
  nguoiThucHien?: string;
  ghiChu?: string;
  time?: string;
  title?: string;
  desc?: string;
  status?: 'done' | 'current' | 'pending';
}

export interface Appointment {
  id: string;
  customerId: string;
  hoTenKH: string;
  soDienThoai: string;
  loaiDichVu: ServiceType;
  ngayHen: string;
  gioHen: string;
  trangThai: AppointmentStatus;
  ghiChu: string;
  tenXe: string;
  bienSo: string;
  nhanVienPhuTrach?: string; // LH08: Nhân viên phụ trách
  lyDoTuChoi?: string;       // LH05: Lý do từ chối (bắt buộc)
  createdDate?: string;      // LH10: Thời gian tạo để sắp xếp mới nhất
  maLichHen?: string;        // Mã lịch hẹn đón tiếp (vd: HEN-XE-8492)
  maDonHangXe?: string;      // Mã đơn hàng bán xe liên kết
  mauXe?: string;
  phienBan?: string;
  soTienCoc?: number;
  daThanhToan100?: boolean;
  soKhungVIN?: string;
  soMay?: string;
  hinhThucGiao?: 'Showroom' | 'HomeDelivery';
  diaChiGiao?: string;
  timeline?: AppointmentTimelineItem[];
}

/* ───────────────────────── MOTORBIKE INSURANCE (BHX01 - BHX05) ───────────────────────── */
export type InsurancePackageType =
  | 'TNDS_BAT_BUOC'
  | 'TNDS_NGUOI_NGOI'
  | 'VAT_CHAT_TOAN_DIEN'
  | 'VAT_CHAT_XE'
  | 'TAI_NAN_NGUOI'
  | 'TOAN_DIEN';
export type InsuranceStatus = 'HieuLuc' | 'ChoDuyet' | 'HetHan' | 'TuChoi';

export interface InsurancePackage {
  id: InsurancePackageType;
  tenGoi: string;
  phi1Nam: number;
  phi2Nam?: number;
  phi3Nam?: number;
  moTa: string;
  quyenLoi: string[];
  mucTrachNhiem: string;
  badge: string;
  icon: string;
  color: string;
  tags?: string[];
}

export interface InsuranceContract {
  id: string; // Mã HĐ (vd: BH001)
  soGCN: string; // Số Giấy chứng nhận điện tử (vd: GCN-BV-2026-0812)
  customerId: string; // KH001
  hoTenKH: string;
  soDienThoai: string;
  email: string;
  diaChi: string;
  vehicleId: string; // XE001
  tenXe: string;
  bienSo: string;
  soKhung: string;
  soMay?: string;
  packageType: InsurancePackageType;
  tenGoi: string;
  thoiHanNam: number; // 1, 2, 3
  phiBaoHiem: number;
  thueVAT?: number;
  tongTien?: number;
  maGiamGia?: string;
  phuongThucThanhToan?: 'ChuyenKhoan' | 'TienMat';
  kenhDangKy?: 'Web' | 'TaiQuay';
  nhaBaoHiem: string; // Bảo Việt, PVI, PTI, MIC...
  ngayCap: string; // YYYY-MM-DD
  ngayBatDau: string; // YYYY-MM-DD
  ngayKetThuc: string; // YYYY-MM-DD
  trangThai: InsuranceStatus;
  ghiChu?: string;
  isRenewed?: boolean;
  hopDongGocId?: string;
}

export const INSURANCE_PACKAGES: InsurancePackage[] = [
  {
    id: 'TNDS_BAT_BUOC',
    tenGoi: 'GÓI CƠ BẢN (TNDS Bắt Buộc)',
    phi1Nam: 66000,
    phi2Nam: 120000,
    phi3Nam: 180000,
    moTa: 'Quyền lợi cơ bản theo quy định nhà nước.',
    quyenLoi: [
      'Bồi thường thiệt hại về người: Tối đa 150.000.000 đ/người/vụ',
      'Bồi thường thiệt hại về tài sản: Tối đa 50.000.000 đ/vụ',
      'Cấp Giấy chứng nhận điện tử có mã QR hợp chuẩn CSGT',
    ],
    mucTrachNhiem: '150.000.000 đ/người/vụ',
    badge: 'Bắt buộc theo luật',
    icon: '🛡️',
    color: '#dc2626',
    tags: ['TNDS Bắt buộc', 'Đúng luật giao thông'],
  },
  {
    id: 'TNDS_NGUOI_NGOI',
    tenGoi: 'GÓI NÂNG CAO (TNDS + Người ngồi)',
    phi1Nam: 150000,
    phi2Nam: 280000,
    phi3Nam: 400000,
    moTa: 'Đền bù TNDS & người ngồi trên xe.',
    quyenLoi: [
      'Bao gồm toàn bộ quyền lợi gói TNDS Bắt buộc',
      'Bảo hiểm tai nạn lái xe & người ngồi sau: 50.000.000 đ/người',
      'Hỗ trợ chi phí cấp cứu và viện phí tai nạn',
    ],
    mucTrachNhiem: '150 triệu người / 50 triệu tài sản',
    badge: 'An tâm toàn diện',
    icon: '👥',
    color: '#2563eb',
    tags: ['TNDS Bắt buộc', 'Bảo vệ người ngồi'],
  },
  {
    id: 'VAT_CHAT_TOAN_DIEN',
    tenGoi: 'GÓI TOÀN DIỆN',
    phi1Nam: 1250000,
    phi2Nam: 2300000,
    phi3Nam: 3300000,
    moTa: 'Bảo vệ xe toàn diện trước mọi rủi ro va quẹt, thủy kích, trộm cắp và hỗ trợ cứu hộ 24/7.',
    quyenLoi: [
      'Đền bù va quẹt, trầy xước và tai nạn thân vỏ xe',
      'Bảo hiểm rủi ro thủy kích ngập nước',
      'Đền bù mất cắp, mất cướp bộ phận hoặc toàn bộ xe',
      'Cứu hộ giao thông khẩn cấp 24/7 không giới hạn số lần',
    ],
    mucTrachNhiem: '100% Giá trị xe + Cứu hộ 24/7',
    badge: 'Khuyên dùng · VIP',
    icon: '👑',
    color: '#7c3aed',
    tags: ['Đền bù va quẹt', 'Thủy kích', 'Cứu hộ 24/7', 'Mất cắp bộ phận'],
  },
  {
    id: 'VAT_CHAT_XE',
    tenGoi: 'Bảo hiểm Vật chất / Thân xe máy',
    phi1Nam: 450000,
    phi2Nam: 850000,
    moTa: 'Bảo vệ toàn diện xe trước rủi ro tai nạn, va quẹt, cháy nổ, thiên tai hoặc mất cắp.',
    quyenLoi: [
      'Bồi thường tổn thất do va chạm, chìm rơi, cháy nổ, lật đổ',
      'Bồi thường mất cắp, mất cướp toàn bộ xe',
      'Hỗ trợ chi phí cẩu kéo cứu hộ xe đến xưởng sửa chữa chính hãng',
    ],
    mucTrachNhiem: '100% giá trị thị trường xe',
    badge: 'Bảo vệ tài sản',
    icon: '🏍️',
    color: '#2563eb',
  },
  {
    id: 'TAI_NAN_NGUOI',
    tenGoi: 'Bảo hiểm Tai nạn người ngồi trên xe',
    phi1Nam: 20000,
    phi2Nam: 38000,
    moTa: 'Bảo vệ sức khỏe, tính mạng cho cả người lái và người ngồi sau xe khi xảy ra tai nạn.',
    quyenLoi: [
      'Bồi thường tai nạn cho người lái xe: Tối đa 50.000.000 đ/người',
      'Bồi thường tai nạn cho người ngồi sau: Tối đa 50.000.000 đ/người',
      'Hỗ trợ viện phí, cấp cứu và điều trị phẫu thuật',
    ],
    mucTrachNhiem: '50.000.000 đ/người/vụ',
    badge: 'An tâm di chuyển',
    icon: '👥',
    color: '#16a34a',
  },
  {
    id: 'TOAN_DIEN',
    tenGoi: 'Gói Bảo hiểm Toàn diện 3-trong-1 (VIP)',
    phi1Nam: 520000,
    phi2Nam: 980000,
    moTa: 'Gói combo kết hợp TNDS Bắt buộc + Vật chất xe + Tai nạn 2 người ngồi, chiết khấu đặc biệt 15%.',
    quyenLoi: [
      'Đầy đủ quyền lợi TNDS Bắt buộc 150 triệu/vụ',
      'Bồi thường trọn gói tổn thất vật chất & mất cắp xe',
      'Bảo hiểm tai nạn lái xe và phụ xe 50 triệu/người',
      'Được ưu tiên cứu hộ 24/7 và giám định bồi thường tận nơi',
    ],
    mucTrachNhiem: 'Toàn diện cao nhất',
    badge: 'Khuyên dùng · Tiết kiệm 15%',
    icon: '👑',
    color: '#7c3aed',
  },
];

export function countWords(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export interface Feedback {
  id: string; customerId: string; hoTen: string; noiDung: string;
  diemDanhGia: number; ngayGui: string; loaiDanhGia: 'DichVu' | 'SanPham' | 'BaoHanh';
  trangThai: 'ChoXuLy' | 'DaXuLy'; loaiNhan: 'DanhGia' | 'KhieuNai' | 'DanhGiaMoi';
  soDienThoai?: string;
  email?: string;
  diaChi?: string;
  xeDangDung?: string;
  ghiChuXuLy?: string;
  phanHoiCuaShop?: string;
  ngayPhanHoi?: string;
  nhanVienXuLy?: string;
  ngayXuLy?: string;
  hinhAnhDinhKem?: string[];
  productId?: string;
  productName?: string;
  productImage?: string;
  productType?: 'PhuTung' | 'XeMau' | 'DichVu';
  editCount?: number;
  orderId?: string;
  nhanVienPhuTrach?: string;
}

export interface ProductReview {
  id: string;
  targetId: string; // vehicleId or partId
  customerId?: string;
  tenKhachHang: string;
  soDienThoai?: string;
  soSao: number;
  ngayDanhGia: string;
  noiDung: string;
  daMua: boolean;
  dongXeDaMua?: string;
  phanHoiShowroom?: string;
  editCount?: number;
  productName?: string;
  productImage?: string;
  productType?: 'PhuTung' | 'XeMau';
  hinhAnhDinhKem?: string[];
}

export interface SurveyQuestion {
  id: string;
  text: string;
  opts: string[];
}

export type SurveyStatus = 'Nhap' | 'SapDienRa' | 'DangDienRa' | 'DaKetThuc' | 'Active' | 'Closed';

export interface Survey {
  id: string;
  title: string;
  description: string;
  targetCustomerId: string | 'ALL';
  targetCustomerName?: string;
  targetCustomerIds?: string[]; // KS05: Cho phép chọn nhiều KH
  targetCustomerTier?: 'ALL' | 'VIP' | 'Gold' | 'Standard' | 'New'; // KS05: Lọc theo Hạng KH
  createdDate: string;
  publishDate?: string; // KS07: Cài đặt thời gian đăng khảo sát
  startDate?: string;   // KS06: Thời gian bắt đầu
  endDate?: string;     // KS06: Thời gian kết thúc
  questions: SurveyQuestion[];
  status: SurveyStatus;
  targetCount?: number;
  responseCount?: number;
}

export function computeSurveyStatus(survey: Survey): 'Nhap' | 'SapDienRa' | 'DangDienRa' | 'DaKetThuc' {
  if (survey.status === 'Nhap') return 'Nhap';
  if (survey.status === 'Closed' || survey.status === 'DaKetThuc') return 'DaKetThuc';
  
  const now = new Date().getTime();

  // Kiểm tra thời gian đăng (KS07)
  if (survey.publishDate) {
    const pub = new Date(survey.publishDate).getTime();
    if (!isNaN(pub) && now < pub) {
      return 'Nhap';
    }
  }

  // Kiểm tra thời gian bắt đầu (KS06 & KS08)
  if (survey.startDate) {
    const start = new Date(survey.startDate).getTime();
    if (!isNaN(start) && now < start) {
      return 'SapDienRa';
    }
  }

  // Kiểm tra thời gian kết thúc (KS06 & KS08)
  if (survey.endDate) {
    const end = new Date(survey.endDate).getTime();
    if (!isNaN(end) && now > end) {
      return 'DaKetThuc';
    }
  }

  return 'DangDienRa';
}

export function formatSurveyDateTime(dtStr?: string): string {
  if (!dtStr) return 'Không giới hạn';
  try {
    const d = new Date(dtStr);
    if (isNaN(d.getTime())) return dtStr;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${mins}`;
  } catch {
    return dtStr;
  }
}

export const surveyStatusLabels: Record<string, { label: string; bg: string; text: string; border: string }> = {
  DangDienRa: { label: 'Đang diễn ra', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  SapDienRa: { label: 'Sắp diễn ra', bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  DaKetThuc: { label: 'Đã kết thúc', bg: '#f4f4f5', text: '#52525b', border: '#e4e4e7' },
  Nhap: { label: 'Bản nháp', bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
  Active: { label: 'Đang diễn ra', bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
  Closed: { label: 'Đã kết thúc', bg: '#f4f4f5', text: '#52525b', border: '#e4e4e7' },
};

export interface SurveyResponse {
  id: string;
  surveyId: string;
  customerId: string;
  customerName: string;
  soDienThoai?: string;
  bienSoXe?: string;
  tenXe?: string;
  danhGiaChung?: string;
  ghiChu?: string;
  daXuLy?: boolean;
  answers: Record<string, string>;
  submittedDate: string;
}

/* ───────────────────────── PARTS CATALOG ───────────────────────── */
export const PART_IMAGES_LIST = [
  "/images/phutung/dan_ao_ab_125_trang_do.webp",
  "/images/phutung/dan_ao_ab_125_xanh_dam.webp",
  "/images/phutung/motul_7100.png",
  "/images/phutung/dan_ao_ab_150_xam_xi_mang.webp",
  "/images/phutung/heo_dau_mfz_2pis.webp",
  "/images/phutung/heo_mfz_4_pis_cho_xe_tay_ga.webp",
  "/images/phutung/heo_nissin_2_pis_thai_lan.webp",
  "/images/phutung/phuoc_ohlins.webp",
  "/images/phutung/phuoc_redleo_v2.webp",
  "/images/phutung/phuoc_redleo_winner.webp",
  "/images/phutung/phuoc_redleo.webp",
  "/images/phutung/phuoc_sau_ohlins_yss_xam.webp",
  "/images/phutung/phuoc_sau_ohlins_yss.webp",
  "/images/phutung/thang_tay_rcb_s1.webp",
  "/images/phutung/thang_tay_rcb_s3.webp",
  "/images/phutung/thang_tay_rcbco_binh_dau_roi.webp",
  "/images/phutung/vo_deli_urban_grip.webp",
  "/images/phutung/vo_michelin_city_grip.webp",
  "/images/phutung/vo_michelin_road_6.webp",
  "/images/phutung/vo_xe_dunlop.webp",
  "/images/phutung/vo_xe_maxxis_3d_chong_truot.webp",
  "/images/phutung/vo_xe_michelin_s1.webp",
  "/images/phutung/vo_xe_michelin_s2.webp",
  "/images/phutung/den_bi_cau_ab_2010.webp",
  "/images/phutung/den_bi_cau_ab_2015.webp",
  "/images/phutung/den_bi_cau_ab_2025.webp"
];


export const mockParts: Part[] = [
  {
    id: 'PT001',
    tenSanPham: 'Nhớt Motul 7100 4T 10W40 1L (100% Tổng Hợp Ester)',
    thuongHieu: 'Motul',
    giaGoc: 290000,
    giaKhuyenMai: 255000,
    soLuongTon: 85,
    danhMuc: 'Nhớt',
    moTa: 'Dầu nhớt tổng hợp 100% công nghệ Ester cao cấp từ Pháp, tối ưu công suất và bảo vệ ly hợp ướt xe côn tay và xe phân khối lớn.',
    hinhAnh: '/images/phutung/dan_ao_ab_125_den_nham.webp',
    rating: 4.9,
    luotDanh: 342,
    dongXePhuHop: 'Winner X, Exciter 150/155, Raider, CBR150R, CB300R',
    xuatXu: 'Pháp',
    baoHanh: 'Chính hãng 100%',
  },
  {
    id: 'PT002',
    tenSanPham: 'Nhớt Castrol POWER1 Ultimate Scooter 10W-30 0.8L',
    thuongHieu: 'Castrol',
    giaGoc: 165000,
    giaKhuyenMai: 145000,
    soLuongTon: 120,
    danhMuc: 'Nhớt',
    moTa: 'Dầu nhớt động cơ công nghệ 5 trong 1 tối ưu tăng tốc, tản nhiệt cực nhanh, chống cặn bẩn vượt trội cho xe tay ga.',
    hinhAnh: '/images/phutung/heo_mfz_4_pis_cho_xe_tay_ga.webp',
    rating: 4.8,
    luotDanh: 215,
    dongXePhuHop: 'Honda SH 125i/160i, Air Blade, Lead, Vision, Vario',
    xuatXu: 'Anh Quốc / VN',
    baoHanh: 'Chính hãng 100%',
  },
  {
    id: 'PT003',
    tenSanPham: 'Dầu nhớt xe số Honda Genuine 4T SL 10W-30 MA 0.8L',
    thuongHieu: 'Honda',
    giaGoc: 105000,
    giaKhuyenMai: 92000,
    soLuongTon: 160,
    danhMuc: 'Nhớt',
    moTa: 'Nhớt động cơ tiêu chuẩn chính hãng Honda cho xe số 4 thì, bôi trơn hoàn hảo và tiết kiệm nhiên liệu tối đa.',
    hinhAnh: '/images/phutung/vo_xe_dunlop.webp',
    rating: 4.7,
    luotDanh: 418,
    dongXePhuHop: 'Wave Alpha, Future 125, Wave RSX, Blade',
    xuatXu: 'Nhật Bản / VN',
    baoHanh: 'Chính hãng Honda',
  },
  {
    id: 'PT004',
    tenSanPham: 'Lọc gió zin chính hãng Honda Air Blade 125/160 & Vario',
    thuongHieu: 'Honda',
    giaGoc: 135000,
    giaKhuyenMai: 120000,
    soLuongTon: 65,
    danhMuc: 'Lọc',
    moTa: 'Lọc gió giấy tẩm dầu chuyên dụng giúp lọc 99% bụi mịn buồng đốt, tăng tuổi thọ động cơ và tối ưu tiêu thụ xăng.',
    hinhAnh: '/images/phutung/thang_tay_rcbco_binh_dau_roi.webp',
    rating: 4.7,
    luotDanh: 94,
    dongXePhuHop: 'Honda Air Blade 125/160, Vario 160, Lead 125',
    xuatXu: 'Việt Nam',
    baoHanh: '6 tháng',
  },
  {
    id: 'PT005',
    tenSanPham: 'Lọc gió độ K&N High-Flow YA-1519 USA cho Exciter 150/155',
    thuongHieu: 'K&N',
    giaGoc: 1350000,
    giaKhuyenMai: 1190000,
    soLuongTon: 22,
    danhMuc: 'Lọc',
    moTa: 'Lọc gió độ vải cotton 4 lớp tẩm dầu K&N (Made in USA) giúp nạp khí cực thoáng, tăng công suất mã lực, vệ sinh tái sử dụng trọn đời.',
    hinhAnh: '/images/phutung/thang_tay_rcb_s3.webp',
    rating: 4.9,
    luotDanh: 58,
    dongXePhuHop: 'Yamaha Exciter 150, Exciter 155 VVA',
    xuatXu: 'Hoa Kỳ (USA)',
    baoHanh: 'Trọn đời (Tái sử dụng)',
  },
  {
    id: 'PT006',
    tenSanPham: 'Má phanh đĩa trước Brembo Carbon Ceramic 07HO28SA',
    thuongHieu: 'Brembo',
    giaGoc: 890000,
    giaKhuyenMai: 790000,
    soLuongTon: 35,
    danhMuc: 'Phanh',
    moTa: 'Bố thắng đĩa hiệu năng cao thương hiệu Brembo Ý. Hợp chất gốm carbon hãm tốc chuẩn xác, chống trượt nước và không xước đĩa.',
    hinhAnh: '/images/phutung/phuoc_sau_ohlins_yss.webp',
    rating: 4.9,
    luotDanh: 142,
    dongXePhuHop: 'Honda SH 150i/160i, Winner X, ADV 160, Forza',
    xuatXu: 'Ý (Italy)',
    baoHanh: '12 tháng',
  },
  {
    id: 'PT007',
    tenSanPham: 'Má phanh đĩa trước Nissin OEM Honda SH 125i/150i/160i',
    thuongHieu: 'Nissin',
    giaGoc: 350000,
    giaKhuyenMai: 295000,
    soLuongTon: 50,
    danhMuc: 'Phanh',
    moTa: 'Má phanh đĩa OEM Nissin Nhật Bản chịu ma sát cao, phanh êm ái chống giật, giảm quãng đường phanh khẩn cấp.',
    hinhAnh: '/images/phutung/den_bi_cau_ab_2015.webp',
    rating: 4.7,
    luotDanh: 188,
    dongXePhuHop: 'Honda SH 125i/150i/160i, SH Mode',
    xuatXu: 'Nhật Bản',
    baoHanh: '6 tháng',
  },
  {
    id: 'PT008',
    tenSanPham: 'Bugi NGK Iridium Laser CPR8EAIX-9 cao cấp',
    thuongHieu: 'NGK',
    giaGoc: 260000,
    giaKhuyenMai: 220000,
    soLuongTon: 110,
    danhMuc: 'Bugi',
    moTa: 'Bugi chân kim Iridium 0.6mm siêu bền từ Nhật Bản. Đánh lửa cực mạnh, khởi động nhạy nổ mùa lạnh và đốt sạch nhiên liệu.',
    hinhAnh: '/images/phutung/den_bi_cau_ab_2010.webp',
    rating: 4.9,
    luotDanh: 520,
    dongXePhuHop: 'Honda Winner X, SH 150i, Air Blade, Yamaha Exciter 155',
    xuatXu: 'Nhật Bản',
    baoHanh: '50.000 km',
  },
  {
    id: 'PT009',
    tenSanPham: 'Bugi Denso Iridium Power IU24 chân dài',
    thuongHieu: 'Denso',
    giaGoc: 240000,
    giaKhuyenMai: 195000,
    soLuongTon: 75,
    danhMuc: 'Bugi',
    moTa: 'Điện cực trung tâm Iridium 0.4mm độc quyền của Denso Nhật Bản. Gia tăng công suất ga đầu và hạn chế bám muội than buồng đốt.',
    hinhAnh: '/images/phutung/heo_dau_mfz_2pis.webp',
    rating: 4.8,
    luotDanh: 167,
    dongXePhuHop: 'Suzuki Raider 150, Satria F150, GSX-R150, Winner X',
    xuatXu: 'Nhật Bản',
    baoHanh: '40.000 km',
  },
  {
    id: 'PT010',
    tenSanPham: 'Lốp Michelin Pilot Street 2 (Cặp 80/90-14 & 90/90-14)',
    thuongHieu: 'Michelin',
    giaGoc: 1850000,
    giaKhuyenMai: 1650000,
    soLuongTon: 28,
    danhMuc: 'Lốp xe',
    moTa: 'Cặp lốp không săm thương hiệu Pháp. Hợp chất cao su silica cao cấp cùng rãnh gai thoát nước thông minh chống trơn trượt mùa mưa.',
    hinhAnh: '/images/phutung/thang_tay_rcb_s1.webp',
    rating: 4.9,
    luotDanh: 280,
    dongXePhuHop: 'Honda Air Blade, Vision, Vario, Yamaha Janus',
    xuatXu: 'Thái Lan',
    baoHanh: '12 tháng chính hãng',
  },
  {
    id: 'PT011',
    tenSanPham: 'Lốp Pirelli Diablo Rosso Sport (Cặp 90/80-17 & 120/70-17)',
    thuongHieu: 'Pirelli',
    giaGoc: 2350000,
    giaKhuyenMai: 2150000,
    soLuongTon: 18,
    danhMuc: 'Lốp xe',
    moTa: 'Lốp xe thể thao nguồn gốc từ đường đua WSBK của Pirelli Ý. Cung cấp độ bám đường nghiêng tuyệt hảo khi ôm cua ở tốc độ cao.',
    hinhAnh: '/images/phutung/phuoc_redleo_v2.webp',
    rating: 4.8,
    luotDanh: 135,
    dongXePhuHop: 'Exciter 155 VVA, Winner X, Raider 150, CBR150R',
    xuatXu: 'Indonesia',
    baoHanh: '12 tháng',
  },
  {
    id: 'PT012',
    tenSanPham: 'Dây curoa Bando V-Belt hai mặt răng cho Honda SH 150i/160i',
    thuongHieu: 'Bando',
    giaGoc: 580000,
    giaKhuyenMai: 510000,
    soLuongTon: 42,
    danhMuc: 'Truyền động',
    moTa: 'Dây curoa hai mặt răng Bando gia cường sợi aramid kevlar chống giãn, truyền tải êm ái, loại bỏ hoàn toàn rung giật nồi ga đầu.',
    hinhAnh: '/images/phutung/den_bi_cau_ab_2025.webp',
    rating: 4.8,
    luotDanh: 112,
    dongXePhuHop: 'Honda SH 150i, SH 160i, ADV 150/160',
    xuatXu: 'Nhật Bản',
    baoHanh: '20.000 km',
  },
  {
    id: 'PT013',
    tenSanPham: 'Bộ nhông sên dĩa D.I.D 428D Vàng 122L - Nhông Sunstar',
    thuongHieu: 'DID',
    giaGoc: 520000,
    giaKhuyenMai: 450000,
    soLuongTon: 55,
    danhMuc: 'Truyền động',
    moTa: 'Sên mạ vàng D.I.D 9 ly siêu bền của Nhật Bản kết hợp cùng bộ nhông dĩa hợp kim Sunstar tôi nhiệt cao tần chống mài mòn.',
    hinhAnh: '/images/phutung/vo_michelin_city_grip.webp',
    rating: 4.9,
    luotDanh: 320,
    dongXePhuHop: 'Yamaha Exciter 150/155, Honda Winner X, Sonic',
    xuatXu: 'Nhật Bản',
    baoHanh: '15.000 km',
  },
  {
    id: 'PT014',
    tenSanPham: 'Bóng đèn pha LED Philips Ultinon Essential Moto HS1/H4 6500K',
    thuongHieu: 'Philips',
    giaGoc: 380000,
    giaKhuyenMai: 315000,
    soLuongTon: 45,
    danhMuc: 'Đèn',
    moTa: 'Đèn LED pha xe máy Philips tản nhiệt nhôm liền khối. Nhiệt màu trắng sáng 6500K thời thượng, gom sáng chuẩn không chói mắt xe ngược chiều.',
    hinhAnh: '/images/phutung/dan_ao_ab_125_xanh_dam.webp',
    rating: 4.8,
    luotDanh: 205,
    dongXePhuHop: 'Xe máy sử dụng chân cắm bóng HS1/H4 (Wave, Exciter, Vision, Air Blade)',
    xuatXu: 'Đức / Ba Lan',
    baoHanh: '12 tháng 1 đổi 1',
  },
  {
    id: 'PT015',
    tenSanPham: 'Bình ắc quy khô GS GTZ5S (12V - 3.5Ah) xe máy chính hãng',
    thuongHieu: 'GS',
    giaGoc: 340000,
    giaKhuyenMai: 285000,
    soLuongTon: 60,
    danhMuc: 'Thân máy',
    moTa: 'Ắc quy khô miễn bảo dưỡng công nghệ AGM của GS Yuasa Nhật Bản. Độ bền cao, khởi động ổn định trong mọi điều kiện thời tiết.',
    hinhAnh: '/images/phutung/phuoc_ohlins.webp',
    rating: 4.7,
    luotDanh: 175,
    dongXePhuHop: 'Wave Alpha, Wave RSX, Future, Sirius, Exciter 135',
    xuatXu: 'Việt Nam (GS Yuasa)',
    baoHanh: '6 tháng chính hãng',
  },
  {
    id: 'PT016',
    tenSanPham: 'Gương chiếu hậu Rizoma Class Retro nhôm CNC chống chói',
    thuongHieu: 'Rizoma',
    giaGoc: 420000,
    giaKhuyenMai: 350000,
    soLuongTon: 30,
    danhMuc: 'Phụ kiện',
    moTa: 'Gương gù thời trang hợp kim nhôm CNC cắt nguyên khối. Kính tráng gương màu xanh dương triệt tiêu ánh sáng chói lóa từ đèn pha phía sau.',
    hinhAnh: '/images/phutung/phuoc_redleo_winner.webp',
    rating: 4.6,
    luotDanh: 89,
    dongXePhuHop: 'Mọi dòng xe máy phổ thông & xe côn tay',
    xuatXu: 'Ý',
    baoHanh: '12 tháng',
  },
  {
    id: 'PT017',
    tenSanPham: 'Kính chắn gió khí động học ZHI.PAT Sport cho SH 160i / SH 125i',
    thuongHieu: 'ZHI.PAT',
    giaGoc: 450000,
    giaKhuyenMai: 390000,
    soLuongTon: 25,
    danhMuc: 'Phụ kiện',
    moTa: 'Kính chắn gió phong cách thể thao Châu Âu chế tác từ Polycarbonate dẻo dai chống va đập, tản gió êm ái khi chạy tốc độ cao.',
    hinhAnh: '/images/phutung/phuoc_sau_ohlins_yss_xam.webp',
    rating: 4.7,
    luotDanh: 114,
    dongXePhuHop: 'Honda SH 125i / 150i / 160i (2020-2024)',
    xuatXu: 'Việt Nam',
    baoHanh: '12 tháng',
  },
  {
    id: 'PT018',
    tenSanPham: 'Thùng đựng đồ gắn sau xe Givi B270N Monolock 27 Lít chống nước',
    thuongHieu: 'Givi',
    giaGoc: 1200000,
    giaKhuyenMai: 1080000,
    soLuongTon: 15,
    danhMuc: 'Phụ kiện',
    moTa: 'Thùng sau Givi Monolock làm từ nhựa nguyên sinh PP siêu bền chịu va đập, gioăng cao su chống nước tuyệt đối, chứa thoải mái 1 mũ fullface.',
    hinhAnh: '/images/phutung/dan_ao_ab_125_trang_do.webp',
    rating: 4.9,
    luotDanh: 76,
    dongXePhuHop: 'Gắn baga mọi dòng xe số, tay ga, xe đi phượt',
    xuatXu: 'Malaysia',
    baoHanh: '24 tháng chính hãng',
  },
];

/* ───────────────────────── CUSTOMERS ───────────────────────── */
export const mockCustomers: Customer[] = [
  { id: 'KH001', hoTen: 'Nguyễn Minh Anh', email: 'minhanh.nguyen@email.com', soDienThoai: '0901234567', diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM', ngaySinh: '1990-05-15', gioiTinh: 'Nam', trangThai: 'HoatDong', ngayDangKy: '2023-01-10', soXe: 'XE001', tongChiTieu: 158500000, avatar: '/images/KH/kh1.jpg' },
  { id: 'KH002', hoTen: 'Trần Thị Bích', email: 'tranthibich95@gmail.com', soDienThoai: '0912345678', diaChi: '45 Nguyễn Huệ, Q.1, TP.HCM', ngaySinh: '1995-08-22', gioiTinh: 'Nu', trangThai: 'HoatDong', ngayDangKy: '2023-02-14', soXe: 'XE002', tongChiTieu: 12300000, avatar: '/images/KH/kh2.jpg' },
  { id: 'KH003', hoTen: 'Lê Hoàng Cường', email: 'lehoangcuong88@gmail.com', soDienThoai: '0923456789', diaChi: '78 Trần Phú, Q.5, TP.HCM', ngaySinh: '1988-11-30', gioiTinh: 'Nam', trangThai: 'HoatDong', ngayDangKy: '2023-03-05', soXe: 'XE003', tongChiTieu: 1200000, avatar: '/images/KH/kh3.jpg' },
  { id: 'KH004', hoTen: 'Phạm Thị Duyên', email: 'phamduyen98@gmail.com', soDienThoai: '0934567890', diaChi: '23 CMT8, Q.3, TP.HCM', ngaySinh: '1998-03-18', gioiTinh: 'Nu', trangThai: 'HoatDong', ngayDangKy: '2023-04-20', soXe: 'XE004', tongChiTieu: 7640000, avatar: '/images/KH/kh4.jpg' },
  { id: 'KH005', hoTen: 'Hoàng Văn Giang', email: 'hoangvanem92@gmail.com', soDienThoai: '0945678901', diaChi: '56 Điện Biên Phủ, Bình Thạnh, TP.HCM', ngaySinh: '1992-07-12', gioiTinh: 'Nam', trangThai: 'HoatDong', ngayDangKy: '2023-05-11', soXe: 'XE005', tongChiTieu: 3290000, avatar: '/images/KH/kh5.jpg' },
  { id: 'KH006', hoTen: 'Đặng Thị Phương Thảo', email: 'dangphuongthao96@gmail.com', soDienThoai: '0956789012', diaChi: '89 Võ Văn Tần, Q.3, TP.HCM', ngaySinh: '1996-12-01', gioiTinh: 'Nu', trangThai: 'HoatDong', ngayDangKy: '2023-06-08', soXe: 'XE006', tongChiTieu: 9150000, avatar: '/images/KH/kh6.jpg' },
  { id: 'KH007', hoTen: 'Vũ Minh Hải', email: 'vuminhhai85@gmail.com', soDienThoai: '0967890123', diaChi: '34 Nguyễn Đình Chiểu, Phú Nhuận, TP.HCM', ngaySinh: '1985-04-25', gioiTinh: 'Nam', trangThai: 'HoatDong', ngayDangKy: '2023-07-15', soXe: 'XE007', tongChiTieu: 5200000, avatar: '/images/KH/kh7.jpg' },
  { id: 'KH008', hoTen: 'Bùi Thị Hương', email: 'buithihuong94@gmail.com', soDienThoai: '0978901234', diaChi: '67 Phan Xích Long, Phú Nhuận, TP.HCM', ngaySinh: '1994-09-14', gioiTinh: 'Nu', trangThai: 'HoatDong', ngayDangKy: '2023-08-22', soXe: 'XE008', tongChiTieu: 5620000, avatar: '/images/KH/kh8.jpg' },
  { id: 'KH009', hoTen: 'Đỗ Khoa Nam', email: 'dokhoanam91@gmail.com', soDienThoai: '0989012345', diaChi: '102 Hoàng Văn Thụ, Tân Bình, TP.HCM', ngaySinh: '1991-02-10', gioiTinh: 'Nam', trangThai: 'HoatDong', ngayDangKy: '2023-09-19', soXe: 'XE009', tongChiTieu: 1850000, avatar: '/images/KH/kh9.jpg' },
  { id: 'KH1004', hoTen: 'Lan Phương', email: 'lanphuong1004@gmail.com', soDienThoai: '0918100400', diaChi: '1004 Nguyễn Thị Minh Khai, Q.1, TP.HCM', ngaySinh: '1995-10-04', gioiTinh: 'Nu', trangThai: 'HoatDong', ngayDangKy: '2024-01-15', soXe: 'XE1004', tongChiTieu: 8500000, avatar: '/images/KH/kh2.jpg' },
  { id: 'KH010', hoTen: 'Trương Vũ Hoàng Lộc', email: 'lochoang48@gmail.com', soDienThoai: '0990123456', diaChi: '215 Lê Văn Sỹ, Q.3, TP.HCM', ngaySinh: '1989-10-05', gioiTinh: 'Nam', trangThai: 'HoatDong', ngayDangKy: '2023-10-05', soXe: 'XE010', tongChiTieu: 6400000, avatar: '/images/KH/kh10.jpg' },
];

/* ───────────────────────── VEHICLES ───────────────────────── */
export const mockVehicles: Vehicle[] = [
  {
    id: 'XE001',
    customerId: 'KH001',
    tenXe: 'VINFAST (XE ĐIỆN) EVO 200 160CC',
    bienSo: '59Y-155.55',
    namSanXuat: 2025,
    ngayMua: '2025-05-12',
    hanBaoHanh: 'Không áp dụng',
    mauSac: 'Đen trắng',
    trangThaiBaoHanh: 'KhongApDung',
    nguonGoc: 'NgoaiHeThong',
    soKhung: 'VFEVO200CB15555',
    soMay: 'EVO200E15555',
    trangThaiDuyet: 'DaDuyet',
    hinhAnh: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XE002',
    customerId: 'KH001',
    tenXe: 'HONDA SH 150i',
    bienSo: '59S1-123.45',
    namSanXuat: 2024,
    ngayMua: '2024-01-20',
    hanBaoHanh: '2027-10-15',
    mauSac: 'Đỏ đen',
    trangThaiBaoHanh: 'ConHan',
    nguonGoc: 'CuaHang',
    soKhung: 'RLHKD150CB12345',
    soMay: 'KD150E12345',
    trangThaiDuyet: 'DaDuyet',
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 'XE003',
    customerId: 'KH001',
    tenXe: 'YAMAHA EXCITER 155',
    bienSo: '59G1-678.90',
    namSanXuat: 2023,
    ngayMua: '2023-08-15',
    hanBaoHanh: '2026-12-31',
    mauSac: 'Xanh đen',
    trangThaiBaoHanh: 'ConHan',
    nguonGoc: 'CuaHang',
    soKhung: 'MHYEX155CB67890',
    soMay: 'EX155E67890',
    trangThaiDuyet: 'DaDuyet',
    hinhAnh: 'https://images.unsplash.com/photo-1525160354320-d8e92641c563?w=800&auto=format&fit=crop&q=80',
  },
  { id: 'XE004', customerId: 'KH002', tenXe: 'Vespa Sprint 125', bienSo: '51H-678.90', namSanXuat: 2022, ngayMua: '2022-02-14', hanBaoHanh: '2025-02-14', mauSac: 'Trắng', trangThaiBaoHanh: 'ConHan', nguonGoc: 'CuaHang', soKhung: 'VESP125CB2345678', trangThaiDuyet: 'DaDuyet' },
  { id: 'XE005', customerId: 'KH003', tenXe: 'Honda Winner X 150', bienSo: '59G1-234.56', namSanXuat: 2021, ngayMua: '2021-03-05', hanBaoHanh: '2024-03-05', mauSac: 'Đỏ đen', trangThaiBaoHanh: 'HetHan', nguonGoc: 'CuaHang', soKhung: 'RLHKW150CB3456789', trangThaiDuyet: 'DaDuyet' },
  { id: 'XE006', customerId: 'KH004', tenXe: 'Honda Lead 125', bienSo: '59F1-888.88', namSanXuat: 2022, ngayMua: '2022-04-20', hanBaoHanh: '2025-04-20', mauSac: 'Đỏ đô', trangThaiBaoHanh: 'ConHan', nguonGoc: 'CuaHang', soKhung: 'RLHKL125CB4567890', trangThaiDuyet: 'DaDuyet' },
  { id: 'XE007', customerId: 'KH005', tenXe: 'Yamaha Exciter 155 VVA', bienSo: '59S2-345.67', namSanXuat: 2022, ngayMua: '2022-05-11', hanBaoHanh: '2025-05-11', mauSac: 'Xanh GP', trangThaiBaoHanh: 'ConHan', nguonGoc: 'CuaHang', soKhung: 'MHYEX155CB5678901', trangThaiDuyet: 'DaDuyet' },
  { id: 'XE008', customerId: 'KH006', tenXe: 'Honda Vision 110', bienSo: '59V1-999.99', namSanXuat: 2023, ngayMua: '2023-06-08', hanBaoHanh: '2026-06-08', mauSac: 'Xám xi măng', trangThaiBaoHanh: 'ConHan', nguonGoc: 'CuaHang', soKhung: 'RLHKV110CB6789012', trangThaiDuyet: 'DaDuyet' },
  { id: 'XE009', customerId: 'KH007', tenXe: 'Honda Air Blade 160', bienSo: '51X1-456.78', namSanXuat: 2022, ngayMua: '2022-07-15', hanBaoHanh: '2025-07-15', mauSac: 'Đen nhám', trangThaiBaoHanh: 'ConHan', nguonGoc: 'CuaHang', soKhung: 'RLHKA160CB7890123', trangThaiDuyet: 'DaDuyet' },
  { id: 'XE010', customerId: 'KH008', tenXe: 'Yamaha Janus 125', bienSo: '59T2-123.89', namSanXuat: 2021, ngayMua: '2021-08-22', hanBaoHanh: '2024-08-22', mauSac: 'Xanh bạc', trangThaiBaoHanh: 'HetHan', nguonGoc: 'CuaHang', soKhung: 'MHYJA125CB8901234', trangThaiDuyet: 'DaDuyet' },
  { id: 'XE011', customerId: 'KH009', tenXe: 'VinFast Feliz S', bienSo: '51L1-567.89', namSanXuat: 2022, ngayMua: '2022-09-19', hanBaoHanh: '2025-09-19', mauSac: 'Bạc', trangThaiBaoHanh: 'ConHan', nguonGoc: 'CuaHang', soKhung: 'VFEL125CB9012345', trangThaiDuyet: 'DaDuyet' },
  { id: 'XE012', customerId: 'KH010', tenXe: 'Honda Vario 160', bienSo: '59U1-678.12', namSanXuat: 2023, ngayMua: '2023-10-05', hanBaoHanh: '2026-10-05', mauSac: 'Đen cam', trangThaiBaoHanh: 'ConHan', nguonGoc: 'CuaHang', soKhung: 'RLHKO160CB0123456', trangThaiDuyet: 'DaDuyet' },
];

export function renewVehicleWarranty(vehicleId: string, years: number): Vehicle | null {
  const v = mockVehicles.find(x => x.id === vehicleId);
  if (!v) return null;
  const baseDate = new Date(v.hanBaoHanh) > new Date() ? new Date(v.hanBaoHanh) : new Date();
  baseDate.setFullYear(baseDate.getFullYear() + years);
  v.hanBaoHanh = baseDate.toISOString().split('T')[0];
  v.trangThaiBaoHanh = 'ConHan';
  return v;
}

/* ───────────────────────── ORDERS (PARTS & VEHICLES) ───────────────────────── */
export const mockOrders: Order[] = [
  // ── ĐƠN 1: MUA XE MÁY HONDA SH 160I ABS (ĐÃ HOÀN THÀNH / ĐÃ GIAO) ──
  {
    id: 'DH001',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Văn An',
    soDienThoai: '0901234567',
    email: 'nguyenvanan1990@gmail.com',
    ngayDat: '2026-10-15',
    trangThai: 'HoanThanh',
    trangThaiThanhToan: 'DaThanhToan',
    kenhBan: 'TaiQuay',
    loaiDon: 'Xe',
    tongTien: 104900000,
    diaChiGiao: 'Showroom Motoshop - 123 Nguyễn Trãi, Q.5, TP.HCM',
    phuongThucThanhToan: 'ChuyenKhoan',
    maNV: 'NV02',
    tenNV: 'Nguyễn Thị Ánh',
    items: [],
    thongTinXe: {
      customerType: 'Individual',
      maXe: 'XM-HD01',
      tenXe: 'Honda SH 160i ABS 2025',
      mauSac: 'Đen mờ',
      phienBan: 'Bản Thể Thao ABS',
      dongCo: '160cc 4 van eSP+',
      giaNiemYet: 104900000,
      phiTruocBa: 5245000,
      phiDangKyBienSo: 4000000,
      tinhThanhDangKy: 'TP. Hồ Chí Minh',
      goiBaoHiem: 'Bảo hiểm TNDS Bắt buộc 1 năm',
      tongGiaTri: 104900000,
      hinhThucNhanXe: 'NhanTaiShowroom',
      showroomNhan: 'Showroom Motoshop - Chi nhánh 1 (Q.5, TP.HCM)',
      soTienCoc: 10000000,
      daNhanXe: true,
      soKhung: 'RLHKF4201RY849201',
      soMay: 'KF42E-9842103',
      bienSo: '59S1-123.45',
    } as any,
  },
  // ── ĐƠN 2: MUA PHỤ TÙNG NHỚT MOTUL 7100 (ĐÃ HOÀN THÀNH) ──
  {
    id: 'DH002',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Văn An',
    soDienThoai: '0901234567',
    email: 'nguyenvanan1990@gmail.com',
    ngayDat: '2026-10-18',
    trangThai: 'HoanThanh',
    trangThaiThanhToan: 'DaThanhToan',
    kenhBan: 'Online',
    loaiDon: 'PhuTung',
    tongTien: 255000,
    diaChiGiao: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    phuongThucThanhToan: 'TienMat',
    maNV: 'NV02',
    tenNV: 'Nguyễn Thị Ánh',
    items: [
      { tenSanPham: 'Nhớt Motul 7100 4T 10W40 1L (100% Tổng Hợp Ester)', soLuong: 1, donGia: 255000, maPhuTung: 1 },
    ],
  },
];

export const mockAppointments: Appointment[] = [
  // ── LỊCH 1: BẢO DƯỠNG ĐỊNH KỲ HOÀN THÀNH ──
  {
    id: 'LH001',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Văn An',
    soDienThoai: '0901234567',
    loaiDichVu: 'BaoDuong',
    ngayHen: '2026-10-16',
    gioHen: '09:00',
    trangThai: 'DaHoanThanh',
    ghiChu: '[GÓI BẢO DƯỠNG]: Gói Tiêu Chuẩn - Thay nhớt máy và vệ sinh buồng đốt định kỳ [Phương tiện: Honda SH 150i - BS: 59S1-123.45]',
    tenXe: 'Honda SH 150i',
    bienSo: '59S1-123.45',
    nhanVienPhuTrach: 'Lê Văn Cường (Kỹ thuật viên)',
    createdDate: '2026-10-14 10:00',
  },
  // ── LỊCH 2: BẢO DƯỠNG SẮP TỚI CHỜ TIẾP NHẬN ──
  {
    id: 'LH002',
    customerId: 'KH002',
    hoTenKH: 'Trần Thị Bích',
    soDienThoai: '0912345678',
    loaiDichVu: 'BaoDuong',
    ngayHen: '2026-10-25',
    gioHen: '10:00',
    trangThai: 'ChoXacNhan',
    ghiChu: '[GÓI BẢO DƯỠNG]: Gói Tiêu Chuẩn - Kiểm tra phanh và thay lọc gió động cơ [Phương tiện: Honda Lead 125 - BS: 59P1-888.88]',
    tenXe: 'Honda Lead 125',
    bienSo: '59P1-888.88',
    nhanVienPhuTrach: 'Chưa phân công',
    createdDate: '2026-10-20 08:30',
  },
  // ── LỊCH 3: LÁI THỬ XE MẪU CHỜ TIẾP NHẬN ──
  {
    id: 'LH003',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Văn An',
    soDienThoai: '0901234567',
    loaiDichVu: 'LaiThu',
    ngayHen: '2026-10-31',
    gioHen: '14:30',
    trangThai: 'ChoXacNhan',
    ghiChu: '[GPLX LÁI THỬ]: Số 079198004567 (Hạng A1) | [GHI CHÚ KHÁCH HÀNG]: Muốn trải nghiệm phanh ABS và cảm giác ngồi xe thực tế',
    tenXe: 'Honda SH 160i ABS 2025',
    bienSo: 'XE-LÁI-THỬ',
    nhanVienPhuTrach: 'Chưa phân công',
    createdDate: '2026-10-29 11:20',
  },
  // ── LỊCH 4: LÁI THỬ XE MẪU ĐÃ HOÀN TẤT ──
  {
    id: 'LH004',
    customerId: 'KH002',
    hoTenKH: 'Trần Thị Bích',
    soDienThoai: '0912345678',
    loaiDichVu: 'LaiThu',
    ngayHen: '2026-10-28',
    gioHen: '10:00',
    trangThai: 'DaHoanThanh',
    ghiChu: '[GPLX LÁI THỬ]: Số 081293009988 (Hạng A1) | Đã hoàn tất buổi lái thử trải nghiệm xe',
    tenXe: 'Yamaha Grande Hybrid 2025',
    bienSo: 'XE-LÁI-THỬ',
    nhanVienPhuTrach: 'Nguyễn Thị Bích (Tư vấn bán hàng)',
    createdDate: '2026-10-27 09:15',
  },
];

export const mockInsuranceContracts: InsuranceContract[] = [
  {
    id: 'BH-SH-01',
    soGCN: 'GCN-BV-2026-0912',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Văn An',
    soDienThoai: '0901234567',
    email: 'nguyenvanan1990@gmail.com',
    diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    vehicleId: 'XE002',
    tenXe: 'HONDA SH 150i (59S1 - 123.45)',
    bienSo: '59S1-123.45',
    soKhung: 'RLHKD150CB12345',
    packageType: 'TNDS_BAT_BUOC',
    tenGoi: 'BẢO HIỂM BẮT BUỘC TNDS XE MÁY',
    thoiHanNam: 1,
    phiBaoHiem: 66000,
    nhaBaoHiem: 'Bảo hiểm Bảo Việt',
    ngayCap: '2026-10-16',
    ngayBatDau: '2026-10-16',
    ngayKetThuc: '2027-10-16',
    trangThai: 'HieuLuc',
    ghiChu: 'Bảo hiểm TNDS bắt buộc theo quy định nhà nước',
  },
];

export const mockFeedbacks: Feedback[] = [
  {
    id: 'PH001',
    customerId: 'KH001',
    hoTen: 'Nguyễn Văn An',
    soDienThoai: '0901234567',
    email: 'nguyenvanan1990@gmail.com',
    diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    xeDangDung: 'Honda SH 160i ABS',
    noiDung: 'Xe chạy cực kỳ êm và bốc, phanh ABS an toàn. Dịch vụ showroom bàn giao xe rất nhiệt tình và chu đáo!',
    diemDanhGia: 5,
    ngayGui: '2026-10-16',
    loaiDanhGia: 'DichVu',
    trangThai: 'DaXuLy',
    loaiNhan: 'DanhGia',
    ghiChuXuLy: 'Đã gọi điện cảm ơn khách hàng và kích hoạt sổ bảo hành điện tử chính hãng.',
    nhanVienXuLy: 'Trần Văn Quản Lý (Giám đốc Showroom)',
    ngayXuLy: '2026-10-16',
    hinhAnhDinhKem: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'PH002',
    customerId: 'KH001',
    hoTen: 'Nguyễn Văn An',
    soDienThoai: '0901234567',
    email: 'nguyenvanan1990@gmail.com',
    diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    xeDangDung: 'Honda SH 160i ABS',
    noiDung: 'Nhớt Motul chính hãng chạy máy cực bốc và êm, đi đường dài máy rất mát. Đóng gói cẩn thận, giao nhanh!',
    diemDanhGia: 5,
    ngayGui: '2026-10-19',
    loaiDanhGia: 'SanPham',
    trangThai: 'DaXuLy',
    loaiNhan: 'DanhGia',
    productId: 'PT001',
    ghiChuXuLy: 'Cảm ơn anh đã tin dùng phụ tùng Motul tại Motoshop!',
    nhanVienXuLy: 'Nguyễn Thị Ánh (Chuyên viên Bán hàng & CSKH)',
    ngayXuLy: '2026-10-19',
    hinhAnhDinhKem: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
    ],
  },
];

export const mockProductReviews: ProductReview[] = [
  {
    id: 'RV001',
    targetId: 'XM-HD01',
    tenKhachHang: 'Nguyễn Văn An',
    soDienThoai: '0901***567',
    soSao: 5,
    ngayDanhGia: '2026-10-16',
    noiDung: 'Xe chạy cực kỳ êm và bốc, phanh ABS an toàn. Dịch vụ showroom bàn giao xe rất nhiệt tình và chu đáo!',
    daMua: true,
    dongXeDaMua: 'Honda SH 160i ABS (Đen mờ)',
  },
  {
    id: 'RV101',
    targetId: 'PT001',
    tenKhachHang: 'Nguyễn Văn An',
    soDienThoai: '0901***567',
    soSao: 5,
    ngayDanhGia: '2026-10-19',
    noiDung: 'Nhớt Motul chính hãng chạy máy cực bốc và êm, đi đường dài máy rất mát. Đóng gói cẩn thận, giao nhanh!',
    daMua: true,
    phanHoiShowroom: 'Motoshop cam kết chỉ bán dầu nhớt Motul chính hãng phân phối ủy quyền tại Việt Nam!',
    hinhAnhDinhKem: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
    ],
  },
];

export const mockSurveys: Survey[] = [
  {
    id: 'KS001',
    title: 'Khảo sát chất lượng Dịch vụ Bảo dưỡng định kỳ Motoshop 2026',
    description: 'Đánh giá chất lượng phục vụ và thái độ nhân viên kỹ thuật tại showroom Motoshop.',
    targetCustomerId: 'ALL',
    targetCustomerTier: 'ALL',
    createdDate: '01-01-2026',
    publishDate: '2026-01-01T08:00',
    startDate: '2026-01-01T08:00',
    endDate: '2026-12-31T23:59',
    status: 'DangDienRa',
    targetCount: 50,
    responseCount: 40,
    questions: [
      { id: 'q1', text: 'Mức độ hài lòng của bạn về ngoại quan và tình trạng xe mới khi nhận bàn giao (sơn xe, gương, phụ kiện, số khung/số máy)?', opts: ['Rất hài lòng (Xe sạch bóng, nguyên seal, đủ phụ kiện)', 'Hài lòng (Đạt tiêu chuẩn)', 'Bình thường', 'Chưa hài lòng'] },
      { id: 'q2', text: 'Thái độ tư vấn, hỗ trợ thủ tục hồ sơ và đăng ký xe của nhân viên bán hàng?', opts: ['Nhiệt tình, chu đáo, rất chuyên nghiệp', 'Tận tâm, đầy đủ thông tin', 'Bình thường', 'Cần cải thiện thái độ phục vụ'] },
      { id: 'q3', text: 'Bạn đã được chuyên viên hướng dẫn chi tiết về Sổ bảo hành điện tử và các mốc bảo dưỡng định kỳ?', opts: ['Đã được hướng dẫn rất chi tiết & rõ ràng', 'Đã được giải thích sơ bộ', 'Chưa được hướng dẫn'] },
      { id: 'q4', text: 'Bạn có sẵn lòng giới thiệu Showroom DailyXeMay cho người thân, bạn bè khi có nhu cầu mua xe máy không?', opts: ['Chắc chắn sẽ giới thiệu', 'Có thể', 'Chưa chắc chắn'] },
    ]
  },
  {
    id: 'KS003',
    title: 'Khảo sát đặc quyền tri ân Khách hàng VIP Xuân 2027',
    description: 'Khảo sát ý kiến đóng góp về chính sách quà tặng và cứu hộ miễn phí 24/7 dành cho hội viên thân thiết.',
    targetCustomerId: 'ALL',
    targetCustomerTier: 'VIP',
    createdDate: '20-10-2026',
    publishDate: '2026-10-20T08:00',
    startDate: '2026-12-01T08:00',
    endDate: '2027-02-28T23:59',
    status: 'SapDienRa',
    targetCount: 20,
    responseCount: 0,
    questions: [
      { id: 'q1', text: 'Mức độ hài lòng của bạn về ngoại quan và tình trạng xe mới khi nhận bàn giao (sơn xe, gương, phụ kiện, số khung/số máy)?', opts: ['Rất hài lòng (Xe sạch bóng, nguyên seal, đủ phụ kiện)', 'Hài lòng (Đạt tiêu chuẩn)', 'Bình thường', 'Chưa hài lòng'] },
      { id: 'q2', text: 'Thái độ tư vấn, hỗ trợ thủ tục hồ sơ và đăng ký xe của nhân viên bán hàng?', opts: ['Nhiệt tình, chu đáo, rất chuyên nghiệp', 'Tận tâm, đầy đủ thông tin', 'Bình thường', 'Cần cải thiện thái độ phục vụ'] },
      { id: 'q3', text: 'Bạn đã được chuyên viên hướng dẫn chi tiết về Sổ bảo hành điện tử và các mốc bảo dưỡng định kỳ?', opts: ['Đã được hướng dẫn rất chi tiết & rõ ràng', 'Đã được giải thích sơ bộ', 'Chưa được hướng dẫn'] },
      { id: 'q4', text: 'Bạn có sẵn lòng giới thiệu Showroom DailyXeMay cho người thân, bạn bè khi có nhu cầu mua xe máy không?', opts: ['Chắc chắn sẽ giới thiệu', 'Có thể', 'Chưa chắc chắn'] },
    ]
  },
  {
    id: 'KS004',
    title: 'Khảo sát đánh giá trải nghiệm phụ tùng Quý 3/2024',
    description: 'Đánh giá độ bền và độ tương thích của phụ tùng Motul, Michelin, Brembo lắp đặt tại showroom.',
    targetCustomerId: 'ALL',
    targetCustomerTier: 'ALL',
    createdDate: '01-07-2024',
    publishDate: '2024-07-01T08:00',
    startDate: '2024-07-01T08:00',
    endDate: '2024-09-30T23:59',
    status: 'DaKetThuc',
    targetCount: 20,
    responseCount: 18,
    questions: [
      { id: 'q1', text: 'Mức độ hài lòng của bạn về ngoại quan và tình trạng xe mới khi nhận bàn giao (sơn xe, gương, phụ kiện, số khung/số máy)?', opts: ['Rất hài lòng (Xe sạch bóng, nguyên seal, đủ phụ kiện)', 'Hài lòng (Đạt tiêu chuẩn)', 'Bình thường', 'Chưa hài lòng'] },
      { id: 'q2', text: 'Thái độ tư vấn, hỗ trợ thủ tục hồ sơ và đăng ký xe của nhân viên bán hàng?', opts: ['Nhiệt tình, chu đáo, rất chuyên nghiệp', 'Tận tâm, đầy đủ thông tin', 'Bình thường', 'Cần cải thiện thái độ phục vụ'] },
      { id: 'q3', text: 'Bạn đã được chuyên viên hướng dẫn chi tiết về Sổ bảo hành điện tử và các mốc bảo dưỡng định kỳ?', opts: ['Đã được hướng dẫn rất chi tiết & rõ ràng', 'Đã được giải thích sơ bộ', 'Chưa được hướng dẫn'] },
      { id: 'q4', text: 'Bạn có sẵn lòng giới thiệu Showroom DailyXeMay cho người thân, bạn bè khi có nhu cầu mua xe máy không?', opts: ['Chắc chắn sẽ giới thiệu', 'Có thể', 'Chưa chắc chắn'] },
    ]
  }
];

export const mockSurveyResponses: SurveyResponse[] = [
  {
    id: 'RSP001',
    surveyId: 'KS001',
    customerId: 'KH002',
    customerName: 'Trần Thị Bích',
    soDienThoai: '0987***221',
    bienSoXe: '59F2-678.90',
    tenXe: 'Honda SH 160i ABS',
    danhGiaChung: 'Hài lòng 😊',
    answers: {
      q1: 'Hài lòng',
      q2: 'Đúng giờ',
      q3: 'Tốt'
    },
    submittedDate: '26/10/2026'
  },
  {
    id: 'RSP002',
    surveyId: 'KS001',
    customerId: 'KH001',
    customerName: 'Nguyễn Văn An',
    soDienThoai: '0901***890',
    bienSoXe: '29K1-123.45',
    tenXe: 'Honda SH 160i ABS',
    danhGiaChung: 'Rất hài lòng 😊',
    answers: {
      q1: 'Rất hài lòng',
      q2: 'Nhanh hơn dự kiến',
      q3: 'Hiện đại'
    },
    submittedDate: '26/10/2026'
  }
];

export const mockStaffAccounts: StaffAccount[] = [
  {
    id: 'ST000',
    hoTen: 'Trần Văn Quản Lý',
    email: 'admin@motoshop.vn',
    soDienThoai: '0909999888',
    chucVu: 'Quản lý Showroom',
    vaiTro: 'SuperAdmin',
    trangThai: 'HoatDong',
    ngayThamGia: '2022-01-01',
    avatar: '/images/NV/nv1.jpg',
    gioiTinh: 'Nam',
    ngaySinh: '1985-06-15',
    diaChi: '128 Hai Bà Trưng, Phường Bến Nghé, Quận 1, TP.HCM',
    cccd: '079085001234',
    loaiNhanVien: 'Full-time',
    luongCoBan: 28000000,
    nganHang: 'Vietcombank',
    soTaiKhoan: '1012345678',
  },
  {
    id: 'ST001',
    hoTen: 'Nguyễn Thị Ánh',
    email: 'anhnguyen@motoshop.vn',
    soDienThoai: '0988777661',
    chucVu: 'Chuyên viên Tư vấn & CSKH',
    vaiTro: 'NhanVienBanHang',
    trangThai: 'HoatDong',
    ngayThamGia: '2023-01-15',
    avatar: '/images/NV/nv1.jpg',
    gioiTinh: 'Nu',
    ngaySinh: '1995-09-20',
    diaChi: '45 Lê Duẩn, Phường Bến Nghé, Quận 1, TP.HCM',
    cccd: '079095002345',
    loaiNhanVien: 'Full-time',
    luongCoBan: 14000000,
    nganHang: 'MB Bank',
    soTaiKhoan: '098877766188',
  },
  {
    id: 'ST002',
    hoTen: 'Trần Minh Hoàng',
    email: 'hoangtran@motoshop.vn',
    soDienThoai: '0988777662',
    chucVu: 'Chuyên viên Bán xe & Trả góp',
    vaiTro: 'NhanVienBanHang',
    trangThai: 'HoatDong',
    ngayThamGia: '2023-02-20',
    avatar: '/images/NV/nv2.jpg',
    gioiTinh: 'Nam',
    ngaySinh: '1993-04-12',
    diaChi: '230 Trần Hưng Đạo, Phường 2, Quận 5, TP.HCM',
    cccd: '079093003456',
    loaiNhanVien: 'Full-time',
    luongCoBan: 15000000,
    nganHang: 'Techcombank',
    soTaiKhoan: '190345678912',
  },
  {
    id: 'ST003',
    hoTen: 'Lê Thị Thu Hà',
    email: 'hale@motoshop.vn',
    soDienThoai: '0988777663',
    chucVu: 'Chuyên viên Marketing & CRM',
    vaiTro: 'NhanVienBanHang',
    trangThai: 'HoatDong',
    ngayThamGia: '2023-03-10',
    avatar: '/images/NV/nv3.jpg',
    gioiTinh: 'Nu',
    ngaySinh: '1996-11-25',
    diaChi: '88 Nguyễn Đình Chiểu, Phường Đa Kao, Quận 1, TP.HCM',
    cccd: '079096004567',
    loaiNhanVien: 'Full-time',
    luongCoBan: 14500000,
    nganHang: 'ACB',
    soTaiKhoan: '246813579',
  },
  {
    id: 'ST004',
    hoTen: 'Phạm Quốc Bảo',
    email: 'baopham@motoshop.vn',
    soDienThoai: '0988777664',
    chucVu: 'Kế toán Bán hàng & Thu ngân',
    vaiTro: 'NhanVienBanHang',
    trangThai: 'HoatDong',
    ngayThamGia: '2023-04-05',
    avatar: '/images/NV/nv4.jpg',
    gioiTinh: 'Nam',
    ngaySinh: '1994-08-18',
    diaChi: '72 Điện Biên Phủ, Phường 15, Quận Bình Thạnh, TP.HCM',
    cccd: '079094005678',
    loaiNhanVien: 'Full-time',
    luongCoBan: 13500000,
    nganHang: 'BIDV',
    soTaiKhoan: '60110000123456',
  },
  {
    id: 'ST005',
    hoTen: 'Võ Ngọc Anh',
    email: 'anhvo@motoshop.vn',
    soDienThoai: '0988777665',
    chucVu: 'Chuyên viên Tư vấn & CSKH',
    vaiTro: 'NhanVienBanHang',
    trangThai: 'HoatDong',
    ngayThamGia: '2023-05-18',
    avatar: '/images/NV/nv5.jpg',
    gioiTinh: 'Nu',
    ngaySinh: '1998-03-08',
    diaChi: '15 Võ Văn Tần, Phường Võ Thị Sáu, Quận 3, TP.HCM',
    cccd: '079098006789',
    loaiNhanVien: 'Part-time',
    luongCoBan: 8500000,
    nganHang: 'VPBank',
    soTaiKhoan: '1888222333',
  },
  {
    id: 'ST006',
    hoTen: 'Nguyễn Văn Thành',
    email: 'nguyen.thanh67@gmail.com',
    soDienThoai: '0901234567',
    chucVu: 'Kỹ thuật viên Trưởng xưởng',
    vaiTro: 'NhanVienKyThuat',
    trangThai: 'HoatDong',
    ngayThamGia: '2023-01-10',
    avatar: '/images/KT/nvkt1.png',
    gioiTinh: 'Nam',
    ngaySinh: '1987-12-05',
    diaChi: '56 Phan Đăng Lưu, Phường 5, Quận Phú Nhuận, TP.HCM',
    cccd: '079087007890',
    loaiNhanVien: 'Full-time',
    luongCoBan: 22000000,
    nganHang: 'Vietcombank',
    soTaiKhoan: '0071001234567',
  },
  {
    id: 'ST007',
    hoTen: 'Trần Minh Đức',
    email: 'tran.duc78@gmail.com',
    soDienThoai: '0912345678',
    chucVu: 'Kỹ thuật viên Bảo dưỡng định kỳ',
    vaiTro: 'NhanVienKyThuat',
    trangThai: 'HoatDong',
    ngayThamGia: '2023-02-15',
    avatar: '/images/KT/nvkt2.png',
    gioiTinh: 'Nam',
    ngaySinh: '1992-07-22',
    diaChi: '112 Cách Mạng Tháng 8, Phường 7, Quận 3, TP.HCM',
    cccd: '079092008901',
    loaiNhanVien: 'Full-time',
    luongCoBan: 16000000,
    nganHang: 'Agribank',
    soTaiKhoan: '1500205123456',
  },
  {
    id: 'ST008',
    hoTen: 'Lê Hoàng Nam',
    email: 'le.nam89@gmail.com',
    soDienThoai: '0923456789',
    chucVu: 'Kỹ thuật viên Sửa chữa máy',
    vaiTro: 'NhanVienKyThuat',
    trangThai: 'HoatDong',
    ngayThamGia: '2023-03-20',
    avatar: '/images/KT/nvkt3.png',
    gioiTinh: 'Nam',
    ngaySinh: '1991-10-30',
    diaChi: '34 Lê Văn Sỹ, Phường 13, Quận 3, TP.HCM',
    cccd: '079091009012',
    loaiNhanVien: 'Full-time',
    luongCoBan: 17500000,
    nganHang: 'MB Bank',
    soTaiKhoan: '092345678999',
  },
  {
    id: 'ST009',
    hoTen: 'Phạm Quốc Huy',
    email: 'pham.huy90@gmail.com',
    soDienThoai: '0934567890',
    chucVu: 'Thủ kho & Quản lý phụ tùng',
    vaiTro: 'NhanVienKyThuat',
    trangThai: 'HoatDong',
    ngayThamGia: '2023-04-12',
    avatar: '/images/KT/nvkt4.png',
    gioiTinh: 'Nam',
    ngaySinh: '1990-05-14',
    diaChi: '90 Hoàng Văn Thụ, Phường 4, Quận Tân Bình, TP.HCM',
    cccd: '079090010123',
    loaiNhanVien: 'Full-time',
    luongCoBan: 15500000,
    nganHang: 'Techcombank',
    soTaiKhoan: '190333444555',
  },
  {
    id: 'ST010',
    hoTen: 'Võ Thành Đạt',
    email: 'vo.dat36@gmail.com',
    soDienThoai: '0945678901',
    chucVu: 'Kỹ thuật viên Điện & Phụ tùng xe',
    vaiTro: 'NhanVienKyThuat',
    trangThai: 'HoatDong',
    ngayThamGia: '2023-05-25',
    avatar: '/images/KT/nvkt5.png',
    gioiTinh: 'Nam',
    ngaySinh: '1995-01-19',
    diaChi: '105 Cộng Hòa, Phường 12, Quận Tân Bình, TP.HCM',
    cccd: '079095011234',
    loaiNhanVien: 'Full-time',
    luongCoBan: 16500000,
    nganHang: 'TPBank',
    soTaiKhoan: '03456789001',
  },
];


/* ───────────────────────── CHART & REVENUE DATA ───────────────────────── */
export const dailyRevenueData = [
  { label: 'Thứ 2 (12/12)', doanhThu: 14500000, donHang: 18, banXe: 95900000 },
  { label: 'Thứ 3 (13/12)', doanhThu: 18200000, donHang: 22, banXe: 50490000 },
  { label: 'Thứ 4 (14/12)', doanhThu: 12800000, donHang: 15, banXe: 0 },
  { label: 'Thứ 5 (15/12)', doanhThu: 24600000, donHang: 29, banXe: 75900000 },
  { label: 'Thứ 6 (16/12)', doanhThu: 31000000, donHang: 38, banXe: 112000000 },
  { label: 'Thứ 7 (17/12)', doanhThu: 45800000, donHang: 54, banXe: 171800000 },
  { label: 'Chủ Nhật (18/12)', doanhThu: 52400000, donHang: 62, banXe: 191800000 },
];

export const weeklyRevenueData = [
  { label: 'Tuần 1 (T12)', doanhThu: 125000000, donHang: 142 },
  { label: 'Tuần 2 (T12)', doanhThu: 168000000, donHang: 189 },
  { label: 'Tuần 3 (T12)', doanhThu: 199300000, donHang: 238 },
  { label: 'Tuần 4 (T12)', doanhThu: 215000000, donHang: 260 },
];

export const monthlyRevenueData = [
  { label: 'T6/2024', doanhThu: 420000000, donHang: 450 },
  { label: 'T7/2024', doanhThu: 580000000, donHang: 590 },
  { label: 'T8/2024', doanhThu: 510000000, donHang: 520 },
  { label: 'T9/2024', doanhThu: 670000000, donHang: 710 },
  { label: 'T10/2024', doanhThu: 750000000, donHang: 820 },
  { label: 'T11/2024', doanhThu: 890000000, donHang: 940 },
  { label: 'T12/2024', doanhThu: 1050000000, donHang: 1120 },
];

export const yearlyRevenueData = [
  { label: 'Năm 2022', doanhThu: 3800000000, donHang: 4100 },
  { label: 'Năm 2023', doanhThu: 5600000000, donHang: 6200 },
  { label: 'Năm 2024', doanhThu: 7870000000, donHang: 8400 },
];

export const revenueBySource = [
  { source: 'Bán Xe Máy Mới', amount: 520000000, percent: '62%', color: '#dc2626' },
  { source: 'Phụ tùng & Phụ kiện', amount: 210000000, percent: '25%', color: '#2563eb' },
  { source: 'Bảo dưỡng & Sửa chữa', amount: 110000000, percent: '13%', color: '#16a34a' },
];

export const revenueData = monthlyRevenueData.map(m => ({ thang: m.label, doanhThu: m.doanhThu / 10, donHang: Math.round(m.donHang / 10) }));

export const serviceDistribution = [
  { name: 'Bảo dưỡng', value: 48, fill: '#dc2626' },
  { name: 'Sửa chữa', value: 31, fill: '#18181b' },
  { name: 'Lái thử xe', value: 13, fill: '#71717a' },
  { name: 'Tư vấn', value: 8, fill: '#a1a1aa' },
];

export const ageDistributionData = [
  { name: '18–25', value: 22, fill: '#dc2626' },
  { name: '26–35', value: 38, fill: '#27272a' },
  { name: '36–45', value: 25, fill: '#71717a' },
  { name: '46+', value: 15, fill: '#d4d4d8' },
];

export function formatVND(n: number | string | undefined | null): string {
  if (n == null || n === '') return '0 đ';
  const num = typeof n === 'number' ? n : Number(String(n).replace(/\D/g, ''));
  if (isNaN(num)) return '0 đ';
  return num.toLocaleString('vi-VN') + ' đ';
}

/* ───────────────────────── SUPPLIERS & PURCHASE RECEIPTS ───────────────────────── */
export interface Supplier {
  id: string;
  tenNhaCungCap: string;
  maSoThue: string;
  nguoiLienHe: string;
  soDienThoai: string;
  email: string;
  diaChi: string;
  tinhThanh?: string;
  quanHuyen?: string;
  phuongXa?: string;
  soNhaDuong?: string;
  nganHang?: string;
  soTaiKhoan?: string;
  chuKyThanhToan?: string;
  ngayHopTac?: string;
  nhomHang: string[];
  chietKhau: number; // % chiết khấu đại lý
  danhGia: number;   // 1-5 sao uy tín
  trangThai: 'DangHopTac' | 'TamNgung';
  ghiChu?: string;
  soLuongMatHang: number;
}

export interface ReceiptItem {
  id: string;
  maSanPham: string;
  tenSanPham: string;
  loai: 'PhuTung' | 'XeMay';
  donViTinh: string;
  soLuong: number;
  donGiaNhap: number;
  thanhTien: number;
}

export interface PurchaseReceipt {
  id: string;
  nhaCungCapId: string;
  tenNhaCungCap: string;
  ngayLap: string;
  ngayNhap: string;
  nguoiLap: string;
  nguoiGiaoHang?: string;
  soDienThoaiGiao?: string;
  tongTien: number;
  trangThai: 'DaNhapKho' | 'ChoDuyet' | 'DaHuy';
  ghiChu: string;
  chiTiet: ReceiptItem[];
}

export const mockSuppliers: Supplier[] = [
  {
    id: 'NCC001',
    tenNhaCungCap: 'Công ty Honda Việt Nam (HVN)',
    maSoThue: '2500150335',
    nguoiLienHe: 'Trần Minh Tuấn (Trưởng ban Phân phối)',
    soDienThoai: '0988112233',
    email: 'cr@honda.com.vn',
    tinhThanh: 'Hà Nội',
    quanHuyen: 'Quận Ba Đình',
    phuongXa: 'Phường Liễu Giai',
    soNhaDuong: 'Tòa nhà Honda Tower, 25 Liễu Giai',
    diaChi: 'Tòa nhà Honda Tower, 25 Liễu Giai, Phường Liễu Giai, Quận Ba Đình, Hà Nội',
    nganHang: 'Vietcombank',
    soTaiKhoan: '0011004567890',
    chuKyThanhToan: '60 ngày',
    ngayHopTac: '2020-03-15',
    nhomHang: ['Xe máy nguyên chiếc', 'Phụ tùng chính hãng Honda', 'Dầu nhờn Pro Honda'],
    chietKhau: 12,
    danhGia: 5.0,
    trangThai: 'DangHopTac',
    ghiChu: 'Hợp đồng đại lý ủy quyền HEAD cấp 1. Hạn mức công nợ 60 ngày.',
    soLuongMatHang: 8,
  },
  {
    id: 'NCC002',
    tenNhaCungCap: 'Công ty TNHH Yamaha Motor Việt Nam',
    maSoThue: '0100774342',
    nguoiLienHe: 'Lê Hoàng Nam (Phụ trách Đại lý KV Miền Nam)',
    soDienThoai: '0977223344',
    email: 'dealer@yamaha-motor.com.vn',
    tinhThanh: 'Hà Nội',
    quanHuyen: 'Quận Cầu Giấy',
    phuongXa: 'Phường Dịch Vọng',
    soNhaDuong: 'Số 12 Duy Tân, Khu liên hiệp Yamaha',
    diaChi: 'Số 12 Duy Tân, Khu liên hiệp Yamaha, Phường Dịch Vọng, Quận Cầu Giấy, Hà Nội',
    nganHang: 'BIDV',
    soTaiKhoan: '12010000889988',
    chuKyThanhToan: '45 ngày',
    ngayHopTac: '2021-06-20',
    nhomHang: ['Xe máy nguyên chiếc', 'Phụ tùng Yamalube chính hãng'],
    chietKhau: 11.5,
    danhGia: 4.9,
    trangThai: 'DangHopTac',
    ghiChu: 'Đại lý phân phối xe máy và phụ tùng Yamaha Town.',
    soLuongMatHang: 6,
  },
  {
    id: 'NCC003',
    tenNhaCungCap: 'Công ty TNHH Dầu nhớt Motul Châu Á (Việt Nam)',
    maSoThue: '0303889123',
    nguoiLienHe: 'Nguyễn Văn Đạt (Kinh doanh KV TP.HCM)',
    soDienThoai: '0903889123',
    email: 'sales-vn@motul.com',
    tinhThanh: 'TP. Hồ Chí Minh',
    quanHuyen: 'Quận Tân Bình',
    phuongXa: 'Phường 2',
    soNhaDuong: 'Đường số 7, KCN Tân Bình mở rộng',
    diaChi: 'Đường số 7, KCN Tân Bình mở rộng, Phường 2, Quận Tân Bình, TP. Hồ Chí Minh',
    nganHang: 'Techcombank',
    soTaiKhoan: '19034567891011',
    chuKyThanhToan: '30 ngày',
    ngayHopTac: '2022-01-10',
    nhomHang: ['Dầu nhớt', 'Chăm sóc xe & Phụ gia động cơ'],
    chietKhau: 18,
    danhGia: 5.0,
    trangThai: 'DangHopTac',
    ghiChu: 'Nhà phân phối độc quyền dòng Motul 300V, 7100, Scooter Power LE.',
    soLuongMatHang: 12,
  },
  {
    id: 'NCC004',
    tenNhaCungCap: 'Michelin Châu Á - Thái Bình Dương (Văn phòng VN)',
    maSoThue: '0309998124',
    nguoiLienHe: 'Phạm Thanh Sơn (Quản lý Phân phối Vỏ xe máy)',
    soDienThoai: '0918999124',
    email: 'tw-sales.vn@michelin.com',
    tinhThanh: 'TP. Hồ Chí Minh',
    quanHuyen: 'Quận 1',
    phuongXa: 'Phường Bến Nghé',
    soNhaDuong: 'Tầng 14, Tòa nhà Sun Wah, 115 Nguyễn Huệ',
    diaChi: 'Tầng 14, Tòa nhà Sun Wah, 115 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    nganHang: 'HSBC Việt Nam',
    soTaiKhoan: '002888999111',
    chuKyThanhToan: '30 ngày',
    ngayHopTac: '2022-08-15',
    nhomHang: ['Lốp xe chính hãng', 'Vỏ không ruột thể thao'],
    chietKhau: 15,
    danhGia: 4.8,
    trangThai: 'DangHopTac',
    ghiChu: 'Dòng sản phẩm Pilot Street 2, City Extra, MotoGP Edition.',
    soLuongMatHang: 8,
  },
  {
    id: 'NCC005',
    tenNhaCungCap: 'Brembo Racing & Braking Systems VN (Đại diện ủy quyền)',
    maSoThue: '0314567890',
    nguoiLienHe: 'Võ Minh Trí (Giám đốc Kỹ thuật & Bán hàng)',
    soDienThoai: '0909123789',
    email: 'info@brembovietnam.vn',
    tinhThanh: 'TP. Hồ Chí Minh',
    quanHuyen: 'Quận 7',
    phuongXa: 'Phường Tân Phong',
    soNhaDuong: 'Số 88 Nguyễn Đức Cảnh, KĐT Phú Mỹ Hưng',
    diaChi: 'Số 88 Nguyễn Đức Cảnh, KĐT Phú Mỹ Hưng, Phường Tân Phong, Quận 7, TP. Hồ Chí Minh',
    nganHang: 'VietinBank',
    soTaiKhoan: '108001234567',
    chuKyThanhToan: '15 ngày',
    ngayHopTac: '2023-04-01',
    nhomHang: ['Phanh & Thắng đĩa', 'Phụ kiện hiệu năng cao', 'Dầu thắng thể thao'],
    chietKhau: 14,
    danhGia: 4.9,
    trangThai: 'DangHopTac',
    ghiChu: 'Cung cấp heo dầu 2 piston, 4 piston, cùm tay thắng RCS Corsa Corta.',
    soLuongMatHang: 10,
  },
  {
    id: 'NCC006',
    tenNhaCungCap: 'Công ty CP Phụ tùng Daichi Việt Nam',
    maSoThue: '0106789123',
    nguoiLienHe: 'Đỗ Quốc Hùng (Trưởng phòng Cung ứng Tổng hợp)',
    soDienThoai: '0936789123',
    email: 'kinhdoanh@daichi.vn',
    tinhThanh: 'Hà Nội',
    quanHuyen: 'Quận Cầu Giấy',
    phuongXa: 'Phường Dịch Vọng Hậu',
    soNhaDuong: 'Số 45 Trần Thái Tông',
    diaChi: 'Số 45 Trần Thái Tông, Phường Dịch Vọng Hậu, Quận Cầu Giấy, Hà Nội',
    nganHang: 'MB Bank',
    soTaiKhoan: '0680199998888',
    chuKyThanhToan: '30 ngày',
    ngayHopTac: '2021-11-20',
    nhomHang: ['Bugi', 'Truyền động', 'Lọc gió', 'Phụ tùng thay thế định kỳ'],
    chietKhau: 20,
    danhGia: 4.7,
    trangThai: 'DangHopTac',
    ghiChu: 'Nhà phân phối sỉ chính hãng Bugi NGK, Dây curoa Bando, Nhông sên dĩa DID.',
    soLuongMatHang: 24,
  },
];

export const mockPurchaseReceipts: PurchaseReceipt[] = [
  {
    id: 'PN-2025001',
    nhaCungCapId: 'NCC003',
    tenNhaCungCap: 'Công ty TNHH Dầu nhớt Motul Châu Á (Việt Nam)',
    ngayLap: '2025-02-15 08:30',
    ngayNhap: '2025-02-15 14:00',
    nguoiLap: 'Lê Văn Kỹ Thuật',
    nguoiGiaoHang: 'Đặng Quốc Huy (Tài xế giao vận Motul)',
    soDienThoaiGiao: '0933 445 566',
    tongTien: 31200000,
    trangThai: 'DaNhapKho',
    ghiChu: 'Nhập bổ sung đợt đầu tháng cho kho dịch vụ bảo dưỡng và quầy bán lẻ lẻ',
    chiTiet: [
      {
        id: 'CT001',
        maSanPham: 'PT001',
        tenSanPham: 'Nhớt Motul 7100 4T 10W40 1L Full Synthetic',
        loai: 'PhuTung',
        donViTinh: 'Chai',
        soLuong: 100,
        donGiaNhap: 220000,
        thanhTien: 22000000,
      },
      {
        id: 'CT002',
        maSanPham: 'PT011',
        tenSanPham: 'Nhớt Motul Scooter Expert LE 10W40 0.8L',
        loai: 'PhuTung',
        donViTinh: 'Chai',
        soLuong: 80,
        donGiaNhap: 115000,
        thanhTien: 9200000,
      },
    ],
  },
  {
    id: 'PN-2025002',
    nhaCungCapId: 'NCC001',
    tenNhaCungCap: 'Công ty Honda Việt Nam (HVN)',
    ngayLap: '2025-02-18 09:15',
    ngayNhap: '2025-02-19 10:30',
    nguoiLap: 'Nguyễn Thị Sale',
    nguoiGiaoHang: 'Vũ Mạnh Cường (Xe lồng Honda Express)',
    soDienThoaiGiao: '0912 334 455',
    tongTien: 428000000,
    trangThai: 'DaNhapKho',
    ghiChu: 'Đợt nhận xe máy trưng bày showroom và giao cho khách đã đặt cọc trước',
    chiTiet: [
      {
        id: 'CT003',
        maSanPham: 'XM001',
        tenSanPham: 'Honda SH 160i ABS 2025 (Đen mờ / Trắng bạc)',
        loai: 'XeMay',
        donViTinh: 'Chiếc',
        soLuong: 3,
        donGiaNhap: 84000000,
        thanhTien: 252000000,
      },
      {
        id: 'CT004',
        maSanPham: 'XM004',
        tenSanPham: 'Honda Air Blade 125 Smartkey 2025',
        loai: 'XeMay',
        donViTinh: 'Chiếc',
        soLuong: 4,
        donGiaNhap: 44000000,
        thanhTien: 176000000,
      },
    ],
  },
  {
    id: 'PN-2025003',
    nhaCungCapId: 'NCC006',
    tenNhaCungCap: 'Công ty CP Phụ tùng Daichi Việt Nam',
    ngayLap: '2025-02-22 10:00',
    ngayNhap: '2025-02-22 15:30',
    nguoiLap: 'Lê Văn Kỹ Thuật',
    nguoiGiaoHang: 'Lê Thanh Bình (Logistics Daichi)',
    soDienThoaiGiao: '0978 991 122',
    tongTien: 25500000,
    trangThai: 'DaNhapKho',
    ghiChu: 'Nhập phụ tùng hao mòn định kỳ phục vụ mùa bảo dưỡng xe đầu năm',
    chiTiet: [
      {
        id: 'CT005',
        maSanPham: 'PT004',
        tenSanPham: 'Bugi NGK Laser Iridium Moto CPR8EAIX-9',
        loai: 'PhuTung',
        donViTinh: 'Cái',
        soLuong: 40,
        donGiaNhap: 180000,
        thanhTien: 7200000,
      },
      {
        id: 'CT006',
        maSanPham: 'PT007',
        tenSanPham: 'Dây Curoa Bando Bando V-Belt SH/AirBlade',
        loai: 'PhuTung',
        donViTinh: 'Sợi',
        soLuong: 30,
        donGiaNhap: 310000,
        thanhTien: 9300000,
      },
      {
        id: 'CT007',
        maSanPham: 'PT008',
        tenSanPham: 'Nhông Sên Dĩa DID Vàng 428HD Exciter/Winner',
        loai: 'PhuTung',
        donViTinh: 'Bộ',
        soLuong: 25,
        donGiaNhap: 360000,
        thanhTien: 9000000,
      },
    ],
  },
  {
    id: 'PN-2025004',
    nhaCungCapId: 'NCC004',
    tenNhaCungCap: 'Michelin Châu Á - Thái Bình Dương (Văn phòng VN)',
    ngayLap: '2025-02-25 14:20',
    ngayNhap: '2025-02-26 09:00',
    nguoiLap: 'Lê Văn Kỹ Thuật',
    nguoiGiaoHang: 'Nguyễn Tấn Đạt (Kho vận Michelin Sóng Thần)',
    soDienThoaiGiao: '0908 667 788',
    tongTien: 38250000,
    trangThai: 'ChoDuyet',
    ghiChu: 'Lô lốp Michelin City Extra vỏ trước/sau xe tay ga và xe số. Đang đợi kiểm tra quy cách ngoại quan.',
    chiTiet: [
      {
        id: 'CT008',
        maSanPham: 'PT006',
        tenSanPham: 'Lốp Xe Michelin City Extra 90/90-14 Không Ruột',
        loai: 'PhuTung',
        donViTinh: 'Cái',
        soLuong: 45,
        donGiaNhap: 510000,
        thanhTien: 22950000,
      },
      {
        id: 'CT009',
        maSanPham: 'PT012',
        tenSanPham: 'Lốp Xe Michelin Pilot Street 2 110/70-17 Bánh Sau',
        loai: 'PhuTung',
        donViTinh: 'Cái',
        soLuong: 20,
        donGiaNhap: 765000,
        thanhTien: 15300000,
      },
    ],
  },
  {
    id: 'PN-2025005',
    nhaCungCapId: 'NCC005',
    tenNhaCungCap: 'Brembo Racing & Braking Systems VN (Đại diện ủy quyền)',
    ngayLap: '2025-02-26 16:45',
    ngayNhap: '2025-02-27 11:00',
    nguoiLap: 'Trần Văn Quản Lý',
    nguoiGiaoHang: 'Trương Hoàng Phúc',
    soDienThoaiGiao: '0945 112 233',
    tongTien: 54000000,
    trangThai: 'ChoDuyet',
    ghiChu: 'Linh kiện phanh cao cấp Brembo chính hãng kèm thẻ xác thực QR code chống hàng giả',
    chiTiet: [
      {
        id: 'CT010',
        maSanPham: 'PT003',
        tenSanPham: 'Heo Dầu Brembo 2 Piston Đối Xứng Chính Hãng',
        loai: 'PhuTung',
        donViTinh: 'Bộ',
        soLuong: 15,
        donGiaNhap: 2600000,
        thanhTien: 39000000,
      },
      {
        id: 'CT011',
        maSanPham: 'PT015',
        tenSanPham: 'Đĩa Thắng Thể Thao Brembo Oro 260mm',
        loai: 'PhuTung',
        donViTinh: 'Cái',
        soLuong: 10,
        donGiaNhap: 1500000,
        thanhTien: 15000000,
      },
    ],
  },
];

/* ───────────────────────── BẢO HÀNH & LỊCH HẸN BẢO HÀNH (WARRANTY) ───────────────────────── */
export interface WarrantyRecord {
  id: string;
  vehicleId: string;
  lanThu: number;
  ngayThucHien: string;
  noiDung: string;
  chiPhi: number;
  loaiChiPhi: 'BaoHanh' | 'CoPhi';
  trangThai: 'HoanThanh' | 'DangXuLy';
  chiNhanh?: string;
  maLichHen?: string;
  soKm?: number;
  kyThuatVien?: string;
  chiTietLinhKien?: string[];
}

export type WarrantyAppointmentStatus =
  | 'ChoTiepNhan'     // Chờ tiếp nhận (khách vừa gửi form)
  | 'DaXacNhan'       // Đã xác nhận (nhân viên xác nhận lịch)
  | 'DaTiepNhan'      // Đã tiếp nhận xe (xe đã đến xưởng)
  | 'DangKiemTra'     // Đang kiểm tra (KTV kiểm tra & thẩm định)
  | 'SuaChuaBH'       // Đang sửa chữa bảo hành (nhánh Được bảo hành)
  | 'KiemTraSauSuaBH' // Kiểm tra sau sửa chữa (nhánh Được bảo hành)
  | 'TuChoi'          // Từ chối bảo hành (chờ khách quyết định)
  | 'BaoGia'          // Báo giá sửa chữa (khách đồng ý sửa có phí)
  | 'SuaCoPhi'        // Đang sửa chữa có phí
  | 'KiemTraSauSuaCoPhi' // Kiểm tra sau sửa có phí
  | 'DongYeuCau'      // Đóng yêu cầu / Trả xe (khách không sửa)
  | 'HoanTat'         // Hoàn tất (In phiếu BH hoặc In hóa đơn)
  | 'DaHuy';          // Đã hủy

export interface TechnicalAssessment {
  boPhanLoi: string[];
  soKmThucTe: number;
  hinhAnhKyThuat: string[];
  yKienKyThuat: string;
  ngayDanhGia?: string;
  kyThuatVien?: string;
}

export type WarrantyDecision =
  | 'DuocBaoHanh'     // Được bảo hành (0đ)
  | 'TuChoi_DongYSua' // Từ chối BH, khách đồng ý sửa chữa (có phí)
  | 'TuChoi_KhongSua' // Từ chối BH, khách không sửa chữa (trả xe)
  | null;

export interface WarrantyAppointment {
  id: string; // #BH-120426-01
  customerId: string;
  hoTenKH: string;
  soDienThoai: string;
  vehicleId: string;
  tenXe: string;
  bienSo: string;
  odoKhachBao: number;
  vanDeGapPhai: string[];
  moTaChiTiet: string;
  hinhAnhKhachHang: string[];
  ngayHen: string;
  gioHen: string;
  chiNhanh: string;
  trangThai: WarrantyAppointmentStatus;
  
  // Đánh giá kỹ thuật
  danhGiaKyThuat?: TechnicalAssessment;
  quyetDinh?: WarrantyDecision;
  
  // Chi phí & Báo giá
  chiPhiBaoGia?: number;
  chiPhiThucTe?: number;
  
  // In ấn
  inPhieuLoai?: 'PhieuBaoHanh' | 'HoaDonSuaChua' | 'BienBanTraXe';
  ngayTao: string;
  ngayHoanTat?: string;
}

export const WARRANTY_BRANCHES = [
  'Hệ thống Honda Ủy nhiệm - Chi nhánh 1 (Quận 1, TP. HCM)',
  'Hệ thống Honda Ủy nhiệm - Chi nhánh 2 (Bình Thạnh, TP. HCM)',
  'Hệ thống Honda Ủy nhiệm - Chi nhánh 3 (Quận 7, TP. HCM)',
  'Hệ thống Honda Ủy nhiệm - Chi nhánh 4 (Thủ Đức, TP. HCM)',
];

export const WARRANTY_ISSUES_LIST = [
  'Động cơ / Động cơ kêu to',
  'Phanh (Thắng) trước/sau',
  'Hệ thống điện / Đèn / Còi',
  'Giảm xóc (Phuộc)',
  'Hệ thống truyền động (Côn/Xích)',
  'Ốp nhựa / Rò rỉ dầu / Khác',
];

export interface ExtendedWarrantyPackage {
  id: string;
  tenGoi: string;
  moTa: string;
  thoiGianThem: string;
  kmThem: string;
  giaGoc: number;
  giaUuDai: number;
  quyenLoi: string[];
  isPopular?: boolean;
  isEligible?: boolean;
  ineligibleReason?: string;
}

export const EXTENDED_WARRANTY_PACKAGES: ExtendedWarrantyPackage[] = [
  {
    id: 'GOI_TIEU_CHUAN_1Y',
    tenGoi: 'GÓI TIÊU CHUẨN (1 NĂM)',
    moTa: 'Bảo vệ xe thêm 1 năm hoặc 10.000 km tiếp theo.',
    thoiGianThem: '12 tháng',
    kmThem: '10.000 km',
    giaGoc: 450000,
    giaUuDai: 350000,
    isPopular: true,
    isEligible: true,
    quyenLoi: [
      'Khắc phục lỗi động cơ, hệ thống điện, IC, giảm xóc... miễn phí tại mọi chi nhánh',
      'Cứu hộ giao thông khẩn cấp 24/7 toàn quốc',
    ],
  },
  {
    id: 'GOI_TOAN_DIEN_2Y',
    tenGoi: 'GÓI TOÀN DIỆN (2 NĂM)',
    moTa: 'Bảo vệ xe thêm 2 năm hoặc 20.000 km tiếp theo.',
    thoiGianThem: '24 tháng',
    kmThem: '20.000 km',
    giaGoc: 750000,
    giaUuDai: 600000,
    isEligible: true,
    quyenLoi: [
      'Bao gồm toàn bộ quyền lợi gói 1 năm',
      'Tặng 2 lượt bảo dưỡng định kỳ miễn phí',
      'Cứu hộ giao thông khẩn cấp 24/7',
    ],
  },
  {
    id: 'GOI_CAO_CAP_3Y',
    tenGoi: 'GÓI CAO CẤP (3 NĂM)',
    moTa: 'Chăm sóc toàn diện 3 năm hoặc 30.000 km tiếp theo.',
    thoiGianThem: '36 tháng',
    kmThem: '30.000 km',
    giaGoc: 1050000,
    giaUuDai: 850000,
    isEligible: false,
    ineligibleReason: 'Chỉ áp dụng cho xe mua dưới 12 tháng (Xe của bạn đã sử dụng 2 năm)',
    quyenLoi: [
      'Bảo vệ trọn đời linh kiện đắt tiền',
      'Tặng 4 lượt bảo dưỡng định kỳ miễn phí',
      'Cứu hộ toàn quốc 24/7',
    ],
  },
  {
    id: 'GOI_CON_TAY_XE_SO',
    tenGoi: 'GÓI ĐẶC BIỆT CÔN TAY/XE SỐ',
    moTa: 'Gói chuyên sâu cho xe côn tay & xe số 12 tháng.',
    thoiGianThem: '12 tháng',
    kmThem: '10.000 km',
    giaGoc: 650000,
    giaUuDai: 500000,
    isEligible: false,
    ineligibleReason: 'Chỉ dành cho xe côn tay & xe số (Xe của bạn là xe tay ga)',
    quyenLoi: [
      'Bảo dưỡng bộ côn nồi ly hợp chuyên sâu',
      'Kiểm tra nhông sên dĩa định kỳ',
      'Cứu hộ 24/7',
    ],
  },
  // Backward compatibility alias:
  {
    id: 'CARE_PLUS_1Y',
    tenGoi: 'Gói Care+ 1 Năm Mở Rộng',
    moTa: 'Bảo vệ xe thêm 1 năm hoặc 10.000 km khi gia hạn sớm hôm nay!',
    thoiGianThem: '12 tháng',
    kmThem: '10.000 km',
    giaGoc: 450000,
    giaUuDai: 350000,
    isEligible: true,
    quyenLoi: [
      'Khắc phục lỗi động cơ, hệ thống điện, IC, giảm xóc...',
      'Cứu hộ 24/7',
    ],
  },
  {
    id: 'CARE_PLUS_2Y',
    tenGoi: 'Gói Care+ Premium 2 Năm',
    moTa: 'Gói chăm sóc toàn diện 2 năm hoặc 20.000 km, tối ưu chi phí bảo dưỡng.',
    thoiGianThem: '24 tháng',
    kmThem: '20.000 km',
    giaGoc: 750000,
    giaUuDai: 600000,
    isEligible: true,
    quyenLoi: [
      'Bao gồm toàn bộ quyền lợi gói 1 năm',
      'Tặng 2 lượt bảo dưỡng định kỳ',
    ],
  },
];

export interface VehicleServiceHistoryRecord {
  id: string;
  vehicleId: string;
  ngayThucHien: string;
  tenDichVu: string;
  chiNhanh: string;
  soKm: number;
  ketQua: 'Dat' | 'PhatHienCanThiep';
  ghiChu?: string;
}

export const mockVehicleServiceHistories: Record<string, VehicleServiceHistoryRecord[]> = {
  XE001: [
    {
      id: 'LSDV-004',
      vehicleId: 'XE001',
      ngayThucHien: '10/06/2026',
      tenDichVu: 'Bảo dưỡng định kỳ lần 3 (Tại CN1 - Quận 1)',
      chiNhanh: 'CN1 - Quận 1',
      soKm: 11200,
      ketQua: 'Dat',
    },
    {
      id: 'LSDV-003',
      vehicleId: 'XE001',
      ngayThucHien: '20/01/2026',
      tenDichVu: 'Sửa chữa/thay thế dầu máy (Tại CN1 - Quận 1)',
      chiNhanh: 'CN1 - Quận 1',
      soKm: 7500,
      ketQua: 'Dat',
    },
    {
      id: 'LSDV-002',
      vehicleId: 'XE001',
      ngayThucHien: '15/09/2025',
      tenDichVu: 'Bảo dưỡng định kỳ lần 2 (Tại CN1 - Quận 1)',
      chiNhanh: 'CN1 - Quận 1',
      soKm: 4800,
      ketQua: 'Dat',
    },
    {
      id: 'LSDV-001',
      vehicleId: 'XE001',
      ngayThucHien: '10/11/2024',
      tenDichVu: 'Bảo dưỡng định kỳ lần 1 (Tại CN1 - Quận 1)',
      chiNhanh: 'CN1 - Quận 1',
      soKm: 1000,
      ketQua: 'Dat',
    },
  ],
  XE001_FAIL: [
    {
      id: 'LSDV-FAIL-002',
      vehicleId: 'XE001',
      ngayThucHien: '10/06/2026',
      tenDichVu: 'Sửa chữa/Thay thế ngoài hệ thống (Thay thế bình ắc quy ngoài tại cơ sở không chính hãng)',
      chiNhanh: 'Cơ sở bên ngoài',
      soKm: 11200,
      ketQua: 'PhatHienCanThiep',
      ghiChu: 'Phát hiện can thiệp bên ngoài',
    },
    {
      id: 'LSDV-FAIL-001',
      vehicleId: 'XE001',
      ngayThucHien: '20/01/2026',
      tenDichVu: 'Bảo dưỡng định kỳ lần 1 (Tại CN Q.1)',
      chiNhanh: 'CN1 - Quận 1',
      soKm: 4800,
      ketQua: 'Dat',
      ghiChu: 'Mất lịch sử bảo dưỡng định kỳ lần 2 và lần 3 trong hệ thống',
    },
  ],
};

export const mockWarrantyRecords: WarrantyRecord[] = [
  {
    id: 'WREC-002',
    vehicleId: 'XE001',
    lanThu: 2,
    ngayThucHien: '20/06/2026',
    noiDung: 'Khắc phục tiếng ồn phuộc trước & kiểm tra cổ phốt',
    chiPhi: 0,
    loaiChiPhi: 'BaoHanh',
    trangThai: 'HoanThanh',
    chiNhanh: 'CN 1 - Quận 1',
    maLichHen: '#BH-090925-04',
    soKm: 12000,
    kyThuatVien: 'Trần Văn Nam',
    chiTietLinhKien: ['Phốt phuộc dầu chính hãng', 'Bạc đạn cổ lái'],
  },
  {
    id: 'WREC-001',
    vehicleId: 'XE001',
    lanThu: 1,
    ngayThucHien: '10/12/2025',
    noiDung: 'Thay thế cảm biến oxy khí thải và vệ sinh kim phun PGM-FI',
    chiPhi: 0,
    loaiChiPhi: 'BaoHanh',
    trangThai: 'HoanThanh',
    chiNhanh: 'CN 1 - Quận 1',
    maLichHen: '#BH-070725-01',
    soKm: 6500,
    kyThuatVien: 'Nguyễn Văn Minh',
    chiTietLinhKien: ['Cảm biến oxy PGM-FI', 'Dung dịch vệ sinh kim phun Honda'],
  },
];

export const mockWarrantyAppointments: WarrantyAppointment[] = [];

/* ───────────────────────── ADMIN BẢO HÀNH (MOCK CHO ẢNH 1 - 8) ───────────────────────── */
export interface WarrantyExtensionTransaction {
  id: string; // MĐJ00001
  ngayGiaHan: string; // 29/12/2023
  khachHang: string; // Nguyễn Văn Minh / Khách hàng
  soDienThoai: string; // 59T2-XXXXX / 0987******
  xeBienSo: string; // Honda Vision - 29F1-234.56
  goiGiaHan: string; // Gói gia hạn Tiêu chuẩn (1 năm)
  soTien: number; // 1200000
  nguon: 'TrucTuyen' | 'TaiShowroom';
  nhanVien: string; // Nguyễn Văn A / Nguyễn Viên
  thoiHanMoi: string; // 29/12/2024
}

export type AdminWarrantyClaimStatus = 'ChoXuLy' | 'DaTiepNhan' | 'DangSuaChua' | 'HoanThanh' | 'TuChoi' | 'DaXacNhan' | 'ChoPhuTung' | 'KiemTraXong' | 'DaHuy';

export interface AdminWarrantyClaim {
  id: string; // YCBH00156
  ngayGui: string; // 20/10/2026
  khachHang: string; // Nguyễn Văn Minh
  soDienThoai: string; // 0987******
  customerId?: string;
  xeBienSo: string; // Honda Vision - 29F1-234.56
  vehicleId?: string;
  maLichHen?: string;
  ngayHen?: string;
  gioHen?: string;
  chiNhanh?: string;
  noiDung: string; // Xe đi bị giật, kêu to ở nồi
  nhanVienPhuTrach: string; // Nguyễn Văn Hùng
  trangThai: AdminWarrantyClaimStatus;
  currentStep: number; // 1 -> 6

  // Bước 1
  b1_khachDaDenShowroom?: boolean;
  b1_xacNhanDungXeBienSo?: boolean;
  b1_bienSoThucTe?: string;
  b1_soKmHienTai?: number;
  b1_ghiChuNgoaiQuan?: string;
  b1_dayDuGiayTo?: boolean;
  b1_hinhAnhKhachGui?: string[];

  // Bước 2
  b2_heThongSuCo?: string[];
  b2_chiTietLoi?: string;
  b2_deXuatHuongXuLy?: string;
  b2_phuTungDuKien?: Array<{ ten: string; soLuong: number; tinhTrang: string }>;
  b2_hinhAnhKiemTra?: string[];

  // Bước 3
  b3_cheDoBaoHanh?: 'MienPhi' | 'CoPhi';
  b3_hangMucChiPhi?: Array<{
    ten: string;
    soLuong: number;
    donGia: number;
    thanhTien: number;
    doiTuongChiTra: 'HangBaoHanh' | 'KhachHang';
  }>;
  b3_tongChiPhi?: number;
  b3_chiPhiBaoHanhChiTra?: number;
  b3_khachThanhToan?: number;
  b3_thoiGianHoanThanhDuKien?: string;
  b3_ktvPhuTrach?: string;

  // Bước 4
  b4_hangXeXacNhan?: boolean;
  b4_khachHangDongY?: boolean;
  b4_ghiChuDuyet?: string;
  b4_nguoiDuyet?: string;
  b4_minhChungDuyet?: string[];

  // Bước 5
  b5_ktvChinh?: string;
  b5_hoTro?: string;
  b5_thoiGianBatDau?: string;
  b5_thoiGianHoanThanhDuKien?: string;
  b5_nhatKyCongViec?: string;
  b5_hangMucThiCong?: Array<{
    hangMuc: string;
    phuTung: string;
    trangThai: 'DaThayThe' | 'DangThucHien' | 'ChuaThucHien';
    nguoiXacNhan: string;
  }>;
  b5_hinhAnhThiCong?: string[];
  b5_danhGiaSauSuaChua?: boolean;

  // Bước 6
  b6_nguoiNhanXe?: string;
  b6_sdtNguoiNhan?: string;
  b6_thoiGianBanGiaoThucTe?: string;
  b6_xacNhanChayThuHaiLong?: boolean;
  b6_xacNhanBanGiaoPhuTungCu?: boolean;
  b6_xacNhanHuongDanBaoHanh?: boolean;
  b6_khachKyNhan?: boolean;
  b6_yKienKhachHang?: string;
  b6_daCapNhatLichSu?: boolean;
  b6_daGuiTinNhan?: boolean;
}

export const mockWarrantyExtensionTransactions: WarrantyExtensionTransaction[] = [];

export const mockAdminWarrantyClaims: AdminWarrantyClaim[] = [];
