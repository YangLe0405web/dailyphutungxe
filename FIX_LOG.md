# NHẬT KÝ SỬA LỖI & THEO DÕI TẬP TIN (FIX LOG & FILE TRACKING)
**Dự án:** Motoshop CRM  
**Quy tắc:**
1. Mỗi khi fix xong 1 lỗi, ghi nhận chi tiết (mô tả lỗi, giải pháp, tập tin đã sửa, kết quả).
2. Danh sách các tập tin đã can thiệp được cập nhật liên tục bên dưới.
3. **BẮT BUỘC:** Nếu có lỗi tiếp theo cần chỉnh sửa đụng đến bất kỳ tập tin nào đã từng sửa trước đó, phải thông báo và hỏi ý kiến bạn trước khi thực hiện.

---

## 1. DANH SÁCH CÁC TẬP TIN ĐÃ TỪNG ĐƯỢC CHỈNH SỬA
Dưới đây là danh sách toàn bộ các tập tin đã can thiệp. Khi xử lý lỗi mới, nếu chạm vào bất kỳ file nào dưới đây, **Antigravity sẽ hỏi ý kiến bạn trước**:
1. `D:\crm-project\init-db\init.sql` (Cập nhật schema bảng KHACH_HANG)
2. `D:\crm-project\CrmBackend\Controllers\KhachHangController.cs` (Validate SĐT 10 số, check trùng SĐT/Email, check mật khẩu mạnh, lưu Email, ngày sinh, giới tính)
3. `D:\crm-project\crm-frontend\src\data\vietnamLocations.ts` (File tạo mới: Cung cấp dữ liệu Tỉnh/TP - Quận/Huyện - Phường/Xã)
4. `D:\crm-project\crm-frontend\src\services\api.ts` (Bắt và xử lý lỗi chính xác từ backend, không fallback giả mạo)
5. `D:\crm-project\crm-frontend\src\layouts\CustomerLayout.tsx` (Giao diện form đăng ký mới: validate regex SĐT, cascaded address select, DOB, giới tính, mật khẩu mạnh 6 tiêu chuẩn, xác thực OTP 2 bước; lắng nghe sự kiện mở popup đăng nhập toàn cục)
6. `D:\crm-project\crm-frontend\src\App.tsx` (Truyền state `currentCustomer` và trigger `crm-open-login` xuống `VehiclesShowroom` và `PartsStore`)
7. `D:\crm-project\crm-frontend\src\pages\customer\VehiclesShowroom.tsx` (Bộ lọc đa tiêu chí: hãng, khoảng giá, xuất xứ Trong nước/Nhập khẩu, sắp xếp; khóa gửi form đánh giá khi chưa đăng nhập)
8. `D:\crm-project\crm-frontend\src\pages\customer\PartsStore.tsx` (Chặn thêm vào giỏ hàng và khóa form đánh giá khi chưa đăng nhập, kích hoạt popup đăng nhập)

---

## 2. NHẬT KÝ CHI TIẾT CÁC LỖI ĐÃ FIX

### Nhóm chức năng: ĐĂNG KÝ (Mã lỗi ĐK01 - ĐK06)
- **Thời gian hoàn thành:** 02/10/2026 23:38
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100%

#### 1. ĐK01 – Lỗi định dạng sđt
* **Mô tả lỗi:** SĐT thừa, thiếu, chứa chữ vẫn đăng ký thành công.
* **Kết quả mong đợi:** SĐT phải đúng 10 số, bắt đầu bằng 0.
* **Giải pháp đã thực hiện:**
  - Frontend (`CustomerLayout.tsx`): Kiểm tra realtime regex `^0\d{9}$`, chỉ cho nhập số, hiển thị cảnh báo đỏ và chặn submit nếu không hợp lệ.
  - Backend (`KhachHangController.cs`): Thêm kiểm tra regex `^0\d{9}$`, trả về lỗi HTTP 400 nếu sai định dạng.
* **Kết quả test:** Gửi SĐT "12345" -> Hệ thống trả lỗi `{"message":"Số điện thoại không hợp lệ! Phải gồm đúng 10 chữ số và bắt đầu bằng số 0."}`.

#### 2. ĐK02 – Lỗi đăng ký trùng gmail/sđt
* **Mô tả lỗi:** Đăng ký trùng gmail/sđt vẫn báo thành công ảo, admin không có dữ liệu mới.
* **Kết quả mong đợi:** Mỗi tài khoản tương ứng 1 SĐT và 1 Email; nếu trùng sẽ thông báo sđt/email đã tồn tại.
* **Giải pháp đã thực hiện:**
  - Database: Bổ sung cột `Email VARCHAR(100)` vào bảng `KHACH_HANG`.
  - Backend: Kiểm tra trùng lặp SĐT (`SELECT COUNT(*) FROM KHACH_HANG WHERE SoDienThoai = @SoDienThoai`) và Email (`SELECT COUNT(*) FROM KHACH_HANG WHERE LOWER(Email) = LOWER(@Email)`).
  - Frontend (`api.ts`): Bỏ cơ chế fallback ngầm tạo khách hàng giả khi server trả lỗi 400, ném lỗi thật để giao diện hiển thị cho người dùng.
* **Kết quả test:**
  - Nhập SĐT đã có `0901234567` -> Báo lỗi: *"Số điện thoại này đã được đăng ký tài khoản!"*.
  - Nhập Email đã có `baongoc@gmail.com` -> Báo lỗi: *"Email này đã được đăng ký tài khoản!"*.

#### 3. ĐK03 – Địa chỉ không có bộ lọc Phường/Thành phố
* **Mô tả lỗi:** Địa chỉ đăng ký chưa lọc Phường theo Thành phố, dẫn đến chọn sai địa chỉ.
* **Kết quả mong đợi:** Cho phép lọc Phường (Quận/Huyện, Phường/Xã) theo Thành phố đã chọn.
* **Giải pháp đã thực hiện:**
  - Tạo file `vietnamLocations.ts` chứa dữ liệu phân cấp các Tỉnh/Thành phố (TP.HCM, Hà Nội, Đà Nẵng, Bình Dương, Cần Thơ...), Quận/Huyện và Phường/Xã.
  - Giao diện `CustomerLayout.tsx`: 3 dropdown phân cấp liên hoàn (Tỉnh/TP -> Quận/Huyện -> Phường/Xã) + ô nhập số nhà, tên đường, tự động ghép thành địa chỉ hoàn chỉnh.
* **Kết quả test:** Khi chọn TP. Hồ Chí Minh -> Dropdown quận hiển thị các quận của TP.HCM -> Khi chọn Quận 1 -> Dropdown phường hiển thị đúng các phường của Quận 1 (Bến Nghé, Bến Thành, Đa Kao...).

#### 4. ĐK04 – Thiếu thông tin ngày sinh, giới tính khi đăng ký
* **Mô tả lỗi:** Form đăng ký không có trường ngày sinh, giới tính nhưng BE tự động gán giá trị mặc định.
* **Kết quả mong đợi:** Bổ sung trường ngày sinh, giới tính để KH nhập/chọn chính xác.
* **Giải pháp đã thực hiện:**
  - Thêm ô chọn ngày sinh (`<input type="date" />`) giới hạn độ tuổi từ đủ 16 tuổi.
  - Thêm ô chọn giới tính (Nam, Nữ, Khác).
  - Truyền dữ liệu trực tiếp xuống Backend và lưu chính xác vào CSDL SQL Server.
* **Kết quả test:** Tạo tài khoản với ngày sinh `1997-09-20` và giới tính `Nữ` -> Lưu thành công vào bảng `KHACH_HANG` trong CSDL.

#### 5. ĐK05 – Thêm xác minh SĐT/Email khi đăng ký
* **Mô tả lỗi:** Hệ thống chưa có bước xác minh SĐT/Email khi tạo tài khoản.
* **Kết quả mong đợi:** Bổ sung bước xác minh SĐT/Email bằng OTP hoặc liên kết xác nhận trước khi tạo tài khoản.
* **Giải pháp đã thực hiện:**
  - Bổ sung quy trình 2 bước trên giao diện đăng ký:
    - Bước 1: Điền thông tin hợp lệ -> Bấm "Tiếp tục xác thực OTP →".
    - Bước 2: Hiển thị popup mô phỏng gửi mã OTP 6 số ngẫu nhiên về SĐT/Email của KH, có bộ đếm ngược 120s, nút "⚡ Tự động điền OTP" và nút "Gửi lại mã OTP".
    - Chỉ khi nhập đúng OTP mới cho phép hoàn tất tạo tài khoản.
* **Kết quả test:** Nhập OTP sai -> Báo lỗi *"Mã OTP không chính xác"*; Nhập OTP đúng -> Tạo tài khoản thành công.

#### 6. ĐK06 – Lỗi tự động tạo mật khẩu mặc định (123456)
* **Mô tả lỗi:** Hệ thống tự động đặt mật khẩu 123456 khi đăng ký tài khoản.
* **Kết quả mong đợi:** KH tự thiết lập mật khẩu; mật khẩu đủ độ dài, gồm chữ hoa, chữ thường, số và ký tự đặc biệt; có ô xác nhận và phải trùng khớp.
* **Giải pháp đã thực hiện:**
  - Loại bỏ hoàn toàn mật khẩu mặc định 123456.
  - Bổ sung ô nhập "Mật khẩu mới" và "Xác nhận mật khẩu" có nút ẩn/hiện mắt xem mật khẩu.
  - Bảng tiêu chí trực quan tự động bật xanh khi thỏa mãn: Tối thiểu 8 ký tự, có chữ in hoa, có chữ in thường, có số, có ký tự đặc biệt và 2 mật khẩu trùng khớp. Nút tiếp tục bị vô hiệu hóa nếu mật khẩu chưa đạt chuẩn.
  - Backend cũng validate chặt chẽ 5 tiêu chuẩn mật khẩu mạnh trước khi lưu vào CSDL.
* **Kết quả test:** Gửi mật khẩu đơn giản `123456` -> Bị chặn với thông báo `Mật khẩu phải từ 8 ký tự trở lên, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt!`. Nhập mật khẩu mạnh `BaoNgoc@2026` -> Hợp lệ và lưu thành công.


### Nhóm chức năng: ĐĂNG NHẬP (Mã lỗi ĐN01 - ĐN02)
- **Thời gian hoàn thành:** 03/10/2026 00:01
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100%

#### 1. ĐN01 – Tài khoản đã đăng ký nhưng không thể đăng nhập
* **Mô tả lỗi:** Tài khoản đã tồn tại trên Admin nhưng khi đăng nhập hệ thống báo tài khoản không tồn tại.
* **Kết quả mong đợi:** Cho phép đăng nhập bằng tài khoản đã đăng ký hợp lệ (cả Email, Số điện thoại hoặc Tên đăng nhập) kèm kiểm tra mật khẩu.
* **Giải pháp đã thực hiện:**
  - Backend (`KhachHangController.cs`): Viết API `POST /api/KhachHang/login` tìm kiếm trong CSDL SQL Server theo `Email`, `SoDienThoai` hoặc `TenDangNhap`, kiểm tra trạng thái hoạt động/khóa và đối chiếu mật khẩu.
  - Frontend (`api.ts` & `CustomerLayout.tsx`): Bỏ cơ chế tìm kiếm trong mảng tĩnh `mockCustomers`, thay bằng gọi trực tiếp `customerApi.login(loginInput, loginPass)`.
* **Kết quả test:**
  - Đăng nhập bằng tài khoản vừa tạo trên hệ thống `baongoc@gmail.com` với mật khẩu -> Đăng nhập thành công, nhận đầy đủ thông tin từ DB.
  - Đăng nhập bằng SĐT `0901234567` (tài khoản seed có sẵn) -> Đăng nhập thành công.
  - Nhập sai mật khẩu -> Hệ thống thông báo lỗi chính xác: *"Mật khẩu không chính xác!"*.
  - Nhập tài khoản không tồn tại -> Thông báo: *"Tài khoản không tồn tại trên hệ thống!"*.

#### 2. ĐN02 – Thiếu chức năng Quên mật khẩu
* **Mô tả lỗi:** Trang đăng nhập chưa có chức năng hỗ trợ khách hàng lấy lại mật khẩu.
* **Kết quả mong đợi:** Bổ sung chức năng Quên mật khẩu để khách hàng có thể đặt lại mật khẩu.
* **Giải pháp đã thực hiện:**
  - Backend:
    - Bổ sung API `POST /api/KhachHang/kiem-tra-tai-khoan` để kiểm tra tài khoản theo Email hoặc SĐT.
    - Bổ sung API `POST /api/KhachHang/dat-lai-mat-khau` kiểm tra 5 điều kiện mật khẩu mạnh và cập nhật mật khẩu mới vào bảng `TAI_KHOAN` trong CSDL.
  - Frontend:
    - Bổ sung liên kết *"Quên mật khẩu?"* trên form đăng nhập.
    - Xây dựng luồng khôi phục mật khẩu 3 bước bảo mật:
      1. Nhập Email hoặc SĐT -> Kiểm tra tài khoản tồn tại trên hệ thống.
      2. Gửi mã xác nhận OTP 6 số (kèm mô phỏng hiển thị OTP, đếm ngược 120s, nút tự động điền nhanh).
      3. Thiết lập mật khẩu mới (có mắt ẩn/hiện) kèm bảng kiểm tra 6 tiêu chuẩn mật khẩu an toàn.
      4. Lưu mật khẩu mới thành công -> Tự động đăng nhập vào tài khoản ngay lập tức.
* **Kết quả test:**
  - Bấm "Quên mật khẩu?", nhập `baongoc@gmail.com` -> Hệ thống tìm thấy tài khoản và gửi mã OTP.
  - Điền OTP và thiết lập mật khẩu mới `NewBaoNgoc@2026` -> Mật khẩu được cập nhật vào DB và người dùng được tự động đăng nhập thành công.


### Nhóm chức năng: TRANG CHỦ & CỬA HÀNG (Mã lỗi TC01 - TC03)
- **Thời gian hoàn thành:** 03/10/2026 00:22
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100%

#### 1. TC01 – Chỉ cho phép xem đánh giá khi chưa đăng nhập (Chặn gửi đánh giá trên Xem xe mẫu & Phụ tùng)
* **Mô tả lỗi:** Khách hàng vãng lai (chưa đăng nhập) vẫn có thể viết và gửi đánh giá nhận xét trên chi tiết xe mẫu và phụ tùng.
* **Kết quả mong đợi:** Khách hàng chưa đăng nhập chỉ được xem các đánh giá của người mua trước, không được phép gửi đánh giá; hiển thị khung thông báo bảo mật có nút "Đăng nhập để đánh giá ngay" mở popup đăng nhập. Khi đã đăng nhập, tự động điền họ tên và số điện thoại của khách hàng.
* **Giải pháp đã thực hiện:**
  - `VehiclesShowroom.tsx`:
    - Truyền prop `currentCustomer` và `onRequireLogin`.
    - Kiểm tra nếu `!currentCustomer`: Ẩn form viết nhận xét, thay thế bằng banner ổ khóa 🔒 với nút *"Đăng nhập để đánh giá ngay →"*.
    - Khi bấm nút, bắn sự kiện `crm-open-login` để `CustomerLayout.tsx` mở ngay modal đăng nhập.
    - Khi đã đăng nhập, tự động điền họ tên và SĐT của khách hàng vào form gửi đánh giá.
  - `PartsStore.tsx`:
    - Áp dụng cơ chế tương tự cho tab "Đánh giá & nhận xét" của modal phụ tùng: hiển thị banner khóa khi chưa đăng nhập và form đánh giá khi đã đăng nhập.
* **Kết quả test:**
  - Chưa đăng nhập: Mở chi tiết xe hoặc phụ tùng -> Vẫn đọc được 100% các đánh giá trước đó, nhưng form nhập đánh giá được khóa lại bằng banner kèm nút yêu cầu đăng nhập.
  - Bấm "Đăng nhập để đánh giá ngay" -> Modal đăng nhập lập tức hiện lên.
  - Đã đăng nhập: Form mở ra bình thường, tên và SĐT của khách hàng được tự động điền sẵn.

#### 2. TC02 – Trang "Xem xe mẫu" thiếu bộ lọc nâng cao
* **Mô tả lỗi:** Trang Xem xe mẫu chỉ có thanh tìm kiếm đơn giản, thiếu các bộ lọc theo hãng, khoảng giá, xuất xứ và sắp xếp giá/tên.
* **Kết quả mong đợi:** Bổ sung thanh lọc toàn diện gồm:
  - Lọc theo Hãng (Tất cả, Honda, Yamaha, Suzuki, Piaggio & Vespa).
  - Lọc theo Khoảng giá (< 30 triệu, 30 - 60 triệu, 60 - 100 triệu, > 100 triệu).
  - Lọc theo Xuất xứ (Trong nước, Nhập khẩu).
  - Sắp xếp (Mặc định, Giá tăng dần, Giá giảm dần, Tên A-Z, Tên Z-A).
  - Lọc nhanh dòng xe cho phép Lái thử.
* **Giải pháp đã thực hiện:**
  - Cập nhật model `ShowroomVehicle` bổ sung thuộc tính `xuatXu` cho các dòng xe (Việt Nam, Nhập khẩu Ý, Nhập khẩu Nhật...).
  - Bổ sung bộ điều khiển lọc và sắp xếp trực quan với thanh tìm kiếm realtime, các dropdown chọn mức giá, xuất xứ và sắp xếp theo tiêu chí.
  - Đồng bộ thuật toán lọc đa điều kiện kết hợp cùng lúc: `matchSearch && matchHang && matchPhanKhuc && matchTestDrive && matchPrice && matchOrigin`.
* **Kết quả test:**
  - Lọc "Dưới 30 triệu" -> Hiển thị đúng xe Wave Alpha (18.790.000 đ), Honda Vision,...
  - Lọc "Trên 100 triệu" -> Hiển thị SH350i, Vespa GTS Super Tech 300, CBR150R,...
  - Lọc Xuất xứ "Nhập khẩu" -> Hiển thị các dòng xe Piaggio/Vespa Ý và xe nhập khẩu.
  - Chọn sắp xếp "Giá tăng dần" -> Danh sách sắp xếp chính xác từ giá thấp nhất đến cao nhất.

#### 3. TC03 – Chặn thêm giỏ hàng khi chưa đăng nhập (Trang Phụ tùng)
* **Mô tả lỗi:** Khách hàng chưa đăng nhập tài khoản vẫn bấm được nút "Thêm vào giỏ hàng" ở danh sách phụ tùng và trong modal chi tiết sản phẩm.
* **Kết quả mong đợi:** Khi chưa đăng nhập, nhấn "Thêm vào giỏ hàng" sẽ bị chặn, không thêm vào giỏ và tự động bật popup yêu cầu đăng nhập tài khoản.
* **Giải pháp đã thực hiện:**
  - `PartsStore.tsx`:
    - Trong hàm `handleAdd(p: Part)`: Kiểm tra `if (!currentCustomer)`, nếu chưa đăng nhập thì chặn thêm vào giỏ `add(p)` và phát sự kiện `crm-open-login` để mở modal đăng nhập.
    - Trong nút "+ Thêm vào giỏ" của modal chi tiết phụ tùng: Kiểm tra xác thực tương tự và giữ nguyên modal để khách hàng không bị mất ngữ cảnh đang xem.
* **Kết quả test:**
  - Chưa đăng nhập: Bấm nút "Thêm vào giỏ" ở bất kỳ phụ tùng nào -> Giỏ hàng không tăng số lượng, popup Đăng nhập lập tức bật lên.
  - Đã đăng nhập: Bấm "Thêm vào giỏ" -> Thêm sản phẩm vào giỏ bình thường kèm badge xanh "✓ Đã thêm".
