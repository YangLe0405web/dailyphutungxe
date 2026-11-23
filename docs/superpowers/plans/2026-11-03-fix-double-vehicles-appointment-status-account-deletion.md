# Kế hoạch chi tiết: Khắc phục lỗi Double xe ở Phương tiện của tôi, Lịch hẹn bị hoàn tất sớm và Xóa triệt để dữ liệu tài khoản cũ

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khắc phục triệt để 3 vấn đề: (1) Trùng lặp hiển thị xe trong "Phương tiện của tôi" trên Customer Dashboard; (2) Lịch hẹn nhận xe bị đánh dấu "Đã hoàn tất" sớm trên lịch biểu dù đơn mua xe chưa hoàn tất; (3) Tài khoản đã xóa khi tạo lại bằng thông tin cũ vẫn bị kéo lại xe, đơn hàng và lịch hẹn của tài khoản cũ.

**Architecture:** 
- **Chống trùng lặp phương tiện sở hữu:** Trong [`CustomerDashboard.tsx`](file:///d:/crm-project/crm-frontend/src/pages/customer/CustomerDashboard.tsx), liên kết xe tổng hợp từ đơn hàng hoàn tất với xe đã có trong `vList` bằng `orderId`, VIN và tên xe. Thay vì `unshift` xe mới gây double, hệ thống cập nhật xe hiện có. Khâu `dedupedVList` chuẩn hóa khóa định danh theo `orderId` / VIN / tên chuẩn để chỉ hiển thị đúng 1 xe duy nhất cho mỗi đơn hàng.
- **Sửa điều kiện hoàn tất lịch hẹn nhận xe:**
  * Trong [`api.ts`](file:///d:/crm-project/crm-frontend/src/services/api.ts) (hàm `handleUpdateStatus` khi đơn chuyển sang `HoanThanh`): Loại bỏ điều kiện quét chung `a.customerId === ord.customerId && a.loaiDichVu === 'NhanXe'`. Chỉ hoàn tất lịch hẹn có `a.maDonHangXe === ord.id` hoặc `a.maLichHen === ord.maLichHen`.
  * Trong [`Appointments.tsx`](file:///d:/crm-project/crm-frontend/src/pages/admin/Appointments.tsx): Tại `isLinkedOrderCompleted`, loại bỏ kiểm tra trùng `soDienThoai` (nguyên nhân khiến các đơn xe khác của cùng một khách hàng bị nhận nhầm là đã hoàn tất). Chỉ so khớp chính xác mã đơn `maDonHangXe === o.id` hoặc `maLichHen`.
  * Đồng bộ khôi phục trạng thái chuẩn: Lịch hẹn nào gắn với đơn xe chưa hoàn tất (`ChoDuyet`, `ChoKhachXacNhanNgayNhan`, `ChoGiaoXe`, `DangGiao`) sẽ giữ nguyên trạng thái `DaXacNhan` / `ChoXacNhan`.
- **Xóa sạch và cô lập dữ liệu tài khoản đã xóa:**
  * Backend [`KhachHangController.cs`](file:///d:/crm-project/CrmBackend/Controllers/KhachHangController.cs): Trong câu lệnh `Delete`, cascade xóa toàn bộ `DON_HANG`, `LICH_HEN`, `XE_KHACH_HANG`, `PHAN_HOI`, `KET_QUA_KHAO_SAT` theo cả `MaKH = @MaKH` và `SoDienThoai = @SoDienThoai` / `Email = @Email`.
  * Frontend [`api.ts`](file:///d:/crm-project/crm-frontend/src/services/api.ts) (`customerApi.deleteCustomer`): Dọn dẹp triệt để `crm_orders_cache`, `crm_customer_vehicles`, `crm_appointments_cache`, `crm_customer_insurances`, `crm_customer_feedbacks`, `crm_order_ktv_assignments` theo cả `customerId`, `soDienThoai` và `email`.
  * Frontend [`api.ts`](file:///d:/crm-project/crm-frontend/src/services/api.ts) (`customerApi.create`): Khi đăng ký tài khoản mới, chủ động xóa sạch mọi tàn dư cache cũ liên quan đến số điện thoại hoặc email này để đảm bảo tài khoản mới tạo 100% bắt đầu từ trang trắng (blank slate).

**Tech Stack:** React 19, TypeScript, C# .NET 8 Web API, SQL Server / LocalDB, Vite.

## Global Constraints
- Bảo toàn 10 System Invariants (Zero-deletion policy cho đơn hàng đang hoạt động, không push GitHub khi chưa có lệnh).
- Giữ vững toàn bộ kết quả của Bản Fix 78 (Duyệt biển số) và Bản Fix 79 (KTV & Hóa đơn lăn bánh).
- `npm --prefix crm-frontend run build` luôn đạt 0 lỗi TypeScript.

---

### Task 1: Khắc phục lỗi Double hiển thị xe ở "Phương tiện của tôi"

**Files:**
- Modify: `crm-frontend/src/pages/customer/CustomerDashboard.tsx:1760-1835`
- Test: `crm-frontend/tests/verify_no_double_vehicles.test.cjs`

- [ ] **Step 1: Viết failing test kiểm tra không double xe**
  Test script mô phỏng danh sách xe có 1 xe từ backend và 1 xe từ đơn hàng đã hoàn tất cùng mã xe/đơn xe, xác nhận sau khi filter và dedup chỉ còn đúng 1 xe duy nhất.
- [ ] **Step 2: Chạy test xác nhận FAIL**
- [ ] **Step 3: Triển khai cập nhật logic đồng bộ và deduplication trong `CustomerDashboard.tsx`**
  Cập nhật `myVehicleOrders.forEach` và `dedupedVList` để đối chiếu thông minh, hợp nhất thay vì thêm mới.
- [ ] **Step 4: Chạy test xác nhận PASS**
- [ ] **Step 5: Kiểm tra build TypeScript**

---

### Task 2: Khắc phục lịch hẹn nhận xe bị đánh dấu "Đã hoàn tất" sớm

**Files:**
- Modify: `crm-frontend/src/services/api.ts:2995-3015`
- Modify: `crm-frontend/src/pages/admin/Appointments.tsx:1880-1895, 2550-2565`
- Test: `crm-frontend/tests/verify_appointment_not_completed_early.test.cjs`

- [ ] **Step 1: Viết failing test kiểm tra đơn chưa hoàn tất không bị set DaHoanThanh**
  Test script xác nhận: đơn `#DH-XE-048` đang ở trạng thái `ChoDuyet` / `ChoGiaoXe`, phiếu hẹn liên kết `#LH052` không bao giờ bị đánh dấu là `DaHoanThanh` ngay cả khi khách hàng có một đơn xe khác `#DH-XE-047` đã `HoanThanh`.
- [ ] **Step 2: Chạy test xác nhận FAIL**
- [ ] **Step 3: Sửa logic trong `api.ts` và `Appointments.tsx`**
  - Xóa điều kiện `a.customerId === ord.customerId && a.loaiDichVu === 'NhanXe'` trong `api.ts`.
  - Xóa điều kiện `soDienThoai` trong `isLinkedOrderCompleted` của `Appointments.tsx`.
  - Khôi phục trạng thái chuẩn cho các lịch hẹn gắn với đơn chưa hoàn thành.
- [ ] **Step 4: Chạy test xác nhận PASS**
- [ ] **Step 5: Kiểm tra build TypeScript**

---

### Task 3: Xóa triệt để dữ liệu cũ khi tài khoản bị xóa (Không kế thừa sang tài khoản mới)

**Files:**
- Modify: `CrmBackend/Controllers/KhachHangController.cs:180-215`
- Modify: `crm-frontend/src/services/api.ts:575-650, 4425-4445`
- Test: `crm-frontend/tests/verify_account_deletion_clean_slate.test.cjs`

- [ ] **Step 1: Viết failing test kiểm tra xóa tài khoản và tạo mới với thông tin cũ**
  Test script xác nhận: khi xóa tài khoản, tất cả xe, đơn hàng, lịch hẹn, bảo hiểm thuộc SĐT/Email/ID đó bị xóa triệt để. Khi tạo tài khoản mới cùng SĐT/Email, không còn sót lại bất kỳ dữ liệu cũ nào.
- [ ] **Step 2: Chạy test xác nhận FAIL**
- [ ] **Step 3: Triển khai cập nhật backend `KhachHangController.cs` và frontend `api.ts`**
  - Backend cascade delete theo cả `MaKH`, `SoDienThoai` và `Email`.
  - Frontend `deleteCustomer` dọn dẹp toàn bộ xe, đơn hàng, lịch hẹn, bảo hiểm theo SĐT/Email/ID.
  - Frontend `customerApi.create` chủ động purge cache của SĐT/Email khi tạo tài khoản mới.
- [ ] **Step 4: Chạy test xác nhận PASS**
- [ ] **Step 5: Kiểm tra build TypeScript**

---

### Task 4: Kiểm thử hồi quy toàn diện & Cập nhật FIX_LOG.md (Bản Fix 80)

**Files:**
- Modify: `FIX_LOG.md`
- Test: Chạy toàn bộ test suites của cả 4 tasks.

- [ ] **Step 1: Chạy tất cả test suites**
- [ ] **Step 2: Build production frontend `npm run build`**
- [ ] **Step 3: Ghi nhận Bản Fix 80 vào `FIX_LOG.md`**
