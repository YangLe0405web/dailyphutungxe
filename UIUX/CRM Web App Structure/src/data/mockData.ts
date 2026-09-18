/* ───────────────────────── TYPES ───────────────────────── */
export type CustomerStatus = 'HoatDong' | 'BiKhoa';
export type OrderStatus = 'ChoDuyet' | 'DangGiao' | 'HoanThanh' | 'DaHuy';
export type AppointmentStatus = 'ChoDuyet' | 'DaXacNhan' | 'DangThucHien' | 'HoanThanh' | 'DaHuy';
export type ServiceType = 'BaoDuong' | 'SuaChua' | 'LaiThu';

export interface Customer {
  id: string; hoTen: string; email: string; soDienThoai: string;
  diaChi: string; ngaySinh: string; gioiTinh: 'Nam' | 'Nu';
  trangThai: CustomerStatus; ngayDangKy: string; soXe: string;
  tongChiTieu: number;
}

export interface Vehicle {
  id: string; customerId: string; tenXe: string; bienSo: string;
  namSanXuat: number; hanBaoHanh: string; mauSac: string;
  trangThaiBaoHanh: 'ConHan' | 'HetHan'; soKhung: string;
}

export interface Part {
  id: string; tenSanPham: string; thuongHieu: string; giaGoc: number;
  giaKhuyenMai: number | null; soLuongTon: number; danhMuc: string;
  moTa: string; hinhAnh: string; rating: number; luotDanh: number;
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
}

/* ───────────────────────── PARTS CATALOG ───────────────────────── */
export const mockParts: Part[] = [
  { id: 'PT001', tenSanPham: 'Nhớt Honda 10W-30 0.8L', thuongHieu: 'Honda', giaGoc: 95000, giaKhuyenMai: 79000, soLuongTon: 120, danhMuc: 'Nhớt', moTa: 'Nhớt động cơ chính hãng Honda, phù hợp Wave/Future/Lead', hinhAnh: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format', rating: 4.8, luotDanh: 234 },
  { id: 'PT002', tenSanPham: 'Lốc xơ Air Blade 125', thuongHieu: 'Honda', giaGoc: 850000, giaKhuyenMai: null, soLuongTon: 15, danhMuc: 'Lọc', moTa: 'Lọc gió chính hãng cho Air Blade 125cc, vệ sinh không khí tối ưu', hinhAnh: 'https://images.unsplash.com/photo-1609136689989-d2b51aef6e4e?w=400&h=300&fit=crop&auto=format', rating: 4.6, luotDanh: 89 },
  { id: 'PT003', tenSanPham: 'Má phanh trước Exciter 155', thuongHieu: 'Yamaha', giaGoc: 280000, giaKhuyenMai: 249000, soLuongTon: 42, danhMuc: 'Phanh', moTa: 'Má phanh đĩa trước chính hãng Yamaha, độ bền cao', hinhAnh: 'https://images.unsplash.com/photo-1558618047-f4e70e926b8b?w=400&h=300&fit=crop&auto=format', rating: 4.7, luotDanh: 156 },
  { id: 'PT004', tenSanPham: 'Bugi NGK CR7HSA', thuongHieu: 'NGK', giaGoc: 65000, giaKhuyenMai: 55000, soLuongTon: 200, danhMuc: 'Bugi', moTa: 'Bugi NGK tiêu chuẩn Nhật Bản, phù hợp hầu hết xe số/tay ga', hinhAnh: 'https://images.unsplash.com/photo-1614201152709-70c0e3e28b31?w=400&h=300&fit=crop&auto=format', rating: 4.9, luotDanh: 512 },
  { id: 'PT005', tenSanPham: 'Gương chiếu hậu SH 160i Chrome', thuongHieu: 'Honda', giaGoc: 450000, giaKhuyenMai: 380000, soLuongTon: 28, danhMuc: 'Phụ kiện', moTa: 'Gương chính hãng SH 160i mạ chrome, chống chói tốt', hinhAnh: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&auto=format', rating: 4.5, luotDanh: 73 },
  { id: 'PT006', tenSanPham: 'Dây curoa Grande 125cc', thuongHieu: 'Yamaha', giaGoc: 320000, giaKhuyenMai: null, soLuongTon: 35, danhMuc: 'Truyền động', moTa: 'Dây đai truyền động chính hãng Yamaha Grande, thay thế 20.000km/lần', hinhAnh: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&h=300&fit=crop&auto=format', rating: 4.4, luotDanh: 61 },
  { id: 'PT007', tenSanPham: 'Bộ decal tem xe Exciter Racing', thuongHieu: 'TT Decal', giaGoc: 180000, giaKhuyenMai: 150000, soLuongTon: 50, danhMuc: 'Trang trí', moTa: 'Decal dán xe phong cách racing, chất liệu vinyl cao cấp chống nước', hinhAnh: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=400&h=300&fit=crop&auto=format', rating: 4.3, luotDanh: 198 },
  { id: 'PT008', tenSanPham: 'Đèn LED headlight H4 55W', thuongHieu: 'Osram', giaGoc: 750000, giaKhuyenMai: 620000, soLuongTon: 18, danhMuc: 'Đèn', moTa: 'Bóng đèn LED H4 cao cấp, độ sáng 6000K, tiết kiệm điện 60%', hinhAnh: 'https://images.unsplash.com/photo-1621252179027-94459d278660?w=400&h=300&fit=crop&auto=format', rating: 4.7, luotDanh: 145 },
  { id: 'PT009', tenSanPham: 'Lốp Michelin Pilot Street 90/90-14', thuongHieu: 'Michelin', giaGoc: 980000, giaKhuyenMai: 890000, soLuongTon: 22, danhMuc: 'Lốp xe', moTa: 'Lốp xe máy Michelin Pilot Street, bám đường tốt cả khô và ướt', hinhAnh: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop&auto=format', rating: 4.8, luotDanh: 307 },
  { id: 'PT010', tenSanPham: 'Bình xăng con Wave Alpha', thuongHieu: 'Honda', giaGoc: 1200000, giaKhuyenMai: null, soLuongTon: 8, danhMuc: 'Thân máy', moTa: 'Bình xăng chính hãng Honda Wave Alpha, dung tích 3.5 lít', hinhAnh: 'https://images.unsplash.com/photo-1617191735082-2c8d17f8c28f?w=400&h=300&fit=crop&auto=format', rating: 4.6, luotDanh: 44 },
  { id: 'PT011', tenSanPham: 'Bộ nhông xích SH Mode', thuongHieu: 'Honda', giaGoc: 650000, giaKhuyenMai: 580000, soLuongTon: 30, danhMuc: 'Truyền động', moTa: 'Bộ nhông xích chính hãng SH Mode, bôi trơn tốt, ít tiếng ồn', hinhAnh: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop&auto=format', rating: 4.5, luotDanh: 92 },
  { id: 'PT012', tenSanPham: 'Kính chắn gió PCX 160', thuongHieu: 'Honda', giaGoc: 420000, giaKhuyenMai: 370000, soLuongTon: 12, danhMuc: 'Phụ kiện', moTa: 'Kính chắn gió chính hãng PCX 160, chống UV, chống xước tốt', hinhAnh: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&auto=format', rating: 4.6, luotDanh: 67 },
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

/* ───────────────────────── ORDERS ───────────────────────── */
export const mockOrders: Order[] = [
  { id: 'DH001', customerId: 'KH001', hoTenKH: 'Nguyễn Văn An', ngayDat: '2024-11-15', trangThai: 'HoanThanh', tongTien: 134000, diaChiGiao: '12 Lý Thường Kiệt, Q.1', items: [{ tenSanPham: 'Nhớt Honda 10W-30', soLuong: 1, donGia: 79000 }, { tenSanPham: 'Bugi NGK CR7HSA', soLuong: 1, donGia: 55000 }] },
  { id: 'DH002', customerId: 'KH002', hoTenKH: 'Trần Thị Bích', ngayDat: '2024-12-03', trangThai: 'DangGiao', tongTien: 889000, diaChiGiao: '45 Nguyễn Huệ, Q.1', items: [{ tenSanPham: 'Lốp Michelin Pilot Street', soLuong: 1, donGia: 890000 }] },
  { id: 'DH003', customerId: 'KH004', hoTenKH: 'Phạm Thị Dung', ngayDat: '2024-12-10', trangThai: 'DangGiao', tongTien: 998000, diaChiGiao: '23 CMT8, Q.3', items: [{ tenSanPham: 'Đèn LED H4 55W', soLuong: 1, donGia: 620000 }, { tenSanPham: 'Má phanh Exciter', soLuong: 1, donGia: 249000 }, { tenSanPham: 'Bugi NGK', soLuong: 2, donGia: 55000 }] },
  { id: 'DH004', customerId: 'KH005', hoTenKH: 'Hoàng Văn Em', ngayDat: '2024-12-12', trangThai: 'ChoDuyet', tongTien: 580000, diaChiGiao: '56 Điện Biên Phủ, Bình Thạnh', items: [{ tenSanPham: 'Bộ nhông xích SH Mode', soLuong: 1, donGia: 580000 }] },
  { id: 'DH005', customerId: 'KH006', hoTenKH: 'Vũ Thị Hoa', ngayDat: '2024-12-13', trangThai: 'ChoDuyet', tongTien: 229000, diaChiGiao: '89 Võ Văn Tần, Q.3', items: [{ tenSanPham: 'Decal Racing Exciter', soLuong: 1, donGia: 150000 }, { tenSanPham: 'Bugi NGK CR7HSA', soLuong: 1, donGia: 55000 }, { tenSanPham: 'Nhớt Honda', soLuong: 1, donGia: 79000 }] },
  { id: 'DH006', customerId: 'KH008', hoTenKH: 'Bùi Thị Kim', ngayDat: '2024-12-14', trangThai: 'ChoDuyet', tongTien: 370000, diaChiGiao: '67 Phan Xích Long, Phú Nhuận', items: [{ tenSanPham: 'Kính chắn gió PCX 160', soLuong: 1, donGia: 370000 }] },
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
  { id: 'PH001', customerId: 'KH001', hoTen: 'Nguyễn Văn An', noiDung: 'Dịch vụ bảo dưỡng nhanh, nhân viên tận tình. Rất hài lòng!', diemDanhGia: 5, ngayGui: '2024-11-16', loaiDanhGia: 'DichVu', trangThai: 'DaXuLy', loaiNhan: 'DanhGia' },
  { id: 'PH002', customerId: 'KH002', hoTen: 'Trần Thị Bích', noiDung: 'Giao hàng chậm hơn dự kiến 2 ngày, nhưng sản phẩm đúng chất lượng.', diemDanhGia: 3, ngayGui: '2024-12-04', loaiDanhGia: 'DichVu', trangThai: 'ChoXuLy', loaiNhan: 'KhieuNai' },
  { id: 'PH003', customerId: 'KH004', hoTen: 'Phạm Thị Dung', noiDung: 'Nhớt Honda chính hãng tốt, xe chạy êm hơn rõ rệt!', diemDanhGia: 5, ngayGui: '2024-12-05', loaiDanhGia: 'SanPham', trangThai: 'DaXuLy', loaiNhan: 'DanhGia' },
  { id: 'PH004', customerId: 'KH005', hoTen: 'Hoàng Văn Em', noiDung: 'Giá phụ tùng hơi cao so với thị trường bên ngoài. Mong giảm thêm.', diemDanhGia: 3, ngayGui: '2024-12-10', loaiDanhGia: 'SanPham', trangThai: 'ChoXuLy', loaiNhan: 'KhieuNai' },
  { id: 'PH005', customerId: 'KH006', hoTen: 'Vũ Thị Hoa', noiDung: 'Nhân viên tư vấn nhiệt tình, showroom sạch sẽ. Sẽ giới thiệu bạn bè!', diemDanhGia: 5, ngayGui: '2024-12-11', loaiDanhGia: 'DichVu', trangThai: 'DaXuLy', loaiNhan: 'DanhGia' },
];

/* ───────────────────────── CHART DATA ───────────────────────── */
export const revenueData = [
  { thang: 'T6', doanhThu: 42000000, donHang: 58 },
  { thang: 'T7', doanhThu: 58000000, donHang: 74 },
  { thang: 'T8', doanhThu: 51000000, donHang: 63 },
  { thang: 'T9', doanhThu: 67000000, donHang: 89 },
  { thang: 'T10', doanhThu: 75000000, donHang: 98 },
  { thang: 'T11', doanhThu: 89000000, donHang: 112 },
  { thang: 'T12', doanhThu: 105000000, donHang: 134 },
];

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
