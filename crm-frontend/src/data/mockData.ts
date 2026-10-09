/* ───────────────────────── TYPES ───────────────────────── */
export type CustomerStatus = 'HoatDong' | 'BiKhoa';
export type OrderStatus = 'ChoDuyet' | 'DaXacNhan' | 'DangGiao' | 'HoanThanh' | 'DaHuy' | 'ChoGiaoXe';
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
  trangThaiBaoHanh: 'ConHan' | 'HetHan' | 'ChuaCo' | 'KhongApDung'; soKhung?: string; hinhAnh?: string;
  trangThaiDuyet?: 'ChoDuyet' | 'DaDuyet' | 'TuChoi';
  nguonGoc?: 'CuaHang' | 'NgoaiHeThong'; // Mua tại cửa hàng vs Xe mua ngoài hệ thống
  ngayMua?: string;
  soMay?: string;
  anhCaVet?: string; // Ảnh chụp giấy tờ / Cà vẹt xe
  bienSoChoDuyet?: string; // Biển số khách cập nhật đang chờ phê duyệt
  trangThaiDuyetBienSo?: 'ChoCapNhat' | 'ChoDuyet' | 'DaDuyet'; // Trạng thái quy trình biển số
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

export function formatVietnameseLicensePlate(input: string): string {
  if (!input) return '';
  const clean = input.toUpperCase().replace(/[\s\-\.]/g, '');

  const m5SingleLetter = clean.match(/^([0-9]{2}[A-Z])([0-9]{3})([0-9]{2})$/);
  if (m5SingleLetter) {
    return `${m5SingleLetter[1]} - ${m5SingleLetter[2]}.${m5SingleLetter[3]}`;
  }

  const m5DoubleSeries = clean.match(/^([0-9]{2}[A-Z][0-9A-Z])([0-9]{3})([0-9]{2})$/);
  if (m5DoubleSeries) {
    return `${m5DoubleSeries[1]} - ${m5DoubleSeries[2]}.${m5DoubleSeries[3]}`;
  }

  const m4SingleLetter = clean.match(/^([0-9]{2}[A-Z])([0-9]{4})$/);
  if (m4SingleLetter) {
    return `${m4SingleLetter[1]} - ${m4SingleLetter[2]}`;
  }

  const m4DoubleSeries = clean.match(/^([0-9]{2}[A-Z][0-9A-Z])([0-9]{4})$/);
  if (m4DoubleSeries) {
    return `${m4DoubleSeries[1]} - ${m4DoubleSeries[2]}`;
  }

  if (clean.length >= 4) {
    const mPartial = clean.match(/^([0-9]{2}[A-Z][0-9A-Z]?)(.*)$/);
    if (mPartial) {
      const series = mPartial[1];
      const rest = mPartial[2];
      if (rest.length > 3) {
        return `${series} - ${rest.slice(0, 3)}.${rest.slice(3, 5)}`;
      } else if (rest.length > 0) {
        return `${series} - ${rest}`;
      }
    }
  }

  return clean;
}

export function isValidLicensePlate(plate: string): boolean {
  if (!plate || !plate.trim()) return false;
  const clean = plate.toUpperCase().replace(/[\s\-\.]/g, '');
  return /^[0-9]{2}[A-Z][0-9A-Z]?[0-9]{4,5}$/.test(clean);
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
  checklist: VehicleChecklist;
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
  ghiChu?: string;
  lyDoHuy?: string;
  maLichHen?: string;
  qrCodeUrl?: string;
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
  nhanVienXuLy?: string;
  ngayXuLy?: string;
  hinhAnhDinhKem?: string[];
  productId?: string;
  productName?: string;
  productImage?: string;
  productType?: 'PhuTung' | 'XeMau' | 'DichVu';
  editCount?: number;
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
  status: SurveyStatus; // KS08: Tự động cập nhật Nháp -> Sắp diễn ra -> Đang diễn ra -> Đã kết thúc
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
  answers: Record<string, string>;
  submittedDate: string;
}

/* ───────────────────────── PARTS CATALOG ───────────────────────── */
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
    hinhAnh: 'https://images.unsplash.com/photo-1635773054018-22c6630f9a2e?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1609136689989-d2b51aef6e4e?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1600706432502-77894a4ff495?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1558618047-f4e70e926b8b?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1614201152709-70c0e3e28b31?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1589134734703-46142c943dfd?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1563720223185-11003d516935?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1617191735082-2c8d17f8c28f?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=500&auto=format',
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
    hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format',
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
  // ── ĐƠN HÀNG XE MỚI (KHỚP MOCKUP ẢNH 2) ──
  {
    id: 'MS-100234',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    email: 'minhanh.nguyen@email.com',
    ngayDat: '2026-05-12',
    trangThai: 'DangGiao',
    trangThaiThanhToan: 'DaThanhToan',
    kenhBan: 'Online',
    loaiDon: 'Xe',
    tongTien: 22000000,
    diaChiGiao: 'Showroom Autora - Chi nhánh 1',
    items: [],
    maNV: 'NV02',
    tenNV: 'Nguyễn Thị Ánh',
    phuongThucThanhToan: 'ChuyenKhoan',
    thongTinXe: {
      customerType: 'Individual',
      maXe: 'XE001',
      tenXe: 'XE MÁY VINFAST EVO 200',
      mauSac: 'Đen trắng',
      phienBan: 'Bản Tiêu Chuẩn',
      giaNiemYet: 22000000,
      tongGiaTri: 22000000,
    } as any,
  },
  {
    id: 'MS-098432',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    email: 'minhanh.nguyen@email.com',
    ngayDat: '2026-01-20',
    trangThai: 'HoanThanh',
    trangThaiThanhToan: 'DaThanhToan',
    kenhBan: 'TaiQuay',
    loaiDon: 'Xe',
    tongTien: 115000000,
    diaChiGiao: 'Showroom Autora - 123 Nguyễn Trãi, Q.5',
    items: [],
    maNV: 'NV02',
    tenNV: 'Nguyễn Thị Ánh',
    phuongThucThanhToan: 'ChuyenKhoan',
    thongTinXe: {
      customerType: 'Individual',
      maXe: 'XE002',
      tenXe: 'HONDA SH 150i',
      mauSac: 'Đỏ đen',
      phienBan: 'Bản Thể Thao ABS',
      giaNiemYet: 115000000,
      tongGiaTri: 115000000,
    } as any,
  },
  {
    id: 'DH-XE-001',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    email: 'minhanh.nguyen@email.com',
    ngayDat: '2026-10-04',
    trangThai: 'ChoGiaoXe',
    trangThaiThanhToan: 'DaCoc',
    kenhBan: 'Online',
    loaiDon: 'Xe',
    tongTien: 104900000,
    diaChiGiao: 'Showroom DailyXeMay - Chi nhánh 1 (Tại quầy)',
    items: [],
    maNV: 'NV02',
    tenNV: 'Nguyễn Thị Ánh',
    phuongThucThanhToan: 'ChuyenKhoan',
    maLichHen: 'HEN-XE-8492',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HEN-XE-8492',
    ghiChu: 'Khách đặt cọc online 2.000.000đ, hẹn nhận xe ngày 07/10/2026 khung giờ 09:30.',
    thongTinXe: {
      customerType: 'Individual',
      idCardTaxNo: '079090123456',
      customerNotes: 'Lắp thêm cảng sau và thảm lót chân cao su',
      maXe: 'XM-HD01',
      tenXe: 'Honda SH 160i ABS 2025',
      mauSac: 'Đen mờ',
      phienBan: 'Bản Thể Thao ABS',
      dongCo: '156.9cc eSP+ 4 van',
      soKhungVIN: 'RLHKD160CB1234567',
      soMay: 'KF12E-1234567',
      giaNiemYet: 95900000,
      phiTruocBa: 4795000,
      phiDangKyBienSo: 4000000,
      tinhThanhDangKy: 'TP. Hồ Chí Minh',
      goiBaoHiem: 'Bảo hiểm TNDS Bắt buộc 1 năm + Vật chất xe',
      phiBaoHiem: 1205000,
      khuyenMai: 1000000,
      tongGiaTri: 104900000,
      soTienDatCoc: 2000000,
      ngayDatCoc: '2026-10-04',
      soTienConLai: 102900000,
      phuongThucThanhToan: 'ChuyenKhoan',
      taiKhoanNhan: 'Vietcombank: 1012345678 (CTY DAILYXEMAY)',
      trangThaiDonHang: 'ChoGiaoXe',
      hinhThucGiao: 'Showroom',
      ngayGiaoXe: '2026-10-07',
      khungGioGiao: '09:30 - 11:30',
      diaChiGiao: 'Showroom DailyXeMay - 123 Lê Văn Sỹ, P.13, Q.3, TP.HCM',
      checklist: {
        xacThucKH: true,
        thuThapCCCD: true,
        kyHopDong: true,
        nhapSoKhungVIN: true,
        dangKyBienSo: false,
        thuTienCoc: true,
        hoSoVay: false,
        capBaoHiem: true,
        kiemTraPDI: true,
        banGiaoXe: false,
      },
    },
  },
  {
    id: 'DH-XE-002',
    customerId: 'KH002',
    hoTenKH: 'Trần Thị Bích',
    soDienThoai: '0912345678',
    email: 'tranthibich95@gmail.com',
    ngayDat: '2026-09-28',
    trangThai: 'HoanThanh',
    trangThaiThanhToan: 'DaThanhToan',
    kenhBan: 'TaiQuay',
    loaiDon: 'Xe',
    tongTien: 84680000,
    diaChiGiao: 'Showroom DailyXeMay (Đã bàn giao)',
    items: [],
    maNV: 'NV03',
    tenNV: 'Trần Minh Hoàng',
    phuongThucThanhToan: 'ChuyenKhoan',
    maLichHen: 'HEN-XE-7120',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HEN-XE-7120',
    ghiChu: 'Đã thanh toán 100%, hoàn tất thủ tục đăng ký biển số và bàn giao xe thành công.',
    thongTinXe: {
      customerType: 'Individual',
      idCardTaxNo: '079195009876',
      customerNotes: 'Khách hàng nữ, hỗ trợ hướng dẫn tính năng mở khóa thông minh',
      maXe: 'XM-PI01',
      tenXe: 'Vespa Sprint 125 ABS',
      mauSac: 'Trắng Innocenza',
      phienBan: 'Bản Tiêu Chuẩn',
      dongCo: '124.5cc i-Get 3V',
      soKhungVIN: 'VESP125CB2345678',
      soMay: 'VP12E-2345678',
      giaNiemYet: 77800000,
      phiTruocBa: 3890000,
      phiDangKyBienSo: 4000000,
      tinhThanhDangKy: 'TP. Hồ Chí Minh',
      goiBaoHiem: 'Bảo hiểm TNDS Bắt buộc 2 năm',
      phiBaoHiem: 120000,
      khuyenMai: 1130000,
      tongGiaTri: 84680000,
      soTienDatCoc: 84680000,
      ngayDatCoc: '2026-09-28',
      soTienConLai: 0,
      phuongThucThanhToan: 'ChuyenKhoan',
      taiKhoanNhan: 'BIDV: 1234567890 (DAILYXEMAY POS)',
      trangThaiDonHang: 'HoanThanh',
      hinhThucGiao: 'Showroom',
      ngayGiaoXe: '2026-09-28',
      khungGioGiao: '14:00 - 16:00',
      diaChiGiao: 'Showroom DailyXeMay - 123 Lê Văn Sỹ, P.13, Q.3, TP.HCM',
      checklist: {
        xacThucKH: true,
        thuThapCCCD: true,
        kyHopDong: true,
        nhapSoKhungVIN: true,
        dangKyBienSo: true,
        thuTienCoc: true,
        hoSoVay: false,
        capBaoHiem: true,
        kiemTraPDI: true,
        banGiaoXe: true,
      },
    },
  },
  {
    id: 'DH-XE-003',
    customerId: 'KH003',
    hoTenKH: 'Lê Hoàng Cường',
    soDienThoai: '0923456789',
    email: 'lehoangcuong88@gmail.com',
    ngayDat: '2026-10-05',
    trangThai: 'ChoDuyet',
    trangThaiThanhToan: 'DaCoc',
    kenhBan: 'Online',
    loaiDon: 'Xe',
    tongTien: 60250000,
    diaChiGiao: 'Showroom DailyXeMay - Chi nhánh 1',
    items: [],
    maNV: 'NV04',
    tenNV: 'Lê Thị Thu Hà',
    phuongThucThanhToan: 'ChuyenKhoan',
    maLichHen: 'HEN-XE-9104',
    qrCodeUrl: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=HEN-XE-9104',
    ghiChu: 'Khách đặt cọc online 2.000.000đ giữ xe Exciter 155 VVA ABS, hẹn nhận xe ngày 08/10/2026.',
    thongTinXe: {
      customerType: 'Individual',
      idCardTaxNo: '079088001122',
      customerNotes: 'Kiểm tra kỹ tem Monster Energy trước khi bàn giao',
      maXe: 'XM-YM01',
      tenXe: 'Yamaha Exciter 155 VVA ABS',
      mauSac: 'Xanh GP Monster',
      phienBan: 'Bản Giới Hạn ABS',
      dongCo: '155cc 4 van VVA',
      giaNiemYet: 55000000,
      phiTruocBa: 2750000,
      phiDangKyBienSo: 2000000,
      tinhThanhDangKy: 'TP. Hồ Chí Minh',
      goiBaoHiem: 'Bảo hiểm TNDS 1 năm',
      phiBaoHiem: 66000,
      khuyenMai: 566000,
      tongGiaTri: 60250000,
      soTienDatCoc: 2000000,
      ngayDatCoc: '2026-10-05',
      soTienConLai: 58250000,
      phuongThucThanhToan: 'ChuyenKhoan',
      trangThaiDonHang: 'ChoDuyet',
      hinhThucGiao: 'Showroom',
      ngayGiaoXe: '2026-10-08',
      khungGioGiao: '15:00 - 17:00',
      diaChiGiao: 'Showroom DailyXeMay',
      checklist: {
        xacThucKH: true,
        thuThapCCCD: true,
        kyHopDong: false,
        nhapSoKhungVIN: false,
        dangKyBienSo: false,
        thuTienCoc: true,
        hoSoVay: false,
        capBaoHiem: false,
        kiemTraPDI: false,
        banGiaoXe: false,
      },
    },
  },

  // ── ĐƠN HÀNG PHỤ TÙNG (KHỚP MOCKUP ẢNH 3) ──
  {
    id: 'MS-009842',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    ngayDat: '2026-05-15',
    trangThai: 'HoanThanh',
    trangThaiThanhToan: 'DaThanhToan',
    kenhBan: 'Online',
    loaiDon: 'PhuTung',
    tongTien: 1250000,
    diaChiGiao: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    phuongThucThanhToan: 'ChuyenKhoan',
    items: [
      {
        tenSanPham: 'Lốp xe Michelin Pilot Street 2',
        soLuong: 1,
        donGia: 1250000,
        maPhuTung: 10,
        hinhAnh: 'https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=500&auto=format',
      } as any,
    ],
  },
  {
    id: 'MS-008311',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    ngayDat: '2026-04-28',
    trangThai: 'HoanThanh',
    trangThaiThanhToan: 'DaThanhToan',
    kenhBan: 'Online',
    loaiDon: 'PhuTung',
    tongTien: 850000,
    diaChiGiao: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    phuongThucThanhToan: 'ChuyenKhoan',
    items: [
      {
        tenSanPham: 'Má phanh dầu Brembo',
        soLuong: 1,
        donGia: 850000,
        maPhuTung: 6,
        hinhAnh: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=500&auto=format',
      } as any,
    ],
  },
  {
    id: 'MS-007502',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    ngayDat: '2026-03-10',
    trangThai: 'DaHuy',
    trangThaiThanhToan: 'ChuaThanhToan',
    kenhBan: 'Online',
    loaiDon: 'PhuTung',
    tongTien: 680000,
    diaChiGiao: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    phuongThucThanhToan: 'TienMat',
    items: [
      {
        tenSanPham: 'Nhông sên dĩa DID',
        soLuong: 1,
        donGia: 680000,
        maPhuTung: 13,
        hinhAnh: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format',
      } as any,
    ],
  },
  {
    id: 'DH001',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    ngayDat: '2024-11-15',
    trangThai: 'HoanThanh',
    trangThaiThanhToan: 'DaThanhToan',
    kenhBan: 'TaiQuay',
    loaiDon: 'PhuTung',
    tongTien: 312000,
    diaChiGiao: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    phuongThucThanhToan: 'TienMat',
    maNV: 'NV02',
    tenNV: 'Nguyễn Thị Ánh',
    items: [
      { tenSanPham: 'Nhớt Motul 7100 4T 10W40 1L', soLuong: 1, donGia: 255000, maPhuTung: 1 },
      { tenSanPham: 'Bugi NGK Iridium Laser CPR8EAIX-9', soLuong: 1, donGia: 57000, maPhuTung: 8 },
    ],
  },
  {
    id: 'DH002',
    customerId: 'KH002',
    hoTenKH: 'Trần Thị Bích',
    soDienThoai: '0912345678',
    ngayDat: '2024-12-03',
    trangThai: 'DangGiao',
    trangThaiThanhToan: 'DaThanhToan',
    kenhBan: 'Online',
    loaiDon: 'PhuTung',
    tongTien: 1650000,
    diaChiGiao: '45 Nguyễn Huệ, Q.1, TP.HCM',
    phuongThucThanhToan: 'ChuyenKhoan',
    items: [{ tenSanPham: 'Lốp Michelin Pilot Street 2 110/70-12', soLuong: 1, donGia: 1650000, maPhuTung: 10 }],
  },
  {
    id: 'DH003',
    customerId: 'KH004',
    hoTenKH: 'Phạm Thị Duyên',
    soDienThoai: '0934567890',
    ngayDat: '2024-12-10',
    trangThai: 'ChoDuyet',
    trangThaiThanhToan: 'ChuaThanhToan',
    kenhBan: 'Online',
    loaiDon: 'PhuTung',
    tongTien: 1105000,
    diaChiGiao: '23 CMT8, Q.3, TP.HCM',
    phuongThucThanhToan: 'TienMat',
    items: [
      { tenSanPham: 'Bóng đèn pha LED Philips Ultinon Essential Moto HS1', soLuong: 1, donGia: 315000, maPhuTung: 14 },
      { tenSanPham: 'Má phanh đĩa trước Brembo Carbon Ceramic', soLuong: 1, donGia: 790000, maPhuTung: 6 },
    ],
  },
  {
    id: 'DH004',
    customerId: 'KH005',
    hoTenKH: 'Hoàng Văn Giang',
    soDienThoai: '0945678901',
    ngayDat: '2024-12-12',
    trangThai: 'HoanThanh',
    trangThaiThanhToan: 'DaThanhToan',
    kenhBan: 'TaiQuay',
    loaiDon: 'PhuTung',
    tongTien: 510000,
    diaChiGiao: '56 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    phuongThucThanhToan: 'TienMat',
    maNV: 'NV03',
    tenNV: 'Trần Minh Hoàng',
    items: [{ tenSanPham: 'Bộ nhông sên dĩa D.I.D 428D Vàng (130L)', soLuong: 1, donGia: 510000, maPhuTung: 13 }],
  },
  {
    id: 'DH005',
    customerId: 'KH007',
    hoTenKH: 'Vũ Minh Hải',
    soDienThoai: '0967890123',
    ngayDat: '2024-12-14',
    trangThai: 'DaHuy',
    trangThaiThanhToan: 'ChuaThanhToan',
    kenhBan: 'Online',
    loaiDon: 'PhuTung',
    tongTien: 450000,
    diaChiGiao: '34 Nguyễn Đình Chiểu, Phú Nhuận, TP.HCM',
    phuongThucThanhToan: 'ChuyenKhoan',
    items: [{ tenSanPham: 'Dây curoa Bando V-Belt chính hãng', soLuong: 1, donGia: 450000, maPhuTung: 12 }],
  },
];

/* ───────────────────────── APPOINTMENTS (5 CRM TRANSACTIONS + VEHICLE PICKUP) ───────────────────────── */
export const mockAppointments: Appointment[] = [
  // Lịch hẹn đón tiếp khách nhận xe mới (D. BÁN XE)
  {
    id: 'LH006',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Văn An',
    soDienThoai: '0901234567',
    loaiDichVu: 'NhanXe',
    ngayHen: '2026-10-07',
    gioHen: '09:30',
    trangThai: 'DaXacNhan',
    ghiChu: '[NHẬN XE MỚI]: Khách đã cọc online 2.000.000đ giữ xe Honda SH 160i ABS (Mã lịch: HEN-XE-8492). Đã giữ 1 xe trong kho.',
    tenXe: 'Honda SH 160i ABS 2025',
    bienSo: 'CHỜ BẤM BIỂN',
    nhanVienPhuTrach: 'Nguyễn Thị Ánh (Tư vấn bán hàng)',
    createdDate: '2026-10-04 14:10',
    maLichHen: 'HEN-XE-8492',
    maDonHangXe: 'DH-XE-001',
    mauXe: 'Đen mờ',
    phienBan: 'Bản Thể Thao ABS',
    soTienCoc: 2000000,
    daThanhToan100: false,
    soKhungVIN: 'RLHKD160CB1234567',
    soMay: 'KF12E-1234567',
  },
  {
    id: 'LH-1012',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    loaiDichVu: 'SuaChua',
    ngayHen: '2026-10-12',
    gioHen: '14:00',
    trangThai: 'DaXacNhan',
    ghiChu: 'SỬA CHỮA: THAY XÍCH & LỐP XE | Cơ sở 1 - 123 Nguyễn Trãi, Q.5',
    tenXe: 'Honda SH 150i',
    bienSo: '59S1-123.45',
    nhanVienPhuTrach: 'Lê Văn Cường (Kỹ thuật viên)',
    createdDate: '2026-10-08 10:00',
  },
  {
    id: 'LH-1017',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    loaiDichVu: 'SuaChua',
    ngayHen: '2026-10-17',
    gioHen: '09:30',
    trangThai: 'ChoXacNhan',
    ghiChu: 'SỬA CHỮA: KIỂM TRA HỆ THỐNG PHANH | Đang đợi nhân viên duyệt lịch | Cơ sở 1 - 123 Nguyễn Trãi, Q.5',
    tenXe: 'Yamaha Exciter 155',
    bienSo: '59G1-678.90',
    nhanVienPhuTrach: 'Chưa phân công',
    createdDate: '2026-10-09 08:30',
  },
  {
    id: 'LH-1020',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    loaiDichVu: 'SuaChua',
    ngayHen: '2026-10-20',
    gioHen: '15:30',
    trangThai: 'DaHuy',
    ghiChu: 'SỬA CHỮA: THAY BÓNG ĐÈN PHA | Cơ sở 2 - 456 Lê Lợi, Q.1 | Lý do hủy: Khách hàng yêu cầu hủy lịch',
    tenXe: 'VinFast EVO 200',
    bienSo: '59Y-155.55',
    nhanVienPhuTrach: 'Trần Văn Long (Kỹ thuật viên)',
    createdDate: '2026-10-07 14:00',
  },
  {
    id: 'LH-1027',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    loaiDichVu: 'SuaChua',
    ngayHen: '2026-10-27',
    gioHen: '10:00',
    trangThai: 'DaXacNhan',
    ghiChu: 'SỬA CHỮA: BẢO TRÌ ĐỘNG CƠ | Cơ sở 1 - 123 Nguyễn Trãi, Q.5',
    tenXe: 'Yamaha Exciter 155',
    bienSo: '59G1-678.90',
    nhanVienPhuTrach: 'Lê Văn Cường (Kỹ thuật viên)',
    createdDate: '2026-10-09 11:00',
  },
  { id: 'LH001', customerId: 'KH001', hoTenKH: 'Nguyễn Minh Anh', soDienThoai: '0901234567', loaiDichVu: 'BaoDuong', ngayHen: '2026-10-12', gioHen: '14:00', trangThai: 'DaXacNhan', ghiChu: '[GÓI BẢO DƯỠNG]: Gói Tiêu Chuẩn | Bảo dưỡng định kỳ xe Honda SH 150i', tenXe: 'Honda SH 150i', bienSo: '59S1-123.45', nhanVienPhuTrach: 'Lê Văn Cường (Kỹ thuật viên)', createdDate: '2026-10-04 10:00' },
  { id: 'LH002', customerId: 'KH002', hoTenKH: 'Trần Thị Bích', soDienThoai: '0912345678', loaiDichVu: 'SuaChua', ngayHen: '2026-10-06', gioHen: '10:30', trangThai: 'ChoXacNhan', ghiChu: '[TÌNH TRẠNG XE]: Phanh kêu / bó phanh / mất phanh | Phanh trước kêu nhẹ, kiểm tra vệ sinh nồi xe Vespa', tenXe: 'Vespa Sprint 125', bienSo: '51H-678.90', nhanVienPhuTrach: 'Chưa phân công', createdDate: '2026-10-05 08:30' },
  { id: 'LH003', customerId: 'KH003', hoTenKH: 'Lê Hoàng Cường', soDienThoai: '0923456789', loaiDichVu: 'LaiThu', ngayHen: '2026-10-07', gioHen: '14:00', trangThai: 'DaXacNhan', ghiChu: '[GPLX LÁI THỬ]: Số 790123456789 (Hạng A1) | Đăng ký lái thử xe Yamaha Exciter 155 VVA thế hệ mới', tenXe: 'Yamaha Exciter 155 VVA ABS', bienSo: 'XE-LÁI-THỬ', nhanVienPhuTrach: 'Trần Thị Mai (Tư vấn bán hàng)', createdDate: '2026-10-04 15:20' },
  { id: 'LH004', customerId: 'KH006', hoTenKH: 'Đặng Thị Phương Thảo', soDienThoai: '0956789012', loaiDichVu: 'BaoDuong', ngayHen: '2026-10-03', gioHen: '08:30', trangThai: 'DaHoanThanh', ghiChu: '[GÓI BẢO DƯỠNG]: Gói Tiêu Chuẩn (Cấp 1) (150.000₫) | Bảo dưỡng định kỳ 5.000km và rửa xe', tenXe: 'Honda Vision 110', bienSo: '59V1-999.99', nhanVienPhuTrach: 'Lê Văn Cường (Kỹ thuật viên)', createdDate: '2026-10-02 09:15' },
  { id: 'LH005', customerId: 'KH009', hoTenKH: 'Đỗ Khoa Nam', soDienThoai: '0989012345', loaiDichVu: 'SuaChua', ngayHen: '2026-10-08', gioHen: '15:00', trangThai: 'ChoXacNhan', ghiChu: '[TÌNH TRẠNG XE]: Hệ thống điện / đèn / còi không hoạt động | Kiểm tra lỗi còi và hệ thống phanh tái sinh', tenXe: 'VinFast Feliz S', bienSo: '51L1-567.89', nhanVienPhuTrach: 'Chưa phân công', createdDate: '2026-10-05 09:00' },
];

/* ───────────────────────── MOTORBIKE INSURANCE CONTRACTS (BHX01 - BHX05) ───────────────────────── */
export const mockInsuranceContracts: InsuranceContract[] = [
  // ── XE 1: VINFAST EVO 200 (59Y - 155.55) ──
  {
    id: 'BH-VF-01',
    soGCN: 'GCN-MIC-2026-1001',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    email: 'minhanh.nguyen@email.com',
    diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    vehicleId: 'XE001',
    tenXe: 'VINFAST EVO 200 (59Y - 155.55)',
    bienSo: '59Y-155.55',
    soKhung: 'VFEVO200CB15555',
    packageType: 'TNDS_BAT_BUOC',
    tenGoi: 'BẢO HIỂM BẮT BUỘC TNDS XE MÁY',
    thoiHanNam: 1,
    phiBaoHiem: 66000,
    nhaBaoHiem: 'Bảo hiểm MIC',
    ngayCap: '2026-10-07',
    ngayBatDau: '2026-10-07',
    ngayKetThuc: '2027-10-07',
    trangThai: 'HieuLuc',
    ghiChu: 'Bảo hiểm TNDS bắt buộc theo quy định nhà nước',
  },
  {
    id: 'BH-VF-02',
    soGCN: 'GCN-MIC-2026-1002',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    email: 'minhanh.nguyen@email.com',
    diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    vehicleId: 'XE001',
    tenXe: 'VINFAST EVO 200 (59Y - 155.55)',
    bienSo: '59Y-155.55',
    soKhung: 'VFEVO200CB15555',
    packageType: 'TAI_NAN_NGUOI',
    tenGoi: 'BẢO HIỂM TAI NẠN NGƯỜI NGỒI TRÊN XE',
    thoiHanNam: 1,
    phiBaoHiem: 20000,
    nhaBaoHiem: 'Bảo hiểm MIC',
    ngayCap: '2026-10-07',
    ngayBatDau: '2026-10-07',
    ngayKetThuc: '2027-10-07',
    trangThai: 'HieuLuc',
    ghiChu: 'Bảo hiểm tai nạn cho 02 người ngồi trên xe máy',
  },

  // ── XE 2: HONDA SH 150i (59S1 - 123.45) ──
  {
    id: 'BH-SH-01',
    soGCN: 'GCN-BV-2025-0912',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    email: 'minhanh.nguyen@email.com',
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
    ngayCap: '2025-11-12',
    ngayBatDau: '2025-11-12',
    ngayKetThuc: '2026-11-12',
    trangThai: 'HieuLuc',
    ghiChu: 'Sắp hết hạn (Còn 35 ngày)',
  },
  {
    id: 'BH-SH-02',
    soGCN: 'GCN-PVI-2025-1105',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    email: 'minhanh.nguyen@email.com',
    diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    vehicleId: 'XE002',
    tenXe: 'HONDA SH 150i (59S1 - 123.45)',
    bienSo: '59S1-123.45',
    soKhung: 'RLHKD150CB12345',
    packageType: 'VAT_CHAT_TOAN_DIEN',
    tenGoi: 'BẢO HIỂM TỰ NGUYỆN XE MÁY',
    thoiHanNam: 1,
    phiBaoHiem: 150000,
    nhaBaoHiem: 'Bảo hiểm PVI',
    ngayCap: '2025-12-15',
    ngayBatDau: '2025-12-15',
    ngayKetThuc: '2026-12-15',
    trangThai: 'HieuLuc',
  },

  // ── XE 3: YAMAHA EXCITER 155 (59G1 - 678.90) ──
  {
    id: 'BH-EX-01',
    soGCN: 'GCN-PVI-2025-0610',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    email: 'minhanh.nguyen@email.com',
    diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    vehicleId: 'XE003',
    tenXe: 'YAMAHA EXCITER 155 (59G1 - 678.90)',
    bienSo: '59G1-678.90',
    soKhung: 'MHYEX155CB67890',
    packageType: 'VAT_CHAT_XE',
    tenGoi: 'BẢO HIỂM VẬT CHẤT & TAI NẠN XE MÁY',
    thoiHanNam: 1,
    phiBaoHiem: 450000,
    nhaBaoHiem: 'Bảo hiểm PVI',
    ngayCap: '2025-09-15',
    ngayBatDau: '2025-09-15',
    ngayKetThuc: '2026-09-15',
    trangThai: 'HetHan',
    ghiChu: 'Đã quá hạn từ 15/09/2026',
  },
  {
    id: 'BH001',
    soGCN: 'GCN-BV-2026-0812',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Minh Anh',
    soDienThoai: '0901234567',
    email: 'nguyenvanan1990@gmail.com',
    diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    vehicleId: 'XE001',
    tenXe: 'HONDA VISION 110',
    bienSo: '59A1-12345',
    soKhung: 'RLHKV110CB12345',
    soMay: 'KV110E12345',
    packageType: 'TNDS_BAT_BUOC',
    tenGoi: 'TNDS bắt buộc',
    thoiHanNam: 1,
    phiBaoHiem: 66000,
    nhaBaoHiem: 'Tổng Công ty Bảo hiểm Bảo Việt',
    ngayCap: '2026-10-01',
    ngayBatDau: '2026-10-01',
    ngayKetThuc: '2027-10-01',
    trangThai: 'HieuLuc',
    ghiChu: 'Cấp chứng nhận bảo hiểm TNDS bắt buộc theo xe Honda Vision 110.',
  },
  {
    id: 'BH002',
    soGCN: 'GCN-PVI-2025-0452',
    customerId: 'KH002',
    hoTenKH: 'Trần Thị Bích',
    soDienThoai: '0912345678',
    email: 'tranthibich95@gmail.com',
    diaChi: '45 Nguyễn Huệ, Q.1, TP.HCM',
    vehicleId: 'XE002',
    tenXe: 'Vespa Sprint 125',
    bienSo: '51H-678.90',
    soKhung: 'VESP125CB2345678',
    soMay: 'VM125E123456',
    packageType: 'VAT_CHAT_XE',
    tenGoi: 'Bảo hiểm Vật chất / Thân xe máy',
    thoiHanNam: 2,
    phiBaoHiem: 850000,
    nhaBaoHiem: 'Bảo hiểm PVI Sài Gòn',
    ngayCap: '2024-02-14',
    ngayBatDau: '2024-02-14',
    ngayKetThuc: '2026-02-14',
    trangThai: 'HieuLuc',
    ghiChu: 'Khách hàng VIP đăng ký gói 2 năm bảo vệ thân vỏ xe Vespa.',
  },
  {
    id: 'BH003',
    soGCN: 'GCN-PTI-2024-0789',
    customerId: 'KH003',
    hoTenKH: 'Lê Hoàng Cường',
    soDienThoai: '0923456789',
    email: 'lehoangcuong88@gmail.com',
    diaChi: '78 Trần Phú, Q.5, TP.HCM',
    vehicleId: 'XE003',
    tenXe: 'Honda Winner X 150',
    bienSo: '59G1-234.56',
    soKhung: 'RLHKW150CB3456789',
    soMay: 'WN150E234567',
    packageType: 'TNDS_BAT_BUOC',
    tenGoi: 'Bảo hiểm TNDS Bắt buộc xe máy',
    thoiHanNam: 1,
    phiBaoHiem: 66000,
    nhaBaoHiem: 'Bảo hiểm Bưu điện (PTI)',
    ngayCap: '2024-03-05',
    ngayBatDau: '2024-03-05',
    ngayKetThuc: '2025-03-05',
    trangThai: 'HetHan',
    ghiChu: 'Hợp đồng TNDS năm trước đã hết hạn. Đang chờ khách hàng tái tục.',
  },
  {
    id: 'BH004',
    soGCN: 'GCN-MIC-2026-1102',
    customerId: 'KH004',
    hoTenKH: 'Phạm Thị Duyên',
    soDienThoai: '0934567890',
    email: 'phamduyen98@gmail.com',
    diaChi: '23 CMT8, Q.3, TP.HCM',
    vehicleId: 'XE004',
    tenXe: 'Honda Lead 125',
    bienSo: '59F1-888.88',
    soKhung: 'RLHKL125CB4567890',
    soMay: 'LD125E890123',
    packageType: 'TNDS_BAT_BUOC',
    tenGoi: 'Bảo hiểm TNDS Bắt buộc xe máy',
    thoiHanNam: 1,
    phiBaoHiem: 66000,
    nhaBaoHiem: 'Bảo hiểm Quân Đội (MIC)',
    ngayCap: '2025-04-20',
    ngayBatDau: '2025-04-20',
    ngayKetThuc: '2026-04-20',
    trangThai: 'HieuLuc',
    ghiChu: 'Cấp bảo hiểm TNDS bắt buộc theo xe Lead 125.',
  },
  {
    id: 'BH005',
    soGCN: 'GCN-BV-2026-2391',
    customerId: 'KH005',
    hoTenKH: 'Hoàng Văn Giang',
    soDienThoai: '0945678901',
    email: 'hoangvanem92@gmail.com',
    diaChi: '56 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    vehicleId: 'XE005',
    tenXe: 'Yamaha Exciter 155 VVA',
    bienSo: '59S2-345.67',
    soKhung: 'MHYEX155CB5678901',
    soMay: 'EX155E456789',
    packageType: 'TAI_NAN_NGUOI',
    tenGoi: 'Bảo hiểm Tai nạn người ngồi trên xe',
    thoiHanNam: 2,
    phiBaoHiem: 38000,
    nhaBaoHiem: 'Tổng Công ty Bảo hiểm Bảo Việt',
    ngayCap: '2026-10-04',
    ngayBatDau: '2026-10-04',
    ngayKetThuc: '2028-10-04',
    trangThai: 'ChoDuyet',
    ghiChu: 'Khách hàng gửi yêu cầu đăng ký bảo hiểm tai nạn lái phụ xe qua Cổng cá nhân.',
  },
  {
    id: 'BH006',
    soGCN: 'GCN-BV-2026-2392',
    customerId: 'KH006',
    hoTenKH: 'Đặng Thị Phương Thảo',
    soDienThoai: '0956789012',
    email: 'dangphuongthao96@gmail.com',
    diaChi: '89 Võ Văn Tần, Q.3, TP.HCM',
    vehicleId: 'XE008',
    tenXe: 'Honda Vision 110',
    bienSo: '59V1-999.99',
    soKhung: 'RLHKV110CB6789012',
    packageType: 'TNDS_BAT_BUOC',
    tenGoi: 'Bảo hiểm TNDS Bắt buộc xe máy',
    thoiHanNam: 2,
    phiBaoHiem: 120000,
    nhaBaoHiem: 'Tổng Công ty Bảo hiểm Bảo Việt',
    ngayCap: '2026-10-05',
    ngayBatDau: '2026-10-05',
    ngayKetThuc: '2028-10-05',
    trangThai: 'ChoDuyet',
    ghiChu: 'Yêu cầu gia hạn thêm 2 năm TNDS bắt buộc từ khách hàng.',
  },
];

/* ───────────────────────── FEEDBACK ───────────────────────── */
export const mockFeedbacks: Feedback[] = [
  {
    id: 'PH001',
    customerId: 'KH001',
    hoTen: 'Nguyễn Văn An',
    soDienThoai: '0901234567',
    email: 'nguyenvanan1990@gmail.com',
    diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    xeDangDung: 'Honda SH 160i ABS',
    noiDung: 'Dịch vụ bảo dưỡng định kỳ rất nhanh chóng, nhân viên kỹ thuật thay nhớt và siết phuộc cẩn thận. Showroom có phòng chờ máy lạnh tiện nghi!',
    diemDanhGia: 5,
    ngayGui: '2024-11-16',
    loaiDanhGia: 'DichVu',
    trangThai: 'DaXuLy',
    loaiNhan: 'DanhGia',
    ghiChuXuLy: 'Đã gọi điện cảm ơn khách hàng và gửi voucher giảm giá 10% lần sau.',
    nhanVienXuLy: 'Trần Văn Quản Lý (Giám đốc Showroom)',
    ngayXuLy: '2024-11-17',
    hinhAnhDinhKem: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'PH002',
    customerId: 'KH002',
    hoTen: 'Trần Thị Bích',
    soDienThoai: '0912345678',
    email: 'tranthibich95@gmail.com',
    diaChi: '45 Nguyễn Huệ, Q.1, TP.HCM',
    xeDangDung: 'Vespa Sprint 125',
    noiDung: 'Đơn hàng lốp Michelin giao chậm hơn dự kiến 1 ngày do bên vận chuyển, may là đồ bọc gói kỹ và đúng kích thước chuẩn cho xe Vespa.',
    diemDanhGia: 4,
    ngayGui: '2024-12-04',
    loaiDanhGia: 'SanPham',
    trangThai: 'ChoXuLy',
    loaiNhan: 'KhieuNai',
    hinhAnhDinhKem: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'PH003',
    customerId: 'KH004',
    hoTen: 'Phạm Thị Duyên',
    soDienThoai: '0934567890',
    email: 'phamduyen98@gmail.com',
    diaChi: '23 CMT8, Q.3, TP.HCM',
    xeDangDung: 'Honda Lead 125',
    noiDung: 'Đèn LED Philips và má phanh Brembo mua tại cửa hàng dùng cực thích, bóp phanh êm ru và đi đêm rất an toàn.',
    diemDanhGia: 5,
    ngayGui: '2024-12-05',
    loaiDanhGia: 'SanPham',
    trangThai: 'DaXuLy',
    loaiNhan: 'DanhGia',
    ghiChuXuLy: 'Đã hỗ trợ kiểm tra định kỳ miễn phí cho khách.',
    nhanVienXuLy: 'Lê Hoàng Nam (Kỹ thuật viên Sửa chữa máy)',
    ngayXuLy: '2024-12-06',
  },
  {
    id: 'PH004',
    customerId: 'KH005',
    hoTen: 'Hoàng Văn Giang',
    soDienThoai: '0945678901',
    email: 'hoangvanem92@gmail.com',
    diaChi: '56 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    xeDangDung: 'Yamaha Exciter 155 VVA',
    noiDung: 'Bộ nhông sên dĩa DID vàng lắp vào chạy rất êm, nhân viên kỹ thuật căn xích chuẩn xác. Sẽ tiếp tục ủng hộ showroom!',
    diemDanhGia: 5,
    ngayGui: '2024-12-10',
    loaiDanhGia: 'SanPham',
    trangThai: 'DaXuLy',
    loaiNhan: 'DanhGia',
    nhanVienXuLy: 'Lê Thị Thu Hà (Chuyên viên Bán hàng & CSKH)',
    ngayXuLy: '2024-12-11',
  },
  {
    id: 'PH005',
    customerId: 'KH006',
    hoTen: 'Đặng Thị Phương Thảo',
    soDienThoai: '0956789012',
    email: 'dangphuongthao96@gmail.com',
    diaChi: '89 Võ Văn Tần, Q.3, TP.HCM',
    xeDangDung: 'Honda Vision 110',
    noiDung: 'Tư vấn viên bán hàng giải thích các chương trình ưu đãi rất nhiệt tình, rửa xe sạch sẽ sau khi bảo dưỡng xong. Rất hài lòng!',
    diemDanhGia: 5,
    ngayGui: '2024-12-11',
    loaiDanhGia: 'DichVu',
    trangThai: 'DaXuLy',
    loaiNhan: 'DanhGia',
    nhanVienXuLy: 'Trần Minh Hoàng (Chuyên viên Tư vấn Bán hàng)',
    ngayXuLy: '2024-12-12',
  },
  {
    id: 'PH006',
    customerId: 'KH007',
    hoTen: 'Vũ Minh Hải',
    soDienThoai: '0967890123',
    email: 'vuminhhai85@gmail.com',
    diaChi: '34 Nguyễn Đình Chiểu, Phú Nhuận, TP.HCM',
    xeDangDung: 'Honda Air Blade 160',
    noiDung: 'Tôi đặt đơn dây curoa nhưng bấm nhầm số lượng nên đã hủy. Cửa hàng hỗ trợ hoàn tiền và tư vấn lại rất nhanh chóng chu đáo.',
    diemDanhGia: 5,
    ngayGui: '2024-12-14',
    loaiDanhGia: 'DichVu',
    trangThai: 'DaXuLy',
    loaiNhan: 'DanhGia',
    ghiChuXuLy: 'Đã hoàn tiền và gửi mã ưu đãi miễn phí giao hàng.',
    nhanVienXuLy: 'Nguyễn Thị Ánh (Chuyên viên Tư vấn Bán hàng)',
    ngayXuLy: '2024-12-15',
  },
  {
    id: 'PH007',
    customerId: 'KH010',
    hoTen: 'Trương Vũ Hoàng Lộc',
    soDienThoai: '0990123456',
    email: 'lochoang48@gmail.com',
    diaChi: '215 Lê Văn Sỹ, Q.3, TP.HCM',
    xeDangDung: 'Honda Vario 160',
    noiDung: 'Showroom rất khang trang, nhiều phụ tùng chính hãng đẹp mắt. Nhân viên lễ tân tiếp đón tận tình, nước uống chu đáo.',
    diemDanhGia: 5,
    ngayGui: '2024-12-16',
    loaiDanhGia: 'DichVu',
    trangThai: 'DaXuLy',
    loaiNhan: 'DanhGia',
    nhanVienXuLy: 'Trần Văn Quản Lý (Giám đốc Showroom)',
    ngayXuLy: '2024-12-17',
  },
];

/* ───────────────────────── PRODUCT REVIEWS (REVIEWS & COMMENTS) ───────────────────────── */
export const mockProductReviews: ProductReview[] = [
  // ── REVIEWS FOR VEHICLES ──
  {
    id: 'RV001',
    targetId: 'XM-HD01', // SH 160i
    tenKhachHang: 'Nguyễn Tuấn Kiệt',
    soDienThoai: '0908***221',
    soSao: 5,
    ngayDanhGia: '2024-11-20',
    noiDung: 'Mình mua bản Đen mờ tại Showroom, xe chạy cực kỳ đầm chắc. Phanh ABS 2 kênh bóp rất an tâm khi chạy trời mưa ngập. Nhân viên hỗ trợ bấm biển chỉ 2 ngày là có!',
    daMua: true,
    dongXeDaMua: 'Honda SH 160i ABS 2025 (Đen mờ)',
    phanHoiShowroom: 'Cảm ơn anh Kiệt đã tin tưởng lựa chọn Motoshop. Chúc anh vạn dặm bình an cùng SH 160i!',
    hinhAnhDinhKem: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'RV002',
    targetId: 'XM-HD01',
    tenKhachHang: 'Trần Mai Phương',
    soDienThoai: '0912***456',
    soSao: 5,
    ngayDanhGia: '2024-12-02',
    noiDung: 'Xe dáng đẹp sang trọng, cốp để vừa laptop và 2 nón bảo hiểm thoải mái. Hệ thống đèn LED chiếu sáng rất tốt khi đi đêm.',
    daMua: true,
    dongXeDaMua: 'Honda SH 160i ABS (Xám xi măng)',
  },
  {
    id: 'RV003',
    targetId: 'XM-HD02', // Air Blade 160
    tenKhachHang: 'Lê Hoàng Long',
    soDienThoai: '0933***889',
    soSao: 5,
    ngayDanhGia: '2024-11-28',
    noiDung: 'Máy 160cc 4 van bốc kinh khủng, vượt xe tải nhẹ nhàng. Tiêu thụ xăng tầm 2.2L/100km trong nội thành là quá ổn.',
    daMua: true,
    dongXeDaMua: 'Honda Air Blade 160 ABS (Đỏ đen)',
  },
  {
    id: 'RV004',
    targetId: 'XM-HD03', // Vision
    tenKhachHang: 'Nguyễn Thị Bích Ngọc',
    soDienThoai: '0977***112',
    soSao: 5,
    ngayDanhGia: '2024-12-05',
    noiDung: 'Xe nhỏ gọn, dắt nhẹ tênh, rất hợp cho nữ đi làm văn phòng. Khóa thông minh Smart Key an toàn, không lo mất xe.',
    daMua: true,
    dongXeDaMua: 'Honda Vision 110 Thể Thao (Xám xi măng)',
  },
  {
    id: 'RV005',
    targetId: 'XM-HD04', // Winner X
    tenKhachHang: 'Đặng Minh Triết',
    soDienThoai: '0902***776',
    soSao: 5,
    ngayDanhGia: '2024-12-10',
    noiDung: 'Côn tay siêu nhẹ nhờ bộ ly hợp Assist & Slipper. Vào cua đầm xe, phanh ABS chống trượt trước hoạt động rất nhạy bén.',
    daMua: true,
    dongXeDaMua: 'Honda Winner X 150 ABS',
    phanHoiShowroom: 'Motoshop tặng anh thêm 1 voucher bảo dưỡng thay nhớt miễn phí cho lần tới nhé!',
  },
  {
    id: 'RV006',
    targetId: 'XM-YM01', // Exciter 155
    tenKhachHang: 'Phan Quốc Bảo',
    soDienThoai: '0948***555',
    soSao: 5,
    ngayDanhGia: '2024-11-15',
    noiDung: 'Van biến thiên VVA kích hoạt ở 7.400 vòng/phút pô hú cực phấn khích! Xe đâm hậu tốt, bản màu Xanh GP nhìn ngoài đời ngầu hơn trong hình.',
    daMua: true,
    dongXeDaMua: 'Yamaha Exciter 155 VVA ABS (Xanh GP)',
  },
  {
    id: 'RV007',
    targetId: 'XM-YM02', // Grande Hybrid
    tenKhachHang: 'Vũ Thanh Hằng',
    soDienThoai: '0981***678',
    soSao: 5,
    ngayDanhGia: '2024-12-01',
    noiDung: 'Cực kỳ tiết kiệm xăng, mình đi 2 tuần mới phải đổ 1 lần. Động cơ hybrid khởi động êm ru không nghe tiếng đề rít tai.',
    daMua: true,
    dongXeDaMua: 'Yamaha Grande Hybrid (Trắng ngọc trai)',
  },
  {
    id: 'RV008',
    targetId: 'XM-SZ01', // Raider 150
    tenKhachHang: 'Trương Hoàng Nam',
    soDienThoai: '0919***334',
    soSao: 5,
    ngayDanhGia: '2024-11-10',
    noiDung: 'Động cơ DOHC làm mát két nước to đùng, chạy tua cao máy vẫn mát. Xe kéo hậu 140km/h nhẹ nhàng trên cao tốc.',
    daMua: true,
    dongXeDaMua: 'Suzuki Raider R150 Fi (Xanh MotoGP)',
  },
  {
    id: 'RV009',
    targetId: 'XM-PI01', // Vespa Sprint S 150
    tenKhachHang: 'Hoàng Kim Yến',
    soDienThoai: '0938***999',
    soSao: 5,
    ngayDanhGia: '2024-12-08',
    noiDung: 'Đỉnh cao phong cách thời trang! Nước sơn bóng loáng, màn hình điện tử TFT màu kết nối điện thoại xem bản đồ rất xịn.',
    daMua: true,
    dongXeDaMua: 'Vespa Sprint S 150 TFT (Đen nhám)',
  },

  // ── REVIEWS FOR PARTS ──
  {
    id: 'RV101',
    targetId: 'PT001', // Motul 7100
    tenKhachHang: 'Lê Văn Nam',
    soDienThoai: '0913***567',
    soSao: 5,
    ngayDanhGia: '2024-11-22',
    noiDung: 'Hàng chuẩn tem chống giả 100%, quét mã QR ra ngay nguồn gốc Motul Pháp. Thay cho con Exciter 155 máy êm mát rõ rệt sau 500km tour Đà Lạt.',
    daMua: true,
    phanHoiShowroom: 'Motoshop cam kết chỉ bán dầu nhớt Motul chính hãng phân phối ủy quyền tại Việt Nam!',
    hinhAnhDinhKem: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80',
    ],
  },
  {
    id: 'RV102',
    targetId: 'PT001',
    tenKhachHang: 'Nguyễn Hải Đăng',
    soDienThoai: '0909***882',
    soSao: 5,
    ngayDanhGia: '2024-12-03',
    noiDung: 'Nhớt Ester đỏ thơm đặc trưng, vào số mượt mà không bị sượng khi kẹt xe giờ cao điểm.',
    daMua: true,
  },
  {
    id: 'RV103',
    targetId: 'PT002', // Castrol POWER1 Scooter
    tenKhachHang: 'Phạm Thu Trang',
    soDienThoai: '0988***443',
    soSao: 5,
    ngayDanhGia: '2024-12-01',
    noiDung: 'Thay cho xe Lead và SH của cả nhà, vặn ga bốc, máy êm ru. Giá tại showroom còn có voucher giảm giá rẻ hơn ở cây xăng.',
    daMua: true,
  },
  {
    id: 'RV104',
    targetId: 'PT004', // Lọc gió Honda
    tenKhachHang: 'Đỗ Hữu Nghĩa',
    soDienThoai: '0972***331',
    soSao: 5,
    ngayDanhGia: '2024-11-19',
    noiDung: 'Đúng hàng zin Honda bọc trong túi nilon có mã phụ tùng chuẩn. Thay vào lọc sạch bụi, tiếng máy thở nhẹ hơn hẳn.',
    daMua: true,
  },
  {
    id: 'RV105',
    targetId: 'PT006', // Brembo Brake
    tenKhachHang: 'Võ Minh Quân',
    soDienThoai: '0901***665',
    soSao: 5,
    ngayDanhGia: '2024-12-04',
    noiDung: 'Má phanh Brembo xịn xò, lực hãm chuẩn xác, bóp thắng không bị giật hay cọ xước đĩa. Đi mưa phanh rất tự tin!',
    daMua: true,
  },
  {
    id: 'RV106',
    targetId: 'PT008', // Bugi NGK Iridium
    tenKhachHang: 'Huỳnh Tấn Phát',
    soDienThoai: '0943***221',
    soSao: 5,
    ngayDanhGia: '2024-11-25',
    noiDung: 'Bugi chân kim đánh lửa cực nhạy. Buổi sáng bấm đề 1 phát nổ ngay không cần kéo e ga. Cảm giác ga đầu lanh lẹ hơn bugi zin.',
    daMua: true,
  },
  {
    id: 'RV107',
    targetId: 'PT010', // Michelin Pilot Street 2
    tenKhachHang: 'Trần Đình Trọng',
    soDienThoai: '0966***908',
    soSao: 5,
    ngayDanhGia: '2024-12-07',
    noiDung: 'Lốp Michelin gai thoát nước đỉnh chóp. Chạy qua vạch sơn đường khi mưa không hề bị sàn đuôi như lốp hãng theo xe.',
    daMua: true,
  },
  {
    id: 'RV108',
    targetId: 'PT012', // Bando V-Belt
    tenKhachHang: 'Ngô Kiến Huy',
    soDienThoai: '0937***110',
    soSao: 5,
    ngayDanhGia: '2024-12-09',
    noiDung: 'Dây curoa Bando hai mặt răng chính hãng Nhật Bản. Lắp vào con SH 150i hết tiệt bệnh rung đầu buổi sáng!',
    daMua: true,
  },
  {
    id: 'RV109',
    targetId: 'PT013', // DID Chain
    tenKhachHang: 'Bùi Quốc Anh',
    soDienThoai: '0918***774',
    soSao: 5,
    ngayDanhGia: '2024-11-30',
    noiDung: 'Sên vàng D.I.D 9 ly đi với nhông Sunstar cực bền, chạy 2.000km mới phải tăng xích một lần. Nước mạ vàng sáng bóng!',
    daMua: true,
  },
  {
    id: 'RV110',
    targetId: 'PT017', // ZHI.PAT Windshield
    tenKhachHang: 'Cao Tiến Đạt',
    soDienThoai: '0908***452',
    soSao: 5,
    ngayDanhGia: '2024-12-12',
    noiDung: 'Gắn lên SH 160i nhìn xe bệ vệ thể thao hẳn lên. Nhựa Polycarbonate dẻo dai khó xước, cản gió đi tour xa rất đỡ mệt ngực.',
    daMua: true,
  },
];

/* ───────────────────────── SURVEYS ───────────────────────── */
export const mockSurveys: Survey[] = [
  {
    id: 'KS001',
    title: 'Khảo sát chất lượng Dịch vụ Bảo dưỡng 2025',
    description: 'Đánh giá chất lượng phục vụ và thái độ nhân viên kỹ thuật tại showroom Motoshop.',
    targetCustomerId: 'ALL',
    targetCustomerTier: 'ALL',
    createdDate: '2024-12-15',
    publishDate: '2024-12-15T08:00',
    startDate: '2024-12-15T08:00',
    endDate: '2026-12-31T23:59',
    status: 'DangDienRa',
    questions: [
      { id: 'q1', text: 'Bạn hài lòng với thái độ phục vụ của nhân viên kỹ thuật?', opts: ['Rất hài lòng', 'Hài lòng', 'Bình thường', 'Chưa hài lòng'] },
      { id: 'q2', text: 'Thời gian bảo dưỡng xe có đúng với cam kết?', opts: ['Nhanh hơn dự kiến', 'Đúng giờ', 'Hơi chậm', 'Quá chậm'] },
      { id: 'q3', text: 'Bạn đánh giá thế nào về trang thiết bị tại xưởng sửa chữa?', opts: ['Hiện đại', 'Tốt', 'Bình thường', 'Cần nâng cấp'] },
    ]
  },
  {
    id: 'KS002',
    title: 'Khảo sát nhu cầu mua xe mới Honda SH 160i 2025',
    description: 'Chương trình tìm hiểu nhu cầu và ưu đãi nâng cấp dòng xe tay ga cao cấp.',
    targetCustomerId: 'ALL',
    targetCustomerTier: 'ALL',
    createdDate: '2024-12-16',
    publishDate: '2024-12-16T08:00',
    startDate: '2024-12-16T08:00',
    endDate: '2026-12-31T23:59',
    status: 'DangDienRa',
    questions: [
      { id: 'q1', text: 'Bạn có dự định đổi xe mới trong 6 tháng tới?', opts: ['Có, chắc chắn', 'Đang cân nhắc', 'Chưa có nhu cầu'] },
      { id: 'q2', text: 'Màu sắc xe Honda SH 160i nào bạn yêu thích nhất?', opts: ['Đen nhám', 'Đỏ kim loại', 'Trắng ngọc trai', 'Xám xi măng'] },
    ]
  },
  {
    id: 'KS003',
    title: 'Khảo sát đặc quyền tri ân Khách hàng VIP Xuân 2027',
    description: 'Khảo sát ý kiến đóng góp về chính sách quà tặng và cứu hộ miễn phí 24/7 dành cho hội viên thân thiết.',
    targetCustomerId: 'ALL',
    targetCustomerTier: 'VIP',
    createdDate: '2024-12-20',
    publishDate: '2024-12-20T08:00',
    startDate: '2026-12-01T08:00',
    endDate: '2027-02-28T23:59',
    status: 'SapDienRa',
    questions: [
      { id: 'q1', text: 'Bạn mong muốn nhận đặc quyền nào nhất từ Motoshop?', opts: ['Bảo dưỡng tại nhà', 'Voucher giảm giá 30%', 'Tặng 1 năm cứu hộ 24/7', 'Rửa xe miễn phí trọn đời'] },
      { id: 'q2', text: 'Kênh nhận thông tin ưu đãi tiện lợi nhất với bạn?', opts: ['Zalo CSKH', 'SMS điện thoại', 'Email thông báo', 'Gọi điện trực tiếp'] },
    ]
  },
  {
    id: 'KS004',
    title: 'Khảo sát đánh giá trải nghiệm phụ tùng Quý 3/2024',
    description: 'Đánh giá độ bền và độ tương thích của phụ tùng Motul, Michelin, Brembo lắp đặt tại showroom.',
    targetCustomerId: 'ALL',
    targetCustomerTier: 'ALL',
    createdDate: '2024-07-01',
    publishDate: '2024-07-01T08:00',
    startDate: '2024-07-01T08:00',
    endDate: '2024-09-30T23:59',
    status: 'DaKetThuc',
    questions: [
      { id: 'q1', text: 'Độ êm ái của nhớt Motul sau 1.500km di chuyển?', opts: ['Rất êm', 'Bình thường', 'Hơi nóng máy'] },
      { id: 'q2', text: 'Độ bám đường của lốp Michelin khi trời mưa?', opts: ['Rất tốt', 'Khá tốt', 'Chưa an tâm'] },
    ]
  }
];

export const mockSurveyResponses: SurveyResponse[] = [
  {
    id: 'RSP001',
    surveyId: 'KS001',
    customerId: 'KH002',
    customerName: 'Trần Thị Bích',
    answers: {
      q1: 'Hài lòng',
      q2: 'Đúng giờ',
      q3: 'Tốt'
    },
    submittedDate: '2024-12-16 10:30'
  },
  {
    id: 'RSP002',
    surveyId: 'KS001',
    customerId: 'KH001',
    customerName: 'Nguyễn Văn An',
    answers: {
      q1: 'Rất hài lòng',
      q2: 'Nhanh hơn dự kiến',
      q3: 'Hiện đại'
    },
    submittedDate: '2024-12-17 14:15'
  },
  {
    id: 'RSP003',
    surveyId: 'KS002',
    customerId: 'KH001',
    customerName: 'Nguyễn Văn An',
    answers: {
      q1: 'Đang cân nhắc',
      q2: 'Đen nhám'
    },
    submittedDate: '2024-12-18 09:20'
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

export const mockWarrantyAppointments: WarrantyAppointment[] = [
  {
    id: '#BH-120426-01',
    customerId: 'KH001',
    hoTenKH: 'Nguyễn Văn A',
    soDienThoai: '0987 654 321',
    vehicleId: 'XE001',
    tenXe: 'Honda Vision 110',
    bienSo: '59A1-123.45',
    odoKhachBao: 12500,
    vanDeGapPhai: ['Phanh (Thắng) trước/sau', 'Động cơ / Động cơ kêu to'],
    moTaChiTiet: 'Xe bị kêu lạch cạch ở phía sau khi tăng tốc, phanh sau không ăn khi bóp mạnh.',
    hinhAnhKhachHang: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=500&auto=format',
      'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format',
    ],
    ngayHen: '15/10/2026',
    gioHen: '08:30',
    chiNhanh: 'CN 1 - Quận 1',
    trangThai: 'DangKiemTra',
    danhGiaKyThuat: {
      boPhanLoi: ['Động cơ / Hộp số', 'Hệ thống điện'],
      soKmThucTe: 12500,
      hinhAnhKyThuat: [
        'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=500&auto=format',
        'https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format',
      ],
      yKienKyThuat: 'Phát hiện bộ côn bị mòn tự nhiên, lốc máy có vết trầy xước do va đập ngoại lực nhẹ không thuộc phạm vi lỗi nhà sản xuất...',
      ngayDanhGia: '15/10/2026',
      kyThuatVien: 'KTV. Trần Minh Long',
    },
    quyetDinh: null,
    chiPhiBaoGia: 450000,
    chiPhiThucTe: 0,
    ngayTao: '2026-10-12 09:15',
  },
  {
    id: '#BH-120426-02',
    customerId: 'KH002',
    hoTenKH: 'Trần Thị B',
    soDienThoai: '0901 234 567',
    vehicleId: 'XE002',
    tenXe: 'Honda Air Blade',
    bienSo: '59A1-678.90',
    odoKhachBao: 18200,
    vanDeGapPhai: ['Giảm xóc (Phuộc)', 'Hệ thống điện / Đèn / Còi'],
    moTaChiTiet: 'Phuộc sau kêu cọt kẹt khi qua gờ giảm tốc, đèn xi nhan chớp nháy thất thường.',
    hinhAnhKhachHang: [],
    ngayHen: '14/10/2026',
    gioHen: '10:00',
    chiNhanh: 'CN 3 - Quận 7',
    trangThai: 'ChoTiepNhan',
    ngayTao: '2026-10-12 10:20',
  },
  {
    id: '#BH-090925-04',
    customerId: 'KH003',
    hoTenKH: 'Phạm Văn C',
    soDienThoai: '0948 111 222',
    vehicleId: 'XE003',
    tenXe: 'Yamaha Exciter 155',
    bienSo: '60C1-777.77',
    odoKhachBao: 9500,
    vanDeGapPhai: ['Động cơ / Động cơ kêu to', 'Phanh (Thắng) trước/sau'],
    moTaChiTiet: 'Bảo hành thay thế bố nồi và căn chỉnh xích tải định kỳ.',
    hinhAnhKhachHang: [],
    ngayHen: '14/10/2026',
    gioHen: '14:00',
    chiNhanh: 'CN 1 - Quận 1',
    trangThai: 'HoanTat',
    quyetDinh: 'DuocBaoHanh',
    chiPhiThucTe: 0,
    inPhieuLoai: 'PhieuBaoHanh',
    ngayTao: '2026-10-09 14:00',
    ngayHoanTat: '2026-10-14 16:30',
  },
  {
    id: '#BH-080825-12',
    customerId: 'KH004',
    hoTenKH: 'Lê Hoàng D',
    soDienThoai: '0945 999 888',
    vehicleId: 'XE004',
    tenXe: 'Honda SH 160i',
    bienSo: '59A1-999.99',
    odoKhachBao: 22000,
    vanDeGapPhai: ['Hệ thống điện / Đèn / Còi'],
    moTaChiTiet: 'Khách yêu cầu kiểm tra smartkey và sạc điện thoại trên xe.',
    hinhAnhKhachHang: [],
    ngayHen: '12/10/2026',
    gioHen: '09:30',
    chiNhanh: 'CN 2 - Bình Thạnh',
    trangThai: 'DaHuy',
    ngayTao: '2026-10-08 09:30',
  },
  {
    id: '#BH-070725-03',
    customerId: 'KH005',
    hoTenKH: 'Hoàng Thị E',
    soDienThoai: '0912 345 678',
    vehicleId: 'XE005',
    tenXe: 'Honda Vision 110',
    bienSo: '29B1-999.99',
    odoKhachBao: 14100,
    vanDeGapPhai: ['Động cơ / Động cơ kêu to'],
    moTaChiTiet: 'Tiếng róc máy nhẹ khi chạy dải tốc độ 40-50 km/h.',
    hinhAnhKhachHang: [],
    ngayHen: '11/10/2026',
    gioHen: '15:30',
    chiNhanh: 'CN 1 - Quận 1',
    trangThai: 'DangKiemTra',
    ngayTao: '2026-10-07 15:30',
  },
];

