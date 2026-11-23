# HƯỚNG DẪN CHẠY ĐỒ ÁN MOTOSHOP CRM - BẢO VỆ CHẤM ĐIỂM

> **Dự án:** Hệ thống Quản lý Quan hệ Khách hàng & Kinh doanh Showroom Xe máy, Phụ tùng chính hãng MotoShop  
> **Kiến trúc:** Backend ASP.NET Core Web API (.NET 10/8) + Frontend React Vite TypeScript + SQL Server

---

## ⚡ CÁCH 1: KHỞI ĐỘNG NHANH BẰNG 1-CLICK (KHUYÊN DÙNG)

Ngay tại thư mục gốc của đồ án `D:\crm-project`, bạn chỉ cần:
👉 **Nhấp đúp chuột (Double click) vào file:**
```
CHAY_DO_AN.bat
```
File này sẽ tự động:
1. Mở cửa sổ Backend ASP.NET Core chạy tại `http://localhost:5208`
2. Mở cửa sổ Frontend React Vite chạy tại `http://localhost:5173`
3. Tự động bật trình duyệt web vào ngay trang chủ
4. In sẵn danh sách tài khoản demo để bạn nhìn và đăng nhập demo trước mặt hội đồng!

*(Lưu ý: Giữ 2 cửa sổ màu đen Backend và Frontend mở trong suốt buổi chấm thi).*

---

## 💻 CÁCH 2: CHẠY THỦ CÔNG BẰNG TỪNG LỆNH (TERMINAL / VS CODE)

Mở 2 tab Terminal (PowerShell hoặc Command Prompt):

### 🔹 Tab 1: Khởi động Backend (API)
```powershell
cd D:\crm-project\CrmBackend
dotnet run
```
> Khi Terminal hiện: `Now listening on: http://localhost:5208` là Backend đã sẵn sàng!

### 🔹 Tab 2: Khởi động Frontend (Giao diện Web)
```powershell
cd D:\crm-project\crm-frontend
npm run dev
```
> Khi Terminal hiện: `Local: http://localhost:5173/` là Frontend đã sẵn sàng! Mở trình duyệt truy cập `http://localhost:5173`.

---

## 🔑 DANH SÁCH TÀI KHOẢN PHỤC VỤ CHẤM ĐỒ ÁN (DEMO 4 VAI TRÒ)

Tất cả tài khoản hệ thống đều dùng mật khẩu chung là: **`123456`**

| Vai trò (Role) | Tên đăng nhập (Username) | Mật khẩu | Kịch bản demo trọng tâm khi chấm |
| :--- | :--- | :---: | :--- |
| **1. Quản trị viên (SuperAdmin)** | `admin` | `123456` | • Xem Dashboard Báo cáo Doanh thu 3 mảng (Xe, Phụ tùng, Dịch vụ)<br>• Phân tích CSAT và biểu đồ tăng trưởng<br>• Quản trị phân quyền tài khoản (RBAC), khóa/mở tài khoản |
| **2. Nhân viên Bán hàng (Sales)** | `anhnguyen`<br>*(hoặc: hoangtran, hale)* | `123456` | • Quản lý danh mục xe mẫu, bảng giá niêm yết<br>• Tiếp nhận đơn cọc xe máy (2.000.000đ)<br>• Quét/nhập mã QR nhận xe và CCCD để bàn giao xe |
| **3. Kỹ thuật viên Xưởng (KTV)** | `thanhnguyen`<br>*(hoặc: ductran, namle)* | `123456` | • Giám sát lịch tiếp nhận xe vào bàn nâng xưởng<br>• Giám định bảo hành chính hãng (36 tháng / 30.000 km)<br>• Xuất phụ tùng thay thế và nghiệm thu hoàn thành |
| **4. Khách hàng (Customer)** | `nguyenvanan`<br>*(hoặc: tranthibich)* | `123456` | • Xem xe 360, đặt cọc giữ xe máy online (VietQR)<br>• Nhận Mã QR nhận xe tại showroom<br>• Đặt lịch hẹn bảo dưỡng/sửa chữa online<br>• Tra cứu Sổ bảo hành điện tử và đánh giá CSAT |

---

## 🛠️ KIỂM TRA TRƯỚC BUỔI CHẤM THI (CHECKLIST AN TOÀN)

1. **Kiểm tra SQL Server:**
   - Đảm bảo dịch vụ SQL Server (mặc định `MSSQLSERVER` hoặc `SQLEXPRESS`) đang ở trạng thái **Running**.
   - Database: `CRM_XeMayPhuTung`.
   - Nếu cần kiểm tra nhanh bằng PowerShell:
     ```powershell
     Get-Service -Name "MSSQLSERVER"
     ```

2. **Kiểm tra Swagger API (để chứng minh Backend chuẩn RESTful):**
   - Truy cập: [http://localhost:5208/swagger](http://localhost:5208/swagger)
   - Trình duyệt sẽ hiển thị đầy đủ tài liệu API của các Controller: `KhachHang`, `SanPhamXe`, `PhuTung`, `DonHang`, `LichHen`, `PhanHoi`, `RevenueAnalytics`, v.v.

3. **Nếu gặp lỗi cổng bị chiếm (Port in use):**
   - Tắt các tiến trình node hoặc dotnet cũ:
     ```powershell
     taskkill /F /IM node.exe
     taskkill /F /IM dotnet.exe
     ```
   - Sau đó chạy lại `CHAY_DO_AN.bat`.
