/* ───────────────────────── TYPES ───────────────────────── */
export type CustomerStatus = 'HoatDong' | 'BiKhoa';
export type OrderStatus = 'ChoDuyet' | 'DangGiao' | 'HoanThanh' | 'DaHuy';
export type AppointmentStatus = 'ChoDuyet' | 'DaXacNhan' | 'DangThucHien' | 'HoanThanh' | 'DaHuy';
export type ServiceType = 'BaoDuong' | 'SuaChua' | 'LaiThu';
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
}

export interface Customer {
  id: string; hoTen: string; email: string; soDienThoai: string;
  diaChi: string; ngaySinh: string; gioiTinh: 'Nam' | 'Nu';
  trangThai: CustomerStatus; ngayDangKy: string; soXe: string;
  tongChiTieu: number; avatar?: string;
}

export interface Vehicle {
  id: string; customerId: string; tenXe: string; bienSo: string;
  namSanXuat: number; hanBaoHanh: string; mauSac: string;
  trangThaiBaoHanh: 'ConHan' | 'HetHan'; soKhung: string; hinhAnh?: string;
}

export interface Part {
  id: string; tenSanPham: string; thuongHieu: string; giaGoc: number;
  giaKhuyenMai: number | null; soLuongTon: number; danhMuc: string;
  moTa: string; hinhAnh: string; rating: number; luotDanh: number;
  dongXePhuHop?: string; xuatXu?: string; baoHanh?: string;
}

export interface CartItem {
  part: Part; soLuong: number;
}

export interface Order {
  id: string; customerId: string; hoTenKH: string; ngayDat: string;
  trangThai: OrderStatus; tongTien: number; diaChiGiao: string;
  items: { tenSanPham: string; soLuong: number; donGia: number }[];
}

export interface Appointment {
  id: string; customerId: string; hoTenKH: string; soDienThoai: string;
  loaiDichVu: ServiceType; ngayHen: string; gioHen: string;
  trangThai: AppointmentStatus; ghiChu: string; tenXe: string; bienSo: string;
}

export interface Feedback {
  id: string; customerId: string; hoTen: string; noiDung: string;
  diemDanhGia: number; ngayGui: string; loaiDanhGia: 'DichVu' | 'SanPham' | 'BaoHanh';
  trangThai: 'ChoXuLy' | 'DaXuLy'; loaiNhan: 'DanhGia' | 'KhieuNai';
  soDienThoai?: string;
  email?: string;
  diaChi?: string;
  xeDangDung?: string;
  ghiChuXuLy?: string;
}

export interface ProductReview {
  id: string;
  targetId: string; // vehicleId or partId
  tenKhachHang: string;
  soDienThoai?: string;
  soSao: number;
  ngayDanhGia: string;
  noiDung: string;
  daMua: boolean;
  dongXeDaMua?: string;
  phanHoiShowroom?: string;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  opts: string[];
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  targetCustomerId: string | 'ALL';
  targetCustomerName?: string;
  createdDate: string;
  questions: SurveyQuestion[];
  status: 'Active' | 'Closed';
}

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
  { id: 'KH001', hoTen: 'Nguyễn Văn An', email: 'nguyenvanan@gmail.com', soDienThoai: '0901234567', diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM', ngaySinh: '1990-05-15', gioiTinh: 'Nam', trangThai: 'HoatDong', ngayDangKy: '2023-01-10', soXe: 'XE001', tongChiTieu: 4850000 },
  { id: 'KH002', hoTen: 'Trần Thị Bích', email: 'tranthibich@gmail.com', soDienThoai: '0912345678', diaChi: '45 Nguyễn Huệ, Q.1, TP.HCM', ngaySinh: '1985-08-22', gioiTinh: 'Nu', trangThai: 'HoatDong', ngayDangKy: '2023-02-14', soXe: 'XE002', tongChiTieu: 12300000 },
  { id: 'KH003', hoTen: 'Lê Minh Cường', email: 'leminhcuong@gmail.com', soDienThoai: '0923456789', diaChi: '78 Trần Phú, Q.5, TP.HCM', ngaySinh: '1978-11-30', gioiTinh: 'Nam', trangThai: 'BiKhoa', ngayDangKy: '2023-03-05', soXe: 'XE003', tongChiTieu: 1200000 },
  { id: 'KH004', hoTen: 'Phạm Thị Dung', email: 'phamthidung@gmail.com', soDienThoai: '0934567890', diaChi: '23 CMT8, Q.3, TP.HCM', ngaySinh: '1995-03-18', gioiTinh: 'Nu', trangThai: 'HoatDong', ngayDangKy: '2023-04-20', soXe: 'XE004', tongChiTieu: 7640000 },
  { id: 'KH005', hoTen: 'Hoàng Văn Em', email: 'hoangvanem@gmail.com', soDienThoai: '0945678901', diaChi: '56 Điện Biên Phủ, Bình Thạnh', ngaySinh: '2000-07-12', gioiTinh: 'Nam', trangThai: 'HoatDong', ngayDangKy: '2023-05-11', soXe: 'XE005', tongChiTieu: 3290000 },
  { id: 'KH006', hoTen: 'Vũ Thị Hoa', email: 'vuthihoa@gmail.com', soDienThoai: '0956789012', diaChi: '89 Võ Văn Tần, Q.3, TP.HCM', ngaySinh: '1988-12-01', gioiTinh: 'Nu', trangThai: 'HoatDong', ngayDangKy: '2023-06-08', soXe: 'XE006', tongChiTieu: 9150000 },
  { id: 'KH007', hoTen: 'Đặng Quốc Hùng', email: 'dangquochung@gmail.com', soDienThoai: '0967890123', diaChi: '34 Nguyễn Đình Chiểu, Phú Nhuận', ngaySinh: '1975-04-25', gioiTinh: 'Nam', trangThai: 'BiKhoa', ngayDangKy: '2023-07-15', soXe: 'XE007', tongChiTieu: 500000 },
  { id: 'KH008', hoTen: 'Bùi Thị Kim', email: 'buithikim@gmail.com', soDienThoai: '0978901234', diaChi: '67 Phan Xích Long, Phú Nhuận', ngaySinh: '1993-09-14', gioiTinh: 'Nu', trangThai: 'HoatDong', ngayDangKy: '2023-08-22', soXe: 'XE008', tongChiTieu: 5620000 },
];

/* ───────────────────────── VEHICLES ───────────────────────── */
export const mockVehicles: Vehicle[] = [
  { id: 'XE001', customerId: 'KH001', tenXe: 'Honda Wave Alpha 110cc', bienSo: '51K-12345', namSanXuat: 2021, hanBaoHanh: '2025-01-10', mauSac: 'Đỏ đen', trangThaiBaoHanh: 'HetHan', soKhung: 'RLHKC110JA1234567' },
  { id: 'XE002', customerId: 'KH002', tenXe: 'Honda Air Blade 125cc', bienSo: '51B-56789', namSanXuat: 2022, hanBaoHanh: '2026-02-14', mauSac: 'Trắng bạc', trangThaiBaoHanh: 'ConHan', soKhung: 'RLHKF125BA2345678' },
  { id: 'XE003', customerId: 'KH003', tenXe: 'Yamaha Exciter 155cc', bienSo: '51C-11111', namSanXuat: 2020, hanBaoHanh: '2024-03-05', mauSac: 'Xanh đen', trangThaiBaoHanh: 'HetHan', soKhung: 'MHYDE155CC3456789' },
  { id: 'XE004', customerId: 'KH004', tenXe: 'Honda SH 160i ABS', bienSo: '51D-22222', namSanXuat: 2023, hanBaoHanh: '2027-04-20', mauSac: 'Đen mờ', trangThaiBaoHanh: 'ConHan', soKhung: 'RLHKD160CB4567890' },
  { id: 'XE005', customerId: 'KH005', tenXe: 'Yamaha Grande 125cc', bienSo: '51E-33333', namSanXuat: 2022, hanBaoHanh: '2026-05-11', mauSac: 'Hồng trắng', trangThaiBaoHanh: 'ConHan', soKhung: 'MHYEG125CB5678901' },
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

/* ───────────────────────── ORDERS ───────────────────────── */
export const mockOrders: Order[] = [
  { id: 'DH001', customerId: 'KH001', hoTenKH: 'Nguyễn Văn An', ngayDat: '2024-11-15', trangThai: 'HoanThanh', tongTien: 312000, diaChiGiao: '12 Lý Thường Kiệt, Q.1', items: [{ tenSanPham: 'Dầu nhớt xe số Honda Genuine 4T', soLuong: 1, donGia: 92000 }, { tenSanPham: 'Bugi NGK Iridium Laser CPR8EAIX-9', soLuong: 1, donGia: 220000 }] },
  { id: 'DH002', customerId: 'KH002', hoTenKH: 'Trần Thị Bích', ngayDat: '2024-12-03', trangThai: 'DangGiao', tongTien: 1650000, diaChiGiao: '45 Nguyễn Huệ, Q.1', items: [{ tenSanPham: 'Lốp Michelin Pilot Street 2', soLuong: 1, donGia: 1650000 }] },
  { id: 'DH003', customerId: 'KH004', hoTenKH: 'Phạm Thị Dung', ngayDat: '2024-12-10', trangThai: 'DangGiao', tongTien: 1105000, diaChiGiao: '23 CMT8, Q.3', items: [{ tenSanPham: 'Bóng đèn pha LED Philips Ultinon', soLuong: 1, donGia: 315000 }, { tenSanPham: 'Má phanh đĩa trước Brembo Carbon Ceramic', soLuong: 1, donGia: 790000 }] },
  { id: 'DH004', customerId: 'KH005', hoTenKH: 'Hoàng Văn Em', ngayDat: '2024-12-12', trangThai: 'ChoDuyet', tongTien: 510000, diaChiGiao: '56 Điện Biên Phủ, Bình Thạnh', items: [{ tenSanPham: 'Dây curoa Bando V-Belt SH', soLuong: 1, donGia: 510000 }] },
  { id: 'DH005', customerId: 'KH006', hoTenKH: 'Vũ Thị Hoa', ngayDat: '2024-12-13', trangThai: 'ChoDuyet', tongTien: 450000, diaChiGiao: '89 Võ Văn Tần, Q.3', items: [{ tenSanPham: 'Bộ nhông sên dĩa D.I.D 428D Vàng', soLuong: 1, donGia: 450000 }] },
  { id: 'DH006', customerId: 'KH008', hoTenKH: 'Bùi Thị Kim', ngayDat: '2024-12-14', trangThai: 'ChoDuyet', tongTien: 390000, diaChiGiao: '67 Phan Xích Long, Phú Nhuận', items: [{ tenSanPham: 'Kính chắn gió ZHI.PAT Sport', soLuong: 1, donGia: 390000 }] },
];

/* ───────────────────────── APPOINTMENTS ───────────────────────── */
export const mockAppointments: Appointment[] = [
  { id: 'LH001', customerId: 'KH001', hoTenKH: 'Nguyễn Văn An', soDienThoai: '0901234567', loaiDichVu: 'BaoDuong', ngayHen: '2024-12-20', gioHen: '09:00', trangThai: 'DaXacNhan', ghiChu: 'Xe chạy hơi ồn, cần kiểm tra xích và nhớt', tenXe: 'Honda Wave Alpha 110cc', bienSo: '51K-12345' },
  { id: 'LH002', customerId: 'KH002', hoTenKH: 'Trần Thị Bích', soDienThoai: '0912345678', loaiDichVu: 'SuaChua', ngayHen: '2024-12-21', gioHen: '10:30', trangThai: 'ChoDuyet', ghiChu: 'Phanh trước kém hiệu quả, có tiếng kêu khi phanh', tenXe: 'Honda Air Blade 125cc', bienSo: '51B-56789' },
  { id: 'LH003', customerId: 'KH004', hoTenKH: 'Phạm Thị Dung', soDienThoai: '0934567890', loaiDichVu: 'LaiThu', ngayHen: '2024-12-22', gioHen: '14:00', trangThai: 'ChoDuyet', ghiChu: 'Muốn thử xe Honda SH 160i phiên bản 2025', tenXe: 'Honda SH 160i ABS', bienSo: '51D-22222' },
  { id: 'LH004', customerId: 'KH005', hoTenKH: 'Hoàng Văn Em', soDienThoai: '0945678901', loaiDichVu: 'BaoDuong', ngayHen: '2024-12-18', gioHen: '08:00', trangThai: 'HoanThanh', ghiChu: 'Bảo dưỡng định kỳ 3.000km', tenXe: 'Yamaha Grande 125cc', bienSo: '51E-33333' },
  { id: 'LH005', customerId: 'KH006', hoTenKH: 'Vũ Thị Hoa', soDienThoai: '0956789012', loaiDichVu: 'SuaChua', ngayHen: '2024-12-23', gioHen: '15:30', trangThai: 'ChoDuyet', ghiChu: 'Đèn pha không sáng, pin yếu', tenXe: '', bienSo: '' },
];

/* ───────────────────────── FEEDBACK ───────────────────────── */
export const mockFeedbacks: Feedback[] = [
  {
    id: 'PH001',
    customerId: 'KH001',
    hoTen: 'Nguyễn Văn An',
    soDienThoai: '0901234567',
    email: 'nguyenvanan@gmail.com',
    diaChi: '12 Lý Thường Kiệt, Q.1, TP.HCM',
    xeDangDung: 'Honda Wave Alpha 110cc (51K-12345)',
    noiDung: 'Dịch vụ bảo dưỡng định kỳ rất nhanh chóng, nhân viên kỹ thuật thay nhớt và siết xích cẩn thận. Showroom có phòng chờ máy lạnh tiện nghi!',
    diemDanhGia: 5,
    ngayGui: '2024-11-16',
    loaiDanhGia: 'DichVu',
    trangThai: 'DaXuLy',
    loaiNhan: 'DanhGia',
    ghiChuXuLy: 'Đã gọi điện cảm ơn khách hàng và gửi voucher giảm giá 10% lần sau.',
  },
  {
    id: 'PH002',
    customerId: 'KH002',
    hoTen: 'Trần Thị Bích',
    soDienThoai: '0912345678',
    email: 'tranthibich@gmail.com',
    diaChi: '45 Nguyễn Huệ, Q.1, TP.HCM',
    xeDangDung: 'Honda Air Blade 125cc (51B-56789)',
    noiDung: 'Đơn hàng phụ tùng giao chậm hơn dự kiến 2 ngày do bên vận chuyển, may là đồ bọc gói kỹ và đúng hàng chuẩn Honda.',
    diemDanhGia: 3,
    ngayGui: '2024-12-04',
    loaiDanhGia: 'SanPham',
    trangThai: 'ChoXuLy',
    loaiNhan: 'KhieuNai',
  },
  {
    id: 'PH003',
    customerId: 'KH004',
    hoTen: 'Phạm Thị Dung',
    soDienThoai: '0934567890',
    email: 'phamthidung@gmail.com',
    diaChi: '23 CMT8, Q.3, TP.HCM',
    xeDangDung: 'Honda SH 160i ABS (51D-22222)',
    noiDung: 'Nhớt Motul 7100 và má phanh Brembo mua tại cửa hàng dùng cực thích, bóp phanh êm ru và xe chạy bốc hơn hẳn.',
    diemDanhGia: 5,
    ngayGui: '2024-12-05',
    loaiDanhGia: 'SanPham',
    trangThai: 'DaXuLy',
    loaiNhan: 'DanhGia',
    ghiChuXuLy: 'Đã hỗ trợ kiểm tra định kỳ miễn phí cho khách.',
  },
  {
    id: 'PH004',
    customerId: 'KH005',
    hoTen: 'Hoàng Văn Em',
    soDienThoai: '0945678901',
    email: 'hoangvanem@gmail.com',
    diaChi: '56 Điện Biên Phủ, Bình Thạnh, TP.HCM',
    xeDangDung: 'Yamaha Grande 125cc (51E-33333)',
    noiDung: 'Giá một số loại lốp xe nhập khẩu hơi cao hơn so với bên ngoài. Showroom nên có nhiều chương trình khuyến mãi hơn.',
    diemDanhGia: 3,
    ngayGui: '2024-12-10',
    loaiDanhGia: 'SanPham',
    trangThai: 'ChoXuLy',
    loaiNhan: 'KhieuNai',
  },
  {
    id: 'PH005',
    customerId: 'KH006',
    hoTen: 'Vũ Thị Hoa',
    soDienThoai: '0956789012',
    email: 'vuthihoa@gmail.com',
    diaChi: '89 Võ Văn Tần, Q.3, TP.HCM',
    xeDangDung: 'Yamaha Exciter 155 VVA (51C-11111)',
    noiDung: 'Tư vấn viên bán xe giải thích thủ tục trả góp 0% rất rõ ràng, hỗ trợ làm hồ sơ lấy xe trong ngày. Rất hài lòng!',
    diemDanhGia: 5,
    ngayGui: '2024-12-11',
    loaiDanhGia: 'DichVu',
    trangThai: 'DaXuLy',
    loaiNhan: 'DanhGia',
  },
  {
    id: 'PH006',
    customerId: 'KH007',
    hoTen: 'Đặng Quốc Hùng',
    soDienThoai: '0967890123',
    email: 'dangquochung@gmail.com',
    diaChi: '34 Nguyễn Đình Chiểu, Phú Nhuận, TP.HCM',
    xeDangDung: 'Honda Future 125 Fi (59P-44556)',
    noiDung: 'Xe bảo dưỡng xong nhưng phanh sau vẫn có tiếng kêu nhẹ khi chở nặng. Cần thợ xem lại giúp tôi.',
    diemDanhGia: 2,
    ngayGui: '2024-12-14',
    loaiDanhGia: 'BaoHanh',
    trangThai: 'ChoXuLy',
    loaiNhan: 'KhieuNai',
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
    createdDate: '2024-12-15',
    status: 'Active',
    questions: [
      { id: 'q1', text: 'Bạn hài lòng với thái độ phục vụ của nhân viên kỹ thuật?', opts: ['Rất hài lòng', 'Hài lòng', 'Bình thường', 'Chưa hài lòng'] },
      { id: 'q2', text: 'Thời gian bảo dưỡng xe có đúng với cam kết?', opts: ['Nhanh hơn dự kiến', 'Đúng giờ', 'Hơi chậm', 'Quá chậm'] },
      { id: 'q3', text: 'Bạn đánh giá thế nào về trang thiết bị tại xưởng sửa chữa?', opts: ['Hiện đại', 'Tốt', 'Bình thường', 'Cần nâng cấp'] },
    ]
  },
  {
    id: 'KS002',
    title: 'Khảo sát nhu cầu mua xe mới Honda SH 160i 2025',
    description: 'Dành riêng cho khách hàng Nguyễn Văn An tìm hiểu ưu đãi nâng cấp dòng xe ga cao cấp.',
    targetCustomerId: 'KH001',
    targetCustomerName: 'Nguyễn Văn An',
    createdDate: '2024-12-16',
    status: 'Active',
    questions: [
      { id: 'q1', text: 'Bạn có dự định đổi xe mới trong 6 tháng tới?', opts: ['Có, chắc chắn', 'Đang cân nhắc', 'Chưa có nhu cầu'] },
      { id: 'q2', text: 'Màu sắc xe Honda SH 160i nào bạn yêu thích nhất?', opts: ['Đen nhám', 'Đỏ kim loại', 'Trắng ngọc trai', 'Xám xi măng'] },
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
    submittedDate: '2024-12-16'
  }
];

export const mockStaffAccounts: StaffAccount[] = [
  { id: 'ST001', hoTen: 'Trần Văn Quản Lý', email: 'admin@motoshop.vn', soDienThoai: '0909999888', chucVu: 'Giám đốc Showroom', vaiTro: 'SuperAdmin', trangThai: 'HoatDong', ngayThamGia: '2022-01-01' },
  { id: 'ST002', hoTen: 'Nguyễn Thị Sale', email: 'sale@motoshop.vn', soDienThoai: '0918888777', chucVu: 'Chuyên viên Bán hàng & CRM', vaiTro: 'NhanVienBanHang', trangThai: 'HoatDong', ngayThamGia: '2023-03-15' },
  { id: 'ST003', hoTen: 'Lê Văn Kỹ Thuật', email: 'kythuat@motoshop.vn', soDienThoai: '0927777666', chucVu: 'Trưởng xưởng Bảo dưỡng & Kho', vaiTro: 'NhanVienKyThuat', trangThai: 'HoatDong', ngayThamGia: '2023-06-20' },
  { id: 'ST004', hoTen: 'Phạm Văn Hỗ Trợ', email: 'hotro@motoshop.vn', soDienThoai: '0936666555', chucVu: 'Nhân viên Tư vấn Bán hàng', vaiTro: 'NhanVienBanHang', trangThai: 'BiKhoa', ngayThamGia: '2024-02-10' },
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

export function formatVND(n: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}
