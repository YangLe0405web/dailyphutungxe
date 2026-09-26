# 📋 KẾ HOẠCH & TIẾN ĐỘ CÔNG VIỆC DỰ ÁN CRM MOTOSHOP
> **Thời điểm cập nhật:** 27/09/2026  
> **Trạng thái kho mã nguồn:** Đã đồng bộ 100% lên GitHub (`origin/develop` và `origin/main`)  
> **Tài khoản test Admin:** `admin@motoshop.vn` (Mật khẩu: `admin123`)

---

## I. CÁC TÍNH NĂNG ĐÃ HOÀN THÀNH HÔM NAY

### 1. Chuẩn hóa Hình ảnh & Thông số thực tế
- ✅ Cập nhật toàn bộ hình ảnh thực tế cho **14 dòng xe máy** (Honda SH 160i, Air Blade, Vision, Winner X; Yamaha Exciter 155, Grande, NVX; Suzuki Raider, Satria; Vespa Sprint...) đúng từng phiên bản.
- ✅ Cập nhật hình ảnh chính xác cho **18 phụ tùng chính hãng** (Nhớt Motul 7100, Castrol, Lọc gió K&N, Heo dầu Brembo, Bugi NGK, Lốp Michelin, Dây curoa Bando, Nhông sên dĩa DID, Phuộc Ohlins...).

### 2. Xem Chi tiết & Đánh giá Bình luận Khách hàng
- ✅ Cả trang **Showroom Xe** và **Cửa hàng Phụ tùng**: Thẻ sản phẩm có hiệu ứng hover, nhấp vào xem Modal 2 Tab:
  - **Tab 1: Thông số kỹ thuật / Chi tiết sản phẩm**: Xem ảnh lớn, thông số máy, giá niêm yết, xuất xứ, bảo hành.
  - **Tab 2: Đánh giá & Bình luận**: Điểm trung bình sao ⭐, danh sách nhận xét thực tế có huy hiệu `"✓ Đã mua xe tại showroom"` hoặc `"✓ Đã mua hàng chính hãng"`, kèm form gửi đánh giá trực tiếp.

### 3. Trang Phản hồi Admin & Phân trang
- ✅ **Phản hồi khách hàng (`Feedback.tsx`)**: Bổ sung đầy đủ thông tin liên hệ (SĐT, Email, Địa chỉ, Dòng xe đang đi) và nút gọi nhanh `📞 Gọi khách`, `✉️ Gửi mail`.
- ✅ **Phân trang 10 sản phẩm/trang**: Áp dụng chuẩn chỉ tại trang Quản lý Xe mẫu (`Vehicles.tsx`) và Quản lý Phụ tùng (`Parts.tsx`) kèm bộ nút điều hướng trang.

### 4. Sửa lỗi Chuyển Tab Đơn hàng & Lịch hẹn
- ✅ Khắc phục lỗi tab bị đơ: Đồng bộ hai chiều (Two-way Synchronization) giữa Menu Sidebar bên trái ("Quản lý đơn hàng", "Lịch hẹn dịch vụ") và nút Tab pill ("Đơn hàng", "Lịch hẹn") trong `Sales.tsx` & `App.tsx`.

### 5. Xây dựng mới Module "Đối tác & Chuỗi cung ứng"
- ✅ Thêm nhóm menu mới **"Đối tác & Chuỗi cung ứng"** trên Sidebar Admin (`AdminLayout.tsx`).
- ✅ Trang quản lý **`Suppliers.tsx`** gồm 2 Tab:
  - **Tab 🏢 Danh sách Nhà cung cấp ({count})**: Quản lý các hãng xe & nhà phân phối thực tế (Honda VN, Yamaha VN, Motul Asia, Michelin VN, Brembo VN, Daichi VN) với MST, chiết khấu đại lý (%), người liên hệ, hotline, email, địa chỉ kho, chức năng Thêm / Sửa / Xóa.
  - **Tab 📑 Quản lý Phiếu nhập kho ({count})**: Theo dõi lịch sử các đợt nhập hàng, tổng tiền, trạng thái (`Đã nhập kho`, `Chờ duyệt`).
  - **Modal Lập phiếu nhập kho mới (`+ TẠO PHIẾU NHẬP KHO`)**: Bảng thêm mặt hàng động, tự động tính thành tiền từng dòng và tổng giá trị cả đợt nhập.
  - **Modal Biên bản nhập kho kiêm giao nhận hàng hóa (`👁️ Xem chi tiết`)**: Chuẩn mẫu hóa đơn/biên bản doanh nghiệp, bảng chi tiết từng mặt hàng nhập, 4 vị trí chữ ký (Người lập, Người giao, Thủ kho, Kế toán trưởng), tích hợp nút `🖨️ In biên bản / Xuất PDF` và nút `✓ Duyệt nhập kho`.

---

## II. KẾ HOẠCH CÔNG VIỆC GỢI Ý LÀM TIẾP (NGÀY MAI)

### 📌 1. Tự động đồng bộ Tồn kho (Inventory Auto-Sync)
- Khi một phiếu nhập kho được bấm **"✓ Xác nhận duyệt nhập kho"**, hệ thống tự động cộng thêm số lượng tồn kho (`soLuongTon`) của các sản phẩm tương ứng trong danh sách Phụ tùng & Xe mẫu.
- Khi khách hàng đặt đơn hàng online thành công, hệ thống tự động trừ tồn kho tương ứng.

### 📌 2. Báo cáo Doanh thu & Chi phí giá vốn (Profit & Loss / P&L)
- Tại trang **Báo cáo thống kê (`Reports.tsx`)**: Bổ sung biểu đồ so sánh:
  - **Doanh thu bán ra** (từ Đơn hàng phụ tùng + Bán xe).
  - **Chi phí giá vốn nhập hàng** (tổng hợp từ các Phiếu nhập kho đã duyệt).
  - **Lợi nhuận gộp (Gross Margin)** = Doanh thu - Giá vốn nhập kho.
  *(Điểm này giảng viên chấm đồ án rất thích vì thể hiện tư duy quản trị tài chính doanh nghiệp).*

### 📌 3. Nối API Backend cho Nhà cung cấp & Phiếu nhập (Nếu cần lưu DB thật)
- Thêm Entity trong CrmBackend:
  - `NhaCungCap.cs` (Id, TenNhaCungCap, MaSoThue, NguoiLienHe, SoDienThoai, Email, DiaChi, ChietKhau, TrangThai).
  - `PhieuNhap.cs` & `ChiTietPhieuNhap.cs` (Id, MaNhaCungCap, NgayNhap, TongTien, TrangThai, CacDongHang).
- Viết API Controller trong ASP.NET Core để lưu xuống PostgreSQL database qua EF Core.

### 📌 4. Xuất Báo cáo Excel / PDF
- Bổ sung nút xuất file Excel `.xlsx` cho danh sách Nhà cung cấp và lịch sử Phiếu nhập kho để thủ kho nộp báo cáo cho kế toán.

---

## III. HƯỚNG DẪN KHỞI ĐỘNG NHANH CHO NGÀY MAI

Khi mở máy tính vào ngày mai, bạn chỉ cần mở terminal và chạy:

### 1. Khởi động Backend (ASP.NET Core API):
```powershell
cd d:\crm-project\CrmBackend
dotnet run
```
*Backend API chạy tại:* `http://localhost:5208` (Swagger: `http://localhost:5208/swagger`)

### 2. Khởi động Frontend (React Vite):
```powershell
cd d:\crm-project\crm-frontend
npm run dev
```
*Frontend chạy tại:* `http://localhost:5174/`

### 3. Kiểm tra đồng bộ Git:
```powershell
cd d:\crm-project
git status
git pull origin develop
```
