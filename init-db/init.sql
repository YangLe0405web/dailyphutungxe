CREATE DATABASE CRM_XeMayPhuTung;
GO

USE CRM_XeMayPhuTung;
GO

CREATE TABLE TAI_KHOAN (
    MaTK INT IDENTITY(1,1) PRIMARY KEY,
    TenDangNhap VARCHAR(50) NOT NULL UNIQUE,
    MatKhau VARCHAR(255) NOT NULL,
    VaiTro NVARCHAR(50) NOT NULL CHECK (VaiTro IN (N'Admin', N'KhachHang', N'SuperAdmin', N'NhanVienBanHang', N'NhanVienKyThuat')),
    TrangThai NVARCHAR(20) DEFAULT N'HoatDong' CHECK (TrangThai IN (N'HoatDong', N'BiKhoa')),
    NgayTao DATETIME DEFAULT GETDATE()
);

-- Bảng Nhân viên / Tài khoản quản trị Admin (StaffAccount & AdminRole)
CREATE TABLE NHAN_VIEN (
    MaNV INT IDENTITY(1,1) PRIMARY KEY,
    MaTK INT NULL UNIQUE,
    HoTen NVARCHAR(100) NOT NULL,
    Email VARCHAR(150) NOT NULL UNIQUE,
    SoDienThoai VARCHAR(15) NOT NULL UNIQUE,
    ChucVu NVARCHAR(100),
    VaiTro NVARCHAR(50) NOT NULL DEFAULT N'NhanVienBanHang' CHECK (VaiTro IN (N'SuperAdmin', N'NhanVienBanHang', N'NhanVienKyThuat', N'Admin')),
    TrangThai NVARCHAR(20) DEFAULT N'HoatDong' CHECK (TrangThai IN (N'HoatDong', N'BiKhoa')),
    Avatar NVARCHAR(500) NULL,
    NgayThamGia DATE DEFAULT CAST(GETDATE() AS DATE),
    NgayTao DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_NhanVien_TaiKhoan FOREIGN KEY (MaTK) REFERENCES TAI_KHOAN(MaTK) ON DELETE SET NULL
);

CREATE TABLE KHACH_HANG (
    MaKH INT IDENTITY(1,1) PRIMARY KEY,
    MaTK INT NOT NULL UNIQUE,
    HoTen NVARCHAR(100) NOT NULL,
    NgaySinh DATE NOT NULL,
    GioiTinh NVARCHAR(10) CHECK (GioiTinh IN (N'Nam', N'Nữ', N'Khác')),
    SoDienThoai VARCHAR(15) NOT NULL,
    Email VARCHAR(100) NULL,
    DiaChi NVARCHAR(255),
    SoThich NVARCHAR(255),
    NgayTao DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_KhachHang_TaiKhoan FOREIGN KEY (MaTK) REFERENCES TAI_KHOAN(MaTK) ON DELETE CASCADE
);

CREATE TABLE SAN_PHAM_XE (
    MaXe INT IDENTITY(1,1) PRIMARY KEY,
    TenXe NVARCHAR(100) NOT NULL,
    HangXe NVARCHAR(50) NOT NULL,
    LoaiXe NVARCHAR(50) NOT NULL CHECK (LoaiXe IN (N'Xe ga', N'Xe số', N'Xe côn tay', N'Xe điện')),
    GiaNiemYet DECIMAL(18,2) NOT NULL,
    ThongSoKyThuat NVARCHAR(500)
);

CREATE TABLE PHU_TUNG (
    MaPhuTung INT IDENTITY(1,1) PRIMARY KEY,
    TenPhuTung NVARCHAR(100) NOT NULL,
    LoaiPhuTung NVARCHAR(50) NOT NULL,
    DonGia DECIMAL(18,2) NOT NULL,
    BaoHanhThang INT DEFAULT 0
);

CREATE TABLE XE_KHACH_HANG (
    MaXeSoHuu INT IDENTITY(1,1) PRIMARY KEY,
    MaKH INT NOT NULL,
    MaXe INT NOT NULL,
    BienSoXe VARCHAR(20) NOT NULL UNIQUE,
    SoKhung VARCHAR(30) NOT NULL UNIQUE,
    SoMay VARCHAR(30),
    NgayMua DATE NOT NULL,
    HanBaoHanh DATE NOT NULL,
    CONSTRAINT FK_XeKH_KhachHang FOREIGN KEY (MaKH) REFERENCES KHACH_HANG(MaKH) ON DELETE CASCADE,
    CONSTRAINT FK_XeKH_SanPhamXe FOREIGN KEY (MaXe) REFERENCES SAN_PHAM_XE(MaXe)
);

CREATE TABLE PHAN_HOI (
    MaPH INT IDENTITY(1,1) PRIMARY KEY,
    MaKH INT NOT NULL,
    MaXe INT NULL,
    MaPhuTung INT NULL,
    DiemDanhGia INT NOT NULL CHECK (DiemDanhGia BETWEEN 1 AND 5),
    NoiDung NVARCHAR(500) NOT NULL,
    NgayGui DATETIME DEFAULT GETDATE(),
    TrangThaiXuLy NVARCHAR(50) DEFAULT N'Chờ xử lý' CHECK (TrangThaiXuLy IN (N'Chờ xử lý', N'Đã phản hồi')),
    CONSTRAINT FK_PhanHoi_KhachHang FOREIGN KEY (MaKH) REFERENCES KHACH_HANG(MaKH),
    CONSTRAINT FK_PhanHoi_Xe FOREIGN KEY (MaXe) REFERENCES SAN_PHAM_XE(MaXe),
    CONSTRAINT FK_PhanHoi_PhuTung FOREIGN KEY (MaPhuTung) REFERENCES PHU_TUNG(MaPhuTung)
);

CREATE TABLE KHAO_SAT (
    MaKS INT IDENTITY(1,1) PRIMARY KEY,
    TieuDe NVARCHAR(200) NOT NULL,
    MoTa NVARCHAR(500),
    NgayTao DATE DEFAULT GETDATE(),
    HanKetThuc DATE NOT NULL
);

CREATE TABLE CAU_HOI_KHAO_SAT (
    MaCH INT IDENTITY(1,1) PRIMARY KEY,
    MaKS INT NOT NULL,
    NoiDungCH NVARCHAR(500) NOT NULL,
    LoaiCauHoi VARCHAR(20) DEFAULT 'TracNghiem' CHECK (LoaiCauHoi IN ('TracNghiem', 'TuLuan')),
    CONSTRAINT FK_CauHoi_KhaoSat FOREIGN KEY (MaKS) REFERENCES KHAO_SAT(MaKS) ON DELETE CASCADE
);

CREATE TABLE KET_QUA_KHAO_SAT (
    MaKQ INT IDENTITY(1,1) PRIMARY KEY,
    MaKS INT NOT NULL,
    MaCH INT NOT NULL,
    MaKH INT NOT NULL,
    CauTraLoi NVARCHAR(1000) NOT NULL,
    NgayTraLoi DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_KQ_KhaoSat FOREIGN KEY (MaKS) REFERENCES KHAO_SAT(MaKS),
    CONSTRAINT FK_KQ_CauHoi FOREIGN KEY (MaCH) REFERENCES CAU_HOI_KHAO_SAT(MaCH),
    CONSTRAINT FK_KQ_KhachHang FOREIGN KEY (MaKH) REFERENCES KHACH_HANG(MaKH)
);

-- 1. Bảng Đơn Hàng (Khách mua phụ tùng)
CREATE TABLE DON_HANG (
    MaDon INT IDENTITY(1,1) PRIMARY KEY,
    MaKH INT FOREIGN KEY REFERENCES KHACH_HANG(MaKH),
    NgayDat DATETIME DEFAULT GETDATE(),
    TongTien DECIMAL(18,2) DEFAULT 0,
    TrangThai NVARCHAR(50) DEFAULT N'Chờ xác nhận'
);

-- 2. Bảng Chi Tiết Đơn Hàng
CREATE TABLE CHI_TIET_DON_HANG (
    MaDon INT FOREIGN KEY REFERENCES DON_HANG(MaDon),
    MaPhuTung INT FOREIGN KEY REFERENCES PHU_TUNG(MaPhuTung),
    SoLuong INT,
    DonGia DECIMAL(18,2),
    PRIMARY KEY (MaDon, MaPhuTung)
);

-- 3. Bảng Lịch Hẹn (Bảo dưỡng / Lái thử / Sửa chữa)
CREATE TABLE LICH_HEN (
    MaLich INT IDENTITY(1,1) PRIMARY KEY,
    MaKH INT FOREIGN KEY REFERENCES KHACH_HANG(MaKH),
    LoaiDichVu NVARCHAR(100), 
    NgayHen DATETIME,
    GhiChu NVARCHAR(MAX),
    TrangThai NVARCHAR(50) DEFAULT N'Chờ xác nhận'
);

-- ────────────────────────────────────────────────────────────
-- DỮ LIỆU MẪU (SEED DATA)
-- ────────────────────────────────────────────────────────────
-- 1. Tài khoản (SuperAdmin, 5 Bán hàng, 5 Kỹ thuật, 10 Khách hàng)
INSERT INTO TAI_KHOAN (TenDangNhap, MatKhau, VaiTro, TrangThai) VALUES
('admin', '123456', N'SuperAdmin', N'HoatDong'),
('anhnguyen', '123456', N'NhanVienBanHang', N'HoatDong'),
('hoangtran', '123456', N'NhanVienBanHang', N'HoatDong'),
('hale', '123456', N'NhanVienBanHang', N'HoatDong'),
('baopham', '123456', N'NhanVienBanHang', N'HoatDong'),
('anhvo', '123456', N'NhanVienBanHang', N'HoatDong'),
('thanhnguyen', '123456', N'NhanVienKyThuat', N'HoatDong'),
('ductran', '123456', N'NhanVienKyThuat', N'HoatDong'),
('namle', '123456', N'NhanVienKyThuat', N'HoatDong'),
('huypham', '123456', N'NhanVienKyThuat', N'HoatDong'),
('datvo', '123456', N'NhanVienKyThuat', N'HoatDong'),
('nguyenvanan', '123456', N'KhachHang', N'HoatDong'),
('tranthibich', '123456', N'KhachHang', N'HoatDong'),
('lehoangcuong', '123456', N'KhachHang', N'HoatDong'),
('phamthiduyen', '123456', N'KhachHang', N'HoatDong'),
('hoangvangiang', '123456', N'KhachHang', N'HoatDong'),
('dangphuongthao', '123456', N'KhachHang', N'HoatDong'),
('vuminhhai', '123456', N'KhachHang', N'HoatDong'),
('buithihuong', '123456', N'KhachHang', N'HoatDong'),
('dokhoanam', '123456', N'KhachHang', N'HoatDong'),
('truonghoangloc', '123456', N'KhachHang', N'HoatDong');

-- 2. Dữ liệu Nhân viên (1 SuperAdmin, 5 Bán hàng, 5 Kỹ thuật)
INSERT INTO NHAN_VIEN (MaTK, HoTen, Email, SoDienThoai, ChucVu, VaiTro, TrangThai, Avatar, NgayThamGia) VALUES
(1, N'Trần Văn Quản Lý', 'admin@motoshop.vn', '0909999888', N'Giám đốc Showroom', N'SuperAdmin', N'HoatDong', '/images/NV/nv1.jpg', '2022-01-01'),
(2, N'Nguyễn Thị Ánh', 'anhnguyen@motoshop.vn', '0988777661', N'Chuyên viên Tư vấn Bán hàng', N'NhanVienBanHang', N'HoatDong', '/images/NV/nv1.jpg', '2023-01-15'),
(3, N'Trần Minh Hoàng', 'hoangtran@motoshop.vn', '0988777662', N'Chuyên viên Tư vấn Bán hàng', N'NhanVienBanHang', N'HoatDong', '/images/NV/nv2.jpg', '2023-02-20'),
(4, N'Lê Thị Thu Hà', 'hale@motoshop.vn', '0988777663', N'Chuyên viên Bán hàng & CSKH', N'NhanVienBanHang', N'HoatDong', '/images/NV/nv3.jpg', '2023-03-10'),
(5, N'Phạm Quốc Bảo', 'baopham@motoshop.vn', '0988777664', N'Chuyên viên Bán xe & Trả góp', N'NhanVienBanHang', N'HoatDong', '/images/NV/nv4.jpg', '2023-04-05'),
(6, N'Võ Ngọc Anh', 'anhvo@motoshop.vn', '0988777665', N'Chuyên viên Bán hàng & CRM', N'NhanVienBanHang', N'HoatDong', '/images/NV/nv5.jpg', '2023-05-18'),
(7, N'Nguyễn Văn Thành', 'nguyen.thanh67@gmail.com', '0901234567', N'Kỹ thuật viên Trưởng xưởng', N'NhanVienKyThuat', N'HoatDong', '/images/KT/nvkt1.png', '2023-01-10'),
(8, N'Trần Minh Đức', 'tran.duc78@gmail.com', '0912345678', N'Kỹ thuật viên Bảo dưỡng', N'NhanVienKyThuat', N'HoatDong', '/images/KT/nvkt2.png', '2023-02-15'),
(9, N'Lê Hoàng Nam', 'le.nam89@gmail.com', '0923456789', N'Kỹ thuật viên Sửa chữa máy', N'NhanVienKyThuat', N'HoatDong', '/images/KT/nvkt3.png', '2023-03-20'),
(10, N'Phạm Quốc Huy', 'pham.huy90@gmail.com', '0934567890', N'Kỹ thuật viên Điện & Phụ tùng', N'NhanVienKyThuat', N'HoatDong', '/images/KT/nvkt4.png', '2023-04-12'),
(11, N'Võ Thành Đạt', 'vo.dat36@gmail.com', '0945678901', N'Kỹ thuật viên Bảo hành', N'NhanVienKyThuat', N'HoatDong', '/images/KT/nvkt5.png', '2023-05-25');

-- 3. Dữ liệu Khách hàng (10 khách hàng thực tế)
INSERT INTO KHACH_HANG (MaTK, HoTen, NgaySinh, GioiTinh, SoDienThoai, DiaChi, SoThich) VALUES
(12, N'Nguyễn Văn An', '1990-05-15', N'Nam', '0901234567', N'12 Lý Thường Kiệt, Q.1, TP.HCM', N'Xe ga cao cấp, phượt'),
(13, N'Trần Thị Bích', '1995-08-22', N'Nữ', '0912345678', N'45 Nguyễn Huệ, Q.1, TP.HCM', N'Thời trang, phong cách Ý'),
(14, N'Lê Hoàng Cường', '1988-11-30', N'Nam', '0923456789', N'78 Trần Phú, Q.5, TP.HCM', N'Xe côn tay thể thao'),
(15, N'Phạm Thị Duyên', '1998-03-18', N'Nữ', '0934567890', N'23 CMT8, Q.3, TP.HCM', N'Cốp to, đi làm công sở'),
(16, N'Hoàng Văn Giang', '1992-07-12', N'Nam', '0945678901', N'56 Điện Biên Phủ, Bình Thạnh, TP.HCM', N'Phượt xa, độ máy nhẹ'),
(17, N'Đặng Thị Phương Thảo', '1996-12-01', N'Nữ', '0956789012', N'89 Võ Văn Tần, Q.3, TP.HCM', N'Xe gọn nhẹ thanh lịch'),
(18, N'Vũ Minh Hải', '1985-04-25', N'Nam', '0967890123', N'34 Nguyễn Đình Chiểu, Phú Nhuận, TP.HCM', N'Động cơ mạnh mẽ bền bỉ'),
(19, N'Bùi Thị Hương', '1994-09-14', N'Nữ', '0978901234', N'67 Phan Xích Long, Phú Nhuận, TP.HCM', N'Tiết kiệm xăng, trẻ trung'),
(20, N'Đỗ Khoa Nam', '1991-02-10', N'Nam', '0989012345', N'102 Hoàng Văn Thụ, Tân Bình, TP.HCM', N'Xe điện công nghệ mới'),
(21, N'Trương Vũ Hoàng Lộc', '1989-10-05', N'Nam', '0990123456', N'215 Lê Văn Sỹ, Q.3, TP.HCM', N'Xe ga thể thao nhập khẩu');

-- 4. Dữ liệu Xe mẫu Showroom (SAN_PHAM_XE - Giữ nguyên)
INSERT INTO SAN_PHAM_XE (TenXe, HangXe, LoaiXe, GiaNiemYet, ThongSoKyThuat) VALUES
(N'Honda SH 160i ABS (2025)', 'Honda', N'Xe ga', 95900000, N'156.9cc eSP+ 4 van, Phanh ABS 2 kênh, HSTC, Khóa thông minh Smart Key'),
(N'Honda Air Blade 160 ABS', 'Honda', N'Xe ga', 56690000, N'156.9cc eSP+, Phanh ABS trước, Cổng sạc USB, Cốp rộng 23.2L'),
(N'Honda Lead 125cc (Bản Đặc Biệt)', 'Honda', N'Xe ga', 42790000, N'124.8cc eSP+, Cốp siêu lớn 37L đựng vừa 2 mũ bảo hiểm, Nắp bình xăng trước'),
(N'Honda Vision 110 Smart Key', 'Honda', N'Xe ga', 33490000, N'109.5cc eSP, Khung dập eSAF thế hệ mới siêu nhẹ, Tiết kiệm xăng 1.85L/100km'),
(N'Honda Winner X 150 ABS', 'Honda', N'Xe côn tay', 50560000, N'149.1cc DOHC 6 cấp số, Phanh đĩa ABS trước, Bộ ly hợp chống trượt 2 chiều'),
(N'Honda Wave Alpha 110cc', 'Honda', N'Xe số', 18190000, N'109.1cc làm mát bằng không khí, Động cơ siêu bền bỉ, 1.72L/100km'),
(N'Yamaha Exciter 155 VVA ABS', 'Yamaha', N'Xe côn tay', 54000000, N'155cc 4 van biến thiên VVA, 17.9 mã lực, Phanh ABS 2 piston, Bộ ly hợp A&S'),
(N'Yamaha Grande Hybrid', 'Yamaha', N'Xe ga', 49500000, N'124.9cc Blue Core Hybrid trợ lực điện, Tiết kiệm xăng số 1 (1.66L/100km), Phanh ABS'),
(N'Yamaha MT-15 Naked Bike', 'Yamaha', N'Xe côn tay', 69000000, N'155cc VVA, Phuộc trước Upside Down vàng thể thao, Đèn pha LED thấu kính'),
(N'Suzuki Raider R150 Fi', 'Suzuki', N'Xe côn tay', 51190000, N'147.3cc DOHC 4 van làm mát két nước lớn, Công suất cực đại 18.5 mã lực'),
(N'Suzuki Burgman Street 125', 'Suzuki', N'Xe ga', 48600000, N'124.3cc động cơ SEP, Thiết kế Maxi-Scooter phong cách Châu Âu bề thế'),
(N'Vespa Primavera 125 ABS', 'Piaggio & Vespa', N'Xe ga', 77800000, N'124.5cc động cơ i-Get 3 van, Khung thép liền khối kinh điển, Phanh ABS'),
(N'Vespa Sprint S 150 TFT', 'Piaggio & Vespa', N'Xe ga', 97800000, N'154.8cc động cơ i-Get thế hệ mới, Màn hình màu TFT hiển thị thông minh, ABS'),
(N'Piaggio Liberty 125 S ABS', 'Piaggio & Vespa', N'Xe ga', 57700000, N'124.5cc động cơ i-Get hiện đại, Bánh trước 16 inch vượt chướng ngại vật êm ái');

-- 5. Dữ liệu Phụ tùng Showroom (PHU_TUNG - Giữ nguyên)
INSERT INTO PHU_TUNG (TenPhuTung, LoaiPhuTung, DonGia, BaoHanhThang) VALUES
(N'Nhớt Motul 7100 4T 10W40 1L (100% Tổng Hợp Ester)', N'Nhớt', 255000, 12),
(N'Nhớt Castrol POWER1 Ultimate Scooter 10W-30 0.8L', N'Nhớt', 145000, 12),
(N'Dầu nhớt xe số Honda Genuine 4T SL 10W-30 MA 0.8L', N'Nhớt', 92000, 6),
(N'Lọc gió zin chính hãng Honda Air Blade 125/160 & Vario', N'Lọc', 120000, 6),
(N'Lọc gió độ K&N High-Flow YA-1519 USA cho Exciter 150/155', N'Lọc', 1190000, 36),
(N'Má phanh đĩa trước Brembo Carbon Ceramic 07HO28SA', N'Phanh', 790000, 12),
(N'Má phanh đĩa trước Nissin OEM Honda SH 125i/150i/160i', N'Phanh', 295000, 6),
(N'Bugi NGK Iridium Laser CPR8EAIX-9 cao cấp', N'Bugi', 220000, 12),
(N'Bugi Denso Iridium Power IU24 chân dài', N'Bugi', 195000, 12),
(N'Lốp Michelin Pilot Street 2 (Cặp 80/90-14 & 90/90-14)', N'Lốp xe', 1650000, 12),
(N'Lốp Pirelli Diablo Rosso Sport (Cặp 90/80-17 & 120/70-17)', N'Lốp xe', 2150000, 12),
(N'Dây curoa Bando V-Belt hai mặt răng cho Honda SH 150i/160i', N'Truyền động', 510000, 12),
(N'Bộ nhông sên dĩa D.I.D 428D Vàng 122L - Nhông Sunstar', N'Truyền động', 450000, 12),
(N'Bóng đèn pha LED Philips Ultinon Essential Moto HS1/H4 6500K', N'Đèn', 315000, 12),
(N'Bình ắc quy khô GS GTZ5S (12V - 3.5Ah) xe máy chính hãng', N'Thân máy', 285000, 6),
(N'Gương chiếu hậu Rizoma Class Retro nhôm CNC chống chói', N'Phụ kiện', 350000, 12),
(N'Kính chắn gió khí động học ZHI.PAT Sport cho SH 160i / SH 125i', N'Phụ kiện', 390000, 12),
(N'Thùng đựng đồ gắn sau xe Givi B270N Monolock 27 Lít chống nước', N'Phụ kiện', 1080000, 24);

-- 6. Dữ liệu Xe sở hữu của Khách hàng (XE_KHACH_HANG)
INSERT INTO XE_KHACH_HANG (MaKH, MaXe, BienSoXe, SoKhung, SoMay, NgayMua, HanBaoHanh) VALUES
(1, 1, '51K-123.45', 'RLHKD160CB1234567', 'KF12E-1234567', '2023-01-10', '2026-01-10'),
(2, 12, '51H-678.90', 'VESP125CB2345678', 'VP12E-2345678', '2022-02-14', '2025-02-14'),
(3, 5, '59G1-234.56', 'RLHKW150CB3456789', 'KW15E-3456789', '2021-03-05', '2024-03-05'),
(4, 3, '59F1-888.88', 'RLHKL125CB4567890', 'KL12E-4567890', '2022-04-20', '2025-04-20'),
(5, 7, '59S2-345.67', 'MHYEX155CB5678901', 'YE15E-5678901', '2022-05-11', '2025-05-11'),
(6, 4, '59V1-999.99', 'RLHKV110CB6789012', 'KV11E-6789012', '2023-06-08', '2026-06-08'),
(7, 2, '51X1-456.78', 'RLHKA160CB7890123', 'KA16E-7890123', '2022-07-15', '2025-07-15'),
(8, 6, '59T2-123.89', 'MHYJA125CB8901234', 'WA11E-8901234', '2021-08-22', '2024-08-22'),
(9, 1, '51L1-567.89', 'VFEL125CB9012345', 'VF12E-9012345', '2022-09-19', '2025-09-19'),
(10, 2, '59U1-678.12', 'RLHKO160CB0123456', 'KO16E-0123456', '2023-10-05', '2026-10-05');

-- 7. Giao dịch CRM 1-5: Đơn hàng & Chi tiết (DON_HANG & CHI_TIET_DON_HANG)
INSERT INTO DON_HANG (MaKH, NgayDat, TongTien, TrangThai) VALUES
(1, '2024-11-15 08:30:00', 312000, N'Hoàn thành'),
(2, '2024-12-03 14:15:00', 1650000, N'Đang giao'),
(4, '2024-12-10 10:00:00', 1105000, N'Chờ duyệt'),
(5, '2024-12-12 16:45:00', 510000, N'Hoàn thành'),
(7, '2024-12-14 09:20:00', 450000, N'Đã hủy');

INSERT INTO CHI_TIET_DON_HANG (MaDon, MaPhuTung, SoLuong, DonGia) VALUES
(1, 1, 1, 255000),
(1, 8, 1, 57000),
(2, 10, 1, 1650000),
(3, 14, 1, 315000),
(3, 6, 1, 790000),
(4, 13, 1, 510000),
(5, 12, 1, 450000);

-- 8. Giao dịch CRM 6-10: Lịch hẹn dịch vụ (LICH_HEN)
INSERT INTO LICH_HEN (MaKH, LoaiDichVu, NgayHen, GhiChu, TrangThai) VALUES
(1, N'Bảo dưỡng', '2024-12-20 09:00:00', N'Xe chạy hơi ồn, cần kiểm tra phuộc và thay nhớt tổng hợp', N'Đã xác nhận'),
(2, N'Sửa chữa', '2024-12-21 10:30:00', N'Phanh trước kêu nhẹ, kiểm tra vệ sinh nồi xe Vespa', N'Chờ duyệt'),
(3, N'Lái thử', '2024-12-22 14:00:00', N'Muốn đăng ký lái thử xe Yamaha Exciter 155 VVA thế hệ mới', N'Đã xác nhận'),
(6, N'Bảo dưỡng', '2024-12-18 08:30:00', N'Bảo dưỡng định kỳ 5.000km và rửa xe', N'Hoàn thành'),
(9, N'Sửa chữa', '2024-12-23 15:00:00', N'Kiểm tra lỗi còi và hệ thống phanh tái sinh xe điện', N'Đang thực hiện');

-- 9. Đánh giá & Phản hồi Khách hàng (PHAN_HOI)
INSERT INTO PHAN_HOI (MaKH, MaXe, MaPhuTung, DiemDanhGia, NoiDung, NgayGui, TrangThaiXuLy) VALUES
(1, 1, NULL, 5, N'Dịch vụ bảo dưỡng định kỳ rất nhanh chóng, nhân viên kỹ thuật thay nhớt và siết phuộc cẩn thận. Showroom có phòng chờ tiện nghi!', '2024-11-16 10:00:00', N'Đã phản hồi'),
(2, NULL, 10, 4, N'Đơn hàng lốp Michelin giao chậm hơn dự kiến 1 ngày do bên vận chuyển, may là đồ bọc gói kỹ và đúng kích thước chuẩn xe Vespa.', '2024-12-04 11:30:00', N'Chờ xử lý'),
(4, NULL, 6, 5, N'Đèn LED Philips và má phanh Brembo mua tại cửa hàng dùng cực thích, bóp phanh êm ru và đi đêm rất an toàn.', '2024-12-05 14:00:00', N'Đã phản hồi'),
(5, NULL, 13, 5, N'Bộ nhông sên dĩa DID vàng lắp vào chạy rất êm, nhân viên kỹ thuật căn xích chuẩn xác. Sẽ tiếp tục ủng hộ showroom!', '2024-12-10 16:00:00', N'Đã phản hồi'),
(6, 4, NULL, 5, N'Tư vấn viên bán hàng giải thích các chương trình ưu đãi rất nhiệt tình, rửa xe sạch sẽ sau khi bảo dưỡng xong. Rất hài lòng!', '2024-12-11 09:15:00', N'Đã phản hồi'),
(7, NULL, 12, 5, N'Tôi đặt đơn dây curoa nhưng bấm nhầm số lượng nên đã hủy. Cửa hàng hỗ trợ hoàn tiền và tư vấn lại rất nhanh chóng chu đáo.', '2024-12-14 10:45:00', N'Đã phản hồi'),
(10, 2, NULL, 5, N'Showroom rất khang trang, nhiều phụ tùng chính hãng đẹp mắt. Nhân viên lễ tân tiếp đón tận tình, nước uống chu đáo.', '2024-12-16 15:20:00', N'Đã phản hồi');

GO