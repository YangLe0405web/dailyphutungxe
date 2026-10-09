# 🧪 KẾ HOẠCH & PHÂN CHIA NHIỆM VỤ TEST END-USER (DỰ ÁN CRM AUTORA)

> **Mục tiêu:** Kiểm thử toàn diện trải nghiệm người dùng cuối (End-to-End Testing), đảm bảo mọi tính năng mới và các nghiệp vụ đã khôi phục hoạt động trơn tru 100%, không phát sinh lỗi trước khi bàn giao và bảo vệ đồ án.  
> **Nhóm thực hiện:** 4 thành viên – **Minh**, **Nghĩa**, **Phương**, **Lộc**.  
> **Phiên bản kiểm thử:** Nhánh `develop` mới nhất (Cổng FE: `http://localhost:5173`, Cổng BE: `http://localhost:5208`).

---

## 📊 BẢNG TỔNG QUAN PHÂN CHIA NHIỆM VỤ

| Thành viên | Vai trò | Phân hệ / Module kiểm thử chính | Các Flow kiểm thử trọng tâm |
| :--- | :--- | :--- | :--- |
| **MINH** | Trưởng nhóm | **Showroom Xe Máy, Cấp Biển Số & Cà Vẹt, Hủy Đơn Xe** | Flow M1 ➔ M4 (Mua xe, QR nhận xe, Upload & Duyệt Cà vẹt, Xe ngoài, Hủy đơn xe hoàn showroom) |
| **NGHĨA** | Thành viên | **Cửa Hàng Phụ Tùng, Giỏ Hàng, Hủy Đơn Phụ Tùng & Đánh Giá ⭐** | Flow N1 ➔ N4 (Mua phụ tùng, Checkout VietQR/COD, Hủy đơn hoàn tồn kho, Đánh giá ⭐ đơn thành công) |
| **PHƯƠNG** | Thành viên | **Lịch Hẹn Dịch Vụ, Sổ BH Điện Tử & Gia Hạn Care+ 4 Bước** | Flow P1 ➔ P6 (Đặt lịch 4 dịch vụ, Calendar Grid 31 ngày, Sổ BH 30k km, Gửi yêu cầu BH, Gia hạn Care+ ODO) |
| **LỘC** | Thành viên | **Bảo Hiểm Phương Tiện (Web & POS), Hồ Sơ & Bảo Mật, Khảo Sát CLV** | Flow L1 ➔ L5 (Mua BH online VietQR, POS quầy, Gia hạn hợp đồng, Validate hồ sơ $\ge 16$ tuổi, Đổi MK 5 chuẩn, Khảo sát CLV) |

---

## 👤 1. NHIỆM VỤ CỦA MINH (SHOWROOM XE, BIỂN SỐ & CÀ VẸT, HỦY ĐƠN XE)

### 🎯 Mục tiêu:
Kiểm thử trọn vẹn vòng đời của xe từ lúc đặt mua tại showroom cho đến khi nhận xe, cấp biển số, cà vẹt và xử lý trường hợp hủy đơn.

#### 📌 Kịch bản M1: Đặt Mua Xe Showroom & Nhận Mã Nhận Xe QR Code
1. **Tài khoản sử dụng:** `khachhang@autora.vn` / `Khach@12345` (hoặc tạo tài khoản mới).
2. **Các bước thực hiện:**
   - Truy cập `http://localhost:5173/vehicles` (Showroom Xe máy).
   - Sử dụng bộ lọc: Lọc theo Hãng (Honda, Yamaha), lọc Phân khúc (Tay ga, Côn tay), nhập ô tìm kiếm (ví dụ: `SH 160i` hoặc `Exciter 155`).
   - Nhấp vào một mẫu xe để xem trang chi tiết: Kiểm tra hình ảnh, bảng thông số kỹ thuật, giá niêm yết, các tùy chọn màu sắc.
   - Nhấn nút **"Đặt cọc xe ngay"** hoặc **"Mua xe ngay"**.
   - Điền thông tin người mua, chọn hình thức thanh toán (Đặt cọc 10% hoặc Thanh toán toàn bộ), chọn chi nhánh nhận xe.
   - Nhấn **Xác nhận đặt hàng**.
3. **Kết quả mong đợi:**
   - Hiển thị thông báo đặt cọc thành công kèm chuông thông báo (Notification) góc trên.
   - Vào mục **Cá nhân** (`http://localhost:5173/customer`) ➔ Tab **Đơn mua hàng** (Sub-tab `[XE]`) thấy đơn xe xuất hiện với trạng thái *Đang xử lý / Chờ nhận xe*.
   - Nhấn nút **"Mã QR Nhận Xe"**: Modal hiển thị rõ ràng thông tin mã đơn, địa chỉ đại lý showroom, bản đồ, hotline và mã QR nhận xe.

---

#### 📌 Kịch bản M2: Quy Trình Cập Nhật Biển Số & Phê Duyệt Cà Vẹt Xe Showroom (Mã lỗi KH03)
1. **Các bước thực hiện (Phía Khách hàng):**
   - Vào Tab **Phương tiện của tôi** trên trang cá nhân.
   - Chiếc xe vừa mua ở Kịch bản M1 xuất hiện với badge màu vàng: `⚠️ Chưa có biển số`.
   - Nhấp vào nút **`[📋 Cập nhật Biển số & Tải Cà vẹt xe]`**.
   - Modal mở ra: Nhập biển số xe mong muốn (ví dụ: `59A1-999.88`), tải lên ảnh Giấy đăng ký xe (Cà vẹt) từ máy tính hoặc chọn ảnh mẫu có sẵn.
   - Nhấn **Gửi yêu cầu duyệt**. Thẻ xe chuyển sang trạng thái `⌛ Đang chờ duyệt biển số`.
2. **Các bước thực hiện (Phía Admin/Nhân viên):**
   - Đăng nhập Admin tại `http://localhost:5173/admin/login` (Tài khoản: `admin` / `Admin@12345`).
   - Vào menu **Khách hàng** (`/admin/customers`), tìm đến khách hàng `Nguyễn Minh Anh`.
   - Mở Tab **Xe & Bảo hành**: Thấy chiếc xe có huy hiệu biển số chờ duyệt kèm ảnh Cà vẹt.
   - Bấm vào ảnh Cà vẹt để phóng to kiểm tra.
   - Nhấn nút **`[✓ Phê duyệt biển số]`**.
3. **Kết quả mong đợi:**
   - Quay lại trang Khách hàng (F5 nếu cần): Thẻ xe của khách đã cập nhật biển số chính thức `59A1-999.88`, Sổ bảo hành chính hãng được kích hoạt, không còn cảnh báo vàng.

---

#### 📌 Kịch bản M3: Đăng Ký Xe Ngoài Hệ Thống Bắt Buộc Tải Cà Vẹt Xe
1. **Các bước thực hiện:**
   - Tại Tab **Phương tiện của tôi**, nhấn nút **`+ ĐĂNG KÝ PHƯƠNG TIỆN MỚI`**.
   - Nhập thông tin xe: Hãng, Dòng xe, Năm sản xuất, Số khung, Số máy.
   - Thử nhập biển số sai định dạng (ví dụ `123abc`): Hệ thống phải báo lỗi yêu cầu chuẩn biển số Việt Nam (ví dụ `29B1-123.45`).
   - Bỏ trống ô tải ảnh Cà vẹt và bấm Lưu: Hệ thống bắt buộc phải chặn và thông báo *"Vui lòng tải ảnh Cà vẹt xe"*.
   - Tải ảnh Cà vẹt xe hợp lệ và bấm **Đăng ký xe**.
2. **Kết quả mong đợi:**
   - Xe được tạo thành công với nguồn gốc `Xe ngoài hệ thống`, trạng thái chờ admin duyệt cà vẹt.

---

#### 📌 Kịch bản M4: Hủy Đơn Mua Xe & Hoàn Trả Tồn Kho Showroom
1. **Các bước thực hiện:**
   - Vào Tab **Đơn mua hàng** ➔ Sub-tab `[XE]`.
   - Chọn một đơn xe chưa bàn giao (trạng thái Chờ xử lý).
   - Nhấn nút **`[Hủy đơn hàng]`**.
   - Modal hủy đơn hiển thị 6 lý do hủy chuẩn: Chọn lý do (ví dụ: *Đổi ý chọn màu khác*), nhập ghi chú.
   - Nhấn **Xác nhận hủy đơn**.
2. **Kết quả mong đợi:**
   - Trạng thái đơn chuyển ngay sang `Đã hủy`.
   - Vào lại Showroom Xe máy (`/vehicles`): Số lượng xe mẫu tương ứng được phục hồi nguyên vẹn.

---

## 👤 2. NHIỆM VỤ CỦA NGHĨA (CỬA HÀNG PHỤ TÙNG, GIỎ HÀNG, HỦY ĐƠN & ĐÁNH GIÁ ⭐)

### 🎯 Mục tiêu:
Kiểm thử toàn bộ luồng mua sắm phụ tùng online, checkout, cơ chế hủy đơn tự động hoàn kho, và đặc biệt là tính năng viết đánh giá ⭐ cho đơn hàng thành công.

#### 📌 Kịch bản N1: Mua Sắm Phụ Tùng, Bộ Lọc & Quản Lý Giỏ Hàng
1. **Các bước thực hiện:**
   - Truy cập `http://localhost:5173/parts` (Cửa hàng Phụ tùng).
   - Thử nghiệm các bộ lọc:
     * Lọc theo danh mục: Nhớt, Lọc gió, Bugi, Má phanh, Lốp xe...
     * Lọc theo thương hiệu: Motul, Michelin, NGK, Castrol...
     * Sắp xếp theo: Giá tăng dần, Giá giảm dần, Bán chạy nhất.
     * Ô tìm kiếm: Nhập từ khóa (ví dụ: `Motul 7100`, `Michelin`).
   - Bấm vào sản phẩm để xem modal/chi tiết: Đọc thông số, tình trạng tồn kho, chính sách bảo hành phụ tùng.
   - Bấm nút **"Thêm vào giỏ hàng"** cho 2-3 sản phẩm khác nhau.
   - Nhấp vào biểu tượng **Giỏ hàng 🛒** trên thanh điều hướng.
   - Trong Giỏ hàng: Thử tăng số lượng, giảm số lượng, xóa bớt sản phẩm. Thử tăng số lượng vượt quá tồn kho (hệ thống phải giới hạn ở mức tồn kho tối đa).
2. **Kết quả mong đợi:**
   - Tổng tiền cập nhật chính xác theo số lượng và khuyến mãi.

---

#### 📌 Kịch bản N2: Đặt Hàng & Thanh Toán (Checkout VietQR / COD)
1. **Các bước thực hiện:**
   - Từ Giỏ hàng, nhấn nút **"Tiến hành đặt hàng"** ➔ Chuyển đến trang `http://localhost:5173/checkout`.
   - Điền thông tin giao hàng: Họ tên, Số điện thoại, Địa chỉ nhận hàng, Tỉnh/Thành phố, Ghi chú giao hàng.
   - Áp dụng mã giảm giá (nếu có, ví dụ: `AUTORA50K`).
   - Kiểm tra 2 phương thức thanh toán:
     * **Cách 1: Thanh toán khi nhận hàng (COD):** Chọn COD ➔ Bấm "Xác nhận đặt hàng".
     * **Cách 2: Chuyển khoản ngân hàng (VietQR):** Chọn Chuyển khoản ➔ Hệ thống tạo mã QR VietQR kèm số tài khoản, tên chủ TK, số tiền và nội dung CK duy nhất ➔ Bấm xác nhận đã chuyển khoản.
2. **Kết quả mong đợi:**
   - Màn hình thông báo đặt hàng thành công xuất hiện với mã đơn `#MS-XXXXXX`.
   - Kho hàng trừ tồn kho tương ứng của các món phụ tùng đã mua.
   - Chuông thông báo góc trên có thông báo mới: *"Đơn hàng #MS-XXXXXX đã được tiếp nhận thành công"*.

---

#### 📌 Kịch bản N3: Hủy Đơn Phụ Tùng & Tự Động Hoàn Tồn Kho (Mã lỗi PT-FLOW-04)
1. **Các bước thực hiện:**
   - Vào trang **Cá nhân** ➔ Tab **Đơn mua hàng** ➔ Sub-tab `[PHỤ TÙNG]`.
   - Kiểm tra đơn hàng vừa đặt ở Kịch bản N2 (trạng thái: *Chờ xử lý*).
   - Nhấn nút **`[Hủy đơn hàng]`**.
   - Chọn lý do hủy từ dropdown (ví dụ: *Đặt nhầm số lượng / quy cách*, *Tìm thấy sản phẩm khác*).
   - Nhấn nút **Xác nhận hủy**.
2. **Kết quả mong đợi:**
   - Trạng thái đơn đổi thành `Đã hủy`.
   - Kiểm tra lại tại trang Cửa hàng Phụ tùng hoặc trang Admin (`/admin/parts`): Số lượng tồn kho của các sản phẩm trong đơn đã được cộng hoàn trả lại chính xác!

---

#### 📌 Kịch bản N4: Đánh Giá Đơn Hàng Thành Công (Nút ⭐ ĐÁNH GIÁ - Yêu cầu mới)
1. **Các bước thực hiện:**
   - Tại Tab **Đơn mua hàng**, chọn một đơn hàng phụ tùng hoặc xe đã có trạng thái **`Đã giao thành công`** hoặc **`Hoàn thành`** (ví dụ đơn `#MS-009842`).
   - Xác nhận sự hiện diện của nút màu vàng nổi bật: **`[⭐ Đánh giá]`**.
   - Nhấp vào nút **`[⭐ Đánh giá]`**: Modal viết đánh giá mở ra.
   - Thao tác:
     * Chọn số sao đánh giá (từ 1 đến 5 sao).
     * Nhập tiêu đề nhận xét và nội dung cảm nhận chi tiết (về chất lượng sản phẩm, tốc độ giao hàng).
     * *(Tùy chọn)* Tải lên ảnh thực tế sản phẩm.
   - Nhấn nút **"Gửi đánh giá"**.
2. **Kết quả mong đợi:**
   - Toast thông báo *"Cảm ơn bạn đã gửi đánh giá!"*.
   - Đơn hàng được cập nhật trạng thái đã đánh giá.
   - Chuyển sang Tab 5 **Khảo sát & Đánh giá** (Sub-tab `Đã đánh giá`): Bài đánh giá vừa viết xuất hiện đầy đủ với ngày gửi và số sao.
   - Đăng nhập Admin vào `/admin/feedback`: Thấy nhận xét của khách hiển thị ngay lập tức.

---

## 👤 3. NHIỆM VỤ CỦA PHƯƠNG (LỊCH HẸN DỊCH VỤ, SỔ BH ĐIỆN TỬ & GIA HẠN CARE+)

### 🎯 Mục tiêu:
Kiểm thử toàn bộ hệ thống đặt lịch hẹn 4 loại dịch vụ, giao diện Lịch tổng 31 ngày, Sổ bảo hành 36 tháng/30k km, và Wizard gia hạn bảo hành mở rộng Care+ 4 bước có thẩm định ODO.

#### 📌 Kịch bản P1: Đặt Lịch Hẹn Dịch Vụ Trực Tuyến
1. **Các bước thực hiện:**
   - Truy cập `http://localhost:5173/booking` (Đặt lịch dịch vụ).
   - Lần lượt thử tạo lịch cho các loại dịch vụ:
     * **Sửa chữa:** Mô tả sự cố (ví dụ: kêu phanh sau, khó nổ máy).
     * **Bảo dưỡng:** Chọn các gói định kỳ (1.000 km, 5.000 km, 10.000 km).
     * **Lái thử:** Chọn mẫu xe muốn trải nghiệm lái thử tại đại lý.
     * **Bảo hành:** Chọn bảo hành kỹ thuật chính hãng.
   - Chọn phương tiện từ danh sách xe của khách hoặc nhập xe khác.
   - Chọn Chi nhánh (Showroom Quận 1, Quận 5...), chọn Ngày hẹn và Khung giờ hẹn.
   - Bấm **"Xác nhận đặt lịch hẹn"**.
2. **Kết quả mong đợi:**
   - Hiển thị màn hình đặt lịch thành công kèm mã lịch hẹn `#LH-XXXXXX`.
   - Nhận thông báo đặt lịch thành công tại thanh thông báo.

---

#### 📌 Kịch bản P2: Kiểm Tra Giao Diện Lịch Hẹn (Tab 2 Cá Nhân - Chuẩn Mockup 4 & 5)
1. **Các bước thực hiện:**
   - Vào trang **Cá nhân** ➔ Chọn Tab 2 **📅 Lịch hẹn**.
   - **Kiểm tra Màn hình Lịch tổng (Sub-tab 1):**
     * Cột trái: Lưới Calendar Grid tháng 10/2026 với 31 ô ngày. Kiểm tra các chấm tròn màu đánh dấu ngày có lịch (Bảo dưỡng màu xanh dương, Sửa chữa màu cam, Bảo hành màu đỏ).
     * Cột phải: Card chi tiết lịch hẹn sắp tới gần nhất với badge to `ĐÃ XÁC NHẬN`, đầy đủ giờ, xe, địa chỉ và nút thao tác.
   - **Kiểm tra 4 Sub-tabs Dịch vụ cụ thể (Sửa chữa, Bảo dưỡng, Lái thử, Bảo hành):**
     * Thẻ lịch hẹn thiết kế ngang viền đỏ, hiển thị đúng badge `ĐÃ XÁC NHẬN`, `CHỜ XÁC NHẬN` hoặc `BỊ HỦY`.
     * Với lịch hẹn bị hủy: Hiển thị lý do hủy màu đỏ và nút **"Đặt lịch lại"**.
     * Với lịch hẹn đang chờ: Thử bấm nút **"Hủy lịch"** ➔ Điền lý do ➔ Kiểm tra lịch chuyển sang `Bị hủy`.

---

#### 📌 Kịch bản P3: Kiểm Tra Lịch Sử Dịch Vụ (Tab 3 - Tuyệt Đối BỎ Nút Đánh Giá)
1. **Các bước thực hiện:**
   - Vào Tab 3 **🕒 Lịch sử dịch vụ** trên trang cá nhân.
   - Kiểm tra các sub-tab: `Tất cả`, `Bảo dưỡng`, `Sửa chữa`, `Lái thử`, `Bảo hành`.
   - Sử dụng ô tìm kiếm theo biển số xe hoặc tên dịch vụ.
   - Nhấn nút **"Chi tiết"** và **"Xem biên bản / Hóa đơn"** trên từng phiếu dịch vụ.
   - **ĐIỀU KIỆN KIỂM TRA QUAN TRỌNG:** Rà soát toàn bộ các thẻ và dòng lịch sử trong Tab 3 này — **Đảm bảo TUYỆT ĐỐI KHÔNG CÓ nút đánh giá** (đúng theo chỉ đạo thiết kế mới nhất của dự án).

---

#### 📌 Kịch bản P4: Sổ Bảo Hành Điện Tử Chính Hãng & Tải File (BH01)
1. **Các bước thực hiện:**
   - Vào Tab 0 **🏍️ Phương tiện của tôi**.
   - Tìm thẻ xe Honda SH 160i (hoặc xe chính hãng đang bảo hành).
   - Nhấn nút **`[🔒 Xem bảo hành]`**.
   - Màn hình chuyển sang giao diện Sổ bảo hành điện tử chính hãng:
     * Huy hiệu màu xanh: `✓ ĐANG TRONG HẠN BẢO HÀNH`.
     * 2 thanh Progress bar: Thời hạn bảo hành (% trên 36 tháng) và Quãng đường (% trên 30.000 km).
     * Timeline dọc Lịch sử bảo hành: Các lần bảo dưỡng/thay thế linh kiện với chi phí 0đ và mã phiếu `#BH-...`.
   - Nhấn nút **`[📥 Tải sổ bảo hành điện tử]`**.
2. **Kết quả mong đợi:**
   - Hệ thống tự động tạo và tải xuống file tài liệu Sổ bảo hành điện tử đầy đủ thông số phương tiện và lịch sử dịch vụ.

---

#### 📌 Kịch bản P5: Gửi Yêu Cầu Bảo Hành Kỹ Thuật (BH02)
1. **Các bước thực hiện:**
   - Tại trang Sổ bảo hành hoặc Tab Lịch hẹn, bấm **"Yêu cầu bảo hành"**.
   - Form 6 bước mở ra:
     * Mục 1: Chọn ít nhất 1 vấn đề (Động cơ, Hệ thống điện, Phanh, Thân vỏ...).
     * Mục 2: Nhập mô tả triệu chứng lỗi chi tiết.
     * Mục 3: Nhập số KM ODO hiện tại.
     * Mục 4: Tải ảnh/video minh họa lỗi (chọn file máy tính hoặc chọn ảnh mẫu).
     * Mục 5: Chọn chi nhánh và thời gian mang xe đến xưởng.
     * Mục 6: Xác nhận thông tin liên hệ.
   - Bấm **Gửi yêu cầu bảo hành**.
2. **Kết quả mong đợi:**
   - Tạo thành công phiếu yêu cầu bảo hành `#BH-...`.
   - Đăng nhập Admin vào `/admin/warranty`: Phiếu xuất hiện ở tab *Chờ xác nhận*, có thể bấm *Xác nhận yêu cầu*.

---

#### 📌 Kịch bản P6: Wizard Gia Hạn Bảo Hành Mở Rộng Care+ 4 Bước (GHBH01)
1. **Các bước thực hiện:**
   - Tại thẻ xe hoặc sổ bảo hành, nhấn nút **"Gia hạn bảo hành mở rộng"** (Care+).
   - Wizard 4 bước mở ra:
     * **Bước 1 (Xác nhận ODO & Minh chứng):** Nhập ODO thực tế (ví dụ: `15.500 km`), tải ảnh minh chứng đồng hồ xe, tích chọn cam kết thông tin trung thực ➔ Bấm Tiếp tục.
     * **Bước 2 (Thẩm định điều kiện tự động):** Hệ thống quét 3 tiêu chí: (1) ODO dưới 30.000 km; (2) Bảo dưỡng tối thiểu 3 lần tại hãng; (3) 100% linh kiện chính hãng. Nếu đủ điều kiện ➔ 3 tích xanh xuất hiện ➔ Mở nút *Tiếp tục*.
     * *(Thử nghiệm trường hợp từ chối):* Quay lại bước 1 gõ ODO `35.000 km` ➔ Bước 2 báo đỏ lỗi vi phạm và khóa nút tiếp tục.
     * **Bước 3 (Chọn gói Care+):** Chọn Gói Tiêu chuẩn 1 năm (350.000đ) hoặc Gói Toàn diện 2 năm (600.000đ). Lưu ý các gói không hợp lệ sẽ bị khóa kèm lý do rõ ràng.
     * **Bước 4 (Thanh toán & Cập nhật):** Xem hóa đơn điện tử, quét mã VietQR mô phỏng ➔ Bấm xác nhận đã thanh toán.
2. **Kết quả mong đợi:**
   - Thông báo gia hạn thành công.
   - Thời hạn bảo hành trên Sổ bảo hành điện tử của xe được tự động cộng nối thêm 12 tháng (hoặc 24 tháng).

---

## 👤 4. NHIỆM VỤ CỦA LỘC (BẢO HIỂM ONLINE & POS, HỒ SƠ & BẢO MẬT, KHẢO SÁT)

### 🎯 Mục tiêu:
Kiểm thử phân hệ Bảo hiểm xe máy (Mua online bắt buộc VietQR và Cấp tại quầy POS Admin), tính năng Hồ sơ & Bảo mật tài khoản (validate 16 tuổi, đổi mật khẩu 5 tiêu chí), và Khảo sát động CLV.

#### 📌 Kịch bản L1: Mua Bảo Hiểm Xe Máy Online Bắt Buộc VietQR (BHX06, UI-CUST-06)
1. **Các bước thực hiện:**
   - Vào trang **Cá nhân** ➔ Chọn Tab 4 **🛡️ Bảo hiểm**.
   - Kiểm tra giao diện: Tiêu đề **QUẢN LÝ BẢO HIỂM THEO TỪNG XE**. Các hợp đồng được gom nhóm trực quan theo từng xe mà khách hàng đang sở hữu.
   - Nhấn nút màu đỏ lớn: **`+ MUA BẢO HIỂM CHO XE NÀY`**.
   - Giao diện mua bảo hiểm online mở ra:
     * Thông tin chủ xe tự động điền sẵn (có icon bút chì để sửa nhanh).
     * Chọn gói bảo hiểm: Gói Bắt buộc TNDS (66.000đ), Gói Nâng cao (150.000đ), hoặc Gói Toàn diện (1.250.000đ).
     * Chọn thời hạn: 1 năm, 2 năm hoặc 3 năm.
     * Nhấn nút **"Xem trước Hợp đồng Demo"**: Đọc điều khoản hợp đồng chuẩn pháp lý.
     * Nhấn **"Tiến hành thanh toán"**: Hệ thống bắt buộc mở cửa sổ VietQR (đúng chuẩn thiết kế, không chọn tiền mặt khi mua online).
     * Quét mã hoặc bấm nút xác nhận thanh toán demo.
2. **Kết quả mong đợi:**
   - Màn hình chúc mừng cấp Giấy chứng nhận thành công.
   - Danh sách hợp đồng xe được bổ sung hợp đồng mới với trạng thái `🟢 ĐANG HIỆU LỰC`.
   - Có thể bấm **"Xem chi tiết"** và **"In Giấy chứng nhận điện tử"**.

---

#### 📌 Kịch bản L2: Gia Hạn Hợp Đồng Bảo Hiểm Xe Máy Nối Tiếp Hạn Cũ
1. **Các bước thực hiện:**
   - Tại Tab 4 Bảo hiểm, tìm một hợp đồng có trạng thái `🟠 SẮP HẾT HẠN` hoặc `🔴 ĐÃ HẾT HẠN`.
   - Nhấn nút **`[Gia hạn ngay]`**.
   - Modal gia hạn mở ra: Chọn gói gia hạn và thời hạn ➔ Thanh toán qua VietQR.
2. **Kết quả mong đợi:**
   - Hợp đồng được gia hạn thành công.
   - Ngày kết thúc mới được tự động tính nối tiếp từ ngày kết thúc của hợp đồng cũ, không bị trùng lặp hay mất thời hạn đã mua trước đó.

---

#### 📌 Kịch bản L3: Đăng Ký Bảo Hiểm Tại Quầy Admin POS Cho Khách Hàng (BHX07)
1. **Các bước thực hiện:**
   - Đăng nhập Admin (`/admin/login`) ➔ Vào menu **Quản lý bảo hiểm** (`/admin/insurance`).
   - Nhấn nút **`[+ Đăng ký bảo hiểm tại quầy (POS)]`**.
   - **Tìm kiếm tài khoản khách hàng:** Gõ số điện thoại (ví dụ: `0901234567`) hoặc email vào ô tìm kiếm ➔ Danh sách gợi ý Autocomplete hiển thị ➔ Chọn khách hàng `Nguyễn Minh Anh`.
   - Sau khi chọn khách: Dropdown Phương tiện tự động lọc và chỉ hiển thị đúng các xe thuộc sở hữu của khách hàng đó.
   - Chọn gói bảo hiểm (Cơ bản, Nâng cao, Toàn diện).
   - **Phương thức thanh toán:** Kiểm tra Admin có thể linh hoạt chọn **Tiền mặt tại quầy** HOẶC **Chuyển khoản VietQR**.
   - Nhấn **Cấp hợp đồng bảo hiểm**.
2. **Kết quả mong đợi:**
   - Hợp đồng được tạo thành công vào CSDL.
   - Nút In Giấy chứng nhận và In Biên lai xuất hiện ngay lập tức.
   - Khi khách hàng đăng nhập portal cá nhân, hợp đồng vừa cấp hiển thị ngay lập tức trong Tab Bảo hiểm.

---

#### 📌 Kịch bản L4: Chỉnh Sửa Hồ Sơ (Validate $\ge 16$ Tuổi) & Đổi Mật Khẩu (5 Tiêu Chí)
1. **Kiểm tra Chỉnh sửa hồ sơ cá nhân:**
   - Vào trang Cá nhân Tab 0 ➔ Bấm nút **"Chỉnh sửa thông tin ✏️"**.
   - Thử chọn Ngày sinh sao cho độ tuổi $< 16$ tuổi (ví dụ năm sinh 2015) ➔ Bấm Lưu ➔ Hệ thống phải chặn và báo lỗi *"Chủ tài khoản phải từ đủ 16 tuổi trở lên"*.
   - Chọn ngày sinh hợp lệ ($\ge 16$ tuổi).
   - Thử chọn 1 trong 10 mẫu Avatar Preset có sẵn hoặc dùng công cụ tải ảnh từ máy tính.
   - Bấm Lưu thay đổi ➔ Avatar và thông tin cập nhật ngay lập tức.
2. **Kiểm tra Đổi mật khẩu mạnh:**
   - Bấm nút **"Đổi mật khẩu"**.
   - Nhập mật khẩu mới không đạt chuẩn (ví dụ chỉ có chữ thường `123456`): 5 thanh tiêu chí (Độ dài $\ge 8$, Chữ hoa, Chữ thường, Chữ số, Ký tự đặc biệt) báo màu đỏ tương ứng.
   - Nhập mật khẩu mạnh đạt đủ 5 tiêu chí (ví dụ: `Autora@2026`) ➔ Cả 5 tiêu chí tích xanh.
   - Bấm Cập nhật mật khẩu ➔ Toast thông báo thành công. Thử đăng xuất và đăng nhập lại bằng mật khẩu mới.

---

#### 📌 Kịch bản L5: Khảo Sát Động Phân Bổ Theo CLV (Dynamic Survey Tab)
1. **Các bước thực hiện:**
   - Vào Tab 5 **📝 Khảo sát & Đánh giá** ➔ Chọn Sub-tab **Khảo sát từ hệ thống**.
   - Xem bài khảo sát được phân phối theo cấp bậc khách hàng (Kim Cương / VIP).
   - Nhấn **"Tham gia khảo sát"**.
   - Làm bài khảo sát: Thử bỏ sót 1-2 câu hỏi và bấm nút Nộp bài ➔ Hệ thống phải tự động chặn submit và cuộn mượt (smooth scroll) đến đúng câu hỏi chưa trả lời.
   - Điền đầy đủ tất cả các câu hỏi ➔ Bấm Nộp bài.
2. **Kết quả mong đợi:**
   - Toast thông báo *"Cảm ơn bạn đã tham gia khảo sát! Đã cộng 50 điểm thưởng và gửi mã giảm giá"* hiển thị kèm hiệu ứng đếm ngược (countdown) 4 giây tự động đóng.
   - Bài khảo sát chuyển sang trạng thái đã hoàn thành.

---

## 📝 5. MẪU BÁO CÁO KẾT QUẢ TEST & GHI NHẬN LỖI (BUG REPORT)

Khi phát hiện lỗi trong quá trình kiểm thử, các thành viên ghi nhận vào bảng theo mẫu dưới đây:

| Mã Flow | Người test | Mô tả hành động thực hiện | Kết quả thực tế (Lỗi gặp phải) | Mức độ lỗi (Blocker / Major / Minor) | Ảnh chụp màn hình / Ghi chú |
| :---: | :---: | :--- | :--- | :---: | :--- |
| **M2** | Minh | Gửi biển số xe đề xuất | Biển số không hiện sau khi admin bấm duyệt | Major | Chụp màn hình console |
| **N4** | Nghĩa | Bấm nút ⭐ Đánh giá | Modal không mở khi ấn trên Firefox | Minor | Kiểm tra event click |
| ... | ... | ... | ... | ... | ... |

---

## ✅ 6. CHECKLIST ĐÁNH GIÁ SẴN SÀNG BÀN GIAO (DEFINITION OF DONE)

- [ ] Tất cả 4 thành viên hoàn thành 100% các kịch bản kiểm thử được phân công.
- [ ] Không còn lỗi crash hoặc lỗi console đỏ ảnh hưởng đến luồng chính.
- [ ] Dữ liệu hiển thị đồng bộ giữa Khách hàng và Admin (chi tiêu CLV, trạng thái xe, trạng thái đơn, tồn kho).
- [ ] Giao diện Dark Theme 6 tab trên trang cá nhân hoạt động mượt mà, đúng toàn bộ các mockup yêu cầu.
