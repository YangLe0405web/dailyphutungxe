# CHƯƠNG 4: TRIỂN KHAI, BẢO TRÌ & HƯỚNG DẪN SỬ DỤNG
### HỆ THỐNG QUẢN LÝ QUAN HỆ KHÁCH HÀNG & KINH DOANH MOTOSHOP CRM

---

## 4.1 PHƯƠNG ÁN CÀI ĐẶT VÀ CHUYỂN ĐỔI HỆ THỐNG

### 4.1.1 Phương án cài đặt hệ thống mới
Hệ thống MotoShop CRM được xây dựng theo kiến trúc 3 tầng (3-Tier Architecture) hiện đại gồm Tầng trình diễn (React 19 Single Page Application), Tầng xử lý nghiệp vụ (ASP.NET Core Web API .NET 10) và Tầng cơ sở dữ liệu (Microsoft SQL Server 2022).

#### 1. Yêu cầu cấu hình phần cứng & phần mềm
- **Máy chủ Showroom (Server):** CPU 4-8 cores, RAM 8GB-16GB, SSD NVMe 256GB+.
- **Máy trạm nhân viên (Client POS):** CPU Core i3/i5, RAM 4GB-8GB, Màn hình Full HD 1920x1080.
- **Hệ điều hành:** Windows 10/11 Pro 64-bit hoặc Windows Server 2022.
- **Môi trường thực thi:** .NET SDK 10.0, Node.js 22.x LTS, SQL Server 2022.
- **Trình duyệt Web:** Google Chrome / Microsoft Edge phiên bản mới nhất.

#### 2. Quy trình cài đặt step-by-step
- **Bước 1: Khởi tạo Cơ sở dữ liệu SQL Server**
  - Kết nối SSMS tới `localhost`. Chạy kịch bản `init-db\init.sql` để tạo CSDL `CRM_XeMayPhuTung`, 12 bảng thực thể và nạp dữ liệu mẫu ban đầu.
- **Bước 2: Cấu hình Backend ASP.NET Core API**
  - Mở `CrmBackend\appsettings.json`, kiểm tra chuỗi kết nối:
    `"DefaultConnection": "Server=localhost;Database=CRM_XeMayPhuTung;Integrated Security=True;TrustServerCertificate=True;"`
  - Cổng API chạy tại: `http://localhost:5208`.
- **Bước 3: Khởi động tự động hệ thống bằng 1-Click**
  - Nhấp đúp chuột vào file: `CHAY_DO_AN.bat` để tự động mở Backend (:5208), Frontend (:5173) và bật trình duyệt truy cập hệ thống.

---

### 4.1.2 Phương án chuyển đổi từ hệ thống cũ sang hệ thống mới

#### 1. Đánh giá và lựa chọn chiến lược chuyển đổi
- **Chiến lược tối ưu được lựa chọn:** Áp dụng **Chuyển đổi song song kết hợp từng giai đoạn (Phased Parallel Conversion)** trong 30 ngày.
  - *Tuần 1 - 2:* Đưa phân hệ Danh mục Xe & Quản lý Khách hàng vào hoạt động.
  - *Tuần 3 - 4:* Kích hoạt phân hệ Cọc xe VietQR, Sổ bảo hành điện tử và Nghiệm thu bàn nâng xưởng.
  - *Lợi ích:* Đảm bảo an toàn tuyệt đối 100% cho giao dịch tiền bạc và dữ liệu bảo hành, không làm gián đoạn việc nhận xe của khách hàng.

#### 2. Kế hoạch di chuyển dữ liệu (Data Migration - ETL)
- **Trích xuất (Extract):** Lấy dữ liệu từ các file Excel cũ (`danh_sach_khach_hang.xlsx`, `nhan_vien_ban_hang.xlsx`).
- **Làm sạch (Transform):** Chuẩn hóa số điện thoại, mã định danh CCCD, loại bỏ bản ghi trùng và phân hạng CLV ban đầu (Đồng/Bạc/Vàng).
- **Nạp dữ liệu (Load):** Chạy kịch bản SQL Bulk Insert nạp vào các bảng `KHACH_HANG`, `XE_KHACH_HANG`, `PHU_TUNG`.

---

## 4.2 PHƯƠNG ÁN BẢO MẬT, SAO LƯU VÀ PHỤC HỒI CƠ SỞ DỮ LIỆU

### 4.2.1 Chính sách bảo mật hệ thống toàn diện
- **Phân quyền vai trò (RBAC):** Phân định 4 vai trò rõ rệt: `SuperAdmin`, `NhanVienBanHang`, `NhanVienKyThuat`, `KhachHang`.
- **Chống SQL Injection:** Sử dụng Micro-ORM Dapper với truy vấn tham số hóa 100% (`new { Id = id }`).
- **Bảo mật API (CORS):** Chỉ chấp nhận truy vấn HTTP từ nguồn Frontend được cấp phép (`localhost:5173`).
- **Chống gian lận ODO & Bảo hành:** Sổ bảo hành điện tử 36 tháng khóa chặt theo Số khung & Số máy; ODO chỉ được cập nhật tăng dần qua biên bản nghiệm thu xưởng có chữ ký KTV.

### 4.2.2 Kế hoạch sao lưu và phục hồi CSDL tự động (Disaster Recovery Plan)
- **Mục tiêu:** RPO <= 1 giờ, RTO <= 15 phút.
- **Tác vụ tự động:** `MotoShopCRM_AutoBackup_Daily` đã kích hoạt trên **Windows Task Scheduler**, tự động sao lưu lúc **23:00 hàng ngày**.
- **Kịch bản tự động:** `scripts\Backup_Database_Auto.bat` / `.ps1` (lưu file `.bak` nén tại `D:\crm-project\backup\`).
- **Chính sách lưu trữ (Retention Policy):** Tự động xóa các bản sao lưu cũ quá 30 ngày.
- **Kịch bản phục hồi khẩn cấp:** Chạy file `scripts\Restore_Database_Latest.bat` để phục hồi 100% CSDL trong vòng 5 giây.

---

## 4.3 TÀI LIỆU HƯỚNG DẪN SỬ DỤNG CHI TIẾT

*(Tất cả các giao diện có khoanh đỏ các nút bấm thao tác được hiển thị trực quan trong file HTML: [chuong-4-trien-khai-bao-tri-huong-dan-su-dung.html](file:///d:/crm-project/docs/chuong-4-trien-khai-bao-tri-huong-dan-su-dung.html))*

### 🔵 LUỒNG 1: DÀNH CHO QUẢN LÝ & NHÂN VIÊN CỬA HÀNG XE MÁY
1. **Bước 1: Đăng nhập hệ thống quản trị**  
   - Truy cập `/admin/login`, nhập tài khoản `admin` / `123456`, nhấp vào nút **`[ĐĂNG NHẬP VÀO HỆ THỐNG]`** *(khoanh đỏ)*.
2. **Bước 2: Giám sát Dashboard Báo cáo Doanh thu & Chỉ số CSAT**  
   - Truy cập `/admin/reports`, nhấp vào **`[📅 Bộ lọc thời gian: Tháng Này]`** *(khoanh đỏ)* để xem doanh thu xe mới (1.539 tỷ), phụ tùng (7.65 triệu) và điểm hài lòng CSAT (4.2/5 sao).
3. **Bước 3: Quản lý Bán xe & Quét mã QR nhận xe tại Showroom**  
   - Truy cập `/admin/sales`, chọn đơn hàng chờ giao, nhấp vào nút **`[🔍 Quét Mã QR Nhận Xe]`** *(khoanh đỏ)* để đối soát CCCD và bàn giao xe.
4. **Bước 4: Điều phối Lịch hẹn Kỹ thuật & Bàn nâng KTV**  
   - Truy cập `/admin/appointments`, tại phiếu hẹn dịch vụ, nhấp vào nút **`[🔧 Xếp Bàn Nâng Số 2 & Giao KTV]`** *(khoanh đỏ)*.
5. **Bước 5: Thẩm định Bảo hành chính hãng & Xuất hóa đơn**  
   - Truy cập `/admin/warranty`, đối soát ODO xe, nhấp vào nút **`[✓ DUYỆT BẢO DƯỠNG 0Đ & CẬP NHẬT SỔ ĐIỆN TỬ]`** *(khoanh đỏ)*.

### 🔴 LUỒNG 2: DÀNH CHO KHÁCH HÀNG (TRẢI NGHIỆM MUA SẮM & DỊCH VỤ)
1. **Bước 1: Xem Showroom 360 & Đặt cọc xe máy online**  
   - Truy cập `/showroom`, chọn xe máy NVX 155 VVA, nhấp vào nút **`[⚡ ĐẶT CỌC NGAY (2.000.000 đ)]`** *(khoanh đỏ)*.
2. **Bước 2: Quét mã VietQR thanh toán cọc & Nhận Mã QR nhận xe**  
   - Quét mã VietQR qua app ngân hàng, màn hình hiển thị mã bàn giao xe `#MOTO-QR-8899`, nhấp nút **`[💾 TẢI VỀ MÃ QR XÁC NHẬN]`** *(khoanh đỏ)*.
3. **Bước 3: Đặt lịch hẹn bảo dưỡng / sửa chữa trực tuyến**  
   - Truy cập `/booking`, chọn ngày giờ và loại dịch vụ, nhấp nút **`[📅 XÁC NHẬN ĐẶT LỊCH HẸN XƯỞNG]`** *(khoanh đỏ)*.
4. **Bước 4: Tra cứu Sổ bảo hành điện tử chính hãng 36 tháng**  
   - Truy cập `/customer/profile`, xem tiến độ ODO và số tháng bảo hành còn lại, nhấp nút **`[📄 Xem Lịch Sử 6 Lần Bảo Dưỡng]`** *(khoanh đỏ)*.
5. **Bước 5: Đánh giá độ hài lòng CSAT sau khi nhận xe / làm dịch vụ**  
   - Truy cập `/feedback`, chấm sao (1-5 sao) và ghi nhận xét, nhấp nút **`[⭐ GỬI Ý KIẾN ĐÁNH GIÁ (CSAT)]`** *(khoanh đỏ)*.
