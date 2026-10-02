# BÁO CÁO TOÀN DIỆN VỀ KIỂM TRA MÃ NGUỒN HỆ THỐNG (CODEBASE AUDIT REPORT)
**Dự án:** Hệ Thống CRM Quản Lý Đại Lý Xe Máy & Phụ Tùng (Motosの記事 / Motoshop CRM)  
**Thời gian thực hiện:** 02/10/2026  
**Trạng thái hệ thống:** Backend (.NET 9) & Frontend (React/Vite) & Database (MSSQL Docker) đang hoạt động.

---

## 1. TỔNG QUAN KIẾN TRÚC HỆ THỐNG

| Thành phần | Công nghệ / Phiên bản | Cổng / Cấu hình | Trạng thái |
| :--- | :--- | :--- | :--- |
| **Cơ sở dữ liệu** | Microsoft SQL Server 2022 (Docker container `crm_sql_server`) | `localhost:14333` / Database `CRM_XeMayPhuTung` | Đang chạy (Active) |
| **Backend API** | ASP.NET Core Web API (.NET 9), Dapper ORM | `http://localhost:5208` (Swagger: `/swagger`) | Đang chạy (Active) |
| **Frontend Web** | React 18, TypeScript, Vite, Tailwind CSS | `http://localhost:5174` | Đang chạy (Active) |
| **Cơ chế đồng bộ** | RESTful API (`fetchWithTimeout`), Custom Event `crm-data-refresh`, LocalStorage cache & session persistence | Trực tiếp 2 chiều FE ↔ BE | Đã kết nối |

---

## 2. KẾT QUẢ KIỂM TRA CHI TIẾT TỪNG MODULE

### 2.1. Module Xác thực & Tài khoản (Authentication & Account)
- **Backend:** 
  - `KhachHangController.cs`: Đăng ký tài khoản (`POST /api/KhachHang`), tra cứu theo mã tài khoản (`GET /api/KhachHang/by-taikhoan/{maTK}`), danh sách khách hàng (`GET /api/KhachHang`).
  - `NhanVienController.cs`: Đăng nhập quản trị viên, thông tin nhân viên.
- **Frontend:**
  - `App.tsx`: Lưu trữ phiên người dùng (`crm_current_customer`, `crm_current_staff`, `crm_mode`, `crm_admin_page`, `crm_customer_page`) vào `localStorage`, tránh mất dữ liệu khi F5 tải lại trang.
  - Hỗ trợ modal Đăng nhập / Đăng ký cho Khách hàng và trang đăng nhập riêng cho Admin (`AdminLogin.tsx`).

### 2.2. Module Quản trị Khách hàng & Phân khúc CLV (CRM & CLV Classification)
- **Backend:**
  - `KhachHangController.cs`: Quản lý thông tin cá nhân, số điện thoại, sở thích.
  - `RevenueAnalyticsController.cs`: Tính toán doanh thu tích lũy, phân bổ khách hàng theo các chỉ số.
- **Frontend:**
  - `Customers.tsx`: Bảng danh sách khách hàng, cập nhật trạng thái hoạt động, xem lịch sử giao dịch.
  - Phân loại CLV (Customer Lifetime Value): Dựa trên tổng chi tiêu tích lũy qua các đơn hàng để phân nhóm:
    - **Mới (New):** Tổng chi tiêu < 20.000.000 VNĐ hoặc chưa mua hàng.
    - **Thân thiết (Loyal):** Tổng chi tiêu từ 20.000.000 VNĐ đến 100.000.000 VNĐ.
    - **VIP:** Tổng chi tiêu > 100.000.000 VNĐ.
  - `Reports.tsx`: Thống kê nhân khẩu học, biểu đồ độ tuổi và phân bổ sở thích xe (Xe ga, Xe số, Côn tay, Phụ tùng, v.v.).

### 2.3. Module Sản phẩm: Xe mẫu & Phụ tùng (Catalog & Inventory)
- **Backend:**
  - `XeMauController.cs`: Danh mục xe mẫu, thông số kỹ thuật, giá niêm yết, tình trạng hỗ trợ lái thử.
  - `PhuTungController.cs`: Danh mục phụ tùng, số lượng tồn kho, giá bán, hãng sản xuất.
- **Frontend:**
  - Khách hàng: `VehiclesShowroom.tsx` (danh mục xe mẫu, nút Đăng ký lái thử), `PartsStore.tsx` (danh mục phụ tùng, thêm vào giỏ hàng).
  - Quản trị viên: `Vehicles.tsx` (CRUD xe mẫu), `Parts.tsx` (CRUD phụ tùng, kiểm soát tồn kho).

### 2.4. Module Đơn hàng & Bán hàng (Orders & Checkout)
- **Backend:**
  - `DonHangController.cs`: Tạo đơn hàng (`POST /api/DonHang`), lấy chi tiết đơn hàng (`GET /api/DonHang/{id}`), cập nhật trạng thái đơn (`PUT /api/DonHang/{id}/status`), trừ kho tự động khi tạo đơn.
- **Frontend:**
  - `CartContext.tsx`: Quản lý giỏ hàng phụ tùng.
  - `Checkout.tsx`: Kiểm tra đăng nhập trước khi thanh toán, chọn phương thức thanh toán, lưu đơn vào CSDL và phát sự kiện đồng bộ.
  - `Sales.tsx` (Admin): Quản lý danh sách đơn hàng, lọc theo trạng thái (Chờ xác nhận, Đang xử lý, Hoàn thành, Đã hủy), duyệt đơn.

### 2.5. Module Lịch hẹn & Lái thử (Appointments & Test Drive)
- **Backend:**
  - `LichHenController.cs`: Đặt lịch bảo dưỡng và đăng ký lái thử xe (`POST /api/LichHen`), duyệt/hủy lịch hẹn (`PUT /api/LichHen/{id}/trang-thai`).
- **Frontend:**
  - `ServiceBooking.tsx`: Form khách hàng đặt lịch bảo dưỡng / sửa chữa hoặc đăng ký lái thử xe.
  - `Dashboard.tsx` & `Appointments.tsx` (Admin): Thông báo lịch hẹn mới, phê duyệt và điều phối nhân viên kỹ thuật.

### 2.6. Module Xe khách hàng & Gia hạn bảo hành điện tử (Warranty Management)
- **Backend:**
  - `XeKhachHangController.cs`: Quản lý xe mà khách hàng đang sở hữu (`GET /api/XeKhachHang/by-khachhang/{maKH}`), gia hạn bảo hành điện tử (`POST /api/XeKhachHang/renew-warranty/{maXeKH}`).
- **Frontend:**
  - `CustomerDashboard.tsx`: Hiển thị danh sách xe khách hàng sở hữu, ngày hết hạn bảo hành, nút gửi yêu cầu "Gia hạn bảo hành điện tử" 12 tháng, cập nhật tức thì.

### 2.7. Module Khảo sát & Đánh giá chất lượng (Surveys & Feedback)
- **Backend:**
  - `KhaoSatController.cs`: Tạo phiếu khảo sát, lấy câu hỏi khảo sát, nộp kết quả (`POST /api/KhaoSat/submit`).
  - `PhanHoiController.cs`: Gửi phản hồi/khiếu nại/đánh giá sao (`POST /api/PhanHoi`), cập nhật phản hồi của quản trị viên.
- **Frontend:**
  - Khách hàng: `Review.tsx` (Gửi phản hồi, chấm điểm sao), `SurveyTaking.tsx` (Làm khảo sát hài lòng dịch vụ).
  - Quản trị viên: `Feedback.tsx` (Xem và phản hồi khiếu nại), `Surveys.tsx` (Tạo chiến dịch khảo sát, thống kê tỷ lệ hài lòng).

### 2.8. Module Báo cáo & Dashboard Quản trị (Reports & Dashboard)
- **Backend:**
  - `RevenueAnalyticsController.cs`: Báo cáo doanh thu theo tháng, theo danh mục sản phẩm.
- **Frontend:**
  - `Dashboard.tsx`: Tổng số khách hàng thực tế từ DB, đơn hàng mới, lịch hẹn chờ duyệt, chuông thông báo real-time.
  - `Reports.tsx`: Biểu đồ doanh thu, biểu đồ CLV, cơ cấu nhân khẩu học độ tuổi và sở thích.

---

## 3. DANH SÁCH FILE VÀ CHỨC NĂNG CHÍNH ĐÃ RÀ SOÁT

```
crm-frontend/
├── src/
│   ├── App.tsx                       -> Điều hướng trung tâm, phân quyền Khách/Admin, lưu phiên làm việc
│   ├── contexts/CartContext.tsx      -> Quản lý giỏ hàng phụ tùng
│   ├── services/
│   │   ├── api.ts                    -> Kết nối REST API (Customer, Order, Appointment, Parts, Vehicles, v.v.)
│   │   └── notifications.ts          -> Hệ thống chuông thông báo cho Admin
│   ├── pages/admin/
│   │   ├── Dashboard.tsx             -> Tổng quan số liệu, lịch hẹn, đơn hàng, khách hàng mới
│   │   ├── Customers.tsx             -> Quản lý khách hàng, phân hạng CLV
│   │   ├── Sales.tsx                 -> Quản lý đơn hàng và giao dịch
│   │   ├── Vehicles.tsx              -> Quản lý kho xe mẫu trưng bày
│   │   ├── Parts.tsx                 -> Quản lý kho phụ tùng
│   │   ├── Feedback.tsx              -> Quản lý phản hồi và đánh giá
│   │   ├── Surveys.tsx               -> Khảo sát độ hài lòng khách hàng
│   │   └── Reports.tsx               -> Báo cáo doanh thu, CLV, nhân khẩu học
│   └── pages/customer/
│       ├── CustomerDashboard.tsx     -> Thông tin cá nhân, xe sở hữu, gia hạn bảo hành điện tử
│       ├── VehiclesShowroom.tsx      -> Trưng bày xe, đăng ký lái thử
│       ├── PartsStore.tsx            -> Cửa hàng phụ tùng xe máy
│       ├── ServiceBooking.tsx        -> Đặt lịch bảo dưỡng xe
│       ├── Checkout.tsx              -> Đặt hàng & thanh toán
│       ├── Review.tsx                -> Gửi đánh giá dịch vụ
│       └── SurveyTaking.tsx          -> Thực hiện khảo sát

CrmBackend/
├── Controllers/
│   ├── KhachHangController.cs        -> Xử lý khách hàng, tài khoản, sở thích
│   ├── DonHangController.cs          -> Xử lý đơn hàng, chi tiết đơn, trạng thái
│   ├── LichHenController.cs          -> Xử lý lịch hẹn lái thử & bảo dưỡng
│   ├── PhuTungController.cs          -> Xử lý danh mục & tồn kho phụ tùng
│   ├── XeMauController.cs            -> Xử lý danh mục xe mẫu
│   ├── XeKhachHangController.cs      -> Quản lý xe sở hữu & gia hạn bảo hành
│   ├── PhanHoiController.cs          -> Quản lý phản hồi đánh giá
│   ├── KhaoSatController.cs          -> Quản lý bài khảo sát & kết quả
│   └── RevenueAnalyticsController.cs -> Thống kê báo cáo doanh thu & phân tích
└── Models/                           -> Chứa toàn bộ Data Transfer Objects (DTO) và Entities
```

---

## 4. KẾ HOẠCH FIX BUG (FIX PLAN) SẴN SÀNG

Quy trình sẽ thực hiện ngay sau khi bạn gửi danh sách lỗi & kết quả mong đợi và xác nhận (Confirm):

1. **Bước 1: Tiếp nhận & Phân loại Bug List từ bạn:**
   - Đối chiếu từng lỗi với module tương ứng (Giao diện Frontend, Logic API Backend, hay Dữ liệu CSDL).
   - Xác định chính xác file và đoạn mã nguồn gây lỗi.

2. **Bước 2: Xây dựng giải pháp kỹ thuật chi tiết:**
   - Đảm bảo logic xử lý đúng 100% mong đợi.
   - Giữ vững tính nhất quán của dữ liệu (Data Integrity) giữa SQL Server, Backend API và State của React.

3. **Bước 3: Trình bày Kế hoạch & Chờ bạn Confirm:**
   - Liệt kê chi tiết từng file sẽ chỉnh sửa và giải pháp cụ thể.
   - Nhận phản hồi/đồng ý từ bạn trước khi can thiệp vào mã nguồn.

4. **Bước 4: Thực thi Fix Bug & Kiểm thử End-to-End:**
   - Tiến hành sửa mã nguồn sạch sẽ, không làm hỏng tính năng đã chạy tốt.
   - Chạy kiểm tra TypeScript (`npx tsc --noEmit`) và gọi kiểm thử API Backend thực tế.
   - Báo cáo kết quả chi tiết kèm hướng dẫn kiểm tra lại trên giao diện.
