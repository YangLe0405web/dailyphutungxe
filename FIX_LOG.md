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
7. `D:\crm-project\crm-frontend\src\pages\customer\VehiclesShowroom.tsx` (Bộ lọc đa tiêu chí; trang chi tiết xe máy riêng biệt TC04; khung bộ lọc tập trung TC05; chặn gửi đánh giá và chặn đăng ký lái thử khi chưa đăng nhập TC01 & TC03; tìm kiếm tiếng Việt không dấu & khoảng trắng thừa TC07 & TC08)
8. `D:\crm-project\crm-frontend\src\pages\customer\PartsStore.tsx` (Chặn thêm vào giỏ hàng và khóa form đánh giá khi chưa đăng nhập; trang chi tiết sản phẩm riêng biệt TC04; khung bộ lọc tập trung TC05; Flash Sale và bán chạy TC06; tìm kiếm tiếng Việt không dấu & khoảng trắng thừa TC07 & TC08)
9. `D:\crm-project\crm-frontend\src\utils\vietnameseSearch.ts` (File tạo mới: Chuẩn hóa tìm kiếm tiếng Việt không dấu, xóa khoảng trắng thừa, tìm kiếm tokenized multi-word)
10. `D:\crm-project\crm-frontend\src\contexts\CartContext.tsx` (Quản lý trạng thái chọn sản phẩm trong giỏ hàng: `selectedIds`, `toggleSelect`, `selectAll`, `deselectAll`, tính tổng tiền theo sản phẩm được chọn `selectedTotal`)
11. `D:\crm-project\crm-frontend\src\pages\customer\Checkout.tsx` (Chỉ thanh toán các sản phẩm được chọn trong giỏ hàng và chỉ xóa những sản phẩm đó sau khi đặt hàng thành công)
12. `D:\crm-project\crm-frontend\src\services\notifications.ts` (Nâng cấp hệ thống thông báo đa danh mục TC10: Khách hàng, Đánh giá, Khảo sát, Đơn hàng, Thanh toán, Kho hàng, Hệ thống)
13. `D:\crm-project\crm-frontend\src\layouts\AdminLayout.tsx` (Xây dựng Trung tâm thông báo TC10 quản trị CRM với bộ lọc 7 danh mục, tìm kiếm và thao tác đánh dấu đã đọc)

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

#### 4. TC04 – Tối ưu thẻ sản phẩm và Xây dựng trang chi tiết riêng biệt chuẩn E-commerce
* **Mô tả lỗi:** Giao diện thẻ phụ tùng còn rối, bố cục chưa dễ nhìn; xem chi tiết chỉ là popup modal nhỏ, chưa có trang chi tiết riêng biệt như các sàn TMĐT.
* **Kết quả mong đợi:** 
  - Thẻ sản phẩm được thiết kế rõ ràng, phân cấp giá, thương hiệu, badge tồn kho, rating, nút xem chi tiết và nút thêm giỏ hàng.
  - Khi bấm "Xem chi tiết" (hoặc click vào sản phẩm), chuyển sang **TRANG CHI TIẾT SẢN PHẨM RIÊNG BIỆT** (Shopee/Tiki/Lazada style) có breadcrumbs điều hướng, bố cục 2 cột lớn, ảnh zoom, cam kết bảo hành, chọn số lượng, nút Thêm giỏ / Mua ngay, bảng thông số kỹ thuật, tab mô tả chi tiết & đánh giá khách hàng (kế thừa TC01 & TC03), và danh sách sản phẩm liên quan.
* **Giải pháp đã thực hiện:**
  - `PartsStore.tsx`:
    - Thêm state `selectedPart: Part | null` điều hướng hiển thị view: khi `selectedPart !== null` hiển thị toàn bộ trang chi tiết sản phẩm riêng biệt; khi bấm nút "← Quay lại danh sách" hoặc breadcrumb thì quay lại danh sách cửa hàng phụ tùng.
    - Xây dựng giao diện trang chi tiết 2 cột: Cột trái ảnh lớn + huy hiệu chính hãng + 4 cam kết dịch vụ; Cột phải tên sản phẩm, rating sao, khối giá Shopee đỏ nổi bật tiết kiệm %, bộ chọn số lượng `[-] [qty] [+]`, 2 nút CTA "🛒 Thêm vào giỏ hàng" và "⚡ Mua ngay với giá ưu đãi", bảng thông số kỹ thuật.
    - Tích hợp tab điều hướng: Tab Mô tả chi tiết & Hướng dẫn lắp đặt; Tab Đánh giá khách hàng (chặn submit khi chưa đăng nhập theo TC01); Mục phụ tùng cùng loại & gợi ý cho bạn.
    - Thiết kế lại thẻ card sản phẩm ngoài danh sách: Bo góc mềm mại, hiển thị rõ badge giảm giá %, thương hiệu, dòng xe tương thích, badge tồn kho xanh, 2 nút "Chi tiết" và "Thêm giỏ" tách biệt.
* **Kết quả test:**
  - Nhấp vào bất kỳ sản phẩm nào -> Giao diện chuyển mượt mà sang trang chi tiết riêng biệt chuẩn TMĐT.
  - Đầy đủ thông tin, chọn số lượng, tab mô tả/đánh giá/thông số, nút quay lại giữ nguyên trạng thái tìm kiếm và bộ lọc.

#### 5. TC05 – Bố trí bộ lọc cùng khung với thanh tìm kiếm (Trang Phụ tùng)
* **Mô tả lỗi:** Thanh tìm kiếm nằm ở trên banner đen, bộ lọc danh mục và hãng nằm tách biệt bên dưới khiến trải nghiệm bị chia cắt.
* **Kết quả mong đợi:** Bố trí thanh tìm kiếm và tất cả bộ lọc vào cùng một khung điều khiển tập trung (Unified Filter Card).
* **Giải pháp đã thực hiện:**
  - `PartsStore.tsx`:
    - Gom ô tìm kiếm, dropdown Hãng, dropdown Khoảng giá, dropdown Sắp xếp và thanh danh mục chips (có icon sinh động) vào trong một Card bộ lọc thống nhất (`bg-white rounded-3xl border border-zinc-200 p-6`).
    - Bổ sung thanh trạng thái hiển thị số lượng sản phẩm tìm thấy và nút "✕ Xóa tất cả bộ lọc" khi đang kích hoạt bất kỳ bộ lọc nào.
* **Kết quả test:**
  - Toàn bộ công cụ tìm kiếm và lọc nằm gọn gàng trong cùng 1 khung, thao tác nhanh chóng và mượt mà.

#### 6. TC06 – Bổ sung các khu vực quảng bá sản phẩm (Banner, Flash Sale đếm ngược, Bán chạy nhất)
* **Mô tả lỗi:** Trang bán hàng thiếu banner quảng cáo, chưa có khu vực Flash Sale và sản phẩm bán chạy/nổi bật.
* **Kết quả mong đợi:** Bổ sung banner quảng bá chuyên nghiệp, dải cam kết tiện ích dịch vụ, khu vực Giờ vàng Flash Sale có đồng hồ đếm ngược thời gian thực, và khu vực Sản phẩm bán chạy nhất.
* **Giải pháp đã thực hiện:**
  - `PartsStore.tsx`:
    - Bổ sung **Promo Hero Banner** phong cách showroom xe máy hiện đại với dải tiện ích dịch vụ 4 cam kết (100% Chính hãng, Đổi trả 7 ngày, Giao hàng 2H, Kỹ thuật viên bảo dưỡng).
    - Bổ sung khu vực **⚡ GIỜ VÀNG FLASH SALE** với đồng hồ đếm ngược thời gian thực `[Giờ] : [Phút] : [Giây]` nhảy từng giây, thanh tiến độ bán hàng `🔥 Đã bán X / Sắp hết`, badge giảm giá sốc (-15%, -20%).
    - Bổ sung khu vực **👑 SẢN PHẨM BÁN CHẠY NHẤT THÁNG** xếp hạng top phụ tùng được mua và đánh giá cao nhất.
* **Kết quả test:**
  - Banner và dải tiện ích hiển thị đẹp mắt, đồng hồ Flash Sale đếm ngược mượt mà thời gian thực, các sản phẩm bán chạy nổi bật.

#### 7. TC07 – Lỗi tìm kiếm không hỗ trợ từ khóa không dấu (Áp dụng cho Phụ tùng & Showroom xe)
* **Mô tả lỗi:** Khi tìm kiếm sản phẩm hoặc xe máy, người dùng gõ từ khóa không dấu (vd: `sh`, `air blade`, `nhot motul`, `loc gio`, `phanh`) thì hệ thống không trả về kết quả vì chỉ so khớp chuỗi có dấu nguyên bản.
* **Kết quả mong đợi:** Cho phép tìm kiếm linh hoạt bằng cả tiếng Việt có dấu, không dấu, chữ hoa, chữ thường.
* **Giải pháp đã thực hiện:**
  - Tạo tiện ích `src/utils/vietnameseSearch.ts` với hàm `removeVietnameseTones(str)` chuẩn hóa các ký tự tiếng Việt (`á, à, ả, ã, ạ, â, ấ, ...` -> `a`, `đ` -> `d`) và loại bỏ dấu thanh Unicode NFD.
  - Xây dựng hàm `matchVietnameseSearch(target, query)` so khớp song song cả chuỗi gốc lẫn chuỗi đã loại bỏ dấu.
  - Tích hợp vào bộ lọc tìm kiếm tại `PartsStore.tsx` (tên phụ tùng, thương hiệu, danh mục, dòng xe tương thích) và `VehiclesShowroom.tsx` (tên xe, hãng, phân khúc, động cơ, màu sắc).
* **Kết quả test:**
  - Gõ `nhot` -> Tìm ra đúng "Nhớt Motul 7100 4T", "Nhớt Castrol Power1", "Nhớt Liqui Moly Motorbike".
  - Gõ `dia phanh` -> Tìm ra đúng "Đĩa phanh Brembo Oro".
  - Gõ `sh` hoặc `air blade` -> Tìm ra đúng xe "Honda SH 160i ABS", "Honda Air Blade 160 ABS".

#### 8. TC08 – Lỗi tìm kiếm khi có khoảng trắng thừa (Áp dụng cho Phụ tùng & Showroom xe)
* **Mô tả lỗi:** Khi người dùng vô tình nhập nhiều dấu cách liên tiếp giữa các từ hoặc ở đầu/cuối từ khóa (vd: `nhot   motul`, `  honda   sh  `), hệ thống tìm kiếm chuỗi nguyên bản nên không trả về kết quả nào.
* **Kết quả mong đợi:** Tự động loại bỏ khoảng trắng thừa ở đầu/cuối, gom các dấu cách liên tiếp thành 1 dấu cách đơn, đồng thời tách từ khóa thành các token độc lập để tìm kiếm chính xác ngay cả khi thứ tự từ hơi xê dịch.
* **Giải pháp đã thực hiện:**
  - Trong `src/utils/vietnameseSearch.ts`:
    - Tiền xử lý từ khóa: `.trim().replace(/\s+/g, ' ')`.
    - Tokenized search: Tách chuỗi truy vấn thành danh sách các từ khóa con (`query.split(' ')`). Yêu cầu mục tiêu phải thỏa mãn chứa toàn bộ các token đã nhập (`tokens.every(token => ...)`).
  - Tích hợp đồng nhất vào thuật toán lọc của cả `PartsStore.tsx` và `VehiclesShowroom.tsx`.
* **Kết quả test:**
  - Nhập `  nhot    motul  ` -> Hệ thống tự động chuẩn hóa và tìm đúng các sản phẩm nhớt Motul.
  - Nhập `  honda     160  ` -> Hệ thống tìm chính xác "Honda SH 160i ABS" và "Honda Air Blade 160 ABS".

#### 9. TC09 – Lỗi thiếu nút chọn sản phẩm trong giỏ hàng (Checkboxes chọn sản phẩm muốn mua)
* **Mô tả lỗi:** Trong giỏ hàng không có nút checkbox để chọn sản phẩm, dẫn đến khi nhấn Thanh toán thì hệ thống bắt buộc phải thanh toán toàn bộ tất cả sản phẩm đang có trong giỏ hàng.
* **Kết quả mong đợi:** 
  - Bổ sung ô Checkbox trước mỗi sản phẩm trong giỏ hàng để khách hàng tự chọn món muốn mua.
  - Bổ sung ô Checkbox "Chọn tất cả" (`Select All`) ở thanh tiêu đề giỏ hàng.
  - Tổng tiền chỉ tính dựa trên những sản phẩm đang được chọn (`selectedTotal`).
  - Nút "Thanh toán" hiển thị số lượng món đã chọn (vd: `THANH TOÁN (2)`) và bị vô hiệu hóa khi chưa chọn sản phẩm nào.
  - Trang Đặt hàng / Checkout chỉ xử lý thanh toán và chỉ xóa khỏi giỏ những sản phẩm đã được chọn mua, các sản phẩm còn lại vẫn được lưu nguyên vẹn trong giỏ hàng.
* **Giải pháp đã thực hiện:**
  - `CartContext.tsx`:
    - Thêm state `selectedIds: Set<string>` quản lý danh sách sản phẩm được chọn.
    - Cung cấp các helper: `toggleSelect(id)`, `selectAll()`, `deselectAll()`, `isSelected(id)`.
    - Tính toán `selectedTotal`, `selectedCount`, `selectedItems` phục vụ thanh toán. Khi thêm sản phẩm mới vào giỏ hàng, tự động đánh dấu chọn sản phẩm đó.
  - `CustomerLayout.tsx`:
    - Bổ sung thanh chọn tất cả: Checkbox "Chọn tất cả (X sản phẩm)".
    - Bổ sung checkbox tùy chọn trước từng dòng sản phẩm trong Drawer giỏ hàng.
    - Cập nhật hiển thị tổng tiền theo `selectedTotal`.
    - Nút thanh toán hiển thị: `THANH TOÁN ({selectedCount})`, disable nếu `selectedCount === 0`.
  - `Checkout.tsx`:
    - Cập nhật luồng thanh toán chỉ lấy `selectedItems` để hiển thị và tính tiền đơn hàng.
    - Sau khi tạo đơn thành công, chỉ gọi `remove(item.id)` đối với các mặt hàng vừa mua; giữ nguyên các mặt hàng chưa chọn trong giỏ.
* **Kết quả test:**
  - Giỏ hàng có 3 sản phẩm: Bỏ tick 1 sản phẩm -> Tổng tiền tự động trừ bớt giá trị sản phẩm đó.
  - Nhấn checkbox "Chọn tất cả" -> Chọn toàn bộ hoặc bỏ chọn toàn bộ tức thì.
  - Bỏ chọn toàn bộ -> Nút thanh toán mờ đi và bị disable.
  - Tiến hành thanh toán với 2/3 sản phẩm -> Đơn hàng chỉ gồm 2 sản phẩm đó, sản phẩm thứ 3 vẫn còn nguyên vẹn trong giỏ hàng sau khi đặt thành công.

#### 10. Mở rộng TC03, TC04, TC05 cho Trang "Xem xe mẫu" (VehiclesShowroom)
* **Yêu cầu của bạn:** *"tc 03,04,05 áp dụng cho trang xem xe mẫu luôn"*
* **Chi tiết thực hiện:**
  1. **TC03 (Áp dụng cho Showroom xe):**
     - Chặn đăng ký lái thử khi chưa đăng nhập.
     - Tại danh sách xe mẫu và trang chi tiết xe: Khi bấm nút "🏍️ Lái thử ngay" hoặc "🏍️ Đăng ký lái thử ngay", kiểm tra `currentCustomer`. Nếu chưa đăng nhập -> Chặn lại và phát sự kiện `crm-open-login` để bật ngay popup đăng nhập. Khi đã đăng nhập -> Chuyển tiếp vào form đặt lịch lái thử kèm mã xe đã chọn.
  2. **TC04 (Áp dụng cho Showroom xe):**
     - Thay thế hoàn toàn popup modal nhỏ cũ bằng **TRANG CHI TIẾT XE MÁY RIÊNG BIỆT (Dedicated Full-Page View)** chuẩn showroom thương mại điện tử.
     - Breadcrumbs điều hướng: `Showroom xe máy / [Hãng] / [Tên xe]` kèm nút `✕ Quay lại danh sách xe`.
     - Bố cục 2 cột cao cấp:
       * Cột trái: Ảnh xe góc rộng lớn (aspect 16:10), badge hãng, badge phân khúc, badge trạng thái xe lái thử, dải 4 cam kết dịch vụ (Bảo hành 3 năm / 30.000km, Lái thử miễn phí tận showroom, Trả góp 0% duyệt 15 phút, Quà tặng chính hãng).
       * Cột phải: Tiêu đề xe lớn, đánh giá ⭐ 4.9 (100% khách khuyên mua), khối giá niêm yết chính hãng màu đỏ sang trọng, lưới thông số nhanh (Động cơ, Công suất, Tiêu hao nhiên liệu, Hệ thống phanh), bảng màu sắc phân phối, nút "🏍️ Đăng ký lái thử ngay" (TC03) và nút "📞 Báo giá lăn bánh".
     - Hệ thống Tab chi tiết bên dưới:
       * Tab 1: Thông số kỹ thuật & Mô tả chi tiết toàn diện.
       * Tab 2: Đánh giá & nhận xét từ khách hàng thực tế (kế thừa TC01: chặn viết đánh giá khi chưa đăng nhập).
     - Khu vực **🏍️ CÁC MẪU XE CÙNG HÃNG HOẶC PHÂN KHÚC** ở chân trang giúp khách hàng dễ dàng so sánh và khám phá thêm các dòng xe tương tự.
  3. **TC05 (Áp dụng cho Showroom xe):**
     - Gom toàn bộ thanh tìm kiếm, bộ lọc Phân khúc, bộ lọc Mức giá, bộ lọc Xuất xứ, bộ lọc Sắp xếp, thanh chọn Hãng xe (All, Honda, Yamaha, Suzuki, Vespa) và công tắc "Chỉ xe có Lái thử" vào cùng **MỘT KHUNG ĐIỀU KHIỂN BỘ LỌC TẬP TRUNG (Unified Filter Card)**.
     - Hiển thị số lượng xe tìm thấy theo thời gian thực và nút "✕ Xóa tất cả bộ lọc" tiện lợi.
* **Kết quả test:**
  - Nhấp vào bất kỳ mẫu xe nào ngoài showroom -> Chuyển ngay sang trang chi tiết xe máy riêng biệt toàn màn hình, mượt mà và trực quan.
  - Bấm "Lái thử ngay" khi chưa đăng nhập -> Lập tức bật popup đăng nhập.
  - Bộ lọc xe nằm gọn gàng trong 1 khung điều khiển, tìm kiếm không dấu / khoảng trắng thừa hoạt động hoàn hảo.

#### 11. TC10 – Thay thông báo thành Trung tâm thông báo (Phân loại thông báo đa nhóm)
* **Mô tả lỗi:** Tất cả thông báo nằm chung trong một danh sách đơn lẻ, khi số lượng thông báo tăng lên sẽ rất khó theo dõi và tìm kiếm theo ngữ cảnh nghiệp vụ.
* **Kết quả mong đợi:** Nâng cấp thành **TRUNG TÂM THÔNG BÁO (Notification Center)** chuyên nghiệp, phân loại rõ ràng thành các nhóm: *Khách hàng, Đánh giá, Khảo sát, Đơn hàng, Thanh toán, Kho hàng, Hệ thống*.
* **Giải pháp đã thực hiện:**
  - `src/services/notifications.ts`:
    - Định nghĩa kiểu `NotificationItemCategory`: `'customer' | 'review' | 'survey' | 'order' | 'payment' | 'inventory' | 'system'`.
    - Tạo mảng cấu hình `NOTIFICATION_CATEGORIES` với đầy đủ icon (👤, ⭐, 📋, 📦, 💳, 🏬, ⚙️), màu sắc nhận diện và tên tiếng Việt.
    - Cập nhật hàm `getAdminNotifications`, `addAdminNotification`, `markAllAsRead`, `clearAllNotifications` hỗ trợ xử lý và lưu trữ theo từng danh mục riêng biệt.
  - `AdminLayout.tsx`:
    - Thiết kế lại Popover thành **TRUNG TÂM THÔNG BÁO CRM** rộng rãi (540px), có thanh tìm kiếm nội dung thông báo realtime và checkbox "Chỉ chưa đọc".
    - Bổ sung thanh tab chips phân loại 7 nhóm có huy hiệu số lượng và chấm đỏ báo tin chưa đọc.
    - Mỗi thông báo hiển thị tag danh mục, icon, tiêu đề, thời gian, nút "Xem chi tiết →" chuyển trang nghiệp vụ tương ứng và nút "✕" xóa nhanh.
  - `CustomerLayout.tsx`:
    - Tích hợp thêm chuông Trung tâm thông báo tại thanh điều hướng khách hàng, phân loại các thông báo về: Đơn hàng, Lịch hẹn, Đánh giá, Ưu đãi hệ thống.
* **Kết quả test:**
  - Bấm chuông thông báo -> Mở Trung tâm thông báo với đầy đủ các tab phân loại.
  - Chọn tab "📦 Đơn hàng" -> Chỉ lọc ra các thông báo về đơn hàng; chọn "⭐ Đánh giá" -> Chỉ hiển thị đánh giá mới.
  - Bấm "Đã đọc tất cả" theo từng danh mục -> Trạng thái cập nhật tức thì.
  - **Cập nhật bổ sung (Điều hướng cuộn ngang):** Trang bị thêm 2 nút điều hướng mũi tên trái/phải (`‹` và `›`) ở cả giao diện Admin và Khách hàng, kèm theo thanh cuộn ngang tinh gọn `scrollbar-thin`. Người dùng trên máy tính (desktop không có chuột cuộn ngang) có thể bấm nút mũi tên để cuộn mượt mà sang các nhóm thông báo phía sau (Kho hàng, Hệ thống, Đơn hàng,...) mà không bị che khuất hay mất tab.


### Nhóm chức năng: ĐÁNH GIÁ (Mã lỗi ĐG01 - ĐG03)
- **Thời gian hoàn thành:** 04/10/2026 00:15
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100%

#### 1. ĐG01 – Lỗi khung nhập đánh giá chưa tương thích, nhỏ
* **Mô tả lỗi:** Khung nhập đánh giá ở trang xem chi tiết chưa tương thích responsive, kích thước hiển thị nhỏ, khó thao tác trên các thiết bị màn hình khác nhau.
* **Kết quả mong đợi:** Tối ưu khung nhập đánh giá chuẩn responsive, tự co giãn mượt mà trên mobile, tablet và desktop.
* **Giải pháp đã thực hiện:**
  - `PartsStore.tsx` & `VehiclesShowroom.tsx`:
    - Tái cấu trúc khung form: Thẻ form bo góc lớn (`rounded-3xl`), padding thoáng (`p-5 sm:p-6`), viền border sắc nét.
    - Lưới responsive: Trường Họ tên và SĐT tự động chuyển đổi giữa 1 cột trên mobile (`grid-cols-1`) và 2 cột trên desktop (`sm:grid-cols-2`).
    - Nút chọn số sao tương tác lớn (`text-xl`), có nhãn cảm xúc trực quan (Tuyệt vời 5 sao, Hài lòng 4 sao, v.v.).
    - Textarea rộng rãi (`rows={4}`), hiển thị bộ đếm ký tự thời gian thực (`{newReviewContent.length}/500`).
    - Nút submit toàn chiều rộng trên mobile (`w-full sm:w-auto`) và hiệu ứng đổ bóng sang trọng.
* **Kết quả test:**
  - Hiển thị hoàn hảo trên màn hình điện thoại di động và máy tính, khung rộng rãi, nhập liệu thoải mái.

#### 2. ĐG02 – Lỗi đánh giá không hiển thị thông tin tài khoản
* **Mô tả lỗi:** Khách hàng đã đăng nhập tài khoản nhưng khi vào form đánh giá thì các ô thông tin vẫn trống, chưa hiển thị tên và SĐT của chủ tài khoản.
* **Kết quả mong đợi:** Tự động điền và hiển thị rõ ràng thông tin tài khoản (Tên và SĐT) của khách hàng đang thực hiện đánh giá.
* **Giải pháp đã thực hiện:**
  - `PartsStore.tsx` & `VehiclesShowroom.tsx`:
    - Khởi tạo và đồng bộ `useEffect` tự động điền `currentCustomer.hoTen` vào `newReviewAuthor` và `currentCustomer.soDienThoai` vào `newReviewPhone`.
    - Bổ sung khối huy hiệu tài khoản xác thực ngay đầu form:
      * Avatar chữ cái đầu kèm nền đỏ thương hiệu.
      * Họ tên in đậm + SĐT font mono trong badge xám.
      * Huy hiệu xanh lá `✓ Đã xác minh mua hàng tại đại lý`.
      * Hiển thị email và thông tin tài khoản đang đăng nhập.
* **Kết quả test:**
  - Đăng nhập tài khoản (ví dụ: `0901234567` - Nguyễn Văn An) -> Vào chi tiết phụ tùng/xe máy -> Khối thông tin tài khoản tự động hiển thị đầy đủ tên "Nguyễn Văn An" và SĐT "0901234567".

#### 3. ĐG03 – Lỗi cho phép đánh giá sản phẩm chưa mua
* **Mô tả lỗi:** Khách hàng chưa từng mua sản phẩm hoặc chưa sở hữu xe vẫn có thể gửi đánh giá và nhận xét.
* **Kết quả mong đợi:** Chỉ cho phép khách hàng đã mua sản phẩm/xe máy thực hiện gửi đánh giá. Nếu chưa mua, hiển thị thông báo giải thích và khóa form gửi đánh giá.
* **Giải pháp đã thực hiện:**
  - `PartsStore.tsx`:
    - Tính toán `hasPurchased`: Đối chiếu `currentCustomer.id` hoặc `currentCustomer.hoTen` với danh sách đơn hàng `mockOrders`, kiểm tra sản phẩm đang xem có nằm trong danh sách các mặt hàng đã mua hay không.
    - Nếu khách hàng chưa mua: Thay thế form đánh giá bằng thẻ thông báo khóa `BẠN CHƯA MUA SẢN PHẨM NÀY` (icon 🛍️), kèm lời giải thích về chính sách đánh giá minh bạch và nút "⚡ Mua ngay với giá ưu đãi".
  - `VehiclesShowroom.tsx`:
    - Tính toán `hasPurchasedVehicle`: Kiểm tra `currentCustomer.id` có sở hữu dòng xe đang xem trong danh sách xe đã mua tại đại lý (`mockVehicles`) hay không.
    - Nếu chưa mua/chưa sở hữu xe: Khóa form đánh giá và hiển thị thông báo `BẠN CHƯA MUA DÒNG XE NÀY` (icon 🏍️), kèm nút "🏍️ Đăng ký lái thử xe này" để khách hàng trải nghiệm xe trước.
* **Kết quả test:**
  - Tài khoản chưa mua sản phẩm đang xem -> Bị chặn gửi đánh giá, hiển thị thông báo giải thích rõ ràng kèm gợi ý mua hàng/lái thử.
  - Tài khoản đã mua (ví dụ: Nguyễn Văn An đã mua Nhớt Motul, xe SH 160i) -> Mở form đánh giá bình thường với đầy đủ xác thực mua hàng.

#### 4. ĐG04 – Lỗi đánh giá không cập nhật trên FE/BE
* **Mô tả lỗi:** Đánh giá của khách hàng sau khi gửi không được lưu bền vững hoặc không đồng bộ giữa FE và CSDL backend, làm dữ liệu đánh giá bị mất khi tải lại trang.
* **Kết quả mong đợi:** Đánh giá được lưu trực tiếp vào CSDL SQL Server và cập nhật đồng bộ realtime trên cả giao diện khách hàng và trang quản trị phản hồi của Admin.
* **Giải pháp đã thực hiện:**
  - Backend (`CrmBackend/Controllers/PhanHoiController.cs`):
    - Mở rộng model `PHAN_HOI` và `PhanHoiDto` lưu `MaXe`, `MaPhuTung`, `TenPhuTung`, `TenXe`, `HangXe`, `LoaiXe`, `GhiChuXuLy`, `SoLanSua`.
    - API `GET /api/PhanHoi`: Viết câu lệnh `SELECT` liên kết `LEFT JOIN` với bảng `KHACH_HANG`, `PHU_TUNG`, `SAN_PHAM_XE` để lấy toàn bộ dữ liệu phản hồi kèm thông tin sản phẩm và khách hàng.
    - API `POST /api/PhanHoi`: Ghi nhận trực tiếp vào bảng `PHAN_HOI` trong SQL Server với ngày gửi hiện tại.
    - API `PUT /api/PhanHoi/{id}`: Cho phép cập nhật nội dung và số sao của đánh giá.
  - Frontend (`src/services/api.ts`, `PartsStore.tsx`, `VehiclesShowroom.tsx`, `Feedback.tsx`):
    - Kết nối `feedbackApi.getAll()`, `feedbackApi.create()`, `feedbackApi.update()`.
    - Khi khách hàng gửi đánh giá mới hoặc sửa đánh giá: Tự động gọi API backend, cập nhật state tức thời và lưu trữ bền vững.
* **Kết quả test:**
  - Khách hàng gửi đánh giá phụ tùng hoặc xe máy -> CSDL SQL Server lưu bản ghi mới, gọi `curl http://localhost:5208/api/PhanHoi` lập tức hiển thị bản ghi đã lưu, trang Admin Feedback nhận được ngay lập tức.

#### 5. ĐG05 – Lỗi cho phép đánh giá nhiều lần trên cùng sản phẩm
* **Mô tả lỗi:** Khách hàng có thể liên tục gửi nhiều đánh giá cho cùng một sản phẩm/xe máy.
* **Kết quả mong đợi:** Mỗi tài khoản chỉ được đánh giá 1 lần duy nhất cho mỗi sản phẩm. Sau khi đã đánh giá, chỉ được phép chỉnh sửa đánh giá tối đa 1 lần (quy định 1 đánh giá & 1 lần sửa).
* **Giải pháp đã thực hiện:**
  - Backend (`PhanHoiController.cs`):
    - Kiểm tra trong CSDL: Nếu khách hàng đã có bản ghi đánh giá cho `MaPhuTung` hoặc `MaXe` tương ứng, API `POST /api/PhanHoi` sẽ từ chối và trả về HTTP 400 Bad Request kèm thông báo lỗi *"Bạn đã đánh giá sản phẩm này rồi!"*.
    - Thêm trường `SoLanSua` để đếm số lần chỉnh sửa, nếu đã sửa 1 lần thì không cho phép sửa tiếp.
  - Frontend (`PartsStore.tsx` & `VehiclesShowroom.tsx`):
    - Kiểm tra `existingReview` dựa trên `currentCustomer.id` và mã sản phẩm/xe máy.
    - Nếu đã đánh giá và `editCount === 0`: Khóa form tạo mới, hiển thị thẻ đánh giá đã gửi kèm nút *"✏️ Chỉnh sửa đánh giá (Còn 1 lần sửa)"*. Khi bấm sửa, form chuyển sang chế độ cập nhật (`feedbackApi.update`).
    - Nếu đã sửa (`editCount >= 1`): Khóa hoàn toàn tính năng sửa, hiển thị nhãn đỏ *"🔒 Đã hết lượt chỉnh sửa (Tối đa 1 lần theo quy định)"*.
* **Kết quả test:**
  - Gửi đánh giá lần 1 thành công -> Form chuyển sang hiển thị thẻ nhận xét đã gửi.
  - Bấm nút sửa -> Cập nhật nội dung và số sao -> Đánh giá được lưu lại và nhãn thông báo chuyển thành "Đã hết lượt chỉnh sửa", không thể gửi thêm hoặc sửa thêm.

#### 6. ĐG06 – Lỗi chức năng Gọi/Gửi Email chưa hoạt động (Admin Phản hồi)
* **Mô tả lỗi:** Trong trang Admin Quản lý phản hồi, các nút thao tác Gọi điện thoại và Gửi Email cho khách hàng phản hồi không phản hồi hoặc chỉ là nút tĩnh không có tính năng.
* **Kết quả mong đợi:** Tích hợp đầy đủ popup Gọi điện thoại và Gửi Email hoạt động thực tế:
  - Gọi điện: Cho phép click-to-call `tel:`, ghi chú nhật ký cuộc gọi và cập nhật trạng thái xử lý phản hồi.
  - Gửi Email: Cung cấp 3 mẫu email phản hồi chuyên nghiệp có sẵn (Cảm ơn 5 sao, Xử lý khiếu nại, Tặng voucher tri ân), soạn thảo nội dung và gửi phản hồi cho khách hàng.
* **Giải pháp đã thực hiện:**
  - Frontend (`Feedback.tsx`):
    - Xây dựng Modal Gọi điện (`callFeedback`): Hiển thị thông tin khách hàng, số điện thoại, nút bấm gọi nhanh `tel:`, dropdown kết quả gọi (Đã nghe máy, Hẹn gọi lại, Không bắt máy), ô ghi chú biên bản cuộc gọi và nút lưu cập nhật trạng thái thành "Đã xử lý".
    - Xây dựng Modal Gửi Email (`emailFeedback`): Hiển thị địa chỉ email người nhận, 3 nút chọn nhanh mẫu email tự động điền nội dung, vùng soạn thảo email và nút bấm xác nhận gửi.
    - Backend: API `PATCH /api/PhanHoi/{id}/trang-thai` lưu trạng thái và ghi chú xử lý vào CSDL.
* **Kết quả test:**
  - Bấm nút Gọi trên một phản hồi -> Modal Gọi điện mở ra với SĐT khách hàng, bấm "Lưu nhật ký" -> Trạng thái phản hồi đổi sang "Đã phản hồi".
  - Bấm nút Email -> Modal Soạn Email mở ra, bấm chọn mẫu "Xử lý khiếu nại" -> Tiêu đề và nội dung tự động điền sẵn, bấm "Gửi email" -> Hiển thị thông báo gửi thành công và đóng popup.

#### 7. ĐG07 – Thêm chức năng nhắn tin Khách hàng trực tiếp trên Web (Nâng cấp Realtime 2 chiều hoàn chỉnh)
* **Mô tả lỗi:** Thiếu kênh trao đổi và nhắn tin trực tiếp giữa khách hàng và nhân viên hỗ trợ chăm sóc khách hàng (CSKH) của showroom trên website. Đồng thời, lỗi hai bên không thấy tin nhắn của nhau khi mở ở các tab hoặc trình duyệt khác nhau.
* **Nguyên nhân cốt lõi phát hiện:**
  - Sự kiện `CustomEvent` (`crm-chat-update`) chỉ phát tán trong cùng một cửa sổ/tab đơn lẻ, không thể giao tiếp giữa các tab hoặc giữa các trình duyệt khác nhau.
  - Phía Admin chỉ có thể mở chat khi bấm vào 1 khách hàng cụ thể trong bảng Feedback, không có trung tâm điều khiển Live Chat tổng thể để thấy các cuộc gọi/tin nhắn mới từ khách hàng vãng lai.
  - Thiếu cơ chế polling định kỳ để kéo tin nhắn mới từ máy chủ backend về giao diện khi không tải lại trang.
* **Kết quả mong đợi:** Khách hàng và Admin nhắn tin qua lại trực tuyến nhìn thấy tin nhắn của nhau ngay lập tức trong thời gian thực (0s qua BroadcastChannel hoặc tối đa 2s qua Polling), hoạt động ổn định kể cả khi mở ở nhiều tab hoặc trình duyệt khác nhau.
* **Giải pháp đã thực hiện:**
  - **Đồng bộ đa tầng Realtime:**
    1. **Tầng 1 (BroadcastChannel):** Sử dụng `new BroadcastChannel('crm_live_chat_channel')` giúp truyền tin nhắn tức thì (0ms) giữa tab Khách hàng và tab Admin trên cùng trình duyệt.
    2. **Tầng 2 (Storage Event):** Dự phòng lắng nghe sự kiện `storage` khi `localStorage` được ghi nhận tin nhắn mới.
    3. **Tầng 3 (HTTP Polling 2s):** Cả phía Khách hàng (`CustomerLayout.tsx`), trang Admin Phản hồi (`Feedback.tsx`) và Trung tâm Chat Admin (`AdminLayout.tsx`) đều kích hoạt polling ngầm mỗi 2 giây gọi `GET /api/PhanHoi/messages`, đảm bảo nhận tin nhắn ngay cả khi dùng 2 trình duyệt độc lập (Chrome, Edge, Incognito, điện thoại).
  - **Backend (`PhanHoiController.cs`):**
    - Bổ sung cơ chế lưu trữ bền vững tin nhắn chat vào file `chat_history.json` trên máy chủ, không bị mất lịch sử chat khi khởi động lại server.
    - Cung cấp API `GET /api/PhanHoi/conversations` tổng hợp danh sách các phiên hội thoại của từng khách hàng kèm tin nhắn cuối và thời gian gửi.
    - API `GET /api/PhanHoi/messages` và `POST /api/PhanHoi/messages` hỗ trợ trao đổi hai chiều theo từng mã khách hàng.
  - **Giao diện Khách hàng (`CustomerLayout.tsx`):**
    - Tích hợp Floating Live Chat Widget ở góc dưới bên phải màn hình:
      * Tự động nhận diện tài khoản đang đăng nhập hoặc khách vãng lai.
      * Tự động cuộn xuống cuối (`scrollIntoView`) khi có tin nhắn mới.
      * Huy hiệu đếm số tin nhắn CSKH chưa đọc khi hộp chat đang đóng.
      * Tự động cập nhật tin nhắn của Admin gửi đến trong thời gian thực.
  - **Giao diện Quản trị (`AdminLayout.tsx` & `Feedback.tsx`):**
    - `AdminLayout.tsx`: Bổ sung nút **"💬 Live Chat CSKH"** trên thanh Header trên cùng (cạnh chuông thông báo) với chấm xanh trực tuyến và huy hiệu tin nhắn mới.
    - Khi bấm mở: Hiển thị **Trung tâm CSKH trực tuyến (Live Chat Console)** 2 cột chuyên nghiệp:
      * Cột trái: Danh sách toàn bộ khách hàng đang chat, có thanh tìm kiếm, ảnh đại diện, tin nhắn gần nhất và thời gian.
      * Cột phải: Khung chat chi tiết với khách hàng đang chọn, lịch sử tin nhắn hai bên, nút gợi ý trả lời nhanh và ô soạn tin nhắn gửi đi.
    - `Feedback.tsx`: Nút "Nhắn tin" trên từng dòng phản hồi cũng được đồng bộ cơ chế Realtime Polling + BroadcastChannel tương tự.
* **Kết quả test:**
  - Mở tab 1 (Giao diện Khách hàng) và tab 2 (Giao diện Admin):
    * Khách hàng gửi tin: *"Chào showroom, tôi muốn hỏi lịch bảo dưỡng xe SH160i"* -> Bên Admin ngay lập tức xuất hiện tin nhắn trong khung chat (0s), có thông báo toast góc màn hình.
    * Admin bấm trả lời: *"Dạ chào anh An, showroom có lịch trống ngày mai lúc 9h ạ!"* -> Bên Khách hàng lập tức hiện bong bóng tin nhắn của tư vấn viên.
    * Hai bên trò chuyện qua lại mượt mà, không cần F5 hay tải lại trang.

#### 8. ĐG08 – Lỗi đánh giá không hiển thị rõ sản phẩm
* **Mô tả lỗi:** Trong danh sách đánh giá của Admin và Khách hàng, các đánh giá không hiển thị rõ khách hàng đang đánh giá sản phẩm hay xe máy nào, khó phân biệt giữa phụ tùng và xe mẫu.
* **Kết quả mong đợi:** Hiển thị chi tiết và trực quan thẻ thông tin sản phẩm được đánh giá (ảnh thumbnail, huy hiệu phân loại 📦 Phụ tùng / 🏍️ Xe máy, mã SKU/Mã xe và tên đầy đủ của sản phẩm).
* **Giải pháp đã thực hiện:**
  - Backend: Truy vấn SQL liên kết `PHU_TUNG` và `SAN_PHAM_XE` để trả về đầy đủ tên phụ tùng, loại phụ tùng, tên xe, hãng xe, loại xe cho từng bản ghi phản hồi.
  - Frontend (`Feedback.tsx`):
    - Thiết kế cột "Sản phẩm được đánh giá" riêng biệt và nổi bật:
      * Nếu là Phụ tùng: Badge xanh dương `📦 PHỤ TÙNG`, hiển thị tên phụ tùng chính hãng kèm mã phụ tùng và danh mục (Nhớt, Phanh, v.v.).
      * Nếu là Xe máy: Badge tím `🏍️ XE MÁY`, hiển thị tên mẫu xe, hãng xe (Honda, Yamaha,...) và phân khúc xe (Tay ga, Xe số,...).
      * Nếu là đánh giá dịch vụ chung: Badge xám `🏢 DỊCH VỤ SHOWROOM`.
* **Kết quả test:**
  - Tại trang Quản lý phản hồi (Admin): Mỗi dòng đánh giá đều có thẻ thông tin sản phẩm rõ ràng, nhận biết ngay lập tức khách hàng đang đánh giá phụ tùng nào hoặc xe máy nào.



### Nhóm chức năng: PHẢN HỒI & HỖ TRỢ TRỰC TUYẾN (Bổ sung hoàn thiện ĐG07)
- **Thời gian hoàn thành:** 04/10/2026 21:10
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100%

#### Hoàn thiện ĐG07 – Phân lập tuyệt đối hội thoại theo từng tài khoản khách hàng & Ẩn CSKH khi đăng xuất
* **Mô tả lỗi cũ:**
  - Tài khoản mặc định (`KH001` - Nguyễn Văn An) thì thấy tin nhắn, còn các tài khoản mới tạo (như `KH2002`, `KH2003`, `KH2004` hoặc tài khoản đăng ký mới) thì không thấy tin nhắn hoặc Admin không thấy được tin nhắn gửi từ tài khoản đó.
  - Khi bấm Đăng xuất, hộp thoại chat vẫn hiển thị và bị mặc định trở lại tài khoản của Nguyễn Văn An (`KH001`).
* **Kết quả mong đợi:**
  - Phải thấy được tin nhắn của từng tài khoản khách hàng gửi đến phía Admin.
  - Admin nhắn cho tài khoản nào thì chỉ tài khoản ấy mới thấy tin nhắn phản hồi.
  - Khi Đăng xuất: ẩn hoàn toàn khung chat và nút hỗ trợ trực tuyến CSKH; muốn dùng bắt buộc phải Đăng nhập.
* **Giải pháp đã thực hiện:**
  - **1. Chuẩn hóa định dạng Mã khách hàng (`formatCustomerId`):**
    - Viết hàm `formatCustomerId` trong `api.ts` chuẩn hóa nhất quán ID: ví dụ ID từ identity SQL Server `2004` -> `KH2004`, `1` -> `KH001`, `11` -> `KH011`.
    - Đồng bộ `formatCustomerId` trên toàn bộ luồng: đăng ký mới, đăng nhập, nạp danh sách khách hàng, gửi tin nhắn và nhận tin nhắn.
  - **2. Khóa bảo mật đăng nhập (`CustomerLayout.tsx`):**
    - Bọc nút và khung Live Chat Widget bằng điều kiện `{currentCustomer && (...)}`. Khi khách hàng đăng xuất (`currentCustomer = null`), nút chat CSKH biến mất hoàn toàn.
    - Xóa bỏ cơ chế gán ngầm khách vãng lai thành `KH001`.
    - Khi đăng xuất: tự động reset `chatOpen = false`, `chatMessages = []`, `unreadChatCount = 0` và hủy bỏ polling ngầm.
  - **3. Phân lập kênh chat 2 chiều giữa Admin và Khách hàng:**
    - `PhanHoiController.cs`:
      * `GetMessages`: lọc chính xác theo `CustomerId` (so khớp không phân biệt hoa thường và loại bỏ khoảng trắng).
      * `GetConversations`: nhóm theo từng mã khách hàng và tự động truy vấn tên thực tế từ bảng `KHACH_HANG` trong CSDL.
      * `SendMessage`: bắt buộc phải có `CustomerId`, lưu trữ bền vững vào `chat_history.json`.
    - `api.ts`:
      * `chatApi.getMessages`: trả về mảng rỗng `[]` đối với tài khoản mới chưa có tin nhắn, không tự ý gán tin nhắn mẫu của `KH001`.
      * `chatApi.sendMessage`: gửi đúng `customerId` của tài khoản đang đăng nhập, không fallback về `KH001`.
      * `chatApi.getConversations`: tự động kết hợp các hội thoại hiện có với toàn bộ khách hàng đã đăng ký (`customerApi.getAll()`), giúp Admin luôn thấy và chọn được bất kỳ tài khoản mới nào trong danh sách bên trái.
    - `AdminLayout.tsx`:
      * Cột bên trái hiển thị danh sách toàn bộ khách hàng (có tên, SĐT, mã KH). Khi có tin nhắn mới từ khách hàng nào, khách hàng đó sẽ nhảy lên đầu danh sách kèm huy hiệu số tin chưa đọc màu đỏ.
      * Admin nhấp vào khách hàng nào thì gửi tin nhắn phản hồi trực tiếp vào đúng mã khách hàng đó.
      * Tách biệt tin nhắn khi nhận qua `BroadcastChannel` và `Polling`: chỉ hiển thị tin nhắn trong khung chat nếu trùng với khách hàng đang được chọn.
    - `Feedback.tsx`:
      * Lọc tin nhắn đến theo đúng `chatFeedback.customerId`, không làm lẫn tin nhắn giữa các khách hàng khác nhau.
* **Kết quả test:**
  - Đăng xuất tài khoản khách hàng -> Nút hỗ trợ trực tuyến CSKH biến mất hoàn toàn khỏi màn hình.
  - Đăng nhập tài khoản mới (ví dụ `KH2004` - Nguyễn Tăng Gia Quý):
    * Khách hàng gửi: *"Em cần tư vấn nhớt Motul cho xe Winner X"*.
    * Phía Admin lập tức nhận được tin nhắn trong kênh `KH2004`, hiển thị đúng tên Nguyễn Tăng Gia Quý.
    * Admin phản hồi: *"Dạ chào anh Quý, nhớt Motul 7100 10W40 đang có sẵn tại showroom ạ!"*.
    * Phía khách hàng `KH2004` nhận được phản hồi ngay lập tức trong thời gian thực.
    * Kiểm tra tài khoản `KH001` (Nguyễn Văn An): không hề xuất hiện tin nhắn của `KH2004`, hoàn toàn phân lập 100%.


### Nhóm chức năng: QUẢN LÝ ĐÁNH GIÁ & PHẢN HỒI NÂNG CAO (ĐG09 - ĐG16)
- **Thời gian hoàn thành:** 04/10/2026 22:05
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100%

#### 1. ĐG09 – Cho phép khách hàng thêm hình ảnh hoặc video khi đánh giá sản phẩm
* **Mô tả lỗi:** Khách hàng chưa thể đính kèm hình ảnh hoặc video khi viết bài đánh giá phụ tùng hoặc mẫu xe trong showroom.
* **Kết quả mong đợi:** Cho phép KH thêm hình ảnh/video khi đánh giá sản phẩm. Hiển thị hình ảnh/video đính kèm trong danh sách đánh giá của Showroom xe, Cửa hàng phụ tùng và Trang quản lý phản hồi Admin, có popup lightbox phóng to xem ảnh sắc nét.
* **Giải pháp đã thực hiện:**
  - **Data Model & Backend DTO:**
    - Bổ sung trường `hinhAnhDinhKem?: string[]` trong `Feedback`, `ProductReview` (`mockData.ts`).
    - Bổ sung `public List<string>? HinhAnhDinhKem { get; set; } = new();` trong `PhanHoi`, `PhanHoiCreateDto`, `PhanHoiUpdateDto` (`PhanHoi.cs`).
    - `PhanHoiController.cs`: Lưu trữ và trả về danh sách `HinhAnhDinhKem` cho từng phản hồi trong API `GET`, `POST`, `PUT`.
  - **Giao diện Khách hàng (`VehiclesShowroom.tsx` & `PartsStore.tsx`):**
    - Bổ sung khối đính kèm media trực quan trong form gửi đánh giá: Cho phép nhập URL ảnh/video, có nút chọn ảnh chụp mẫu nhanh, hiển thị danh sách ảnh xem trước (thumbnails) kèm nút bấm xóa `✕` từng ảnh.
    - Hiển thị dải ảnh/video đính kèm trong từng thẻ đánh giá của khách hàng.
    - Tích hợp Modal Lightbox: Bấm vào ảnh bất kỳ để phóng to xem chi tiết ở độ phân giải cao kèm nút đóng `✕`.
  - **Giao diện Admin (`Feedback.tsx`):**
    - Hiển thị bộ sưu tập hình ảnh/video đính kèm trong thẻ chi tiết phản hồi với nhãn `📸 Hình ảnh & Video đính kèm:`.
    - Bấm vào ảnh thumbnail lập tức bật Modal Lightbox phóng to.
* **Kết quả test:**
  - Khách hàng đính kèm ảnh khi đánh giá xe SH hoặc nhớt Motul -> Ảnh lưu thành công và hiển thị ngay trên web.
  - Phía Admin: Thấy rõ ảnh đính kèm của khách hàng, click xem ảnh phóng to full màn hình.

#### 2. ĐG10 – Hiển thị thông tin nhân viên xử lý đánh giá sau khi xử lý
* **Mô tả lỗi:** Đánh giá sau khi được nhân viên giải quyết không hiển thị thông tin nhân viên phụ trách xử lý và ngày giờ xử lý, gây thiếu minh bạch trong quy trình chăm sóc khách hàng.
* **Kết quả mong đợi:** Sau khi xử lý hiển thị thông tin nhân viên xử lý đánh giá (`nhanVienXuLy`, `ngayXuLy`).
* **Giải pháp đã thực hiện:**
  - Thêm trường `nhanVienXuLy?: string` và `ngayXuLy?: string` trong data model Frontend và Backend (`PhanHoi.cs`).
  - Giao diện Admin (`Feedback.tsx`): Với các phản hồi có trạng thái "Đã xử lý" / "Đã phản hồi", hiển thị thẻ thông tin nhân viên phụ trách:
    * `👤 Nhân viên xử lý: [Tên chuyên viên CSKH]`
    * `📅 Ngày xử lý: [Ngày/tháng/năm]`
  - Backend (`PhanHoiController.cs`): API `PATCH /api/PhanHoi/{id}/trang-thai` nhận tên nhân viên xử lý từ client và tự động ghi nhận thời gian `DateTime.Now`, lưu trữ đồng bộ và trả về trong danh sách phản hồi.
* **Kết quả test:**
  - Bấm "Xác nhận đã xử lý" trên phản hồi -> Thẻ phản hồi lập tức hiển thị thông tin nhân viên xử lý: `Nguyễn Minh Tuấn (Chuyên viên CSKH)` kèm ngày xử lý hôm nay.

#### 3. ĐG11 – Xóa thông tin biển số xe trong phần đánh giá
* **Mô tả lỗi:** Đánh giá sản phẩm/xe lưu và hiển thị thông tin biển số xe không cần thiết, làm lộ thông tin cá nhân của chủ phương tiện.
* **Kết quả mong đợi:** Không cần lưu thông tin biển số xe trong phần đánh giá, chỉ hiển thị tên dòng xe thuần túy.
* **Giải pháp đã thực hiện:**
  - `mockData.ts`: Làm sạch dữ liệu `xeDangDung` trong `mockFeedbacks`, loại bỏ hoàn toàn các chuỗi biển số xe (vd: `(51K-123.45)` -> chỉ giữ lại tên xe `Honda SH 160i ABS`).
  - `api.ts`: Chuẩn hóa dữ liệu đầu vào và đầu ra bằng Regex: `.replace(/\s*\([^)]*\)/g, '').trim()`, đảm bảo thông tin biển số xe không bao giờ xuất hiện trong dữ liệu đánh giá.
  - `Feedback.tsx`: Loại bỏ nhãn biển số xe khỏi giao diện hiển thị xe đang sử dụng.
* **Kết quả test:**
  - Bảng đánh giá hiển thị tên dòng xe thuần túy (`Honda Lead 125cc`, `Honda SH 160i ABS`), hoàn toàn không còn thông tin biển số xe.

#### 4. ĐG12 – Thay khiếu nại thành đánh giá mới
* **Mô tả lỗi:** Giao diện quản lý phản hồi cũ có tab và mục xem chỉ tập trung vào "Khiếu nại", gây phân tách trải nghiệm và nhân viên khó theo dõi các đánh giá vừa được gửi đến.
* **Kết quả mong đợi:** Thay phần xem khiếu nại thành xem đánh giá mới, giúp nhân viên xem được toàn bộ đánh giá mới nhất và tiến hành xử lý kịp thời.
* **Giải pháp đã thực hiện:**
  - `Feedback.tsx`: Thay đổi tiêu đề tab chính từ "Khiếu nại & Phản hồi" thành `💬 Phản hồi & Đánh giá mới`.
  - Đánh dấu huy hiệu `✨ Đánh giá mới` nổi bật trên các đánh giá mới gửi để nhân viên nhận diện ngay lập tức.
  - Đồng bộ danh sách hiển thị theo thứ tự thời gian mới nhất lên đầu để tiện xử lý nhanh chóng.
* **Kết quả test:**
  - Tab hiển thị tên `💬 Phản hồi & Đánh giá mới`, các đánh giá mới nhất xuất hiện ngay trên đầu trang cho nhân viên tiếp nhận.

#### 5. ĐG13 – Nút xác nhận đã xử lý hoạt động được
* **Mô tả lỗi:** Nút "Đã xử lý" trong danh sách đánh giá của Admin trước đây chưa hoạt động hoặc bấm không cập nhật trạng thái.
* **Kết quả mong đợi:** Nút xác nhận đã xử lý hoạt động được, cập nhật trạng thái phản hồi sang "Đã xử lý" ngay lập tức không cần F5 tải lại trang.
* **Giải pháp đã thực hiện:**
  - `Feedback.tsx`: Cập nhật hàm `handleResolveQuick(f: Feedback)`:
    * Gọi `feedbackApi.resolve(f.id, undefined, 'Nguyễn Minh Tuấn (Chuyên viên CSKH)')`.
    * Cập nhật trực tiếp state `setFeedbacks(...)` chuyển `trangThai: 'DaXuLy'`, gán `nhanVienXuLy` và `ngayXuLy`.
    * Bật toast thông báo `✓ Đã cập nhật trạng thái phản hồi sang: Đã xử lý!`.
  - Backend: Endpoint `PATCH /api/PhanHoi/{id}/trang-thai` cập nhật trạng thái bản ghi trong CSDL.
* **Kết quả test:**
  - Bấm nút "✓ Xác nhận đã xử lý" -> Trạng thái đổi ngay sang badge xanh lá "Đã xử lý", hiển thị thẻ nhân viên xử lý tức thì không bị giật lag.

#### 6. ĐG14 – Thêm tìm kiếm theo tên sản phẩm, mã sản phẩm
* **Mô tả lỗi:** Nhân viên không thể nhớ tên từng khách hàng để tìm kiếm đánh giá, tìm kiếm bằng tên sản phẩm hoặc mã SKU sản phẩm sẽ hiệu quả và tiện dụng hơn.
* **Kết quả mong đợi:** Nhân viên có thể tìm kiếm đánh giá theo tên sản phẩm, tên xe và mã sản phẩm.
* **Giải pháp đã thực hiện:**
  - `Feedback.tsx`: Mở rộng điều kiện lọc tìm kiếm kiểm tra đồng thời:
    * `productName` (Tên phụ tùng hoặc mẫu xe)
    * `productId` (Mã SKU: `PT001`, `XM001`,...)
    * `xeDangDung` (Dòng xe)
    * `hoTen` (Họ tên khách hàng)
    * `noiDung` (Nội dung đánh giá)
  - Áp dụng tìm kiếm tiếng Việt không dấu (`removeVietnameseTones`) và chuẩn hóa khoảng trắng.
  - Cập nhật placeholder ô tìm kiếm: `"🔍 Tìm theo tên khách hàng, nội dung, tên sản phẩm, mã SP (SKU)..."`.
* **Kết quả test:**
  - Gõ `PT001` hoặc `Motul` -> Danh sách lọc ra chính xác đánh giá của Nhớt Motul 7100.
  - Gõ `Lead` hoặc `SH` -> Danh sách lọc ra đúng các đánh giá của các dòng xe tương ứng.

#### 7. ĐG15 – Chỉnh lại chức năng lọc phân loại ("Khiếu nại" thành "Đánh giá mới")
* **Mô tả lỗi:** Dropdown bộ lọc "Phân loại" còn tùy chọn "Khiếu nại", chưa phù hợp với định hướng quản lý tập trung đánh giá mới.
* **Kết quả mong đợi:** Chỉnh lại chức năng lọc "Phân loại", thay "Khiếu nại" thành "Đánh giá mới".
* **Giải pháp đã thực hiện:**
  - `Feedback.tsx`:
    * Trong dropdown bộ lọc "Phân loại": Thay thế tùy chọn `⚠️ Khiếu nại` thành `✨ Đánh giá mới` (`value="DanhGiaMoi"`).
    * Logic lọc: Khi chọn "Đánh giá mới", hệ thống tự động lọc các đánh giá đang có trạng thái `ChoXuLy` hoặc các đánh giá mới gửi vào hệ thống.
* **Kết quả test:**
  - Mở dropdown Phân loại -> Thấy tùy chọn "✨ Đánh giá mới".
  - Chọn tùy chọn này -> Hệ thống lọc chính xác các đánh giá mới nhất đang chờ nhân viên xử lý.

#### 8. ĐG16 – Giới hạn ký tự trong 1 lần đánh giá (Không quá 200 từ, chống spam)
* **Mô tả lỗi:** Form gửi đánh giá chưa giới hạn độ dài nội dung, dẫn đến nguy cơ khách hàng gửi bài quá dài hoặc spam văn bản rác.
* **Kết quả mong đợi:** Mỗi lần đánh giá không quá 200 từ, hiển thị bộ đếm từ trực quan và cảnh báo chống spam.
* **Giải pháp đã thực hiện:**
  - Tạo hàm đếm từ chuẩn `countWords(text)` trong `mockData.ts`: `.trim().split(/\s+/).filter(Boolean).length`.
  - **Frontend (`VehiclesShowroom.tsx` & `PartsStore.tsx`):**
    * Hiển thị bộ đếm từ trực quan thời gian thực: `${wordCount}/200 từ`.
    * Chuyển màu cam khi trên 180 từ; chuyển màu đỏ và hiển thị cảnh báo đỏ khi vượt quá 200 từ: `"⚠️ Nội dung đã vượt quá 200 từ! Vui lòng rút gọn để tránh tình trạng spam."`.
    * Vô hiệu hóa nút gửi đánh giá (`disabled={wordCount > 200 || wordCount === 0}`) khi vượt quá giới hạn.
  - **Backend (`PhanHoiController.cs`):**
    * Cả 2 API `POST /api/PhanHoi` và `PUT /api/PhanHoi/{id}` đều kiểm tra độ dài từ:
      `dto.NoiDung.Trim().Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length > 200`.
    * Nếu vượt quá 200 từ, lập tức trả về `400 Bad Request` kèm thông báo chi tiết: `"Đánh giá không được vượt quá 200 từ (Hiện tại: {wordCount} từ) nhằm đảm bảo chất lượng và phòng chống spam!"`.
* **Kết quả test:**
  - Nhập dưới 200 từ: Bộ đếm nhảy số chính xác, gửi đánh giá thành công.
  - Nhập 205 từ trên giao diện: Bộ đếm đổi sang màu đỏ thẫm, hiện cảnh báo spam, nút bấm gửi bị vô hiệu hóa.
  - Gửi request trực tiếp 205 từ vào backend: Backend phản hồi lỗi 400 và chặn lưu vào CSDL.

#### Bổ sung hoàn thiện ĐG10 – Đồng bộ tên nhân viên xử lý đánh giá theo đúng tài khoản đăng nhập
* **Mô tả lỗi:**
  - Tên nhân viên xử lý đánh giá trước đây bị gán tĩnh là `"Nguyễn Minh Tuấn (Chuyên viên CSKH)"` (nhân viên không tồn tại trong danh sách tài khoản nhân sự).
  - Khi nhân viên đăng nhập bằng các tài khoản khác nhau (ví dụ: `admin@motoshop.vn` - Trần Văn Quản Lý, `anhnguyen@motoshop.vn` - Nguyễn Thị Ánh, `hoangtran@motoshop.vn` - Trần Minh Hoàng, `nguyen.thanh67@gmail.com` - Nguyễn Văn Thành, v.v.), khi bấm "Xác nhận đã xử lý" hoặc ghi nhận cuộc gọi/email, hệ thống vẫn ghi nhận tên cứng cũ thay vì tên của tài khoản nhân viên đang thao tác.
* **Kết quả mong đợi:** Tên nhân viên xử lý đánh giá phải lấy chính xác và tự động theo thông tin của tài khoản nhân viên đang đăng nhập trên hệ thống CRM.
* **Giải pháp đã thực hiện:**
  - **1. Truyền và đồng bộ ngữ cảnh tài khoản nhân sự (`App.tsx` & `Feedback.tsx`):**
    - Truyền prop `currentStaff={currentStaff}` từ `App.tsx` vào `FeedbackPage`.
    - Xây dựng state `activeStaff` và hàm helper `getStaffHandlingName()` trong `Feedback.tsx`:
      * Ưu tiên lấy từ `currentStaff` prop.
      * Tự động đồng bộ và fallback sang `localStorage.getItem('crm_current_staff')` và lắng nghe sự kiện `storage` khi đổi tài khoản trên trình duyệt.
      * Định dạng chuẩn chỉnh: `[Họ tên nhân viên] ([Chức vụ])`.
  - **2. Đồng bộ các thao tác xử lý đánh giá:**
    - Hàm `resolveFeedback(id)`: Lấy trực tiếp `staffName = getStaffHandlingName()`, gửi lên backend qua API `PATCH /api/PhanHoi/{id}/trang-thai` và cập nhật state hiển thị ngay lập tức.
    - Hàm `handleSaveCallLog()`: Lưu cuộc gọi và tự động gán tên nhân viên đang thực hiện cuộc gọi.
    - Hàm `handleSendEmail()`: Gửi email phản hồi và tự động gán tên nhân viên phụ trách gửi email.
  - **3. Hiển thị thông tin trực quan trên giao diện Admin:**
    - Thêm huy hiệu nhận diện trên Header trang Quản lý phản hồi: `👤 Nhân viên đang xử lý: [Tên nhân viên] ([Chức vụ])` có chấm xanh trực tuyến.
    - Thẻ phản hồi đã xử lý hiển thị chính xác tên nhân viên đã xử lý theo đúng tài khoản.
    - Nút "Xác nhận đã xử lý" hiển thị tooltip rõ ràng: `Xác nhận đã tiếp nhận và hoàn tất xử lý bởi: [Tên nhân viên]`.
  - **4. Backend (`PhanHoiController.cs`) & API (`api.ts`):**
    - API `PATCH /api/PhanHoi/{id}/trang-thai` nhận giá trị `nhanVienXuLy` gửi từ client và lưu trữ bền vững.
    - Làm sạch và đồng bộ lại toàn bộ dữ liệu mẫu trong `mockData.ts` và backend, liên kết chuẩn 100% với các tài khoản trong `mockStaffAccounts` (`ST000`, `ST001`, `ST002`, `ST003`, `ST008`...).
* **Kết quả test:**
  - Đăng nhập bằng tài khoản `anhnguyen@motoshop.vn` (Nguyễn Thị Ánh - Chuyên viên Tư vấn Bán hàng):
    * Bấm "Xác nhận đã xử lý" trên phản hồi -> Thẻ phản hồi lập tức hiển thị: `👤 Nhân viên xử lý: Nguyễn Thị Ánh (Chuyên viên Tư vấn Bán hàng)`.
  - Đăng nhập bằng tài khoản `admin@motoshop.vn` (Trần Văn Quản Lý - Giám đốc Showroom):
    * Bấm "Xác nhận đã xử lý" -> Thẻ phản hồi hiển thị: `👤 Nhân viên xử lý: Trần Văn Quản Lý (Giám đốc Showroom)`.
  - Toàn bộ lịch sử cuộc gọi và gửi email cũng đồng bộ chính xác theo tài khoản nhân viên đang thao tác.

### Nhóm chức năng: KHẢO SÁT Ý KIẾN KHÁCH HÀNG (KS01 - KS08)
- **Thời gian hoàn thành:** 04/10/2026 23:15
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100%

#### 1. KS01 – Khung cảm ơn khảo sát tự động đóng
* **Mô tả lỗi:** Khi khách hàng gửi câu trả lời khảo sát, hệ thống hiển thị một khung cảm ơn cố định ("🎉 Đã hoàn thành cuộc khảo sát!") chiếm diện tích lớn, không tự đóng và không có nút đóng. Nếu khách hàng làm nhiều khảo sát thì các khung này xếp chồng vĩnh viễn gây chật chội màn hình.
* **Kết quả mong đợi:** Khung cảm ơn chỉ hiển thị tạm thời với bộ đếm ngược tự đóng sau 4 giây hoặc bấm nút ✕ để tắt ngay; không tạo thêm khung vĩnh viễn gây chật màn hình; lịch sử khảo sát đã làm được thu gọn gàng.
* **Giải pháp đã thực hiện:**
  - `CustomerDashboard.tsx`: Thay thế khung cảm ơn tĩnh bằng banner thông báo `surveyToast` nổi bật với icon ăn mừng `🎉 CẢM ƠN BẠN ĐÃ GỬI PHẢN HỒI KHẢO SÁT!`.
  - Hiển thị badge đếm ngược thời gian: `⏱ Tự đóng sau {surveyToast.countdown}s`.
  - Tích hợp nút `✕` cho phép khách hàng đóng ngay lập tức nếu muốn.
  - Sử dụng hook `useEffect` và `setInterval` tự động đếm ngược từ 4 giây về 0 và tự hủy banner.
  - Chuyển các khảo sát đã hoàn thành xuống mục accordion thu gọn `LỊCH SỬ KHẢO SÁT ĐÃ HOÀN THÀNH ({doneSurveys.length})` ở cuối tab, giúp khách hàng bấm xem lại khi cần mà không chiếm diện tích làm việc chính.
* **Kết quả test:**
  - Nộp bài khảo sát -> Banner cảm ơn màu xanh lá xuất hiện đẹp mắt, hiển thị đếm ngược 4s, 3s, 2s, 1s và tự đóng mượt mà.
  - Bấm nút `✕` -> Banner tắt ngay lập tức.
  - Màn hình thông thoáng, không còn hiện tượng khung thẻ bất tử bị xếp chồng.

#### 2. KS02 – Hiển thị đầy đủ danh sách bài khảo sát đang phát hành
* **Mô tả lỗi:** Khách hàng đăng nhập chỉ thấy 1 bài khảo sát thay vì thấy toàn bộ các bài khảo sát đang được phát hành trên hệ thống (như KS001, KS002...).
* **Kết quả mong đợi:** Khách hàng thấy danh sách đầy đủ tất cả các bài khảo sát đang phát hành mà mình đủ điều kiện tham gia, có thể làm lần lượt từng bài.
* **Giải pháp đã thực hiện:**
  - `mockData.ts`: Chuẩn hóa dữ liệu `mockSurveys`, đảm bảo các bài khảo sát đang phát hành (`KS001` - Dịch vụ bảo dưỡng, `KS002` - Nhu cầu mua xe Honda SH 160i) có cấu hình `targetCustomerId: 'ALL'`, `targetCustomerTier: 'ALL'`, trạng thái `DangDienRa`.
  - `CustomerDashboard.tsx`: Mở rộng điều kiện lọc khảo sát hợp lệ (`loadSurveys`):
    * Khảo sát gửi đích danh cho khách hàng: `s.targetCustomerId === customer.id || s.targetCustomerIds?.includes(customer.id)`.
    * Khảo sát gửi toàn hệ thống: `s.targetCustomerId === 'ALL'` kết hợp điều kiện phân hạng: `!s.targetCustomerTier || s.targetCustomerTier === 'ALL' || s.targetCustomerTier === custTier`.
  - Hiển thị huy hiệu số lượng bài cần làm: `Có {pendingSurveys.length} bài khảo sát cần làm`.
* **Kết quả test:**
  - Khách hàng đăng nhập vào tab Khảo sát -> Thấy danh sách đầy đủ các bài khảo sát khả dụng (`KS001`, `KS002`...).
  - Với tài khoản VIP: Thấy thêm khảo sát đặc quyền tri ân VIP (`KS003`).

#### 3. KS03 – Bổ sung mã khách hàng trong danh sách phản hồi khảo sát
* **Mô tả lỗi:** Trong modal thống kê kết quả khảo sát của Admin, danh sách khách hàng đã nộp bài chỉ hiển thị tên khách hàng mà không có mã khách hàng (Customer ID).
* **Kết quả mong đợi:** Bổ sung mã khách hàng (ví dụ: `Mã KH: KH001`) bên cạnh tên khách hàng trong bảng thống kê của Admin.
* **Giải pháp đã thực hiện:**
  - `mockData.ts` & `api.ts`: Đảm bảo mỗi bản ghi `SurveyResponse` luôn lưu trữ đầy đủ `customerId`, `customerName`, `submittedDate`.
  - `Feedback.tsx`: Trong mục "DANH SÁCH KHÁCH HÀNG ĐÃ THAM GIA" của Modal Thống kê kết quả:
    * Hiển thị huy hiệu Mã KH màu xanh nổi bật: `<span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">Mã KH: {r.customerId}</span>` ngay cạnh họ tên khách hàng `👤 {r.customerName}`.
    * Hiển thị ngày giờ nộp bài `📅 {formatSurveyDateTime(r.submittedDate)}` và số câu hỏi đã trả lời.
* **Kết quả test:**
  - Admin bấm "Xem thống kê kết quả" bài KS001 -> Thấy danh sách người tham gia hiển thị rõ ràng: `Mã KH: KH001 👤 Nguyễn Văn An`, `Mã KH: KH002 👤 Trần Thị Bình`...

#### 4. KS04 – Bắt buộc chọn đáp án tất cả câu hỏi trước khi gửi khảo sát
* **Mô tả lỗi:** Khách hàng chưa chọn đáp án hoặc chỉ chọn một vài câu hỏi vẫn có thể bấm nút gửi khảo sát, dẫn đến dữ liệu khảo sát bị thiếu sót.
* **Kết quả mong đợi:** Bắt buộc khách hàng chọn đủ đáp án cho tất cả câu hỏi trước khi gửi; cảnh báo rõ ràng và đánh dấu câu hỏi còn thiếu.
* **Giải pháp đã thực hiện:**
  - `CustomerDashboard.tsx`: Trong hàm `handleSubmitSurvey`:
    * Kiểm tra danh sách câu hỏi chưa trả lời: `const missing = survey.questions.filter(q => !sAnswers[q.id] || !sAnswers[q.id].trim()).map(q => q.id);`.
    * Nếu còn câu hỏi thiếu (`missing.length > 0`):
      - Chặn hoàn toàn thao tác gửi khảo sát.
      - Hiển thị thông báo lỗi màu đỏ: `"⚠️ Vui lòng hoàn thành tất cả câu hỏi trước khi gửi khảo sát! (Còn thiếu {missing.length}/{survey.questions.length} câu)"`.
      - Đánh dấu nổi bật câu hỏi còn thiếu bằng viền đỏ dày `border-2 border-red-500 bg-red-50/40` và huy hiệu đỏ `⚠️ Chưa chọn đáp án`.
      - Tự động cuộn trang (`scrollIntoView`) tới câu hỏi chưa trả lời đầu tiên để khách hàng bổ sung ngay.
    * Khi khách hàng bấm chọn đáp án, hệ thống tự động gỡ bỏ cảnh báo đỏ của câu hỏi đó.
    * Nút gửi câu trả lời hiển thị tiến độ thời gian thực: `GỬI CÂU TRẢ LỜI KHẢO SÁT ({answeredCount}/{total} CÂU)`.
* **Kết quả test:**
  - Để trống 1 câu rồi bấm Gửi -> Bị chặn lại ngay, câu hỏi bị viền đỏ và màn hình tự cuộn đến câu hỏi đó kèm cảnh báo lỗi.
  - Chọn đủ tất cả đáp án -> Nút gửi chuyển trạng thái sẵn sàng và gửi thành công 100%.

#### 5. KS05 – Chọn và lọc đối tượng khảo sát đa dạng
* **Mô tả lỗi:** Form tạo khảo sát của Admin chỉ có 1 ô chọn đơn giản hoặc không cho lọc đối tượng theo phân khúc khách hàng hay chọn nhiều khách hàng cùng lúc.
* **Kết quả mong đợi:** Cho phép Admin chọn đối tượng khảo sát linh hoạt: Tất cả khách hàng, lọc theo Hạng thành viên (VIP, Thân thiết, Phổ thông, Mới), hoặc chọn nhiều khách hàng cụ thể (checklist multi-select có tìm kiếm).
* **Giải pháp đã thực hiện:**
  - `Feedback.tsx`: Thiết kế lại khối "Đối tượng nhận khảo sát (KS05)" trong modal Tạo khảo sát với 3 chế độ:
    1. **Tất cả khách hàng (ALL):** Phát hành rộng rãi tới toàn bộ khách hàng trên hệ thống.
    2. **Theo Hạng hội viên (TIER):** Dropdown lọc theo Hạng thành viên (Tất cả, VIP ≥ 10tr, Thân thiết 4tr-10tr, Phổ thông < 4tr, Khách mới 0đ). Hiển thị số lượng khách hàng thuộc từng hạng theo thời gian thực.
    3. **Chọn nhiều KH cụ thể (CUSTOM):**
       - Ô tìm kiếm khách hàng tức thì theo tên, số điện thoại, mã khách hàng.
       - Nút tiện ích "Chọn tất cả" và "Bỏ chọn".
       - Danh sách checkbox dạng cuộn với đầy đủ thông tin: Checkbox, Mã KH, Họ tên, SĐT, Badge hạng hội viên.
       - Huy hiệu đếm số lượng: `Đã chọn: X KH`.
  - `api.ts`: API `surveyApi.create()` lưu trữ đầy đủ `targetCustomerTier`, `targetCustomerIds`, `targetCustomerId`.
* **Kết quả test:**
  - Admin tạo khảo sát chọn Hạng VIP -> Chỉ khách hàng có tổng chi tiêu ≥ 10 triệu mới thấy bài khảo sát.
  - Admin tìm kiếm và tích chọn 2 khách hàng cụ thể (`KH001`, `KH003`) -> Bài khảo sát gửi đúng tới 2 tài khoản này.

#### 6. KS06 – Bổ sung thời gian khảo sát (Bắt đầu và Kết thúc)
* **Mô tả lỗi:** Bài khảo sát thiếu thông tin thời gian bắt đầu (`startDate`) và thời gian kết thúc (`endDate`), người dùng không biết thời hạn của cuộc khảo sát.
* **Kết quả mong đợi:** Bổ sung trường thời gian bắt đầu và kết thúc; hiển thị rõ ràng trên thẻ khảo sát cả phía Admin và Khách hàng.
* **Giải pháp đã thực hiện:**
  - `mockData.ts`: Bổ sung `startDate?: string` và `endDate?: string` vào interface `Survey`.
  - Xây dựng hàm tiện ích `formatSurveyDateTime(dtStr)` định dạng ngày giờ chuẩn Việt Nam: `DD/MM/YYYY HH:mm`.
  - Form tạo khảo sát Admin: Bổ sung 2 trường chọn ngày giờ `datetime-local`: "Bắt đầu khảo sát (Start)" và "Kết thúc khảo sát (End)".
  - Hiển thị thông tin thời gian trên từng thẻ khảo sát:
    * Thẻ Admin: `📅 Thời gian KS: DD/MM/YYYY HH:mm - DD/MM/YYYY HH:mm`.
    * Thẻ Khách hàng: `📅 Thời gian: DD/MM/YYYY HH:mm - DD/MM/YYYY HH:mm` trong khung badge trực quan.
* **Kết quả test:**
  - Thẻ khảo sát hiển thị rõ ràng khoảng thời gian hiệu lực, giúp khách hàng nắm rõ thời hạn phản hồi.

#### 7. KS07 – Cài đặt thời gian đăng khảo sát
* **Mô tả lỗi:** Admin không thể lên lịch công bố bài khảo sát trước, bài tạo ra lập tức phát hành mà không có tính năng hẹn giờ đăng.
* **Kết quả mong đợi:** Cho phép Admin thiết lập thời gian bài khảo sát được đăng lên hệ thống (`publishDate`).
* **Giải pháp đã thực hiện:**
  - Bổ sung trường `publishDate?: string` vào model `Survey`.
  - Form tạo khảo sát Admin: Bổ sung ô nhập `datetime-local`: "Ngày giờ đăng (Publish Date)".
  - Logic kiểm soát: Nếu Admin đặt `publishDate` trong tương lai, khảo sát sẽ tự động ở trạng thái `Bản nháp (Nhap)` và chưa mở cho khách hàng làm trước thời điểm đăng.
  - Trên thẻ khảo sát Admin: Hiển thị `🚀 Ngày đăng: DD/MM/YYYY HH:mm`.
* **Kết quả test:**
  - Admin đặt ngày đăng vào tuần sau -> Bài khảo sát lưu thành công ở trạng thái Bản nháp, phía khách hàng chưa thấy bài này.

#### 8. KS08 – Tự động cập nhật trạng thái khảo sát thời gian thực
* **Mô tả lỗi:** Trạng thái bài khảo sát bị gán cứng, không tự động chuyển đổi theo tiến trình thời gian thực tế.
* **Kết quả mong đợi:** Tự động tính toán và cập nhật trạng thái theo 4 giai đoạn vòng đời: Nháp -> Sắp diễn ra -> Đang diễn ra -> Đã kết thúc.
* **Giải pháp đã thực hiện:**
  - Xây dựng hàm `computeSurveyStatus(survey: Survey)` trong `mockData.ts`:
    * Nếu thời gian hiện tại `< survey.publishDate` $\to$ Trả về `Nhap` (Bản nháp).
    * Nếu thời gian hiện tại `< survey.startDate` $\to$ Trả về `SapDienRa` (Sắp diễn ra).
    * Nếu thời gian hiện tại `> survey.endDate` $\to$ Trả về `DaKetThuc` (Đã kết thúc).
    * Ngược lại $\to$ Trả về `DangDienRa` (Đang diễn ra).
  - Cấu hình màu sắc huy hiệu chuẩn `surveyStatusLabels`:
    * `DangDienRa`: Xanh lá (`#ecfdf5`, viền `#a7f3d0`, chữ `#047857`)
    * `SapDienRa`: Vàng cam (`#fffbeb`, viền `#fde68a`, chữ `#b45309`)
    * `DaKetThuc`: Xám tro (`#f4f4f5`, viền `#e4e4e7`, chữ `#52525b`)
    * `Nhap`: Xanh lam (`#eff6ff`, viền `#bfdbfe`, chữ `#1d4ed8`)
  - `surveyApi.getAll()`: Tự động tính lại trạng thái thời gian thực cho từng khảo sát mỗi khi truy vấn.
  - Giao diện Admin:
    * Thêm thanh tab lọc trạng thái: `Tất cả ({total})`, `🟢 Đang diễn ra ({count})`, `🟡 Sắp diễn ra ({count})`, `⚪ Đã kết thúc ({count})`, `🔵 Bản nháp ({count})`.
    * Từng thẻ khảo sát hiển thị chấm tròn màu và tên trạng thái trực quan.
  - Giao diện Khách hàng:
    * Tự động kiểm tra trạng thái khi nộp bài: Khóa gửi câu trả lời nếu khảo sát chưa mở hoặc đã kết thúc kèm thông báo giải thích cụ thể.
* **Kết quả test:**
  - Khảo sát quá hạn (ví dụ KS004) -> Tự động chuyển sang "Đã kết thúc" màu xám.
  - Khảo sát tương lai (ví dụ KS003) -> Tự động hiển thị "Sắp diễn ra" màu vàng cam.
  - Khảo sát hiện hành (KS001, KS002) -> Hiển thị "Đang diễn ra" màu xanh lá, cho phép nộp câu trả lời bình thường.


### Nhóm chức năng: PHỤ TÙNG, ĐẶT LỊCH, XE KHÁCH HÀNG, ĐƠN HÀNG, XE MẪU (TC12, LH01, LH02, TC13, ĐH01, ĐH02, XM01)
- **Thời gian hoàn thành:** 05/10/2026 00:45
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100% (TypeScript: 0 lỗi)

#### 1. TC12 – Phân trang 20 sản phẩm/trang tại Cửa hàng phụ tùng
* **Mô tả yêu cầu:** Danh sách sản phẩm phụ tùng tại trang Cửa hàng cần được phân trang với mỗi trang tối đa 20 sản phẩm.
* **Giải pháp đã thực hiện:**
  - `PartsStore.tsx`: Khai báo hằng số `ITEMS_PER_PAGE = 20`, state `currentPage` tự động reset về trang 1 mỗi khi thay đổi bộ lọc hoặc từ khóa tìm kiếm.
  - Cắt mảng `paginatedParts = filtered.slice((currentPage - 1) * 20, currentPage * 20)`.
  - Bổ sung thanh điều hướng phân trang đầy đủ tính năng: nút "« Đầu", "‹ Trước", danh sách số trang có highlight trang hiện tại, "Sau ›", "Cuối »" và tự động cuộn lên đầu danh sách sản phẩm.

#### 2. LH01 – Quy tắc ngăn người dùng đặt lịch khi chưa đăng nhập
* **Mô tả lỗi:** Khách chưa đăng nhập tài khoản vẫn có thể gửi form đặt lịch hẹn hoặc tự động tạo tài khoản ngầm.
* **Giải pháp đã thực hiện:**
  - `ServiceBooking.tsx`: Kiểm tra `if (!currentCustomer)`.
  - Hiển thị banner cảnh báo nổi bật màu vàng hổ phách: *"BẠN CHƯA ĐĂNG NHẬP TÀI KHOẢN - Quy định: Vui lòng đăng nhập để hệ thống lưu lịch hẹn và quản lý thông tin phương tiện"*.
  - Nút submit chuyển thành nút kêu gọi *"🔒 VUI LÒNG ĐĂNG NHẬP ĐỂ ĐẶT LỊCH HẸN"*, bấm vào sẽ kích hoạt popup đăng nhập toàn cục (`crm-open-login`).
  - Hàm `handleSubmit` chặn và cảnh báo nếu chưa đăng nhập.

#### 3. LH02 – Lưu lịch hẹn vào BE và reset sạch form khi đặt lịch khác
* **Mô tả yêu cầu:** Lịch hẹn phải được lưu vào CSDL Backend; khi bấm "ĐẶT LỊCH KHÁC" từ màn hình thành công, form phải được làm mới hoàn toàn.
* **Giải pháp đã thực hiện:**
  - `ServiceBooking.tsx`: Gọi `appointmentApi.create(...)` gửi dữ liệu lên API Backend, lưu vào bộ nhớ cache và cập nhật trạng thái.
  - Xây dựng hàm `handleResetForm()`: reset `date = ''`, `time = ''`, `form.ghiChu = ''`, `form.tenXe = ''`, `form.bienSo = ''`, `submitted = false`.

#### 4. TC13 – Đăng ký xe mới chuyển trạng thái Chờ duyệt
* **Mô tả yêu cầu:** Khách hàng tự đăng ký phương tiện của mình -> chuyển sang trạng thái `ChoDuyet` chờ cửa hàng kiểm tra và xác thực.
* **Giải pháp đã thực hiện:**
  - `mockData.ts`: Bổ sung `trangThaiDuyet?: 'ChoDuyet' | 'DaDuyet' | 'TuChoi'` vào interface `Vehicle`.
  - `api.ts`: Bổ sung `vehicleApi.registerVehicle()` gán `trangThaiDuyet = 'ChoDuyet'`, lưu vào `crm_customer_vehicles` và gửi thông báo cho Admin qua Trung tâm thông báo.
  - `CustomerDashboard.tsx`: Hiển thị huy hiệu `⏳ Chờ cửa hàng kiểm tra & duyệt thông tin xe` trên thẻ xe và icon đồng hồ cát trên danh sách chọn xe.

#### 5. ĐH01 – Thay đổi tình hình đơn hàng phía Admin và Khách hàng thấy tất cả đơn của mình theo thời gian thực
* **Mô tả yêu cầu:** Admin có thể thay đổi trạng thái đơn hàng (từ Đang giao sang Hoàn thành/Đã giao...); khách hàng phải thấy tất cả đơn hàng thuộc về mình theo thời gian thực.
* **Giải pháp đã thực hiện:**
  - `Sales.tsx`: Cho phép Admin cập nhật mọi trạng thái đơn hàng (`ChoDuyet`, `DangGiao`, `HoanThanh`, `DaHuy`), đồng bộ xuống Backend `PUT /api/DonHang/trang-thai/{maDon}`, lưu cache và phát sự kiện `crm-data-refresh`.
  - `CustomerDashboard.tsx`: Chuyển `myOrders` sang dạng reactive tải từ `orderApi.getAll()`, lắng nghe `crm-data-refresh`. Lọc chính xác mọi đơn theo `customerId`, mã số KH, số điện thoại hoặc họ tên.
  - Hiển thị banner tiến trình giao nhận thực tế: thông báo xe tải đang vận chuyển khi trạng thái là `DangGiao`, hoàn thành khi `HoanThanh`, chờ xác nhận khi `ChoDuyet`.

#### 6. ĐH02 – Sửa lỗi lọc đơn hàng admin khi cùng khoảng thời gian (cùng 1 ngày)
* **Mô tả lỗi:** Khi lọc đơn hàng với Từ ngày = Đến ngày (cùng 1 ngày), hệ thống bị lỗi so sánh giờ dẫn đến không hiển thị đơn hàng trong ngày đó.
* **Giải pháp đã thực hiện:**
  - `DonHangController.cs`: Cập nhật câu lệnh SQL dùng `CAST(d.NgayDat AS DATE) >= CAST(@FromDate AS DATE) AND CAST(d.NgayDat AS DATE) <= CAST(@ToDate AS DATE)`.
  - `Sales.tsx`: Bổ sung thanh lọc ngày có hỗ trợ Từ ngày, Đến ngày, các nút bấm lọc nhanh ("Hôm nay", "7 ngày qua", "30 ngày qua", "Tất cả") và xử lý so sánh chuỗi chuẩn ISO `YYYY-MM-DD` không bị lệch múi giờ.

#### 7. XM01 – Quản lý xe mẫu showroom (Sửa/Xóa bền vững kèm thông báo Toast)
* **Mô tả yêu cầu:** Admin sửa hoặc xóa xe mẫu showroom cập nhật thành công bền vững, có hiển thị Toast thông báo trực quan.
* **Giải pháp đã thực hiện:**
  - `api.ts` & `Vehicles.tsx`: Khởi tạo và đồng bộ mảng `initialVehicles` vào `localStorage` (`crm_catalog_vehicles`), gọi API Backend đồng thời cập nhật bộ nhớ cục bộ khi thêm/sửa/xóa.
  - `Vehicles.tsx`: Bổ sung Toast notification nổi góc trên bên phải khi thêm mới, chỉnh sửa hoặc xóa mẫu xe.
