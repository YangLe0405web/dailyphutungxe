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
    Avatar NVARCHAR(MAX),
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
INSERT INTO SAN_PHAM_XE (TenXe, HangXe, LoaiXe, GiaNiemYet, ThongSoKyThuat, MauSac, HinhAnh, CoTheLaiThu) VALUES
(N'Honda SH 160i ABS 2024', 'Honda', N'Xe ga', 95900000, N'156.9cc eSP+ 4 van, Phanh ABS 2 kênh, HSTC, Khóa thông minh Smart Key', N'Đen mờ, Đỏ đen, Xám xi măng, Trắng bạc', '/images/Xe/honda_sh_160i_abs_2024.jpg', 1),
(N'Honda Air Blade 160 ABS', 'Honda', N'Xe ga', 56690000, N'156.9cc eSP+, Phanh ABS trước, Cổng sạc USB, Cốp rộng 23.2L', N'Đỏ đen, Xanh xám, Đen vàng đồng', '/images/Xe/honda_air_blade_160_abs.jpg', 1),
(N'Honda Lead 125cc (Bản Đặc Biệt)', 'Honda', N'Xe ga', 42790000, N'124.8cc eSP+, Cốp siêu lớn 37L đựng vừa 2 mũ bảo hiểm, Nắp bình xăng trước', N'Bạc nhám, Đen nhám, Xanh dương', '/images/Xe/honda_lead_125cc_dac_biet.jpg', 1),
(N'Honda Vision 110 Thể Thao', 'Honda', N'Xe ga', 36590000, N'109.5cc eSP, Khung dập eSAF thế hệ mới siêu nhẹ, Tiết kiệm xăng 1.85L/100km', N'Đen nhám, Xám xi măng thể thao', '/images/Xe/honda_vision_110_the_thao.jpg', 1),
(N'Honda Winner X 150 ABS', 'Honda', N'Xe côn tay', 50560000, N'149.1cc DOHC 6 cấp số, Phanh đĩa ABS trước, Bộ ly hợp chống trượt 2 chiều', N'Đỏ đen trắng HRC, Đen vàng đồng', '/images/Xe/honda_winner_x_150_abs.jpg', 1),
(N'Honda Wave Alpha 110cc', 'Honda', N'Xe số', 18190000, N'109.1cc làm mát bằng không khí, Động cơ siêu bền bỉ, 1.72L/100km', N'Trắng bạc, Xanh dương, Đỏ đô, Đen mờ', '/images/Xe/honda_wave_alpha_110_2025.jpg', 1),
(N'Honda CBR150R', 'Honda', N'Xe côn tay', 72290000, N'149.2cc DOHC, Phanh ABS 2 kênh, Phuộc Showa USD, Ly hợp chống trượt', N'Đỏ đen HRC, Đen nhám thể thao', '/images/Xe/honda_cbr150r.jpg', 1),
(N'Honda Future 125 Fi', 'Honda', N'Xe số', 31090000, N'124.9cc PGM-FI, Đèn pha LED cao cấp, Cốp U-Box đựng mũ bảo hiểm full đầu', N'Trắng vàng đen, Xanh đen, Đỏ đen', '/images/Xe/honda_future_125_fi.jpg', 1),
(N'Honda SH Mode 125', 'Honda', N'Xe ga', 58190000, N'124.8cc eSP+ 4 van, Phanh ABS trước, Khóa SmartKey, Cổng sạc USB trước', N'Đỏ nâu, Bạc đen, Xanh đen, Trắng nâu', '/images/Xe/honda_sh_mode_125.png', 1),
(N'Honda Vario 160', 'Honda', N'Xe ga', 51990000, N'156.9cc eSP+ 4 van, Phanh đĩa ABS trước, Khung eSAF, Sạc USB', N'Đen nhám, Xanh đen bạc, Đỏ đen', '/images/Xe/honda_vario_160.jpg', 1),
(N'Yamaha Exciter 155 VVA ABS', 'Yamaha', N'Xe côn tay', 54000000, N'155cc 4 van biến thiên VVA, 17.9 mã lực, Phanh ABS 2 piston, Bộ ly hợp A&S', N'Xanh GP, Đen nhám, Đỏ đen, Xám xi măng', '/images/Xe/yamaha_exciter_155_vva.jpg', 1),
(N'Yamaha Grande Hybrid', 'Yamaha', N'Xe ga', 49500000, N'124.9cc Blue Core Hybrid trợ lực điện, Tiết kiệm xăng số 1 (1.66L/100km), Phanh ABS', N'Trắng ngọc trai, Đỏ nhám, Xanh xám', '/images/Xe/yamaha_grande_hybrid.jpg', 1),
(N'Yamaha NVX 155 VVA', 'Yamaha', N'Xe ga', 55500000, N'155.1cc VVA, Phanh ABS trước, Kết nối Y-Connect, Khóa SmartKey', N'Đen vàng, Xám ánh xanh, Đỏ đen Monster', '/images/Xe/yamaha_nvx_155_vva.jpg', 1),
(N'Yamaha PG-1 Scrambler', 'Yamaha', N'Xe số', 30437000, N'113.7cc làm mát không khí, Lốp gai địa hình khối lớn, Yên đôi rời phong cách bụi bặm', N'Vàng cát, Xanh rêu, Nâu đất, Đen bạc', '/images/Xe/yamaha_pg_1.jpg', 1),
(N'Yamaha Sirius FI', 'Yamaha', N'Xe số', 21100000, N'115cc FI phun xăng điện tử, Động cơ bốc, Tiết kiệm nhiên liệu vượt trội', N'Đỏ đen, Đen nhám, Xám đen, Xanh bạc', '/images/Xe/yamaha_sirius_fi.jpg', 1),
(N'Yamaha Janus 125', 'Yamaha', N'Xe ga', 28600000, N'125cc Blue Core, Khóa thông minh SmartKey, Cốp rộng 14L, Đồng hồ LCD', N'Xanh đen, Trắng ngọc trai, Đỏ nhung', '/images/Xe/yamaha_janus_125.jpg', 1),
(N'Yamaha FreeGo 125', 'Yamaha', N'Xe ga', 34100000, N'125cc Blue Core, Phanh ABS bánh trước, Cốp 25L, Nắp xăng ngoài tiện lợi', N'Đỏ đen, Xám đen nhám, Xanh rêu', '/images/Xe/yamaha_freego_125.png', 1),
(N'Yamaha Latte 125', 'Yamaha', N'Xe ga', 38300000, N'125cc Blue Core, Cốp 37L đáy phẳng cực đại, SmartKey, Nắp xăng trước', N'Trắng tinh khôi, Đỏ đô, Bạc ánh kim', '/images/Xe/yamaha_latte_125.jpg', 1),
(N'Yamaha Jupiter Finn', 'Yamaha', N'Xe số', 27700000, N'113.7cc FI, Phanh kết hợp UBS, Hộc để đồ phía trước, Tiết kiệm xăng 1.64L/100km', N'Xám bạc, Xanh ánh kim, Đỏ đen', '/images/Xe/yamaha_jupiter_finn.jpg', 1),
(N'Yamaha YZF-R15 V4', 'Yamaha', N'Xe côn tay', 78000000, N'155cc VVA, Quickshifter 1 chiều, Kiểm soát lực kéo TCS, Phanh ABS 2 kênh', N'Xanh GP R-Series, Đen bóng Metallic', '/images/Xe/yamaha_yzf_r15_v4.jpg', 1),
(N'Vespa 946 Dragon', 'Piaggio & Vespa', N'Xe ga', 458000000, N'155cc 3V i-Get, Thân xe nguyên khối đúc nhôm thủ công, ABS 2 kênh, Chống trượt ASR', N'Vàng ánh kim họa tiết Rồng huyền thoại', '/images/Xe/vespa_946_dragon.jpg', 1),
(N'Vespa GTS Super Sport 150', 'Piaggio & Vespa', N'Xe ga', 137000000, N'155cc i-Get 4V, Phanh ABS 2 kênh, Khóa thông minh SmartKey, Màn hình LCD', N'Trắng Innocente, Cam Tramonto, Đen bóng', '/images/Xe/vespa_gts_super_sport_150.jpg', 1),
(N'Vespa GTS Touring 300', 'Piaggio & Vespa', N'Xe ga', 179000000, N'278cc HPE 23.8 mã lực, ABS 2 kênh, Kính chắn gió touring, Baga sau cao cấp', N'Xanh Rêu Foresta, Xám Materia', '/images/Xe/vespa_gts_touring_300.jpg', 1),
(N'Vespa Primavera 125 ABS', 'Piaggio & Vespa', N'Xe ga', 77800000, N'124.5cc i-Get 3V, Phanh ABS trước, Đèn Full LED 2 tầng, Cổng sạc USB cốp trước', N'Trắng mây, Xanh biển sâu, Cam đào, Hồng', '/images/Xe/vespa_primavera_125.jpg', 1),
(N'Vespa Sei Giorni II', 'Piaggio & Vespa', N'Xe ga', 199000000, N'278cc HPE, Đèn pha fano basso dè trước kinh điển, Yên đơn thể thao phong cách cổ', N'Xám mờ Sei Giorni thể thao số 47', '/images/Xe/vespa_sei_giorni_ii.jpg', 1),
(N'Vespa Sprint S 125', 'Piaggio & Vespa', N'Xe ga', 81300000, N'124.5cc i-Get, Phanh ABS trước, Đèn pha lục giác LED, Mâm 12 inch thể thao', N'Đen nhám, Xám xi măng, Vàng mờ, Đỏ bóng', '/images/Xe/vespa_sprint_s_125.jpg', 1),
(N'Piaggio Beverly 400', 'Piaggio & Vespa', N'Xe ga', 235000000, N'399cc hpe 35.4 HP, Phanh ABS 2 kênh, Khóa Keyless, Đồng hồ 5.5 inch LCD', N'Đen nhám Meteora, Cam Arancio, Bạc Argento', '/images/Xe/piaggio_beverly_400.jpg', 1),
(N'Piaggio Liberty 125 S', 'Piaggio & Vespa', N'Xe ga', 57700000, N'124.5cc i-Get 3 van, Phanh ABS bánh trước, Bánh lớn 16 inch vượt chướng ngại êm ái', N'Xám titan, Trắng tuyết, Đen nhám', '/images/Xe/piaggio_liberty_125_s.jpg', 1),
(N'Piaggio Medley S 150', 'Piaggio & Vespa', N'Xe ga', 95300000, N'155cc i-Get 4V 16.2 HP, Phanh ABS 2 kênh, Start-Stop RISS, Kết nối Piaggio MIA', N'Nâu mờ Terra, Đen bóng Lucido, Trắng', '/images/Xe/piaggio_medley_s_150.jpg', 1),
(N'Piaggio Zip 100', 'Piaggio & Vespa', N'Xe ga', 36000000, N'96cc 4 thì, Yên xe chỉnh 3 mức độ cao, Trọng lượng nhẹ chỉ 89kg luồn lách phố hẹp', N'Đỏ tươi, Trắng tinh khôi, Đen bóng', '/images/Xe/piaggio_zip_100.jpg', 1),
(N'Suzuki Raider R150', 'Suzuki', N'Xe côn tay', 51190000, N'147.3cc DOHC 4 van làm mát két nước lớn, Công suất cực đại 18.5 mã lực', N'Xanh đen MotoGP, Đỏ đen thể thao', '/images/Xe/suzuki_raider_r150.jpg', 1),
(N'Suzuki Satria F150', 'Suzuki', N'Xe côn tay', 53490000, N'147.3cc DOHC, Phun xăng điện tử Fi, Đồng hồ kỹ thuật số Full LCD', N'Xanh Titan, Trắng đỏ, Đen mờ', '/images/Xe/suzuki_satria_f150.jpg', 1),
(N'Suzuki Burgman Street 125', 'Suzuki', N'Xe ga', 48600000, N'124.3cc động cơ SEP, Thiết kế Maxi-Scooter phong cách Châu Âu bề thế', N'Vàng đồng, Xám mờ, Đen bóng', '/images/Xe/suzuki_burgman_street_125.jpg', 1),
(N'Suzuki GSX-R150', 'Suzuki', N'Xe côn tay', 71500000, N'147.3cc DOHC 19.2 HP, Phanh ABS trước sau, Khóa thông minh SmartKey, Đèn pha LED', N'Xanh đen GP Ecstar, Đen vành đỏ', '/images/Xe/suzuki_gsx_r150.jpg', 1),
(N'Suzuki GSX-S150', 'Suzuki', N'Xe côn tay', 54400000, N'147.3cc DOHC 19.2 mã lực, Khung sườn kim cương siêu cứng vững, Màn hình LCD', N'Đen mờ Titan, Xanh đen', '/images/Xe/suzuki_gsx_s150.jpg', 1),
(N'Suzuki V-Strom 250SX', 'Suzuki', N'Xe côn tay', 132900000, N'249cc SOCS làm mát bằng dầu, Phanh ABS 2 kênh, Kính chắn gió cao, Cổng sạc USB', N'Vàng Champion, Cam Pearl, Đen bóng', '/images/Xe/suzuki_v_strom_250sx.jpg', 1),
(N'Suzuki Address 110', 'Suzuki', N'Xe ga', 28290000, N'113cc SEP làm mát không khí, Cốp xe 20.6L chứa vừa mũ full-face, Sàn để chân rộng', N'Đỏ đen, Xanh đen, Trắng bạc', '/images/Xe/suzuki_address_110.jpg', 1),
(N'Suzuki Avenis 125', 'Suzuki', N'Xe ga', 39000000, N'124.3cc SEP, Nắp bình xăng phía sau đuôi xe, Đồng hồ điện tử, Đèn LED đôi', N'Trắng mờ, Xanh neon thể thao, Đen bóng', '/images/Xe/suzuki_avenis_125.jpg', 1),
(N'Suzuki GD110HU', 'Suzuki', N'Xe côn tay', 27900000, N'112.8cc côn tay 4 số, Bình xăng giọt nước 9.2L, Phuộc sau 5 cấp độ tải trọng', N'Đen mờ cổ điển, Đỏ đen', '/images/Xe/suzuki_gd110hu.jpg', 1),
(N'Suzuki Impulse 125', 'Suzuki', N'Xe ga', 31990000, N'124cc DCP-FI, Vành đúc 16 inch bề thế, Cốp xe rộng rãi, Đèn đuôi lấy cảm hứng GSX', N'Xanh mờ, Đen mờ vàng, Trắng xanh', '/images/Xe/suzuki_impulse_125.jpg', 1),
(N'SYM Attila 125', 'SYM', N'Xe ga', 33700000, N'124.6cc E-Power phun xăng điện tử, Đèn LED toàn phần, Cổng sạc USB trước', N'Trắng thanh lịch, Đỏ mận, Đen mờ', '/images/Xe/sym_attila_125.jpg', 1),
(N'SYM Tuscany 150', 'SYM', N'Xe ga', 45000000, N'149.6cc 4 thì, Phanh đĩa CBS 2 bánh, Khóa thông minh SmartKey, Màn hình LCD màu', N'Xanh ngọc, Trắng ngọc trai, Xám xi măng', '/images/Xe/sym_tuscany_150.jpg', 1),
(N'SYM Shark 50', 'SYM', N'Xe ga', 24500000, N'49.5cc làm mát không khí, Không cần bằng lái, Nắp bình xăng phía trước, Cốp lớn', N'Xanh nhám, Trắng, Đen mờ', '/images/Xe/sym_shark_50.jpg', 1),
(N'SYM Priti 50', 'SYM', N'Xe ga', 26000000, N'49.5cc 4 thì siêu êm, Trọng lượng 93kg, Gương xoay thời trang, Cốp xe tiện dụng', N'Hồng Pastel, Xanh bạc hà, Trắng sữa', '/images/Xe/sym_priti_50.jpg', 1),
(N'SYM Star SR 170', 'SYM', N'Xe côn tay', 52400000, N'174.5cc Ecotech 4V, Phanh ABS trước, Hộp số 6 cấp, Khung sườn gia cường thể thao', N'Đỏ đen thể thao, Xanh đen', '/images/Xe/sym_star_sr_170.jpg', 1),
(N'SYM Galaxy 125', 'SYM', N'Xe số', 25200000, N'124.6cc E-Power, Vành đúc thể thao, Hộc đồ đầu xe, Đèn định vị LED sắc sảo', N'Đỏ đen, Đen nhám vành đúc', '/images/Xe/sym_galaxy_125.jpg', 1),
(N'SYM Elegant 110', 'SYM', N'Xe số', 16700000, N'110cc bền bỉ, Tiêu hao 1.68L/100km, Khung sườn thép chịu lực cao', N'Đỏ đen, Xanh đen, Đen mờ', '/images/Xe/sym_elegant_110.jpg', 1),
(N'SYM Passing 125', 'SYM', N'Xe ga', 26200000, N'124.6cc phun xăng điện tử, Đèn pha đôi mắt cú, Cốp rộng, Trọng lượng nhẹ', N'Đen nhám, Đỏ đen thể thao', '/images/Xe/sym_passing_125.jpg', 1),
(N'SYM Angela 50', 'SYM', N'Xe số', 17500000, N'49.5cc êm ái, Không cần bằng lái A1, Hộc đồ trước tiện lợi, Mức tiêu hao 1.55L/100km', N'Hồng trắng, Xanh trắng ngọc, Đỏ trắng', '/images/Xe/sym_angela_50.jpg', 1),
(N'SYM Abelo 110', 'SYM', N'Xe số', 17200000, N'110cc 4 thì, Phuộc giảm xóc dầu êm ái, Đồng hồ hiển thị rõ nét, Tiết kiệm nhiên liệu', N'Đen đỏ, Xanh bạc, Trắng đen', '/images/Xe/sym_abelo_110.jpg', 1);

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