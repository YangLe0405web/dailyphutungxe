# KẾ HOẠCH PHÂN CÔNG KIỂM THỬ TOÀN BỘ HỆ THỐNG CRM & BÁN HÀNG XE MÁY
> **Dự án:** Hệ thống CRM Quản lý Đại lý Bán xe máy & Phụ tùng Chính hãng  
> **Phiên bản:** 2.0 (Toàn diện Backend .NET Core & Frontend React Vite)  
> **Thời gian thực hiện:** 26/10/2026 - 30/10/2026  
> **Quy định phạm vi:** Kiểm thử toàn bộ hệ thống (trừ trang tổng quan Dashboard), đi sâu vào nghiệp vụ CRM 360°, bảo hành, bảo hiểm, đơn hàng, lịch biểu và khảo sát đánh giá.  
> **Phân công phụ trách:** **Lộc**, **Nghĩa**, **Lan Phương** (mỗi thành viên kiểm thử độc lập cả kịch bản TỐT và XẤU).

---

## I. MỤC TIÊU & NGUYÊN TẮC KIỂM THỬ

1. **Mục tiêu:**
   - Xác minh 100% các tính năng nghiệp vụ CRM hoạt động trơn tru giữa giao diện Khách hàng (Customer) và Quản trị viên (Admin).
   - Kiểm tra tính toàn vẹn dữ liệu giữa Cơ sở dữ liệu SQL Server (`CrmBackend`) và Bộ nhớ cục bộ Client (`localStorage`).
   - Đảm bảo hệ thống bắt lỗi chặt chẽ (Robustness), không bị crash, không bị trùng lặp dữ liệu và giao diện phản hồi trực quan.

2. **Nguyên tắc phân chia kịch bản:**
   - **Kịch bản TỐT (Happy Path):** Thực hiện đúng luồng quy trình chuẩn với dữ liệu hợp lệ. Kết quả mong đợi: thao tác thành công, dữ liệu cập nhật theo thời gian thực, có thông báo/biên bản rõ ràng.
   - **Kịch bản XẤU (Negative / Edge Cases / Boundary):** Thực hiện các thao tác cố tình nhập sai định dạng, bỏ trống trường bắt buộc, vượt ngưỡng số lượng, spam click, chuyển lùi trạng thái bị cấm, hoặc hủy đơn không đúng quy định. Kết quả mong đợi: hệ thống hiển thị cảnh báo đỏ trực tiếp, từ chối giao dịch bất hợp lệ, không làm sai lệch tồn kho và CSDL.

3. **Môi trường & Tài khoản kiểm thử:**
   - **Frontend:** `http://localhost:5173`
   - **Backend API:** `http://localhost:5208`
   - **Tài khoản Admin / Nhân viên:**
     * Admin Quản trị: `admin` / `admin123` (hoặc `admin@motoshop.vn` / `123456`)
     * Kỹ thuật viên: `KTV. Trần Minh Long`, `KTV. Nguyễn Văn Toàn`
   - **Tài khoản Khách hàng:**
     * Khách hàng VIP: `KH001` (Nguyễn Minh Anh - 0901234567 / `123456`)
     * Khách hàng Mới: `KH030` (Vũ Văn Kiên - 0988776655 / `123456`)

---

## II. BẢNG PHÂN CHIA NHIỆM VỤ TỔNG QUAN

| Người phụ trách | Phân hệ & Module Trọng tâm | Phạm vi màn hình kiểm thử |
| :--- | :--- | :--- |
| **LỘC** | **1. Quản lý Khách hàng 360° & CLV Loyalty**<br>**2. Phương tiện Khách & Phê duyệt Biển số**<br>**3. Bán hàng POS & Đơn hàng Xe/Phụ tùng** | - Admin: `Customers.tsx`, `LicensePlateApproval.tsx`, `Sales.tsx`<br>- Khách: `CustomerDashboard.tsx` (Tab 0 & Tab 1), `Checkout.tsx` |
| **NGHĨA** | **4. Lịch hẹn Dịch vụ & Lái thử (Calendar 31 ngày)**<br>**5. Quản lý Bảo hành & Sổ BH Điện tử**<br>**6. Quản lý Bảo hiểm Xe Máy Điện tử** | - Admin: `Appointments.tsx`, `Warranty.tsx`, `Insurance.tsx`<br>- Khách: `ServiceBooking.tsx`, `CustomerDashboard.tsx` (Tab 2, Tab 3, Tab 4) |
| **LAN PHƯƠNG** | **7. Khảo sát Trải nghiệm Khách hàng (CSAT/NPS)**<br>**8. Đánh giá Sản phẩm (Xe mẫu & Phụ tùng)**<br>**9. Quản trị Phản hồi CRM & Phản hồi Khách**<br>**10. Showroom Xe Mẫu & Cửa hàng Phụ tùng** | - Admin: `Feedback.tsx`, `Vehicles.tsx`, `Parts.tsx`<br>- Khách: `CustomerDashboard.tsx` (Tab 5), `VehiclesShowroom.tsx`, `PartsStore.tsx` |

---

## III. CHI TIẾT KỊCH BẢN KIỂM THỬ: LỘC

### Module 1: Hồ sơ Khách hàng 360°, Phân hạng CLV & Tài khoản
#### 1.1. Kịch bản TỐT (Happy Path)
- **TC-LOC-01: Chỉnh sửa thông tin hồ sơ cá nhân khách hàng**
  - *Bước thực hiện:* Đăng nhập `KH001` $\to$ Vào Tab Cài đặt tài khoản / Hồ sơ $\to$ Đổi địa chỉ thành "123 Lê Lợi, P. Bến Nghé, Quận 1, TP.HCM" $\to$ Bấm [Lưu thay đổi].
  - *Kết quả mong đợi:* Hệ thống báo thành công, F5 lại trang thông tin vẫn lưu nguyên vẹn; mở trang Admin `Customers.tsx` thấy địa chỉ của Nguyễn Minh Anh đổi sang địa chỉ mới ngay lập tức.
- **TC-LOC-02: Tự động nâng hạng thành viên dựa trên chi tiêu tích lũy (CLV Loyalty)**
  - *Bước thực hiện:* Kiểm tra hạng thành viên hiện tại của `KH001` (VIP / Kim Cương). Thực hiện hoàn tất thêm 1 đơn hàng phụ tùng giá trị cao.
  - *Kết quả mong đợi:* Tổng chi tiêu tăng lên, huy hiệu thành viên và ưu đãi chiết khấu hiển thị chuẩn xác (VIP hưởng chiết khấu ưu tiên).
- **TC-LOC-03: Đổi mật khẩu tài khoản khách hàng**
  - *Bước thực hiện:* Nhập mật khẩu hiện tại `123456`, mật khẩu mới `NewPass@2026`, xác nhận lại $\to$ Bấm [Cập nhật mật khẩu]. Đăng xuất và đăng nhập lại bằng mật khẩu mới.
  - *Kết quả mong đợi:* Đăng nhập thành công với mật khẩu mới.

#### 1.2. Kịch bản XẤU (Negative & Edge Cases)
- **TC-LOC-04: Đổi mật khẩu với mật khẩu cũ sai hoặc xác nhận không khớp**
  - *Bước thực hiện:* Nhập mật khẩu cũ sai, hoặc mật khẩu mới và xác nhận mật khẩu không trùng khớp nhau.
  - *Kết quả mong đợi:* Hệ thống chặn lưu, hiển thị thông báo lỗi rõ ràng bên dưới ô nhập, không cho submit.
- **TC-LOC-05: Sửa thông tin cá nhân với SĐT hoặc Email sai định dạng**
  - *Bước thực hiện:* Nhập SĐT có chữ cái `09012abcde` hoặc email thiếu đuôi `minhanh@`.
  - *Kết quả mong đợi:* Hiển thị viền đỏ cảnh báo định dạng không hợp lệ, nút lưu bị vô hiệu hóa hoặc chặn lưu.

---

### Module 2: Quản lý Phương tiện, Đăng ký Cà vẹt & Phê duyệt Biển số
#### 2.1. Kịch bản TỐT (Happy Path)
- **TC-LOC-06: Khách hàng đăng ký xe ngoài hệ thống kèm ảnh Cà vẹt xe**
  - *Bước thực hiện:* Vào Tab "Phương tiện của tôi" $\to$ Bấm [+ Đăng ký xe mới] $\to$ Điền Hãng: Honda, Dòng xe: Winner X, Biển số: `59-K1 888.88`, tải lên ảnh Cà vẹt $\to$ Bấm [Gửi hồ sơ đăng ký].
  - *Kết quả mong đợi:* Xe xuất hiện trong danh sách với trạng thái `⏳ Chờ duyệt`, có huy hiệu cảnh báo vàng; Admin nhận được thông báo chuông.
- **TC-LOC-07: Admin phê duyệt biển số xe và cà vẹt**
  - *Bước thực hiện:* Đăng nhập Admin $\to$ Vào trang `LicensePlateApproval.tsx` hoặc `Customers.tsx` mục Duyệt biển số $\to$ Kiểm tra ảnh cà vẹt $\to$ Bấm [✓ Phê duyệt biển số].
  - *Kết quả mong đợi:* Trạng thái xe đổi sang `Đã duyệt` (Xanh lá), thông báo gửi về cho khách hàng; biển số chính thức được cập nhật vào sổ bảo hành.
- **TC-LOC-08: Quy trình cập nhật biển số cho xe mới mua tại Showroom**
  - *Bước thực hiện:* Với xe mới mua có trạng thái "Chưa có biển số", khách bấm [📋 Cập nhật Biển số & Cà vẹt] $\to$ Nhập biển số bấm được `51G-999.99` + Tải ảnh cà vẹt $\to$ Gửi phê duyệt.
  - *Kết quả mong đợi:* Xe chuyển sang `⏳ Đang chờ duyệt biển số`, không bị sinh lặp xe mới.

#### 2.2. Kịch bản XẤU (Negative & Edge Cases)
- **TC-LOC-09: Đăng ký xe nhưng không tải ảnh Cà vẹt xe đối chiếu**
  - *Bước thực hiện:* Điền đầy đủ hãng, dòng xe, biển số nhưng để trống phần tải ảnh Cà vẹt $\to$ Bấm Gửi.
  - *Kết quả mong đợi:* Hệ thống hiển thị cảnh báo đỏ bắt buộc: *"Vui lòng tải lên ảnh Cà vẹt xe để đối chiếu!"*, chặn không cho gửi hồ sơ.
- **TC-LOC-10: Nhập biển số xe sai định dạng chuẩn Việt Nam**
  - *Bước thực hiện:* Nhập biển số dạng chuỗi vô nghĩa: `BIENSOVIP`, `123456`, `AB-XYZ`.
  - *Kết quả mong đợi:* Báo lỗi định dạng biển số Việt Nam (yêu cầu chuẩn dạng VD: `59K1-123.45`).
- **TC-LOC-11: Admin từ chối phê duyệt biển số kèm lý do**
  - *Bước thực hiện:* Admin xem hồ sơ, bấm [Từ chối] và nhập lý do: *"Ảnh cà vẹt bị mờ, không rõ số khung số máy"*.
  - *Kết quả mong đợi:* Trạng thái xe hiển thị `Bị từ chối`, khách hàng nhìn thấy lý do để chụp lại ảnh mới.

---

### Module 3: Bán hàng POS, Quản lý Đơn hàng & Tồn kho khả dụng
#### 3.1. Kịch bản TỐT (Happy Path)
- **TC-LOC-12: Mua phụ tùng online thanh toán thành công & tự trừ tồn kho**
  - *Bước thực hiện:* Vào Cửa hàng phụ tùng $\to$ Chọn 2 Lọc gió Honda $\to$ Thêm vào giỏ $\to$ Tiến hành thanh toán $\to$ Đặt hàng thành công.
  - *Kết quả mong đợi:* Đơn hàng tạo ở trạng thái `ChoDuyet`, tồn kho khả dụng của Lọc gió Honda tự động giảm đúng 2 cái; Admin trang `Sales.tsx` hiển thị đơn hàng mới.
- **TC-LOC-13: Admin chuyển trạng thái đơn hàng và bàn giao xe**
  - *Bước thực hiện:* Admin vào `Sales.tsx` $\to$ Đổi đơn từ `ChoDuyet` $\to$ `DangGiao` $\to$ `HoanThanh` (Bàn giao xe).
  - *Kết quả mong đợi:* Đơn hàng chuyển sang Hoàn thành, xe mới được kích hoạt vào "Phương tiện của tôi" của khách hàng đúng 1 xe duy nhất, không trùng lặp.
- **TC-LOC-14: In hóa đơn giao hàng chuẩn form**
  - *Bước thực hiện:* Trong chi tiết đơn hàng tại `Sales.tsx`, bấm nút [🖨️ In hóa đơn giao hàng].
  - *Kết quả mong đợi:* Cửa sổ in mở ra với đầy đủ thông tin cửa hàng, khách hàng, chi tiết sản phẩm, tổng tiền và chữ ký shipper.

#### 3.2. Kịch bản XẤU (Negative & Edge Cases)
- **TC-LOC-15: Chặn mua khi số lượng vượt tồn kho khả dụng hoặc tồn kho = 0**
  - *Bước thực hiện:* Tìm phụ tùng có số lượng tồn kho = 1. Thử bấm tăng số lượng lên 2 trong giỏ hàng hoặc đặt mua.
  - *Kết quả mong đợi:* Nút tăng số lượng bị khóa, hệ thống hiển thị thông báo lỗi: *"Sản phẩm chỉ còn 1 cái trong kho, không đủ số lượng bạn đặt!"*. Nếu tồn = 0, hiển thị huy hiệu `⛔ Hết hàng trong kho`.
- **TC-LOC-16: Khách hàng hủy đơn hàng & tự động hoàn trả tồn kho**
  - *Bước thực hiện:* Tại đơn hàng đang ở trạng thái `ChoDuyet`, khách bấm [✕ Hủy đơn] $\to$ Chọn lý do: "Đổi ý không mua nữa".
  - *Kết quả mong đợi:* Đơn hàng chuyển sang `DaHuy`, ghi nhận lý do hủy; số lượng phụ tùng hoặc xe máy tự động được **cộng hoàn trả lại kho**.
- **TC-LOC-17: Khóa hủy đơn khi đơn hàng đã bàn giao hoặc đang giao**
  - *Bước thực hiện:* Kiểm tra đơn hàng có trạng thái `DangGiao` hoặc `HoanThanh`.
  - *Kết quả mong đợi:* Nút [Hủy đơn] bị ẩn hoàn toàn, khách hàng không thể tự ý hủy đơn khi hàng đã xuất kho.
- **TC-LOC-18: Khóa cứng đơn hàng Đã hủy phía Admin (Cấm đổi trạng thái ngược lại)**
  - *Bước thực hiện:* Admin mở đơn hàng có trạng thái `DaHuy`.
  - *Kết quả mong đợi:* Dropdown đổi trạng thái bị khóa cứng `🔒 Khóa (Đã hủy)`, không cho phép chuyển ngược về Đang xử lý.

---

## IV. CHI TIẾT KỊCH BẢN KIỂM THỬ: NGHĨA

### Module 4: Lịch hẹn Dịch vụ & Lái thử (Calendar Grid 31 ngày)
#### 4.1. Kịch bản TỐT (Happy Path)
- **TC-NGHIA-01: Đặt lịch bảo dưỡng định kỳ & hiển thị Calendar 31 ngày**
  - *Bước thực hiện:* Vào trang Đặt lịch hẹn (`ServiceBooking.tsx`) $\to$ Chọn xe, chọn ngày hẹn `28/10/2026`, giờ `09:00`, chọn KTV mong muốn $\to$ Bấm [Xác nhận đặt lịch].
  - *Kết quả mong đợi:* Đặt lịch thành công; Admin bấm [Tiếp nhận & Phân công KTV] $\to$ Lịch chuyển sang `DaXacNhan`; Trên Lịch tháng 10 của Khách hàng ngày 28 hiển thị huy hiệu xanh `Bảo dưỡng - 09:00`.
- **TC-NGHIA-02: Khách hàng xác nhận ngày nhận xe mới từ Đơn hàng $\to$ Đồng bộ Lịch biểu Admin**
  - *Bước thực hiện:* Khách hàng có đơn mua xe bấm `[✓ Xác nhận ngày nhận xe]`.
  - *Kết quả mong đợi:*
    * Cuộc hẹn chuyển trạng thái sang `DaXacNhan` (Đã xác nhận).
    * Xuất hiện trên Calendar khách hàng (badge xanh lá `Nhận xe - [giờ]`) và danh sách tóm tắt bên phải.
    * Xuất hiện trên Lịch biểu (Calendar View) trang `Appointments.tsx` của Admin với nhãn `🎉 Đón khách nhận xe mới`.
- **TC-NGHIA-03: Đổi ngày nhận xe tại Showroom**
  - *Bước thực hiện:* Khách bấm `[📅 Đổi ngày nhận xe]` $\to$ Chọn ngày `30/10/2026` $\to$ Bấm [Lưu ngày mới].
  - *Kết quả mong đợi:* Cả Lịch của Khách hàng và Lịch biểu Admin dời huy hiệu cuộc hẹn từ ngày cũ sang ngày `30/10/2026` ngay lập tức.
- **TC-NGHIA-04: Bàn giao xe hoàn tất $\to$ Tự động ẩn khỏi Lịch hẹn & Chuyển sang Lịch sử dịch vụ**
  - *Bước thực hiện:* Admin hoàn tất đơn hàng (`HoanThanh`).
  - *Kết quả mong đợi:* Cuộc hẹn chuyển sang `DaHoanThanh`, biến mất khỏi Tab 2 Lịch hẹn (Lưới lịch & danh sách) và xuất hiện trong Tab 3 "Lịch sử dịch vụ" $\to$ Sub-tab `🎁 Nhận xe mới`.

#### 4.2. Kịch bản XẤU (Negative & Edge Cases)
- **TC-NGHIA-05: Chặn người dùng chưa đăng nhập đặt lịch hẹn (LH01)**
  - *Bước thực hiện:* Đăng xuất tài khoản $\to$ Truy cập form đặt lịch hẹn `ServiceBooking.tsx`.
  - *Kết quả mong đợi:* Form hiển thị banner vàng: *"BẠN CHƯA ĐĂNG NHẬP TÀI KHOẢN"*, nút submit chuyển thành `🔒 Vui lòng đăng nhập để đặt lịch hẹn`, click vào kích hoạt modal đăng nhập.
- **TC-NGHIA-06: Quy trình chuyển trạng thái 1 chiều (LH22 - Cấm quay lùi)**
  - *Bước thực hiện:* Tại Admin `Appointments.tsx`, thử chuyển một lịch hẹn từ `DaXacNhan` quay lùi về `ChoXacNhan`, hoặc từ `DaHoanThanh` sang `DaXacNhan`.
  - *Kết quả mong đợi:* Hệ thống chặn lại và bật thông báo cảnh báo nghiệp vụ: *"Lịch hẹn đã hoàn thành và bàn giao xe! Hồ sơ đã khóa cứng trên hệ thống, không thể chuyển sang trạng thái khác."*
- **TC-NGHIA-07: Ràng buộc hủy lịch hẹn dịch vụ trước 48 tiếng**
  - *Bước thực hiện:* Thử bấm [Hủy lịch] đối với một cuộc hẹn có thời gian diễn ra trong vòng 24 giờ tới.
  - *Kết quả mong đợi:* Nút Hủy bị mờ/khóa hoặc hiển thị thông báo: *"Chỉ được tự hủy lịch trước giờ hẹn ít nhất 48 tiếng. Vui lòng liên hệ Hotline 1900 6868 để được nhân viên hỗ trợ trực tiếp."*
- **TC-NGHIA-08: Admin tiếp nhận lịch hẹn nhưng chưa phân công KTV (LH20)**
  - *Bước thực hiện:* Mở modal Tiếp nhận lịch hẹn tại showroom, để mục KTV là "Chưa phân công" $\to$ Bấm [Xác nhận tiếp nhận].
  - *Kết quả mong đợi:* Báo lỗi đỏ: *"Vui lòng chọn Kỹ thuật viên phụ trách trước khi tiếp nhận lịch hẹn!"*, không cho submit.

---

### Module 5: Quản lý Bảo hành & Gia hạn Bảo hành mở rộng
#### 5.1. Kịch bản TỐT (Happy Path)
- **TC-NGHIA-09: Xem sổ bảo hành điện tử 360°**
  - *Bước thực hiện:* Vào Tab "Phương tiện & Bảo hành" $\to$ Bấm [🛡️ Sổ bảo hành điện tử] của xe cửa hàng.
  - *Kết quả mong đợi:* Mở modal sổ bảo hành đầy đủ: Ngày mua, Hạn bảo hành (3 năm), tình trạng bảo hành `Còn hạn` (Xanh), các mốc bảo dưỡng định kỳ tiêu chuẩn.
- **TC-NGHIA-10: Quy trình Wizard Gia hạn bảo hành mở rộng (Bước 1 ➔ Bước 3)**
  - *Bước thực hiện:* Bấm [Gia hạn bảo hành] $\to$ Bước 1: Nhập ODO 5.000 km, tải lên 1 ảnh công-tơ-mét, tích cam kết $\to$ Bấm [Tiếp theo →] $\to$ Bước 2: Chọn gói +1 năm (1.200.000đ) $\to$ Bước 3: Quét VietQR thanh toán $\to$ Xác nhận.
  - *Kết quả mong đợi:* Yêu cầu gia hạn thành công, hạn bảo hành xe được cộng thêm 1 năm; Admin `Warranty.tsx` nhận bản ghi giao dịch gia hạn mới.
- **TC-NGHIA-11: Admin thẩm định bảo hành rẽ nhánh Được bảo hành vs Từ chối**
  - *Bước thực hiện:* Admin mở phiếu yêu cầu bảo hành $\to$ Chọn thẩm định KTV $\to$ Chọn phụ tùng thay thế miễn phí (chính sách bảo hành) $\to$ In biên bản trả xe.
  - *Kết quả mong đợi:* Phiếu bảo hành hoàn tất, lưu lại lịch sử phụ tùng được bảo hành.

#### 5.2. Kịch bản XẤU (Negative & Edge Cases)
- **TC-NGHIA-12: Wizard Gia hạn bảo hành thiếu ODO hoặc ảnh minh chứng (GHBH03, GHBH04)**
  - *Bước thực hiện:* Để ODO = 0 hoặc âm, không tải ảnh công-tơ-mét, chưa tích cam kết $\to$ Bấm [Tiếp theo →].
  - *Kết quả mong đợi:* Nút không bị disable mờ mà click vào sẽ hiển thị cảnh báo đỏ trực tiếp tại từng trường lỗi (ODO không hợp lệ, thiếu ảnh minh chứng).
- **TC-NGHIA-13: Ô "Ngày gửi yêu cầu" bị sửa đổi (GHBH02)**
  - *Bước thực hiện:* Cố gắng click và gõ bàn phím vào ô "Ngày gửi yêu cầu".
  - *Kết quả mong đợi:* Ô bị khóa cứng (`readOnly disabled`), không thể chỉnh sửa, chuột hiển thị icon cấm `cursor-not-allowed`.
- **TC-NGHIA-14: Xe ngoài hệ thống yêu cầu bảo hành cửa hàng**
  - *Bước thực hiện:* Kiểm tra xe có nguồn gốc `NgoaiHeThong` (khách tự đăng ký).
  - *Kết quả mong đợi:* Trạng thái bảo hành ghi rõ `Không áp dụng`, không hiển thị nút yêu cầu bảo hành miễn phí của showroom.

---

### Module 6: Quản lý Bảo hiểm Xe máy Điện tử
#### 6.1. Kịch bản TỐT (Happy Path)
- **TC-NGHIA-15: Mua bảo hiểm trực tuyến tích hợp thanh toán VietQR**
  - *Bước thực hiện:* Vào Tab "Bảo hiểm" $\to$ Bấm [+ Mua bảo hiểm online] $\to$ Chọn xe, chọn gói Bảo hiểm TNDS Bắt buộc (66.000đ/năm) $\to$ Xem trước Hợp đồng mẫu $\to$ Quét VietQR $\to$ Bấm [Xác nhận đã chuyển khoản].
  - *Kết quả mong đợi:* Hợp đồng bảo hiểm điện tử được tạo với mã HĐ `BH-xxx`, có mã QR tra cứu, hiệu lực 1 năm, trạng thái `Hiệu lực`.
- **TC-NGHIA-16: Gia hạn bảo hiểm nối tiếp hạn cũ**
  - *Bước thực hiện:* Chọn hợp đồng sắp hết hạn $\to$ Bấm [Gia hạn bảo hiểm] $\to$ Thanh toán gói mới.
  - *Kết quả mong đợi:* Ngày bắt đầu của kỳ bảo hiểm mới nối tiếp chuẩn xác vào ngày kết thúc của kỳ cũ (không bị trùng hoặc hổng ngày).
- **TC-NGHIA-17: Xem & In Giấy chứng nhận bảo hiểm điện tử**
  - *Bước thực hiện:* Bấm nút [In giấy chứng nhận] trên thẻ bảo hiểm.
  - *Kết quả mong đợi:* Xuất mẫu chứng nhận chuẩn Bộ Tài Chính kèm thông tin xe, chủ xe và QR code xác thực.

#### 6.2. Kịch bản XẤU (Negative & Edge Cases)
- **TC-NGHIA-18: Mua bảo hiểm cho xe chưa có biển số mà không điền số khung**
  - *Bước thực hiện:* Mua bảo hiểm nhưng để trống cả Biển số và Số khung VIN.
  - *Kết quả mong đợi:* Báo lỗi yêu cầu ít nhất phải có Biển số hoặc Số khung VIN hợp lệ để định danh xe.
- **TC-NGHIA-19: Cố tình nhập số điện thoại hoặc CCCD không đúng 12 số**
  - *Bước thực hiện:* Điền CCCD có 8 chữ số hoặc SĐT thiếu số vào form hợp đồng.
  - *Kết quả mong đợi:* Hệ thống chặn tại chỗ, báo lỗi định dạng CCCD/SĐT.

---

## V. CHI TIẾT KỊCH BẢN KIỂM THỬ: LAN PHƯƠNG (TRỌNG TÂM)

> [!IMPORTANT]
> **Lan Phương phụ trách chuyên sâu toàn bộ module Khảo sát & Đánh giá (Customer Feedback & Surveys), Phản hồi CRM và Quản lý Danh mục Showroom.**

### Module 7: Khảo sát Trải nghiệm Khách hàng (CSAT & NPS)
#### 7.1. Kịch bản TỐT (Happy Path)
- **TC-PHUONG-01: Tự động gửi thông báo mời làm khảo sát sau khi nhận xe hoặc bảo dưỡng**
  - *Bước thực hiện:* Sau khi đơn hàng xe hoặc lịch bảo dưỡng hoàn tất $\to$ Khách hàng nhận được thông báo chuông: *"📋 Khảo sát trải nghiệm mua sắm #..."* $\to$ Nhấp vào thông báo.
  - *Kết quả mong đợi:* Hệ thống tự động chuyển đúng sang Tab 5 (Khảo sát & Đánh giá), cuộn mượt và kích hoạt viền đỏ highlight mục tiêu trong 7 giây.
- **TC-PHUONG-02: Hoàn thành bài khảo sát động phân phối theo CLV (Dynamic Survey)**
  - *Bước thực hiện:* Mở bài khảo sát CSAT $\to$ Điền câu hỏi trắc nghiệm mức độ hài lòng (Rất hài lòng, Hài lòng...), chấm điểm NPS (từ 1 đến 10), nhập ý kiến đóng góp $\to$ Bấm [Gửi bài khảo sát].
  - *Kết quả mong đợi:* Hệ thống hiển thị Toast đếm ngược 4s chúc mừng, tặng voucher ưu đãi thành viên; bài khảo sát chuyển sang trạng thái `Đã hoàn thành`.
- **TC-PHUONG-03: Thống kê kết quả khảo sát trên trang Admin Feedback**
  - *Bước thực hiện:* Đăng nhập Admin $\to$ Vào trang `Feedback.tsx`.
  - *Kết quả mong đợi:* Hiển thị đầy đủ thẻ KPI: Điểm CSAT trung bình, Tỷ lệ hài lòng (%), Danh sách câu trả lời chi tiết của khách hàng kèm ngày giờ gửi.

#### 7.2. Kịch bản XẤU (Negative & Edge Cases)
- **TC-PHUONG-04: Gửi bài khảo sát nhưng bỏ trống câu hỏi bắt buộc (Required Questions)**
  - *Bước thực hiện:* Trong form khảo sát, cố tình bỏ qua 1 câu hỏi đánh giá bắt buộc và bấm nút [Gửi bài khảo sát].
  - *Kết quả mong đợi:* Hệ thống **không gửi**, tự động cuộn mượt (smooth scroll) đến đúng vị trí câu hỏi bị bỏ trống, làm nổi bật viền đỏ và hiển thị thông báo: *"Vui lòng hoàn thành câu hỏi này trước khi gửi!"*.
- **TC-PHUONG-05: Cố tình gửi lại bài khảo sát đã hoàn thành**
  - *Bước thực hiện:* F5 lại trang hoặc bấm lại nút gửi của bài khảo sát đã làm xong.
  - *Kết quả mong đợi:* Nút gửi bị khóa, hiển thị nhãn: `✓ Bạn đã hoàn thành bài khảo sát này vào [ngày/giờ]`, không cho phép gửi trùng lặp dữ liệu.

---

### Module 8: Đánh giá Sản phẩm (Xe Mẫu & Phụ tùng)
#### 8.1. Kịch bản TỐT (Happy Path)
- **TC-PHUONG-06: Đánh giá 5 sao kèm hình ảnh thực tế cho Xe máy mua mới**
  - *Bước thực hiện:* Tại đơn mua xe đã hoàn thành ở Tab 1, bấm nút `[⭐ Đánh giá xe]` $\to$ Chọn 5 sao, gõ nhận xét: *"Xe chạy rất êm, nhân viên showroom nhiệt tình bàn giao đầy đủ phụ kiện"* $\to$ Tải lên 2 ảnh thực tế của xe $\to$ Bấm [Gửi đánh giá].
  - *Kết quả mong đợi:* Đánh giá được lưu thành công vào CSDL Backend; đơn hàng chuyển sang trạng thái đã đánh giá; Admin `Feedback.tsx` nhận được đánh giá mới.
- **TC-PHUONG-07: Đánh giá đơn hàng phụ tùng đã giao**
  - *Bước thực hiện:* Đơn mua phụ tùng đã nhận $\to$ Bấm [⭐ Đánh giá sản phẩm] $\to$ Chấm điểm 4 sao kèm nội dung nhận xét $\to$ Gửi đánh giá.
  - *Kết quả mong đợi:* Bản ghi đánh giá hiển thị trong Sub-tab `Đã đánh giá` của khách hàng.

#### 8.2. Kịch bản XẤU (Negative & Edge Cases)
- **TC-PHUONG-08: Chặn đánh giá lặp lại nhiều lần trên cùng 1 đơn hàng (ĐG05)**
  - *Bước thực hiện:* Đơn hàng đã đánh giá xong, kiểm tra xem nút `[⭐ Đánh giá]` có còn bấm được không hoặc thử dùng API gửi lặp lại.
  - *Kết quả mong đợi:* Nút Đánh giá chuyển thành nút xám `✓ Đã đánh giá` (disabled), hệ thống chặn tuyệt đối không cho phép tạo 2 bản ghi đánh giá trên cùng một sản phẩm/đơn hàng.
- **TC-PHUONG-09: Đánh giá với nội dung rỗng hoặc chỉ toàn khoảng trắng**
  - *Bước thực hiện:* Chọn số sao nhưng để trống ô nhận xét hoặc chỉ gõ dấu cách $\to$ Bấm Gửi.
  - *Kết quả mong đợi:* Hệ thống báo lỗi: *"Vui lòng nhập nội dung đánh giá (tối thiểu 10 ký tự)!"*.
- **TC-PHUONG-10: Cố tình đánh giá đơn hàng chưa hoàn tất (Đang giao hoặc Chờ duyệt)**
  - *Bước thực hiện:* Tìm đơn hàng có trạng thái `DangGiao` hoặc `ChoDuyet`.
  - *Kết quả mong đợi:* Hoàn toàn **không có nút Đánh giá**, khách chỉ được đánh giá khi đơn hàng đã chuyển sang `HoanThanh` (hoặc `DaGiao`).
- **TC-PHUONG-11: Tuyệt đối BỎ nút đánh giá tại Tab 3 Lịch sử dịch vụ (Quy tắc UI-CUST-05)**
  - *Bước thực hiện:* Truy cập Tab 3 "Lịch sử dịch vụ" của khách hàng, kiểm tra tất cả các phiếu dịch vụ sửa chữa/bảo dưỡng.
  - *Kết quả mong đợi:* Đúng theo yêu cầu thiết kế: **Tuyệt đối không có nút đánh giá trong Tab 3**, chỉ có nút Xem chi tiết và In hóa đơn/biên bản.

---

### Module 9: Quản trị Phản hồi Admin & Đồng bộ Showroom
#### 9.1. Kịch bản TỐT (Happy Path)
- **TC-PHUONG-12: Admin phản hồi (Reply) đánh giá của khách hàng**
  - *Bước thực hiện:* Đăng nhập Admin $\to$ Vào `Feedback.tsx` $\to$ Chọn đánh giá của khách $\to$ Bấm [Phản hồi] $\to$ Nhập: *"DailyXeMay chân thành cảm ơn quý khách đã tin tưởng ủng hộ showroom!"* $\to$ Bấm [Gửi phản hồi].
  - *Kết quả mong đợi:* Phản hồi được lưu trữ, khách hàng mở lại đánh giá thấy hiển thị câu trả lời chính thức của đại lý.
- **TC-PHUONG-13: Duyệt hiển thị đánh giá ra ngoài Website Showroom Xe Mẫu**
  - *Bước thực hiện:* Đánh giá xe mới sau khi gửi $\to$ Mở trang Website Showroom Xe (`VehiclesShowroom.tsx`) $\to$ Chọn đúng mẫu xe đó $\to$ Bấm xem chi tiết/tab Đánh giá.
  - *Kết quả mong đợi:* Đánh giá của khách hàng (số sao, tên khách, ngày đánh giá, nội dung, ảnh chụp) hiển thị sắc nét, tính toán lại điểm sao trung bình của dòng xe.

#### 9.2. Kịch bản XẤU (Negative & Edge Cases)
- **TC-PHUONG-14: Admin Ẩn / Xóa đánh giá tiêu cực hoặc vi phạm tiêu chuẩn cộng đồng**
  - *Bước thực hiện:* Tại `Feedback.tsx`, chọn một đánh giá có nội dung spam hoặc phản cảm $\to$ Bấm nút [Ẩn khỏi Showroom] hoặc [Xóa].
  - *Kết quả mong đợi:* Đánh giá ngay lập tức biến mất khỏi trang Showroom xe ngoài web; Admin có toast thông báo thành công.
- **TC-PHUONG-15: Lọc đánh giá theo số sao và dòng xe không tồn tại**
  - *Bước thực hiện:* Chọn bộ lọc 1 sao cho dòng xe chưa có ai đánh giá 1 sao.
  - *Kết quả mong đợi:* Hiển thị giao diện trống thân thiện: *"Chưa có đánh giá nào phù hợp với bộ lọc"*, không bị vỡ giao diện hay lỗi console.

---

### Module 10: Trải nghiệm Showroom Xe Mẫu & Cửa hàng Phụ tùng
#### 10.1. Kịch bản TỐT (Happy Path)
- **TC-PHUONG-16: Xem 50 mẫu xe thực tế & tính chi phí lăn bánh chính xác**
  - *Bước thực hiện:* Vào Showroom xe $\to$ Kiểm tra hiển thị đủ 5 hãng (Honda, Yamaha, Vespa/Piaggio, Suzuki, SYM) $\to$ Chọn xe Honda SH 160i $\to$ Mở công cụ tính chi phí lăn bánh theo từng tỉnh thành (TP.HCM, Hà Nội, Tỉnh khác).
  - *Kết quả mong đợi:* Hiển thị ảnh xe sắc nét (100% ảnh thật offline), tính toán đúng thuế trước bạ, phí cấp biển số và tổng chi phí lăn bánh.
- **TC-PHUONG-17: Admin Bật / Tắt Ẩn/Hiện xe mẫu trên Website Showroom (XM07)**
  - *Bước thực hiện:* Admin vào `Vehicles.tsx` $\to$ Bấm toggle [Ẩn xe] đối với 1 mẫu xe $\to$ Ra ngoài Showroom kiểm tra.
  - *Kết quả mong đợi:* Mẫu xe đó lập tức biến mất khỏi Showroom; khi Admin bấm [Hiện xe] trở lại thì xe xuất hiện lại ngay mà không cần khởi động lại server.

#### 10.2. Kịch bản XẤU (Negative & Edge Cases)
- **TC-PHUONG-18: Chặn đặt cọc mua xe khi số lượng tồn kho xe = 0 (XM-FIX-03)**
  - *Bước thực hiện:* Tìm mẫu xe có số lượng tồn kho = 0.
  - *Kết quả mong đợi:* Nút mua xe bị khóa `⛔ Hết hàng trong kho (Số lượng = 0)`, không mở được modal thanh toán đặt cọc.
- **TC-PHUONG-19: Nhập khoảng giá lọc xe bị ngược (Giá từ > Giá đến)**
  - *Bước thực hiện:* Trong bộ lọc giá ngoài Showroom, nhập Giá từ = 80 triệu, Giá đến = 30 triệu.
  - *Kết quả mong đợi:* Hệ thống tự động cảnh báo hoặc tự động đảo lại khoảng giá hợp lý, không để danh sách xe bị lỗi trắng trang.

---

## VI. BIỂU MẪU BÁO CÁO KẾT QUẢ TEST (TEST LOG TEMPLATE)

Khi phát hiện lỗi hoặc nghiệm thu kịch bản, mỗi thành viên điền kết quả vào bảng theo mẫu sau:

| Mã Test Case | Người test | Kịch bản (Tốt / Xấu) | Trạng thái (PASS / FAIL) | Mô tả thực tế & Lỗi phát sinh (nếu có) | Ảnh chụp màn hình / Bằng chứng |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `TC-LOC-01` | Lộc | Tốt | **PASS** | Đổi địa chỉ thành công, Backend lưu chuẩn | `proof_loc_01.png` |
| `TC-LOC-09` | Lộc | Xấu | **PASS** | Hệ thống chặn không cho gửi khi thiếu Cà vẹt | `proof_loc_09.png` |
| `TC-NGHIA-02` | Nghĩa | Tốt | **PASS** | Khách xác nhận $\to$ lên Lịch hẹn & Lịch biểu Admin | `proof_nghia_02.png` |
| `TC-NGHIA-06` | Nghĩa | Xấu | **PASS** | Chặn quay lùi trạng thái từ DaHoanThanh | `proof_nghia_06.png` |
| `TC-PHUONG-06`| Lan Phương | Tốt | **PASS** | Đánh giá 5 sao kèm 2 ảnh xe hiển thị chuẩn | `proof_phuong_06.png` |
| `TC-PHUONG-08`| Lan Phương | Xấu | **PASS** | Khóa nút đánh giá sau khi đã gửi, không bị spam | `proof_phuong_08.png` |

---

## VII. TỔNG KẾT & TIÊU CHÍ NGHIỆM THU ĐẠT CHUẨN

1. **Tiêu chí ĐẠT (Ready for Defense):**
   - 100% các kịch bản TỐT (Happy Path) được thực hiện thành công, dữ liệu đồng bộ thời gian thực giữa 2 màn hình Client và Admin.
   - 100% các kịch bản XẤU (Negative Cases) đều kích hoạt đúng cơ chế phòng vệ: có thông báo lỗi màu đỏ rõ ràng, chặn submit, không gây lỗi màn hình trắng (Crash) và không sinh bản ghi rác vào CSDL SQL Server.
   - Lan Phương xác nhận toàn bộ quy trình Khảo sát (CSAT/NPS), Đánh giá 5 sao và duyệt hiển thị ra Showroom không có lỗi trùng lặp hay spam.

2. **Hỗ trợ kỹ thuật khi test:**
   - Nếu gặp bất kỳ vấn đề bất thường trong quá trình kiểm thử, ghi lại URL, mã lỗi (nếu có) và thông báo lại ngay để được fix tức thì.
