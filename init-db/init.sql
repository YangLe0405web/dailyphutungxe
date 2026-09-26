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
INSERT INTO TAI_KHOAN (TenDangNhap, MatKhau, VaiTro, TrangThai) VALUES
('admin', '123456', N'SuperAdmin', N'HoatDong'),
('sale', '123456', N'NhanVienBanHang', N'HoatDong'),
('kythuat', '123456', N'NhanVienKyThuat', N'HoatDong'),
('hotro', '123456', N'NhanVienBanHang', N'BiKhoa'),
('nguyenvana', '123456', N'KhachHang', N'HoatDong'),
('tranthib', '123456', N'KhachHang', N'HoatDong');

-- Dữ liệu Nhân viên (StaffAccounts)
INSERT INTO NHAN_VIEN (MaTK, HoTen, Email, SoDienThoai, ChucVu, VaiTro, TrangThai, NgayThamGia) VALUES
(1, N'Trần Văn Quản Lý', 'admin@motoshop.vn', '0909999888', N'Giám đốc Showroom', N'SuperAdmin', N'HoatDong', '2022-01-01'),
(2, N'Nguyễn Thị Sale', 'sale@motoshop.vn', '0918888777', N'Chuyên viên Bán hàng & CRM', N'NhanVienBanHang', N'HoatDong', '2023-03-15'),
(3, N'Lê Văn Kỹ Thuật', 'kythuat@motoshop.vn', '0927777666', N'Trưởng xưởng Bảo dưỡng & Kho', N'NhanVienKyThuat', N'HoatDong', '2023-06-20'),
(4, N'Phạm Văn Hỗ Trợ', 'hotro@motoshop.vn', '0936666555', N'Nhân viên Tư vấn Bán hàng', N'NhanVienBanHang', N'BiKhoa', '2024-02-10');

-- Dữ liệu Khách hàng
INSERT INTO KHACH_HANG (MaTK, HoTen, NgaySinh, GioiTinh, SoDienThoai, DiaChi, SoThich) VALUES
(5, N'Nguyễn Văn A', '2001-05-15', N'Nam', '0901234567', N'Hà Nội', N'Xe thể thao, đi phượt'),
(6, N'Trần Thị B', '1995-11-20', N'Nữ', '0912345678', N'TP.HCM', N'Xe tiết kiệm xăng, đi làm');

-- Dữ liệu Xe mẫu Showroom
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

-- Dữ liệu Phụ tùng Showroom (PHU_TUNG)
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

-- Dữ liệu Đơn hàng
INSERT INTO DON_HANG (MaKH, TongTien, TrangThai) 
VALUES (1, 1500000, N'Chờ xác nhận');

-- Dữ liệu Lịch hẹn
INSERT INTO LICH_HEN (MaKH, LoaiDichVu, NgayHen, GhiChu, TrangThai)
VALUES (2, N'Bảo dưỡng định kỳ', '2026-09-25 09:00:00', N'Thay nhớt và kiểm tra phanh', N'Đã xác nhận');

GO