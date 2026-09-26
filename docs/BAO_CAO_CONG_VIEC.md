# BÁO CÁO TỔNG HỢP CÁC TÍNH NĂNG ĐÃ THỰC HIỆN - MOTOSHOP CRM v2.0

> **Thời gian hoàn thành**: 18/09/2026  
> **Dự án**: Motoshop CRM & E-Commerce Frontend (`d:\crm-project\crm-frontend`)  
> **Công nghệ sử dụng**: React 19, Vite 8, Tailwind CSS v4, TypeScript 5+

---

## 📋 TÓM TẮT CÁC CÔNG VIỆC ĐÃ THỰC HIỆN

### 1. 🔀 Phân luồng Địa chỉ URL độc lập (`#admin` & `#customer`)
- **Cổng Quản trị Admin (`http://localhost:5174/#admin`)**: Truy cập thẳng tới Dashboard dành cho Quản lý & Nhân viên.
- **Cổng Khách hàng (`http://localhost:5174/#customer`)**: Truy cập thẳng tới Portal Khách hàng xem xe, mua phụ tùng, đặt lịch & trang cá nhân.
- **Trang Chọn luồng (`http://localhost:5174/`)**: Trang Landing Page cho phép chọn Cổng Khách hàng hoặc Cổng Admin.
- Tự động đồng bộ đường dẫn và lắng nghe sự thay đổi URL Hash (`hashchange`).

---

### 2. 🔑 Trang Đăng Nhập Quản Trị Admin (`AdminLogin.tsx`)
- Màn hình Đăng nhập chuyên dụng dành cho Ban quản lý & Nhân viên hệ thống Admin.
- Tự động xác thực thông tin Email/SĐT nhân viên.
- Tự động kiểm tra trạng thái tài khoản: Nếu nhân viên bị khóa (`BiKhoa`), hệ thống chặn đăng nhập và thông báo cảnh báo an toàn.
- **Đăng nhập nhanh Tài khoản Demo**:
  - 👑 **Super Admin** (`admin@motoshop.vn`)
  - 💼 **Nhân viên Bán hàng** (`sale@motoshop.vn`)
  - 🔧 **Nhân viên Kỹ thuật & Kho** (`kythuat@motoshop.vn`)
- Tích hợp nút **"🚪 Đăng xuất"** trên Header & Sidebar để nhân viên đăng xuất an toàn khỏi hệ thống.

---

### 3. 🌐 Quyền Truy cập Khách vãng lai (Chưa đăng nhập)
- **Khách chưa đăng nhập có thể**:
  - 🏍️ Xem toàn bộ mẫu xe 2025 trong **Showroom** (`VehiclesShowroom.tsx`), lọc theo Hãng, Phân khúc, Đăng ký lái thử.
  - 🔧 Xem danh mục **Phụ tùng & Phụ kiện** (`PartsStore.tsx`), tìm kiếm sản phẩm, lọc danh mục, xem giá khuyến mãi.
  - 🛒 Thêm phụ tùng vào giỏ hàng và thực hiện Đặt hàng/Thanh toán (`Checkout.tsx`).
- **Bảo mật Trang Cá nhân**:
  - Khi người dùng bấm tab **"Cá nhân"** lúc chưa đăng nhập, hệ thống hiển thị màn hình thông báo **"VUI LÒNG ĐĂNG NHẬP"** hướng dẫn Đăng nhập / Đăng ký ở thanh Header hoặc quay lại xem Showroom xe (không lộ dữ liệu khách hàng khác).

---

### 4. 🔐 Đăng nhập, Đăng ký & Hồ sơ Khách hàng
- **Public Auth Modal bảo mật**:
  - Đã xóa hoàn toàn danh sách khách hàng khỏi Modal public.
  - **Tab Đăng nhập**: Nhập Email/SĐT + Mật khẩu (có nút **"Login Demo (Nguyễn Văn An)"** đăng nhập nhanh).
  - **Tab Đăng ký mới**: Khách tự tạo tài khoản (Họ tên, Email, SĐT, Địa chỉ), dữ liệu tự động đồng bộ ngay lập tức sang CSDL CRM Admin.
- **Tự chỉnh sửa Hồ sơ cá nhân**:
  - Khách hàng bấm nút **"✏️ Sửa hồ sơ"** trên Header trang cá nhân để tự cập nhật *Họ tên, Email, SĐT, Địa chỉ, Ngày sinh, Giới tính, Ảnh đại diện Avatar*.
  - Hiển thị Avatar sắc nét trên thanh điều hướng Navbar và Header Dashboard.

---

### 5. 👥 Quản lý CRM Khách hàng & Bảo hành Điện tử (Admin)
- **Sửa tài khoản khách hàng (`Customers.tsx`)**:
  - Bổ sung nút **`✏️ Sửa`** mở Modal cho phép Admin cập nhật Họ tên, Email, SĐT, Địa chỉ, Ngày sinh, Giới tính, Trạng thái tài khoản (Hoạt động / Bị khóa), Ảnh đại diện Avatar.
- **Xóa tài khoản khách hàng (`Customers.tsx`)**:
  - Bổ sung nút **`🗑️ Xóa`** có hộp thoại cảnh báo an toàn để xóa vĩnh viễn khách hàng khỏi CSDL CRM.
- **Quản lý Xe & Bảo hành Điện tử**:
  - Xem danh sách phương tiện sở hữu của từng khách hàng.
  - Nút **"Gia hạn bảo hành (+12T / +24T)"** cập nhật tức thì hạn bảo hành điện tử của xe.

---

### 6. 📝 Hệ thống Tạo & Gửi Khảo sát (Admin & Customer)
- **Admin (`Feedback.tsx`)**:
  - Bổ sung tab **"Quản lý & Tạo Khảo sát"**.
  - Cho phép Admin tạo bài khảo sát mới: Tiêu đề, Mô tả, Chọn gửi tới **TẤT CẢ KHÁCH HÀNG** (`ALL`) hoặc gửi tới **KHÁCH HÀNG CỤ THỂ**, danh sách các câu hỏi trắc nghiệm & tùy chọn đáp án.
  - Xem báo cáo số lượng và chi tiết câu trả lời phản hồi từ khách hàng.
- **Khách hàng (`CustomerDashboard.tsx`)**:
  - Tự động nhận diện bài khảo sát do Admin gửi.
  - Hiển thị **Banner thông báo màu vàng 🔔 & Badge nhấp nháy** khi có khảo sát mới.
  - Khách hàng xem các câu hỏi, tích chọn đáp án và bấm **"Gửi câu trả lời khảo sát"** để gửi kết quả về cho hệ thống.

---

### 7. 📁 Tải File Ảnh Trực tiếp từ Máy tính (`ImageUploader.tsx`)
- Tạo component tái sử dụng `ImageUploader` tích hợp nút **`📁 Tải ảnh từ máy tính`**.
- Đọc file ảnh từ thiết bị cá nhân (`.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`), mã hóa Data URL để xem trước (Preview) sắc nét trên trình duyệt mà không cần backend uploader.
- **Đã tích hợp vào tất cả vị trí liên quan đến hình ảnh**:
  1. Phụ tùng & Phụ kiện (`Parts.tsx` - Modal Thêm/Sửa sản phẩm)
  2. Xe mẫu trưng bày (`Vehicles.tsx` - Modal Thêm/Sửa xe)
  3. Xe cá nhân sở hữu (`CustomerDashboard.tsx` & `Customers.tsx` - Đăng ký xe mới)
  4. Ảnh đại diện Avatar tài khoản (`CustomerDashboard.tsx` & `Customers.tsx`)

---

### 8. 🔍 Lọc Sản Phẩm Đa Tiêu Chí (Phụ tùng & Xe mẫu Admin)
- **Quản lý Phụ tùng (`Parts.tsx`)**:
  - Thanh bộ lọc đa tiêu chí: Tìm kiếm từ khóa, Lọc theo Danh mục, Lọc theo Thương hiệu (Honda, Yamaha, NGK, Michelin,...), Lọc theo Mức tồn kho (*Còn hàng ≥ 20*, *Sắp hết < 20*, *Hết hàng*), Lọc theo trạng thái Khuyến mãi (*Có khuyến mãi*, *Giá thường*).
- **Quản lý Xe mẫu Showroom (`Vehicles.tsx`)**:
  - Thanh bộ lọc đa tiêu chí: Tìm kiếm tên xe/màu sắc, Lọc theo Hãng (Honda, Yamaha, Suzuki,...), Lọc theo Phân khúc (*Xe số, Tay ga, Côn tay, Xe điện*), Lọc theo Khả năng Lái thử (*Có thể lái thử*, *Chưa hỗ trợ*), Lọc theo Khoảng giá (*<30tr, 30-60tr, 60-90tr, >90tr*).

---

### 9. 💬 Lọc Đa Tiêu Chí Phản Hồi & Khiếu Nại (`Feedback.tsx`)
- Thanh lọc đa tiêu chí cho Phản hồi & Khiếu nại khách hàng:
  - Input tìm kiếm theo tên khách hàng hoặc nội dung phản hồi.
  - Lọc theo Loại: *⭐ Đánh giá* vs *⚠️ Khiếu nại*.
  - Lọc theo Số sao đánh giá (1 star -> 5 stars).
  - Lọc theo Danh mục (*Dịch vụ, Sản phẩm, Bảo hành*).
  - Lọc theo Trạng thái xử lý (*Tất cả, Chờ xử lý, Đã xử lý*).

---

### 10. 📊 Thống Kê Doanh Thu Đa Dạng (`Dashboard.tsx`)
- Nút chuyển đổi thời gian linh hoạt: **Theo Ngày (7 ngày qua)**, **Theo Tuần (4 tuần gần nhất)**, **Theo Tháng (7 tháng qua)**, **Theo Năm (3 năm qua)**.
- Biểu đồ đường LineChart & Thẻ KPI Doanh thu tự động thay đổi dữ liệu chính xác theo chu kỳ thời gian được chọn.
- Thẻ thống kê **Cơ cấu doanh thu theo nguồn**: *Bán Xe Máy Mới (62%)*, *Phụ tùng & Phụ kiện (25%)*, *Bảo dưỡng & Sửa chữa (13%)*.

---

### 11. 🛡️ Phân Quyền Nhân Sự & Quản Lý Account Staff (`StaffRoles.tsx` & `AdminLayout.tsx`)
- **Trang Quản lý Nhân sự (`StaffRoles.tsx`)**:
  - Bảng danh sách tài khoản nhân viên Admin (`SuperAdmin`, `NhanVienBanHang`, `NhanVienKyThuat`).
  - Tìm kiếm & lọc nhân viên, Nút đổi vai trò (Role assignment), Khóa/Mở khóa tài khoản nhân viên.
  - Ma trận phân quyền chi tiết (RBAC Permission Matrix) so sánh quyền hạn truy cập từng tính năng.
- **Thanh Điều Hướng & Topbar Role Switcher (`AdminLayout.tsx`)**:
  - Bổ sung bộ chuyển đổi vai trò (Role Switcher) ở Topbar header để giả lập góc nhìn của Super Admin, Nhân viên Bán hàng, Nhân viên Kỹ thuật.
  - Menu điều hướng Sidebar tự động ẩn/hẹn các mục tương ứng với từng vai trò nhân sự.

---

## 📁 DANH SÁCH FILE ĐÃ TẠO MỚI & CHỈNH SỬA

| STT | Đường dẫn File | Loại thay đổi | Chức năng thực hiện |
|---|---|---|---|
| 1 | `src/pages/admin/AdminLogin.tsx` | **NEW** | Màn hình Đăng nhập Quản trị dành cho Nhân viên Admin |
| 2 | `src/components/shared/ImageUploader.tsx` | **NEW** | Component chọn file ảnh từ máy tính & xem trước |
| 3 | `src/pages/admin/StaffRoles.tsx` | **NEW** | Trang Phân quyền RBAC & Quản lý tài khoản nhân viên |
| 4 | `src/data/mockData.ts` | **MODIFY** | Thêm StaffAccount, RBAC roles & dữ liệu doanh thu đa chu kỳ |
| 5 | `src/pages/admin/Dashboard.tsx` | **MODIFY** | Bộ lọc doanh thu theo Ngày/Tuần/Tháng/Năm & cơ cấu nguồn thu |
| 6 | `src/pages/admin/Feedback.tsx` | **MODIFY** | Lọc đa tiêu chí phản hồi & Công cụ tạo/gửi Khảo sát |
| 7 | `src/pages/admin/Parts.tsx` | **MODIFY** | Lọc phụ tùng đa tiêu chí (Brand, Cat, Stock, Discount) & Uploader |
| 8 | `src/pages/admin/Vehicles.tsx` | **MODIFY** | Lọc xe mẫu đa tiêu chí (Brand, Segment, TestDrive, Price) & Uploader |
| 9 | `src/pages/admin/Customers.tsx` | **MODIFY** | Thêm nút Sửa, Xóa khách hàng & Tải ảnh đại diện Avatar/Xe |
| 10 | `src/pages/customer/CustomerDashboard.tsx` | **MODIFY** | Sửa hồ sơ cá nhân, nhận & làm khảo sát, tải avatar & ảnh xe |
| 11 | `src/layouts/AdminLayout.tsx` | **MODIFY** | Topbar Role Switcher, Nhân viên đăng nhập & Nút Đăng xuất |
| 12 | `src/layouts/CustomerLayout.tsx` | **MODIFY** | Cập nhật Auth modal, Navbar avatar & Phân luồng |
| 13 | `src/App.tsx` | **MODIFY** | Admin Authentication flow, Hash Routing & App State |

---

## 🚀 ĐƯỜNG DẪN TRUY CẬP THỬ NGHIỆM

Hệ thống dev server đang chạy tại:
- 🏠 **Trang chọn Cổng**: `http://localhost:5174/`
- 🔐 **Cổng Quản trị Admin**: `http://localhost:5174/#admin`
- 👤 **Cổng Khách hàng**: `http://localhost:5174/#customer`

---

## 🔧 PHẦN BACKEND API (ASP.NET Core + Dapper + SQL Server)

> **Ngày bắt đầu Backend**: 18/09/2026
> **Người thực hiện đầu tiên**: Giang
> **Trạng thái**: ⏳ Đang chờ các thành viên nhóm hoàn thành phần còn lại

### Công nghệ Backend

| Thành phần | Công nghệ | Phiên bản |
|------------|-----------|-----------|
| Framework | ASP.NET Core Web API | .NET 10.0 |
| ORM / Data Access | Dapper | 2.1.86 |
| Database | SQL Server 2022 (Docker) | Port 14333 |
| API Docs | Swagger / Swashbuckle | 10.2.3 |

### Phần Giang đã hoàn thành ✅

| STT | File | Loại | Nội dung |
|:---:|------|:----:|----------|
| 1 | `CrmBackend/Models/TaiKhoan.cs` | **NEW** | Model TaiKhoan + LoginRequest/LoginResponse DTOs |
| 2 | `CrmBackend/Models/KhachHang.cs` | **NEW** | Model KhachHang + Create/Update DTOs |
| 3 | `CrmBackend/Models/XeKhachHang.cs` | **NEW** | Model XeKhachHang + Create/GiaHanBaoHanh DTOs |
| 4 | `CrmBackend/Models/NhanVien.cs` | **NEW** | Model NhanVien (StaffAccount & AdminRole) + DTOs |
| 5 | `CrmBackend/Controllers/KhachHangController.cs` | **MODIFY** | Full CRUD: GetAll, GetById, Create, Update, Delete, ToggleKhoa, ThongKeTuoi (7 endpoints) |
| 6 | `CrmBackend/Controllers/XeKhachHangController.cs` | **NEW** | Full CRUD: GetAll, GetById, GetByKhachHang, Create, GiaHanBaoHanh, Delete (6 endpoints) |
| 7 | `CrmBackend/Controllers/NhanVienController.cs` | **NEW** | Full CRUD: GetAll, GetById, Create, Update, ToggleKhoa, DoiVaiTro, Delete (7 endpoints) |
| 8 | `CrmBackend/Program.cs` | **MODIFY** | Đọc config từ appsettings.json, thêm CORS port 5174 |
| 9 | `CrmBackend/appsettings.json` | **MODIFY** | Sửa port SQL Server 1433 → 14333 (đúng Docker) |
| 10 | `init-db/init.sql` | **MODIFY** | Bổ sung bảng NHAN_VIEN, liên kết TAI_KHOAN, seed 4 nhân viên mẫu |
| 11 | `docs/HUONG_DAN_NHOM.md` | **NEW** | Hướng dẫn làm việc nhóm chi tiết cho Backend |

### API Endpoints đã hoạt động (20 endpoints)

| # | Method | Route | Chức năng | Test |
|---|--------|-------|-----------|:----:|
| 1 | GET | `/api/KhachHang` | Danh sách khách hàng | ✅ |
| 2 | GET | `/api/KhachHang/{id}` | Chi tiết 1 KH | ✅ |
| 3 | POST | `/api/KhachHang` | Thêm KH mới | ✅ |
| 4 | PUT | `/api/KhachHang/{id}` | Sửa thông tin KH | ✅ |
| 5 | DELETE | `/api/KhachHang/{id}` | Xóa KH | ✅ |
| 6 | PUT | `/api/KhachHang/khoa/{id}` | Khóa/Mở khóa tài khoản | ✅ |
| 7 | GET | `/api/KhachHang/thong-ke-tuoi` | Biểu đồ phân bố tuổi | ✅ |
| 8 | GET | `/api/XeKhachHang` | Danh sách xe KH | ✅ |
| 9 | GET | `/api/XeKhachHang/{id}` | Chi tiết 1 xe | ✅ |
| 10 | GET | `/api/XeKhachHang/khach-hang/{maKh}` | Xe theo KH | ✅ |
| 11 | POST | `/api/XeKhachHang` | Thêm xe cho KH | ✅ |
| 12 | PUT | `/api/XeKhachHang/gia-han/{id}` | Gia hạn bảo hành | ✅ |
| 13 | DELETE | `/api/XeKhachHang/{id}` | Xóa xe | ✅ |
| 14 | GET | `/api/NhanVien` | Danh sách nhân viên Admin & Staff | ✅ |
| 15 | GET | `/api/NhanVien/{id}` | Chi tiết 1 nhân viên | ✅ |
| 16 | POST | `/api/NhanVien` | Thêm nhân viên mới + tạo tài khoản | ✅ |
| 17 | PUT | `/api/NhanVien/{id}` | Cập nhật thông tin nhân viên | ✅ |
| 18 | PUT | `/api/NhanVien/phan-quyen/{id}` | Phân quyền vai trò RBAC | ✅ |
| 19 | PUT | `/api/NhanVien/khoa/{id}` | Khóa/Mở khóa nhân viên | ✅ |
| 20 | DELETE | `/api/NhanVien/{id}` | Xóa nhân viên & tài khoản | ✅ |

---

## 🌿 GITHUB & QUẢN LÝ NHÁNH

> **Repo**: https://github.com/YangLe0405web/dailyphutungxe.git

### Cấu trúc nhánh

```
main                                        ← Code ổn định, production
  └── develop                               ← Nhánh tổng hợp từ các feature
        ├── feature/giang-customer-vehicle   ✅ DONE (đã merge vào develop)
        ├── feature/phuong-phutung-xemau     ⏳ Chờ Phương
        ├── feature/minh-donhang-lichhen     ⏳ Chờ Minh
        ├── feature/nghia-phanhoi-khaosat    ⏳ Chờ Nghĩa
        └── feature/loc-staff-revenue        ⏳ Chờ Lộc
```

### File hướng dẫn nhóm

- 📋 `HUONG_DAN_NHOM.md` — Hướng dẫn chi tiết từ Clone → Docker → Build → Code → Test → Push
- 📊 `crm-frontend/BANG_MODEL_CHIA_VIEC.csv` — Bảng phân công model theo nhóm
- 🧪 `crm-frontend/BANG_TEST_API_QA.csv` — Bảng test case API cho QA

---

## 📌 TIẾN ĐỘ NHÓM — BACKEND MODELS (100% HOÀN THÀNH)

| STT | Model | Người làm | Trạng thái | Ghi chú |
|:---:|-------|:---------:|:----------:|---------|
| 1 | Customer | Giang | ✅ Hoàn thành | 7 endpoints, đã test Swagger |
| 2 | Vehicle (xe KH) | Giang | ✅ Hoàn thành | 6 endpoints, đã test Swagger |
| 3 | ShowroomVehicle | Phương | ✅ Hoàn thành | Controller XeMau + Model SanPhamXe |
| 4 | Part (phụ tùng) | Phương | ✅ Hoàn thành | Controller PhuTung + Model PhuTung |
| 5 | CartItem / Cart | Minh | ✅ Hoàn thành | Hỗ trợ trong Order |
| 6 | Order (đơn hàng) | Minh | ✅ Hoàn thành | Controller DonHang + ChiTietDonHang |
| 7 | Appointment | Minh | ✅ Hoàn thành | Controller LichHen (Bảo dưỡng, Sửa chữa) |
| 8 | Feedback | Nghĩa | ✅ Hoàn thành | Controller PhanHoi + Model PhanHoi |
| 9 | Survey & Question | Nghĩa | ✅ Hoàn thành | Controller KhaoSat + CauHoiKhaoSat |
| 10 | SurveyResponse | Nghĩa | ✅ Hoàn thành | Kết quả khảo sát khách hàng |
| 11 | StaffAccount & Role | Lộc / Giang | ✅ Hoàn thành | Controller NhanVien + Model NhanVien (7 API) |
| 12 | RevenueAnalytics & Upload | Lộc | ✅ Hoàn thành | Controller RevenueAnalytics + UploadController |

---

## 🗄️ PHƯƠNG ÁN SAO LƯU VÀ PHỤC HỒI CƠ SỞ DỮ LIỆU (BACKUP & RESTORE SQL SERVER)
*(Đáp ứng tiêu chuẩn đánh giá mục II.1 Barem chấm điểm đồ án — 5 điểm)*

### 1. Chiến lược Sao lưu (Backup Strategy)

Hệ thống Motoshop CRM áp dụng chiến lược sao lưu chuẩn 3 cấp độ:
- **Full Backup (Sao lưu toàn phần)**: Thực hiện định kỳ vào 00:00 Chủ Nhật hàng tuần.
- **Differential Backup (Sao lưu vi sai)**: Thực hiện vào 23:00 từ Thứ 2 đến Thứ 7 hàng tuần (chỉ sao lưu các dữ liệu thay đổi so với Full Backup gần nhất).
- **Transaction Log Backup (Sao lưu nhật ký giao dịch)**: Thực hiện mỗi 30 phút trong giờ làm việc (8h - 18h) để đảm bảo RPO (Recovery Point Objective) dưới 30 phút khi có sự cố.

### 2. Cú pháp Lệnh T-SQL Sao lưu Database

#### a) Full Backup (Sao lưu toàn phần)
```sql
BACKUP DATABASE CRM_XeMayPhuTung
TO DISK = '/var/opt/mssql/data/CRM_XeMayPhuTung_Full.bak'
WITH FORMAT,
     MEDIANAME = 'CRMSQLServerBackups',
     NAME = 'Full Backup of CRM_XeMayPhuTung',
     COMPRESSION,
     STATS = 10;
GO
```

#### b) Differential Backup (Sao lưu vi sai)
```sql
BACKUP DATABASE CRM_XeMayPhuTung
TO DISK = '/var/opt/mssql/data/CRM_XeMayPhuTung_Diff.bak'
WITH DIFFERENTIAL,
     NAME = 'Differential Backup of CRM_XeMayPhuTung',
     COMPRESSION,
     STATS = 10;
GO
```

#### c) Transaction Log Backup (Sao lưu log)
```sql
BACKUP LOG CRM_XeMayPhuTung
TO DISK = '/var/opt/mssql/data/CRM_XeMayPhuTung_Log.trn'
WITH NAME = 'Transaction Log Backup of CRM_XeMayPhuTung',
     COMPRESSION,
     STATS = 10;
GO
```

### 3. Cú pháp Lệnh T-SQL Phục hồi Database (Restore Strategy)

Khi xảy ra sự cố hỏng hóc dữ liệu hoặc máy chủ bị lỗi, quy trình phục hồi thực hiện theo thứ tự:
1. Đưa database về trạng thái đơn người dùng (`SINGLE_USER`).
2. Khôi phục bản Full Backup gần nhất với tùy chọn `NORECOVERY`.
3. Khôi phục bản Differential Backup gần nhất với tùy chọn `NORECOVERY`.
4. Khôi phục bản Transaction Log cuối cùng với tùy chọn `RECOVERY`.

```sql
-- Bước 1: Ngắt kết nối các session đang hoạt động
ALTER DATABASE CRM_XeMayPhuTung SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
GO

-- Bước 2: Khôi phục bản Full Backup
RESTORE DATABASE CRM_XeMayPhuTung
FROM DISK = '/var/opt/mssql/data/CRM_XeMayPhuTung_Full.bak'
WITH NORECOVERY, REPLACE;
GO

-- Bước 3: Khôi phục bản Differential Backup (nếu có)
RESTORE DATABASE CRM_XeMayPhuTung
FROM DISK = '/var/opt/mssql/data/CRM_XeMayPhuTung_Diff.bak'
WITH NORECOVERY;
GO

-- Bước 4: Khôi phục Transaction Log và mở lại Database hoạt động bình thường
RESTORE LOG CRM_XeMayPhuTung
FROM DISK = '/var/opt/mssql/data/CRM_XeMayPhuTung_Log.trn'
WITH RECOVERY;
GO

-- Bước 5: Đưa database trở lại chế độ Multi-user
ALTER DATABASE CRM_XeMayPhuTung SET MULTI_USER;
GO
```

### 4. Lệnh Sao lưu & Xuất file ra máy tính Host (qua Docker CLI)

Dành cho quản trị viên thực hiện sao lưu từ Terminal máy trạm:

```bash
# 1. Thực thi lệnh Backup bên trong Container Docker
docker exec -it crm_sql_server /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "YourStrong@Password123" -C \
  -Q "BACKUP DATABASE CRM_XeMayPhuTung TO DISK = '/var/opt/mssql/data/CRM_Backup.bak' WITH FORMAT, COMPRESSION;"

# 2. Copy file backup từ Container Docker về thư mục máy tính cá nhân
docker cp crm_sql_server:/var/opt/mssql/data/CRM_Backup.bak D:/crm-project/backup/CRM_Backup.bak
```

---

## ⏳ CÔNG VIỆC TIẾP THEO

> Tất cả Backend API và các tiêu chí chấm điểm giao diện / CSDL đã hoàn thiện 100%. Bước tiếp theo là nối Frontend gọi API Backend thật.


