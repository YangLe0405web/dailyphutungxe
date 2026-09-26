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
(N'Honda Vision 2024', 'Honda', N'Xe ga', 32000000, N'110cc, Phun xăng điện tử'),
(N'Yamaha Exciter 155', 'Yamaha', N'Xe côn tay', 48000000, N'155cc, VVA');

-- Dữ liệu Đơn hàng
INSERT INTO DON_HANG (MaKH, TongTien, TrangThai) 
VALUES (1, 1500000, N'Chờ xác nhận');

-- Dữ liệu Lịch hẹn
INSERT INTO LICH_HEN (MaKH, LoaiDichVu, NgayHen, GhiChu, TrangThai)
VALUES (2, N'Bảo dưỡng định kỳ', '2026-09-25 09:00:00', N'Thay nhớt và kiểm tra phanh', N'Đã xác nhận');

GO