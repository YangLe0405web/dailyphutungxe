# Kế hoạch chi tiết: Khắc phục hiển thị KTV Lịch hẹn, Hóa đơn cọc 2 triệu, Địa chỉ giao tận nơi và Thông tin xe mua về

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or superpowers:subagent-driven-development) to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khắc phục triệt để 4 vấn đề được phát hiện qua 5 ảnh thực tế: (1) KTV đã phân công chưa hiện trên Danh sách/Chi tiết/Lịch biểu Appointments; (2) Xe mua cọc trước 2 triệu in hóa đơn và chi tiết hiển thị sai tổng tiền; (3) Địa chỉ nhận hàng hiển thị nhầm showroom thay vì địa chỉ giao tận nơi; (4) Tên xe và thông tin xe mua về hiển thị chuỗi generic "Xe máy chính hãng Motoshop" thay vì tên thật (`Honda Winner X 150`, `Vespa Sprint S 150 i-Get ABS`).

**Architecture:** 
- Nguồn dữ liệu phân công KTV (`crm_order_ktv_assignments`) được liên kết hai chiều: [`Sales.tsx`](file:///d:/crm-project/crm-frontend/src/pages/admin/Sales.tsx) ghi trực tiếp vào `crm_order_ktv_assignments` và đồng bộ `crm_appointments_cache` / `crm_appointments`; [`Appointments.tsx`](file:///d:/crm-project/crm-frontend/src/pages/admin/Appointments.tsx) tự động fallback tra cứu KTV từ `crm_order_ktv_assignments` và `allOrders` ở mọi vị trí hiển thị (Bảng danh sách, Modal chi tiết, Danh sách ngày lịch biểu).
- Chuẩn hóa quản lý giá lăn bánh: [`VehiclesShowroom.tsx`](file:///d:/crm-project/crm-frontend/src/pages/customer/VehiclesShowroom.tsx) lưu `tongTien` đúng bằng tổng giá trị lăn bánh xe (`fullPriceTotal`); [`CustomerDashboard.tsx`](file:///d:/crm-project/crm-frontend/src/pages/customer/CustomerDashboard.tsx) và [`Sales.tsx`](file:///d:/crm-project/crm-frontend/src/pages/admin/Sales.tsx) (PrintInvoiceModal & OrderDetailModal) hiển thị rõ ràng 3 dòng độc lập: Tổng giá trị xe lăn bánh, Tiền cọc đã nộp, và Số tiền còn lại phải thu khi nhận xe.
- Định tuyến địa chỉ giao xe: [`Appointments.tsx`](file:///d:/crm-project/crm-frontend/src/pages/admin/Appointments.tsx) kiểm tra `hinhThucGiao === 'HomeDelivery'` của lịch hẹn hoặc đơn hàng tương ứng để hiển thị badge `🚚 Giao xe tận nơi` và địa chỉ nhà của khách.
- Nhận diện xe thông minh: [`api.ts`](file:///d:/crm-project/crm-frontend/src/services/api.ts) và [`CustomerDashboard.tsx`](file:///d:/crm-project/crm-frontend/src/pages/customer/CustomerDashboard.tsx) tra cứu tên xe từ lịch hẹn liên kết, regex `Phương tiện:\s*([^\]]+?)(?:\s*-\s*BS:|\s*\])` chính xác không bị ngắt quãng bởi dấu gạch ngang (như `i-Get`), loại bỏ hoàn toàn fallback generic "Xe máy chính hãng Motoshop".

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, LocalStorage, ASP.NET Core Web API.

**Spec:** Yêu cầu người dùng từ 5 hình ảnh (media_1793689972769 đến media_1793690052094):
1. Ảnh 2, 3, 4, 5: KTV phân công phải hiển thị đầy đủ trên cả bảng lịch hẹn, modal chi tiết lịch hẹn, và lịch biểu ngày.
2. Xe mua cọc 2 triệu: In hóa đơn và xem chi tiết phải thể hiện rõ tổng giá lăn bánh, số tiền cọc đã nộp, và số tiền còn lại phải thu.
3. Ảnh 5: Lịch hẹn giao tận nơi phải hiện đúng địa chỉ khách hàng và badge Giao tận nơi.
4. Ảnh 1: Thông tin xe mua về phải hiển thị đúng tên xe, màu sắc và phiên bản thực tế.

## Global Constraints
- Bảo toàn toàn bộ 10 System Invariants đã thiết lập trong `FIX_LOG.md`.
- Tuyệt đối không thay đổi schema database backend hay làm hỏng dữ liệu đơn hàng hiện có.
- Không sử dụng lệnh push GitHub khi chưa có yêu cầu `.github --update`.
- Đảm bảo `npm --prefix crm-frontend run build` luôn thành công 0 lỗi.

## Review Focus
1. **Lịch hẹn đã hoàn tất (`DaHoanThanh`):** Trong bảng lịch hẹn và modal chi tiết, dù trạng thái là `DaHoanThanh` hay `DaXacNhan`, KTV phụ trách vẫn phải hiển thị tên đầy đủ chứ không bị ẩn hoặc mất KTV.
2. **KTV phân công tra cứu đa tầng:** Tra cứu theo `maDonHangXe`, theo số thứ tự đơn (`47`, `48`, `047`, `048`), và theo số điện thoại / khách hàng nếu id bị biến đổi.
3. **Đơn hàng cũ cọc 2 triệu đã có trong DB:** Đơn hàng cũ có `tongTien: 2000000` nhưng có `thongTinXe.tongGiaTri` hoặc `phiTruocBa` phải tự động hiển thị tổng giá lăn bánh thực tế trên hóa đơn và màn hình khách hàng.
4. **Tên xe có dấu gạch ngang (như `Vespa Sprint S 150 i-Get ABS`):** Regex trích xuất không được ngắt quãng ở dấu `-` của `i-Get` hay `155-VVA`.
5. **Đơn hàng giao tận nơi:** Khi khách đặt `HomeDelivery`, địa chỉ hiển thị trong chi tiết lịch bàn giao xe phải là địa chỉ nhà của khách, không bao giờ rơi về địa chỉ Showroom Motoshop.

---

### Task 1: Đồng bộ và hiển thị KTV trên toàn bộ Lịch hẹn & Lịch biểu

**Files:**
- Modify: `crm-frontend/src/pages/admin/Appointments.tsx:810-855, 1375-1410, 1830-1845, 2490-2510`
- Modify: `crm-frontend/src/pages/admin/Sales.tsx:160-210`
- Test: `crm-frontend/tests/verify_ktv_appointments_sync.test.js`

**Interfaces:**
- Consumes: `localStorage.getItem('crm_order_ktv_assignments')`, `allOrders`, `Appointment`
- Produces: `getAssignedKtvForAppt(a: Appointment, orders: Order[]): string` - trả về tên KTV phụ trách chính xác hoặc fallback 'Chưa phân công' (chỉ khi thực sự chưa phân công).

- [ ] **Step 1: Viết test kiểm tra đồng bộ KTV vào Appointments**
  Tạo test script kiểm tra: khi một đơn xe (ví dụ `DH-XE-047`, `DH-XE-048`) đã được gán KTV trong `crm_order_ktv_assignments`, các lịch hẹn tương ứng `#LH051`, `#LH052` phải lấy được tên KTV này trên Bảng danh sách, Modal chi tiết và Danh sách ngày lịch biểu.

- [ ] **Step 2: Chạy test để xác nhận FAIL**
  Chạy: `node crm-frontend/tests/verify_ktv_appointments_sync.test.js`
  Kỳ vọng: FAIL vì `Appointments.tsx` hiện tại chỉ đọc `a.nhanVienPhuTrach` mà không tra cứu `crm_order_ktv_assignments`.

- [ ] **Step 3: Triển khai hàm `getAssignedKtvForAppt` và đồng bộ trong `Appointments.tsx` & `Sales.tsx`**
  - Trong `Appointments.tsx`: Tạo hàm resolver KTV tra cứu từ `a.nhanVienPhuTrach`, `crm_order_ktv_assignments` (so khớp theo `a.maDonHangXe`, số ID, mã đơn), và `matchedOrder.thongTinXe?.ktvPhuTrach` / `matchedOrder.tenKTV`. Áp dụng hàm này cho Bảng danh sách (cả khi `DaHoanThanh` và `DaXacNhan`), Modal chi tiết, và Modal ngày lịch biểu.
  - Trong `Sales.tsx`: Trong hàm `handleAssignKtv`, ngoài việc lưu `crm_order_ktv_assignments`, thực hiện cập nhật trực tiếp trường `nhanVienPhuTrach` của các phiếu hẹn tương ứng trong `crm_appointments_cache` và thông báo sự kiện đồng bộ.

- [ ] **Step 4: Chạy test để xác nhận PASS**
  Chạy: `node crm-frontend/tests/verify_ktv_appointments_sync.test.js`
  Kỳ vọng: PASS 100%.

- [ ] **Step 5: Kiểm tra TypeScript build**
  Chạy: `npm --prefix crm-frontend run build`

---

### Task 2: Chuẩn hóa hiển thị Đơn xe cọc 2 triệu & Chi tiết Hóa đơn

**Files:**
- Modify: `crm-frontend/src/pages/customer/VehiclesShowroom.tsx:480-496`
- Modify: `crm-frontend/src/pages/customer/CustomerDashboard.tsx:3465-3475, 3710-3725`
- Modify: `crm-frontend/src/pages/admin/Sales.tsx:4720-4775`
- Test: `crm-frontend/tests/verify_deposit_order_invoice.test.js`

**Interfaces:**
- Consumes: `order.tongTien`, `order.thongTinXe.tongGiaTri`, `order.thongTinXe.soTienDatCoc`, `order.thongTinXe.soTienConLai`
- Produces: Chuẩn hóa hiển thị tổng giá lăn bánh xe, tiền cọc, và tiền còn lại trên Dashboard và Hóa đơn in ấn.

- [ ] **Step 1: Viết test kiểm tra hiển thị đơn cọc 2 triệu và hóa đơn**
  Tạo test script kiểm tra: với đơn xe đặt cọc 2 triệu, tổng tiền đơn hàng phải phản ánh tổng giá trị lăn bánh của xe; hóa đơn in ấn phải có 3 dòng riêng biệt: Tổng giá trị lăn bánh, Đã đặt cọc (2.000.000₫), và Còn phải thu (Tổng - 2.000.000₫); nhãn thanh toán hiển thị "💵 Đã đặt cọc 2.000.000₫" thay vì "Đã thanh toán".

- [ ] **Step 2: Chạy test để xác nhận FAIL**
  Chạy: `node crm-frontend/tests/verify_deposit_order_invoice.test.js`
  Kỳ vọng: FAIL vì hiện tại đơn cọc gán `tongTien: 2000000`, hóa đơn in ra tổng lăn bánh 2.000.000₫.

- [ ] **Step 3: Triển khai sửa mã nguồn**
  - Trong `VehiclesShowroom.tsx`: Sửa `orderApi.createVehicleOrder` để `tongTien: fullPriceTotal` (hoặc giữ tổng lăn bánh), đồng thời lưu chi tiết `soTienDatCoc: depositAmount`, `soTienConLai: fullPriceTotal - depositAmount`.
  - Trong `CustomerDashboard.tsx`: Với đơn xe, tính toán tổng giá lăn bánh thực tế: `const fullPrice = order.thongTinXe?.tongGiaTri || (order.thongTinXe?.soTienConLai ? (order.tongTien + order.thongTinXe.soTienConLai) : order.tongTien);`. Hiển thị nhãn thanh toán "💵 Đã cọc 2.000.000₫" khi `order.trangThaiThanhToan === 'DaCoc' || order.thongTinXe?.soTienDatCoc`. Ở góc phải hiển thị rõ `Tổng: formatVND(fullPrice)` và kèm ghi chú nhỏ `(Đã cọc: 2.000.000₫ - Còn lại: formatVND(soTienConLai))`.
  - Trong `Sales.tsx` (`PrintInvoiceModal`): Sửa khối tổng kết tiền xe: Tổng lăn bánh luôn lấy từ `order.thongTinXe.tongGiaTri || fullCalculatedPrice`, Tiền cọc lấy từ `order.thongTinXe.soTienDatCoc || (order.trangThaiThanhToan === 'DaCoc' ? 2000000 : order.tongTien)`, Tiền còn phải thu lấy từ `order.thongTinXe.soTienConLai || Math.max(0, fullPrice - deposit)`.

- [ ] **Step 4: Chạy test để xác nhận PASS**
  Chạy: `node crm-frontend/tests/verify_deposit_order_invoice.test.js`
  Kỳ vọng: PASS 100%.

- [ ] **Step 5: Kiểm tra TypeScript build**
  Chạy: `npm --prefix crm-frontend run build`

---

### Task 3: Khắc phục địa chỉ nhận xe đúng theo hình thức Giao tận nơi (Ảnh 5)

**Files:**
- Modify: `crm-frontend/src/pages/admin/Appointments.tsx:1860-1880`
- Test: `crm-frontend/tests/verify_delivery_address_appointments.test.js`

**Interfaces:**
- Consumes: `selectedApptForDetail`, `allOrders`
- Produces: Badge và địa chỉ nhận xe tương thích với hình thức giao hàng của đơn (`HomeDelivery` vs `Showroom`).

- [ ] **Step 1: Viết test kiểm tra địa chỉ giao xe trong modal chi tiết lịch hẹn**
  Tạo test script kiểm tra: với lịch hẹn liên kết đơn xe có hình thức giao tận nơi `HomeDelivery` (ví dụ `#DH-XE-048`), modal chi tiết lịch hẹn phải hiển thị badge `🚚 Giao xe tận nơi` và địa chỉ giao xe là địa chỉ nhà của khách (`123 Lê Lợi, P. Bến Nghé, Q.1`), không hiển thị `🏢 Nhận tại Showroom` hay địa chỉ Showroom Motoshop Lê Văn Sỹ.

- [ ] **Step 2: Chạy test để xác nhận FAIL**
  Chạy: `node crm-frontend/tests/verify_delivery_address_appointments.test.js`
  Kỳ vọng: FAIL vì hiện tại khối này chỉ đọc `selectedApptForDetail.hinhThucGiao` mà không đối chiếu `matchedOrder`.

- [ ] **Step 3: Triển khai sửa trong `Appointments.tsx`**
  - Trong modal chi tiết lịch hẹn `selectedApptForDetail`: Tra cứu `matchedOrder = allOrders.find(...)`.
  - Xác định `isHomeDelivery = selectedApptForDetail.hinhThucGiao === 'HomeDelivery' || matchedOrder?.thongTinXe?.hinhThucGiao === 'HomeDelivery' || selectedApptForDetail.ghiChu?.includes('GIAO XE TẬN NƠI') || matchedOrder?.ghiChu?.includes('GIAO TẬN NƠI') || (matchedOrder?.diaChiGiao && !matchedOrder.diaChiGiao.toLowerCase().includes('showroom'));`
  - Địa chỉ hiển thị: nếu `isHomeDelivery` thì lấy `matchedOrder?.diaChiGiao || matchedOrder?.thongTinXe?.diaChiGiao || selectedApptForDetail.diaChiGiao`. Nếu là Showroom thì lấy địa chỉ Showroom Motoshop.
  - Render rõ ràng badge `🚚 Giao xe tận nơi (Giao tận nhà)` kèm địa chỉ nhà của khách.

- [ ] **Step 4: Chạy test để xác nhận PASS**
  Chạy: `node crm-frontend/tests/verify_delivery_address_appointments.test.js`
  Kỳ vọng: PASS 100%.

- [ ] **Step 5: Kiểm tra TypeScript build**
  Chạy: `npm --prefix crm-frontend run build`

---

### Task 4: Khắc phục thông tin xe mua về hiển thị đúng tên xe thực tế (Ảnh 1)

**Files:**
- Modify: `crm-frontend/src/services/api.ts:2210-2230, 3985-3995`
- Modify: `crm-frontend/src/pages/customer/CustomerDashboard.tsx:3475-3490`
- Test: `crm-frontend/tests/verify_vehicle_info_display.test.js`

**Interfaces:**
- Consumes: `order.thongTinXe`, `allAppts`, `LICH_HEN`, regex trích xuất phương tiện
- Produces: Tên xe thực tế (`Honda Winner X 150`, `Vespa Sprint S 150 i-Get ABS`), màu sắc và phiên bản chính xác.

- [ ] **Step 1: Viết test kiểm tra nhận diện tên xe**
  Tạo test script kiểm tra: các đơn xe `#DH-XE-047` và `#DH-XE-048` không bao giờ hiển thị "Xe máy chính hãng Motoshop", mà phải hiển thị chính xác tên xe từ lịch hẹn (`Honda Winner X 150`, `Vespa Sprint S 150 i-Get ABS`); regex xử lý chuẩn các tên xe có dấu gạch nối (`i-Get`).

- [ ] **Step 2: Chạy test để xác nhận FAIL**
  Chạy: `node crm-frontend/tests/verify_vehicle_info_display.test.js`
  Kỳ vọng: FAIL vì `api.ts` line 2217 đang fallback gán `'Xe máy chính hãng Motoshop'`.

- [ ] **Step 3: Triển khai sửa trong `api.ts` và `CustomerDashboard.tsx`**
  - Trong `api.ts`:
    * Sửa regex trích xuất phương tiện từ ghi chú: `/(?:Phương tiện|Xe):\s*([^\]]+?)(?:\s*-\s*BS:|\s*\])/i` để không bị ngắt quãng bởi dấu gạch ngang của tên xe.
    * Bổ sung tra cứu `linkedAppt` trực tiếp từ `crm_appointments_cache` và giải mã tên xe từ ghi chú nếu `rawBikeName` rỗng.
    * Thay thế fallback generic `'Xe máy chính hãng Motoshop'` bằng tra cứu từ danh mục xe hoặc tên xe thực tế trong lịch hẹn liên kết.
  - Trong `CustomerDashboard.tsx`:
    * Bổ sung hàm resolver: nếu `order.thongTinXe?.tenXe` rỗng hoặc chứa chuỗi generic ('Xe máy chính hãng Motoshop' / 'Mẫu xe chính hãng'), tự động tra cứu từ `appointments` state theo `order.id` hoặc `maDonHangXe` hoặc `maLichHen` để lấy tên xe, màu sắc và phiên bản thật.

- [ ] **Step 4: Chạy test để xác nhận PASS**
  Chạy: `node crm-frontend/tests/verify_vehicle_info_display.test.js`
  Kỳ vọng: PASS 100%.

- [ ] **Step 5: Kiểm tra TypeScript build**
  Chạy: `npm --prefix crm-frontend run build`

---

### Task 5: Kiểm thử hồi quy toàn diện & Cập nhật FIX_LOG.md

**Files:**
- Modify: `FIX_LOG.md`
- Test: Tất cả các file test của 4 task trên.

- [ ] **Step 1: Chạy toàn bộ test suites**
  Chạy tất cả các script kiểm thử:
  * `node crm-frontend/tests/verify_ktv_appointments_sync.test.js`
  * `node crm-frontend/tests/verify_deposit_order_invoice.test.js`
  * `node crm-frontend/tests/verify_delivery_address_appointments.test.js`
  * `node crm-frontend/tests/verify_vehicle_info_display.test.js`
  * `node crm-frontend/tests/verify_plate_and_ktv_sync.js`

- [ ] **Step 2: Chạy build production frontend**
  Chạy: `npm --prefix crm-frontend run build`

- [ ] **Step 3: Cập nhật `FIX_LOG.md` (Bản Fix 79)**
  Ghi nhận đầy đủ: Mục tiêu, nguyên nhân gốc rễ, các file đã chỉnh sửa, kết quả kiểm thử.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-11-03-fix-ktv-appointments-invoices-delivery-address.md`.
Please review the plan. Which execution approach would you prefer?

- **Native (Recommended)** - I implement every task myself in this session, the way this harness runs work, with automated tests and TypeScript verification at each step. Fastest and most cohesive since the context and root causes are already isolated.
- **Subagent-driven** - A fresh subagent implements each task and a fresh reviewer checks it before the next one starts.
