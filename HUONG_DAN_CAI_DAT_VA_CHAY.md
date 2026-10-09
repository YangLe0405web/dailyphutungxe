# 🚀 HƯỚNG DẪN CÀI ĐẶT & CHẠY HỆ THỐNG AUTORA CRM (BẢN MỚI NHẤT)

> **Dự án:** Hệ thống Quản trị Quan hệ Khách hàng & Thương mại điện tử Xe máy – Phụ tùng **Autora Motoshop CRM**  
> **Nhánh Git:** `develop`  
> **Cập nhật lần cuối:** 09/10/2026

---

## 📋 1. YÊU CẦU MÔI TRƯỜNG (PREREQUISITES)

Trước khi bắt đầu, các thành viên trong nhóm cần đảm bảo máy tính đã cài đặt:

1. **Git:** Phiên bản `>= 2.30` ([Tải tại git-scm.com](https://git-scm.com/))
2. **Node.js & npm:** Node.js `>= 18.x` hoặc `20.x` LTS ([Tải tại nodejs.org](https://nodejs.org/))
3. **.NET SDK:** .NET 8.0 SDK hoặc .NET 10.0 SDK ([Tải tại dotnet.microsoft.com](https://dotnet.microsoft.com/download))
4. **Trình duyệt Web:** Google Chrome, MS Edge, hoặc Brave mới nhất.
5. *(Tùy chọn)* **Docker Desktop / SQL Server:** Nếu muốn chạy Database SQL Server nội bộ (Hệ thống Frontend đã tích hợp sẵn cơ chế API Fallback và Mock Sync thông minh, có thể chạy và test toàn bộ tính năng ngay cả khi chưa bật SQL Server).

---

## 📥 2. HƯỚNG DẪN KÉO CODE MỚI NHẤT VỀ MÁY (PULL CODE)

Mở terminal (PowerShell hoặc Git Bash), chuyển đến thư mục làm việc của bạn:

```bash
# 1. Di chuyển vào thư mục dự án
cd d:/crm-project   # (hoặc đường dẫn thư mục dự án trên máy bạn)

# 2. Chuyển sang nhánh develop
git checkout develop

# 3. Kéo toàn bộ mã nguồn và tài liệu mới nhất về
git pull origin develop
```

---

## ⚙️ 3. CÀI ĐẶT VÀ KHỞI CHẠY BACKEND (.NET CORE API)

Backend xử lý toàn bộ các API về Khách hàng, Nhân viên, Đơn hàng, Lịch hẹn, Xe máy, Bảo hành và Bảo hiểm.

### Các bước thực hiện:

```bash
# 1. Mở một cửa sổ Terminal mới, di chuyển vào thư mục Backend
cd CrmBackend

# 2. Khôi phục các thư viện NuGet (Restore dependencies)
dotnet restore

# 3. Build kiểm tra mã nguồn (Đảm bảo 0 lỗi)
dotnet build

# 4. Khởi chạy Backend với cổng cố định 5208
dotnet run --urls "http://localhost:5208"
```

Khi chạy thành công, Terminal sẽ hiển thị:
```
info: Microsoft.Hosting.Lifetime[14]
      Now listening on: http://localhost:5208
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
```

- **Swagger API Documentation:** Truy cập ngay `http://localhost:5208/swagger` để xem và kiểm thử trực tiếp danh sách các Endpoint.

---

## 🎨 4. CÀI ĐẶT VÀ KHỞI CHẠY FRONTEND (REACT + VITE + TAILWIND)

Frontend cung cấp giao diện người dùng cho Khách hàng (Dark theme hiện đại) và Bảng điều khiển Quản trị viên (Admin Portal).

### Các bước thực hiện:

```bash
# 1. Mở một cửa sổ Terminal RIÊNG BIỆT thứ 2, di chuyển vào thư mục Frontend
cd crm-frontend

# 2. Cài đặt các gói phụ thuộc (Dependencies)
npm install

# 3. Kiểm tra kiểm dịch TypeScript & Build thử nghiệm
npm run build

# 4. Khởi chạy Frontend ở chế độ Development (Cổng mặc định 5173)
npm run dev
```

Khi chạy thành công, Terminal sẽ hiển thị:
```
  VITE v8.3.0  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

👉 Mở trình duyệt web và truy cập vào: **`http://localhost:5173`**

---

## 🔐 5. DANH SÁCH TÀI KHOẢN ĐĂNG NHẬP & TEST DỮ LIỆU

Hệ thống đã chuẩn hóa sẵn các tài khoản mẫu cho cả Khách hàng và Quản trị viên:

### A. Tài khoản Khách hàng (Portal Khách hàng)
- **URL Khách hàng:** `http://localhost:5173` (Nhấp icon **Cá nhân** hoặc nút **Đăng nhập** góc phải)

| Họ và tên | Email đăng nhập | Mật khẩu | Phân hạng CLV | Xe sở hữu |
| :--- | :--- | :--- | :--- | :--- |
| **Nguyễn Minh Anh** | `khachhang@autora.vn` | `Khach@12345` | **Kim Cương (VIP)** (158.500.000đ) | Honda SH 160i, Vision |
| **Trần Văn Bình** | `binh.tv@gmail.com` | `Binh@12345` | **Vàng** (35.000.000đ) | Honda Winner X |
| **Lê Thị Cẩm** | `cam.lt@gmail.com` | `Cam@12345` | **Bạc** (8.500.000đ) | Yamaha Grande |

> *Ghi chú:* Bạn có thể bấm nút **"Đăng ký tài khoản mới"** trên trang web để tạo tài khoản riêng kiểm thử flow đăng ký mới!

---

### B. Tài khoản Quản trị & Nhân viên (Admin & Staff Portal)
- **URL Đăng nhập Admin:** `http://localhost:5173/admin/login`

| Vai trò (Role) | Tên đăng nhập | Email | Mật khẩu | Quyền hạn |
| :--- | :--- | :--- | :--- | :--- |
| **Quản trị viên tối cao** | `admin` | `admin@autora.vn` | `Admin@12345` (hoặc `admin123`) | Toàn quyền toàn bộ các module |
| **Nhân viên Bán hàng (Sales)** | `sales01` | `sales@autora.vn` | `Sales@12345` | Bán xe, bán phụ tùng, POS |
| **Kỹ thuật viên Xưởng (KTV)** | `ktv01` | `ktv@autora.vn` | `Ktv@12345` | Duyệt xe, thẩm định bảo hành, dịch vụ |
| **Chăm sóc Khách hàng (CSKH)** | `cskh01` | `cskh@autora.vn` | `Cskh@12345` | Quản lý khảo sát, đánh giá, CSKH |

---

## 🗺️ 6. SƠ ĐỒ ĐIỀU HƯỚNG CÁC TRANG CHÍNH TRÊN HỆ THỐNG

### Phía Khách hàng (End-User):
- **Trang chủ Showroom:** `http://localhost:5173/`
- **Showroom Xe máy:** `http://localhost:5173/vehicles` (Xem thông số, màu sắc, đặt mua/cọc xe)
- **Cửa hàng Phụ tùng:** `http://localhost:5173/parts` (Tìm kiếm, lọc linh kiện, thêm vào giỏ)
- **Giỏ hàng & Thanh toán:** `http://localhost:5173/checkout` (COD, Chuyển khoản VietQR)
- **Đặt lịch Dịch vụ:** `http://localhost:5173/booking` (Đặt sửa chữa, bảo dưỡng, lái thử, bảo hành)
- **Trang Cá nhân 6 Tab (Dark Theme mới):** `http://localhost:5173/customer`
  - `Tab 0 - Phương tiện & Bảo hành:` Quản lý xe, Sổ BH điện tử 36 tháng/30k km, Gia hạn Care+ 4 bước.
  - `Tab 1 - Đơn mua hàng:` Sub-tab `[XE]` & `[PHỤ TÙNG]`, mã QR nhận xe, hủy đơn hoàn tồn kho, nút `⭐ Đánh giá`.
  - `Tab 2 - Lịch hẹn:` Calendar Grid 31 ngày, chi tiết 5 loại dịch vụ, hủy/đổi lịch.
  - `Tab 3 - Lịch sử dịch vụ:` Xem chi tiết hóa đơn/biên bản (Đã bỏ nút đánh giá).
  - `Tab 4 - Bảo hiểm:` Quản lý BH theo từng xe, mua BH online VietQR, gia hạn, in GCN điện tử.
  - `Tab 5 - Khảo sát & Đánh giá:` Form đánh giá 5 sao, khảo sát động theo cấp độ CLV.

### Phía Quản trị viên (Admin & Staff):
- **Dashboard Tổng quan:** `http://localhost:5173/admin`
- **Quản lý Xe mẫu:** `http://localhost:5173/admin/vehicles`
- **Quản lý Phụ tùng & Tồn kho:** `http://localhost:5173/admin/parts`
- **Quản lý Khách hàng & Cà vẹt xe:** `http://localhost:5173/admin/customers`
- **Quản lý Đơn hàng & POS Bán hàng:** `http://localhost:5173/admin/sales`
- **Quản lý Lịch hẹn Dịch vụ:** `http://localhost:5173/admin/appointments`
- **Quản lý Yêu cầu Bảo hành & KTV:** `http://localhost:5173/admin/warranty`
- **Quản lý Hợp đồng Bảo hiểm (POS quầy):** `http://localhost:5173/admin/insurance`
- **Quản lý Đánh giá & Khảo sát:** `http://localhost:5173/admin/feedback`
- **Quản lý Nhân viên & Phân quyền:** `http://localhost:5173/admin/staff`

---

## ❓ 7. CÂU HỎI THƯỜNG GẶP & XỬ LÝ LỖI (TROUBLESHOOTING)

1. **Lỗi cổng 5208 hoặc 5173 bị chiếm dụng:**
   - Nếu bị báo `port already in use`, hãy đóng tiến trình cũ đang chạy hoặc kiểm tra bằng lệnh:
     - Windows PowerShell: `Get-Process -Id (Get-NetTCPConnection -LocalPort 5208).OwningProcess | Stop-Process -Force`
2. **Không kết nối được SQL Server:**
   - Hệ thống được thiết kế với cơ chế Fallback tự động. Khi Backend không kết nối được SQL Server, Frontend vẫn tự động đồng bộ qua Storage và Local API Provider giúp kiểm thử 100% các luồng không bị gián đoạn.
3. **Thay đổi code nhưng giao diện chưa cập nhật:**
   - Nhấn phím `F5` hoặc `Ctrl + F5` để làm mới bộ nhớ cache của trình duyệt.
