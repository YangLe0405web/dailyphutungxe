# CRM ĐẠI LÝ XE MÁY & PHỤ TÙNG - C# .NET

## 1. Thông số kết nối Database (Docker)
- **DBMS:** Microsoft SQL Server 2022 (Docker container: `crm_sql_server`)
- **Server:** `localhost,1433`
- **Database:** `CRM_XeMayPhuTung`
- **User:** `sa`
- **Password:** `YourStrong@Password123`
- **Connection String (C#):**
  `Server=localhost,1433;Database=CRM_XeMayPhuTung;User Id=sa;Password=YourStrong@Password123;TrustServerCertificate=True;`

---

## 2. Kiến trúc & Công nghệ (Tech Stack)
- **Ngôn ngữ:** C# (.NET 8.0)
- **UI Framework:** WinForms (Khuyên dùng thư viện `Guna UI2` hoặc `MaterialSkin.2`) hoặc WPF (sử dụng `MaterialDesignInXAML`).
- **ORM / Data Access:** Dapper hoặc ADO.NET thuần (cho nhẹ và dễ kiểm soát truy vấn SQL).

---

## 3. Checklist màn hình & Chức năng cần Code
- [ ] **Màn hình Đăng nhập (LoginForm):**
  - Input: `TenDangNhap`, `MatKhau`
  - Logic: Kiểm tra bảng `TAI_KHOAN`, nếu `TrangThai == 'BiKhoa'` thì chặn; phân quyền điều hướng sang `AdminDashboard` hoặc `CustomerPortal`.
- [ ] **Admin - Quản lý khách hàng (CustomerForm):**
  - Hiển thị danh sách khách hàng (`KHACH_HANG` + `TAI_KHOAN`).
  - Thao tác: Thêm khách mới, cập nhật hồ sơ, xóa, đổi trạng thái khóa tài khoản.
- [ ] **Admin - Quản lý khảo sát (SurveyManagementForm):**
  - Tạo đợt khảo sát mới (`KHAO_SAT`).
  - Thêm danh sách câu hỏi (`CAU_HOI_KHAO_SAT`).
  - Xem kết quả tổng hợp (`KET_QUA_KHAO_SAT`).
- [ ] **Admin - Quản lý phản hồi (FeedbackForm):**
  - Xem danh sách ý kiến đánh giá từ bảng `PHAN_HOI`.
  - Cập nhật trạng thái từ `'Chờ xử lý'` sang `'Đã phản hồi'`.
- [ ] **Admin - Thống kê báo cáo (DashboardForm):**
  - Chart 1: Phân bố độ tuổi khách hàng (tính theo `NgaySinh`).
  - Chart 2: Cơ cấu sở thích nhu cầu (`SoThich`).
- [ ] **Khách hàng - Portal cá nhân (CustomerPortalForm):**
  - Thông tin cá nhân & Xe đang sở hữu (`XE_KHACH_HANG` join `SAN_PHAM_XE`).
  - Gửi đánh giá sao & nội dung nhận xét (`PHAN_HOI`).
  - Danh sách bài khảo sát cần làm & Form gửi câu trả lời (`KET_QUA_KHAO_SAT`).

---

## 4. Các câu lệnh SQL thường dùng trong C#
- **Lấy danh sách khách hàng:**
  `SELECT k.MaKH, k.HoTen, k.SoDienThoai, k.NgaySinh, k.GioiTinh, t.TrangThai FROM KHACH_HANG k JOIN TAI_KHOAN t ON k.MaTK = t.MaTK`
- **Khóa tài khoản:**
  `UPDATE TAI_KHOAN SET TrangThai = N'BiKhoa' WHERE MaTK = @MaTK`
- **Thống kê độ tuổi:**
  `SELECT CASE WHEN DATEDIFF(YEAR, NgaySinh, GETDATE()) < 25 THEN N'Dưới 25 tuổi' WHEN DATEDIFF(YEAR, NgaySinh, GETDATE()) BETWEEN 25 AND 40 THEN N'25 - 40 tuổi' ELSE N'Trên 40 tuổi' END AS NhomTuoi, COUNT(*) AS SoLuong FROM KHACH_HANG GROUP BY CASE WHEN DATEDIFF(YEAR, NgaySinh, GETDATE()) < 25 THEN N'Dưới 25 tuổi' WHEN DATEDIFF(YEAR, NgaySinh, GETDATE()) BETWEEN 25 AND 40 THEN N'25 - 40 tuổi' ELSE N'Trên 40 tuổi' END;`