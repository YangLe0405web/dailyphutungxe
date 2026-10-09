# NHẬT KÝ SỬA LỖI & THEO DÕI TẬP TIN (FIX LOG & FILE TRACKING)
**Dự án:** Motoshop CRM  
**Quy tắc:**
1. Mỗi khi fix xong 1 lỗi, ghi nhận chi tiết (mô tả lỗi, giải pháp, tập tin đã sửa, kết quả).
2. Danh sách các tập tin đã can thiệp được cập nhật liên tục bên dưới.
3. **BẮT BUỘC:** Nếu có lỗi tiếp theo cần chỉnh sửa đụng đến bất kỳ tập tin nào đã từng sửa trước đó, phải thông báo và hỏi ý kiến bạn trước khi thực hiện.

---

## 1. DANH SÁCH CÁC TẬP TIN ĐÃ TỪNG ĐƯỢC CHỈNH SỬA
Dưới đây là danh sách toàn bộ các tập tin đã can thiệp trong dự án. Khi xử lý lỗi mới hoặc tính năng tiếp theo, nếu đụng chạm đến bất kỳ file nào dưới đây, **Antigravity BẮT BUỘC phải thông báo rõ ràng cho bạn trước khi sửa đổi**:
1. `D:\crm-project\init-db\init.sql` (Cập nhật schema bảng KHACH_HANG)
2. `D:\crm-project\CrmBackend\Controllers\KhachHangController.cs` (Validate SĐT 10 số, check trùng SĐT/Email, check mật khẩu mạnh, lưu Email, ngày sinh, giới tính)
3. `D:\crm-project\CrmBackend\Controllers\DonHangController.cs` (Lọc ngày SQL, cập nhật trạng thái đơn hàng)
4. `D:\crm-project\crm-frontend\src\data\vietnamLocations.ts` (File tạo mới: Cung cấp dữ liệu Tỉnh/TP - Quận/Huyện - Phường/Xã)
5. `D:\crm-project\crm-frontend\src\data\mockData.ts` (Hàm formatVND an toàn, interface VehicleOrderDetails, checklist bàn giao xe)
6. `D:\crm-project\crm-frontend\src\services\api.ts` (Xử lý API backend, bảo lưu cache localStorage cho xe mẫu và phụ tùng, tự động trừ/hoàn tồn kho khi tạo/hủy đơn)
7. `D:\crm-project\crm-frontend\src\layouts\CustomerLayout.tsx` (Giao diện form đăng ký mới, validate SĐT/Email, OTP 2 bước, popup đăng nhập toàn cục)
8. `D:\crm-project\crm-frontend\src\layouts\AdminLayout.tsx` (Menu điều hướng admin, Trung tâm thông báo đa danh mục)
9. `D:\crm-project\crm-frontend\src\App.tsx` (Routing admin/khách hàng, truyền state đăng nhập toàn cục)
10. `D:\crm-project\crm-frontend\src\pages\admin\Vehicles.tsx` (Trang Quản lý xe mẫu: XM02 - XM07, xem trước định dạng giá VNĐ, huy hiệu tồn kho hết hàng/sắp hết, toggle Ẩn/Hiện trên Web)
11. `D:\crm-project\crm-frontend\src\pages\admin\Sales.tsx` (Quản lý bán hàng: In hóa đơn, khóa cứng đơn Đã hủy, POS bán xe, lọc đơn theo ngày)
12. `D:\crm-project\crm-frontend\src\pages\admin\Parts.tsx` (Quản lý phụ tùng: CRUD phụ tùng, kiểm soát tồn kho khả dụng, định dạng giá VNĐ)
13. `D:\crm-project\crm-frontend\src\pages\admin\Appointments.tsx` (Quản lý lịch hẹn dịch vụ và nhận xe bàn giao)
14. `D:\crm-project\crm-frontend\src\pages\customer\VehiclesShowroom.tsx` (Showroom xe: Lọc xe hiển thị/ẩn, chặn mua xe khi hết hàng kho, popup đặt cọc xe online, đăng ký lái thử, đánh giá xe)
15. `D:\crm-project\crm-frontend\src\pages\customer\PartsStore.tsx` (Cửa hàng phụ tùng: Phân trang 20 sp/trang, giỏ hàng, flash sale, đánh giá)
16. `D:\crm-project\crm-frontend\src\pages\customer\CustomerDashboard.tsx` (Trang cá nhân khách hàng: Hủy đơn hàng phụ tùng & xe mẫu có chọn lý do hủy, theo dõi trạng thái giao hàng thời gian thực)
17. `D:\crm-project\crm-frontend\src\pages\customer\Checkout.tsx` (Thanh toán đơn hàng: Tự động điền thông tin, chỉnh sửa địa chỉ nhận hàng, chọn COD/Online)
18. `D:\crm-project\crm-frontend\src\pages\customer\ServiceBooking.tsx` (Đặt lịch hẹn dịch vụ bảo dưỡng, sửa chữa)
19. `D:\crm-project\crm-frontend\src\contexts\CartContext.tsx` (Quản lý giỏ hàng phụ tùng, tính tổng tiền các món được chọn)
20. `D:\crm-project\crm-frontend\src\utils\vietnameseSearch.ts` (Chuẩn hóa tìm kiếm tiếng Việt không dấu)
21. `D:\crm-project\crm-frontend\src\services\notifications.ts` (Hệ thống thông báo thông minh Admin)
22. `D:\crm-project\crm-frontend\src\pages\admin\Suppliers.tsx` (Quản lý nhà cung cấp: NCC01 - NCC05, bảng 6 cột, modal chi tiết, validate MST & SĐT, địa chỉ phân cấp 3 cấp)
23. `D:\crm-project\crm-frontend\src\pages\admin\StaffRoles.tsx` (Quản lý hồ sơ nhân sự & phân quyền: NV01 - NV07, form nhân sự toàn diện, modal hồ sơ chi tiết, validate SĐT VN, dropdown chức danh chuẩn, chặn trùng CCCD/Email/SĐT, đồng bộ phiên đăng nhập, bộ lọc đa tiêu chí, sắp xếp linh hoạt)
24. `D:\crm-project\CrmBackend\Models\NhanVien.cs` (Mô hình dữ liệu nhân viên mở rộng: CCCD, ngày sinh, giới tính, địa chỉ, lương, ngân hàng, số tài khoản, loại hợp đồng)
25. `D:\crm-project\crm-frontend\src\pages\admin\Customers.tsx` (Quản lý khách hàng: H01 - H04, validate ngày sinh/độ tuổi >= 16, ảnh đại diện Avatar presets & uploader, Hồ sơ khách hàng 360° 5 tab, đồng bộ CRUD & bảo mật khóa tài khoản / cấp lại mật khẩu, highlight hàng được chọn từ thông báo)
26. `D:\crm-project\crm-frontend\src\pages\admin\AdminLogin.tsx` (Đăng nhập quản trị: kiểm tra trạng thái tài khoản BiKhoa, xác thực mật khẩu tùy chỉnh)
27. `D:\crm-project\CrmBackend\Models\KhachHang.cs` (DTO Đổi mật khẩu khách hàng: KhachHangDoiMatKhauDto)
28. `D:\crm-project\crm-frontend\src\pages\admin\Feedback.tsx` (Quản lý đánh giá & khiếu nại: highlight phản hồi được chọn từ thông báo)
29. `D:\crm-project\crm-frontend\src\services\notifications.ts` (Hệ thống thông báo thông minh Admin & Khách hàng phân tách độc lập theo customerId)
30. `D:\crm-project\crm-frontend\src\pages\admin\Warranty.tsx` (File tạo mới: Quản lý lịch hẹn bảo hành, thẩm định kỹ thuật KTV, rẽ nhánh luồng ĐƯỢC BẢO HÀNH vs TỪ CHỐI, in ấn chứng từ Phiếu BH / Hóa đơn / Biên bản trả xe)
31. `D:\crm-project\crm-frontend\src\components\customer\WarrantyViews.tsx` (File tạo mới: Trang Chi tiết bảo hành xe chuẩn Ảnh 1, Form Gửi yêu cầu kiểm tra chuẩn Ảnh 3, Modal gia hạn bảo hành mở rộng Care+)
32. `D:\crm-project\crm-frontend\src\components\customer\WarrantyExtensionWizard.tsx` (File tạo mới: Wizard Gia hạn bảo hành mở rộng 4 bước chuẩn Mockup 1-4)
33. `D:\crm-project\crm-frontend\src\components\customer\OnlineInsurancePurchaseView.tsx` (File tạo mới: Trang Mua bảo hiểm online trên web chuẩn Mockup 1)
34. `D:\crm-project\crm-frontend\src\components\customer\RenewInsuranceModal.tsx` (File tạo mới: Modal gia hạn hợp đồng bảo hiểm tái tục chuẩn Web & Admin POS)
35. `D:\crm-project\crm-frontend\src\pages\admin\Insurance.tsx` (Quản lý bảo hiểm: Cấp bảo hiểm tại quầy chuẩn Mockup 2, tìm khách theo SĐT/Email, chọn xe thuộc khách, 3 gói bảo hiểm, tiền mặt/chuyển khoản VietQR, in GCN, gia hạn tại quầy)

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


### Nhóm chức năng: QUY TRÌNH MUA BÁN PHỤ TÙNG & XỬ LÝ HỦY ĐƠN (Mã: PT-FLOW)
- **Thời gian hoàn thành:** 05/10/2026 - 06/10/2026
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100%
- **Các tập tin can thiệp:** `api.ts`, `Parts.tsx`, `PartsStore.tsx`, `Checkout.tsx`, `CustomerDashboard.tsx`, `Sales.tsx`

#### 1. PT-FLOW-01 – Chặn mua khi hết hàng tồn kho khả dụng (= 0) hoặc vượt số lượng
* **Mô tả lỗi:** Khi phụ tùng chỉ còn 1 cái trong kho hoặc tồn kho = 0, nhiều người cùng mua vẫn tạo được đơn hàng, dẫn đến âm kho.
* **Giải pháp đã thực hiện:**
  - `api.ts` (`orderApi.create`): Kiểm tra tồn kho khả dụng trước khi ghi nhận đơn. Nếu tồn kho $\le 0$, trả về lỗi từ chối: *"Sản phẩm đã HẾT HÀNG! Không thể đặt hàng."*. Nếu số lượng mua $>$ số lượng tồn, chặn và báo cụ thể số lượng còn lại trong kho.
  - `PartsStore.tsx` & `Checkout.tsx`: Kiểm tra số lượng tồn, khóa nút tăng số lượng nếu đã đạt giới hạn tồn và hiển thị cảnh báo đỏ trực quan.

#### 2. PT-FLOW-02 – Tự động trừ tồn kho khả dụng khi tạo đơn hàng
* **Mô tả yêu cầu:** Ngay khi khách đặt hàng (trạng thái Chờ xác nhận / Chờ duyệt), hệ thống phải tự động trừ tồn kho khả dụng của các phụ tùng trong đơn.
* **Giải pháp đã thực hiện:**
  - `orderApi.create`: Duyệt qua toàn bộ sản phẩm trong đơn, tìm theo `maPhuTung` / `id` và tự động cập nhật `soLuongTon = Math.max(0, found.soLuongTon - it.soLuong)`.

#### 3. PT-FLOW-03 – Modal chọn lý do hủy đơn hàng & hoàn trả tồn kho khả dụng
* **Mô tả yêu cầu:** Khách hàng hủy đơn phải có popup chọn lý do hủy (kèm nhập lý do khác nếu có). Sau khi hủy, số lượng phụ tùng phải được tự động cộng hoàn lại kho.
* **Giải pháp đã thực hiện:**
  - `CustomerDashboard.tsx`: Xây dựng `CancelOrderModal` với danh sách lý do chuẩn (Đổi ý, Sai địa chỉ/SĐT, Tìm được giá tốt hơn, Đặt nhầm sản phẩm, Lý do khác) có validation bắt buộc.
  - `orderApi.cancelOrder`: Khi hủy đơn, tự động lặp qua items và cộng hoàn trả lại `soLuongTon` cho phụ tùng, đồng thời lưu `lyDoHuy` vào đơn hàng và phát tín hiệu `crm-data-refresh`.

#### 4. PT-FLOW-04 – Khóa cứng đơn hàng Đã hủy phía Admin & cấm hủy khi đang giao
* **Mô tả yêu cầu:** Đơn hàng đã hủy bên Admin bắt buộc giữ nguyên trạng thái Đã hủy, không cho phép đổi sang trạng thái khác. Khi đơn đã chuyển sang Đang giao hàng hoặc Hoàn thành thì khách hàng không được hủy đơn.
* **Giải pháp đã thực hiện:**
  - `Sales.tsx`: Ẩn dropdown đổi trạng thái với đơn `DaHuy`, hiển thị nhãn khóa `🔒 Khóa (Đã hủy)`, chặn mọi thao tác cập nhật trạng thái nếu đơn đã hủy.
  - `CustomerDashboard.tsx`: Ẩn/Khóa nút hủy đơn của khách khi đơn chuyển sang `DangGiao` (hiển thị thông báo xe tải đang vận chuyển, khóa hủy) hoặc `HoanThanh`.
  - `Sales.tsx`: Trang chi tiết đơn hàng bổ sung nút **In hóa đơn giao hàng** chuẩn form bàn giao hàng hóa cho shipper.


### Nhóm chức năng: NÂNG CẤP QUẢN LÝ XE MẪU SHOWROOM (Mã: XM02 - XM07)
- **Thời gian hoàn thành:** 06/10/2026
- **Trạng thái:** ĐÃ HOÀN THÀNH & ĐÃ KIỂM THỬ THÀNH CÔNG 100%
- **Các tập tin can thiệp:** `api.ts`, `Vehicles.tsx`, `VehiclesShowroom.tsx`

#### 1. XM02 – Chuẩn hóa cột Mã xe (ID) dạng XM001, XM002
* **Giải pháp:** Thay thế cột STT cơ bản bằng cột Mã định danh xe mẫu `XM001`, `XM002`... hiển thị font monospace nổi bật, có viền đỏ nhạt chuyên nghiệp.

#### 2. XM03 – Quản lý đa màu sắc (Multi-color tags)
* **Giải pháp:**
  - Bảng danh sách phân tách chuỗi màu sắc thành từng huy hiệu màu sắc trực quan.
  - Modal Thêm/Sửa cung cấp tab **Màu sắc** cho phép thêm nhiều ô màu tùy ý, có nút `+ Thêm màu` và nút xóa `✕` cho từng màu.

#### 3. XM04 – Bổ sung đầy đủ thông số thương mại & kỹ thuật
* **Giải pháp:** Mở rộng interface `Vehicle` và `CatalogVehicle` với các trường: Nhà cung cấp (`ncc`), Năm sản xuất (`namSanXuat`), Xuất xứ (`xuatXu`), Thuế `vat` %, Số lượng tồn kho (`soLuong`), và 11 trường thông số động cơ/khung sườn.

#### 4. XM05 – Modal xem chi tiết thông số kỹ thuật (Specs Modal)
* **Giải pháp:** Nút **👁️ Xem thông số** mở modal hiển thị đầy đủ hình ảnh, giá niêm yết, phân khúc, màu sắc, tình trạng lái thử và toàn bộ bảng thông số kỹ thuật chi tiết của xe mẫu.

#### 5. XM06 – 4 Thẻ KPI Banner tổng quan & bộ lọc nhanh
* **Giải pháp:** Banner đầu trang gồm 4 thẻ KPI: Tổng số xe mẫu, Đang kinh doanh, Ngừng kinh doanh/Đang ẩn, và Xe mới nhập trong 30 ngày; bấm vào mỗi thẻ sẽ kích hoạt lọc nhanh danh sách xe tương ứng.

#### 6. XM07 – Bật / Tắt Ẩn/Hiện xe mẫu trên Website Showroom
* **Giải pháp:** Nút toggle trực tiếp trên bảng quản trị cho phép Admin bật/tắt hiển thị xe mẫu trên Website Showroom chỉ với 1 click, hiển thị toast thông báo phản hồi ngay lập tức.


### Nhóm chức năng: KHẮC PHỤC 3 LỖI XE MẪU & ĐỒNG BỘ TỒN KHO THEO YÊU CẦU NGƯỜI DÙNG (Mã: XM-FIX-01, XM-FIX-02, XM-FIX-03)
- **Thời gian hoàn thành:** 06/10/2026 18:00
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100% (Build: 0 lỗi)
- **Các tập tin can thiệp:**
  1. `D:\crm-project\crm-frontend\src\services\api.ts`
  2. `D:\crm-project\crm-frontend\src\pages\admin\Vehicles.tsx`
  3. `D:\crm-project\crm-frontend\src\pages\customer\VehiclesShowroom.tsx`
  4. `D:\crm-project\crm-frontend\src\pages\customer\CustomerDashboard.tsx`
  5. `D:\crm-project\crm-frontend\src\pages\admin\Sales.tsx`

#### 1. XM-FIX-01 – Định dạng giá tiền chưa chuẩn & thiếu xem trước
* **Mô tả lỗi:** Giá xe khi nhập trong modal Admin dễ gây nhầm lẫn chữ số hàng chục/trăm triệu do thiếu định dạng tiền tệ trực quan; định dạng giá tiền ở một số nơi chưa đồng bộ.
* **Giải pháp đã thực hiện:**
  - `Vehicles.tsx`: Dưới ô nhập `Giá niêm yết (VNĐ)` trong modal Thêm/Sửa xe, bổ sung hiển thị trực tiếp theo thời gian thực: `➔ Định dạng: {formatVND(form.giaNiemYet)}` (VD: `55.000.000 đ`), giúp người dùng kiểm tra ngay hàng triệu/trăm triệu.
  - Đồng bộ hàm `formatVND` an toàn trên toàn bộ hệ thống: bảng danh sách xe, modal thông số, thẻ xe showroom, modal tính chi phí lăn bánh và đặt cọc online.

#### 2. XM-FIX-02 – Ẩn / Hiện xe không hoạt động trên Website Showroom
* **Mô tả lỗi:** Admin bấm Ẩn xe mẫu nhưng xe không biến mất ngoài Showroom, hoặc sau khi làm mới trang trạng thái Ẩn tự động nhảy ngược lại thành Hiện.
* **Nguyên nhân gốc rễ:**
  1. Bảng CSDL backend `SAN_PHAM_XE` không có cột lưu `TrangThaiHienThi`. Khi `catalogVehicleApi.getAll()` tải dữ liệu từ backend, thuộc tính `trangThaiHienThi` trả về `undefined`, code trước đó đã tự động gán fallback `'Hien'` và ghi đè vào `localStorage`, làm mất trạng thái `'An'` của người dùng.
  2. Phía `VehiclesShowroom.tsx` hàm `loadVehicles()` nạp dữ liệu tĩnh từ `showroomVehicles` vào Map trước, nên nếu tên xe có độ lệch nhỏ thì xe vẫn tồn tại ngoài showroom dù đã bị xóa khỏi danh sách.
* **Giải pháp đã thực hiện:**
  - `api.ts` (`catalogVehicleApi.getAll()` & `update()`): Luôn đọc `localStorage` trước để tạo bản đồ `localMap`. Khi hợp nhất dữ liệu từ backend hoặc danh mục mặc định, **bảo lưu tuyệt đối các giá trị ghi đè của người dùng** (`trangThaiHienThi`, `trangThaiKinhDoanh`, `soLuong`). Backend không bao giờ có thể ghi đè `'An'` thành `'Hien'` nữa.
  - `api.ts` (`catalogVehicleApi.update()`): Cập nhật ngay vào `localStorage` trước và chỉ gửi request `PUT` lên backend nếu có đầy đủ trường dữ liệu tên xe, tránh lỗi HTTP 400 khi chỉ cập nhật trạng thái hiển thị.
  - `VehiclesShowroom.tsx`: Cập nhật hàm `loadVehicles()` lọc triệt để: chỉ lấy những xe có `trangThaiHienThi !== 'An'` và `trangThaiKinhDoanh !== 'NgungKinhDoanh'`. Xe bị ẩn sẽ biến mất khỏi Showroom ngay lập tức và khi bật hiện lại sẽ xuất hiện lại ngay mà không cần tải lại trang.

#### 3. XM-FIX-03 – Số lượng tồn kho không trừ ra khi khách đã đặt xe (thực hiện giống mua bán phụ tùng)
* **Mô tả yêu cầu:**
  1. Khi khách hàng đặt cọc/mua xe online, số lượng tồn kho của mẫu xe đó phải tự động trừ đi 1.
  2. Khi xe có số lượng tồn bằng 0, hệ thống phải chặn không cho khách hàng mua xe.
  3. Khi đơn mua xe bị hủy (bởi khách hàng hoặc Admin), hệ thống phải tự động cộng trả lại 1 xe vào tồn kho khả dụng.
* **Giải pháp đã thực hiện:**
  - **Trừ tồn kho khi đặt xe:**
    * `orderApi.createVehicleOrder`: Kiểm tra tồn kho trước khi đặt. Khi tạo đơn thành công, tự động tìm xe trong `crm_catalog_vehicles` theo `maXe` / `tenXe` và cập nhật `soLuong = Math.max(0, curStock - 1)`, lưu vào `localStorage` và phát tín hiệu `crm-data-refresh`.
    * `VehiclesShowroom.tsx` (`BuyVehicleOnlineModal`): Truyền `maXe: vehicle.id` vào chi tiết đơn hàng `thongTinXe` để đảm bảo định danh chính xác 100%.
  - **Chặn mua khi tồn kho = 0:**
    * `VehiclesShowroom.tsx`: Trên thẻ xe ở Showroom, nếu `v.soLuong <= 0`, hiển thị huy hiệu `⛔ Hết hàng trong kho` và khóa nút mua thành nút màu xám disabled `⛔ Hết hàng trong kho`.
    * Trong modal chi tiết xe: Khóa nút đặt mua thành `⛔ XE HIỆN ĐÃ HẾT HÀNG TRONG KHO (SỐ LƯỢNG = 0)`.
    * Trong `handleStartBuyVehicle` & `BuyVehicleOnlineModal`: Chặn mở form và chặn submit nếu xe đã hết hàng trong kho.
  - **Hoàn trả tồn kho khi hủy đơn:**
    * `orderApi.cancelOrder` & `orderApi.updateStatus('DaHuy')`: Nếu đơn hàng bị hủy là đơn mua xe (`loaiDon === 'Xe'` hoặc có `thongTinXe`), tự động tìm xe và **cộng hoàn lại +1 xe** vào kho catalog, phát thông báo và làm mới dữ liệu toàn hệ thống.
    * `CustomerDashboard.tsx`: Mở rộng điều kiện hiển thị nút **✕ Hủy đơn** cho các đơn mua xe có trạng thái `ChoGiaoXe` (trước khi chuyển sang Đang giao), cho phép khách hàng chọn lý do hủy đơn và hoàn trả tồn kho xe tức thì.
  - **Hiển thị trực quan tồn kho trên Admin:**
    * `Vehicles.tsx`: Cột tồn kho hiển thị huy hiệu rõ ràng: `⛔ Hết hàng (0)` màu đỏ khi tồn bằng 0, `⚠️ Sắp hết ({soLuong} xe)` màu vàng khi số lượng $\le 5$, và màu xanh khi còn nhiều xe.


### Nhóm chức năng: NÂNG CẤP & CHUẨN HÓA QUẢN LÝ NHÀ CUNG CẤP (Mã: NCC01 - NCC05)
- **Thời gian hoàn thành:** 06/10/2026 23:20
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100% (Build: 0 lỗi, Dev & Backend đang chạy)
- **Các tập tin can thiệp:**
  1. `D:\crm-project\crm-frontend\src\data\mockData.ts` (Mở rộng interface `Supplier` với các trường ngân hàng, STK, chu kỳ thanh toán, ngày hợp tác, địa chỉ phân cấp; chuẩn hóa dữ liệu mẫu)
  2. `D:\crm-project\crm-frontend\src\pages\admin\Suppliers.tsx` (Tái thiết kế giao diện dạng Table 6 cột, thêm modal chi tiết, tích hợp bộ kiểm tra MST & SĐT, bộ chọn địa chỉ phân cấp)

#### 1. NCC01 – Chuyển đổi giao diện sang dạng Table hiển thị các trường cốt lõi
* **Mô tả yêu cầu:** Thay thế giao diện dạng Card trước đây bằng bảng Table trực quan, dễ quản lý. Bên ngoài bảng chỉ hiển thị đúng các trường thông tin cốt lõi: **Mã NCC, Tên nhà cung cấp, SĐT, Email, Trạng thái, Thao tác**.
* **Giải pháp đã thực hiện:**
  - `Suppliers.tsx`: Thiết kế lại bảng dữ liệu gồm đúng 6 cột:
    1. **Mã NCC:** Huy hiệu font mono nền đỏ nhạt `NCC001`, `NCC002`...
    2. **Tên nhà cung cấp:** Tiêu đề in đậm, kèm phụ đề MST và người đại diện.
    3. **SĐT:** Số điện thoại định dạng chuẩn, có liên kết gọi nhanh.
    4. **Email:** Email liên hệ đối tác, có liên kết gửi thư nhanh.
    5. **Trạng thái:** Huy hiệu bo tròn chấm màu `● Đang hợp tác` (xanh) hoặc `Tạm ngưng` (đỏ).
    6. **Thao tác:** Bộ 3 nút `👁️ Xem chi tiết`, `✏️ Sửa`, `🗑️ Xóa`.
  - Lưu trữ bền vững dữ liệu nhà cung cấp qua `localStorage` (`crm_suppliers`).

#### 2. NCC02 – Bổ sung nút & Modal xem chi tiết Nhà cung cấp
* **Mô tả yêu cầu:** Thêm nút "👁️ Xem chi tiết" và modal hiển thị toàn diện các thông tin chi tiết: Địa chỉ, Người liên hệ, Thông tin thanh toán (STK, Ngân hàng, Chiết khấu, Chu kỳ công nợ), Danh mục hàng hóa cung cấp, và Lịch sử phiếu nhập kho (`PurchaseReceipt`).
* **Giải pháp đã thực hiện:**
  - `Suppliers.tsx`: Xây dựng `SupplierDetailModal`:
    - Khối Thông tin pháp lý & Liên hệ: Người đại diện, Hotline/SĐT, Email, Địa chỉ kho/trụ sở đầy đủ, Ghi chú chính sách.
    - Khối Thanh toán & Công nợ: Ngân hàng thụ hưởng, STK, Chiết khấu đại lý (%), Chu kỳ công nợ (30 ngày, 45 ngày, 60 ngày...), danh mục nhóm hàng hóa cung ứng dạng huy hiệu.
    - Khối Lịch sử phiếu nhập kho: Bảng danh sách các phiếu nhập kho lọc theo `nhaCungCapId === detailSupplier.id` hiển thị Mã phiếu, Ngày nhập, Người lập phiếu, Số lượng mặt hàng, Tổng giá trị tiền hàng, Trạng thái và nút "👁️ Xem phiếu".
    - Nút thao tác chuyển nhanh sang sửa thông tin hoặc lập phiếu nhập mới.

#### 3. NCC03 – Kiểm tra định dạng & trùng lặp Mã số thuế (MST)
* **Mô tả yêu cầu:** Mã số thuế bắt buộc có từ 10 đến 13 chữ số, chỉ chứa ký tự số và không được trùng lặp với các nhà cung cấp khác đã có trong hệ thống; hiển thị cảnh báo lỗi trực tiếp.
* **Giải pháp đã thực hiện:**
  - `Suppliers.tsx`: Thêm hàm `validateTaxCode(tax, currentId)`:
    - Kiểm tra bắt buộc không được để trống.
    - Kiểm tra chỉ chứa số: `/^\d+$/`.
    - Kiểm tra độ dài từ 10 đến 13 ký tự: `clean.length >= 10 && clean.length <= 13`.
    - Kiểm tra trùng lặp: `suppliers.some(s => s.id !== currentId && s.maSoThue.trim() === clean)`.
    - Hiển thị thông báo lỗi màu đỏ thời gian thực ngay dưới ô nhập và chặn lưu dữ liệu nếu có lỗi.

#### 4. NCC04 – Kiểm tra định dạng & trùng lặp Số điện thoại (SĐT)
* **Mô tả yêu cầu:** Số điện thoại bắt buộc đúng 10 chữ số, phải bắt đầu bằng các đầu số chuẩn `03, 05, 07, 08, 09`, chỉ chứa số và không được trùng lặp với nhà cung cấp khác.
* **Giải pháp đã thực hiện:**
  - `Suppliers.tsx`: Thêm hàm `validatePhoneNumber(phone, currentId)`:
    - Kiểm tra bắt buộc không được để trống.
    - Kiểm tra chỉ chứa số: `/^\d+$/`.
    - Kiểm tra regex đầu số mạng Việt Nam: `/^(03|05|07|08|09)\d{8}$/`.
    - Kiểm tra trùng lặp: `suppliers.some(s => s.id !== currentId && s.soDienThoai === clean)`.
    - Hiển thị thông báo đỏ trực tiếp ngay dưới ô nhập và vô hiệu hóa nút submit nếu chưa hợp lệ.

#### 5. NCC05 – Chọn địa chỉ phân cấp chuẩn (Tỉnh/TP ➔ Quận/Huyện ➔ Phường/Xã)
* **Mô tả yêu cầu:** Không nhập địa chỉ tự do một dòng mà cung cấp 3 dropdown phân cấp Tỉnh/TP ➔ Quận/Huyện ➔ Phường/Xã từ danh mục có sẵn (`vietnamLocations.ts`), kèm ô nhập số nhà, tên đường.
* **Giải pháp đã thực hiện:**
  - `Suppliers.tsx`: Tích hợp dữ liệu từ `VIETNAM_LOCATIONS`:
    - Dropdown 1: Tỉnh / Thành phố (TP.HCM, Hà Nội, Đà Nẵng...).
    - Dropdown 2: Quận / Huyện (tự động cập nhật danh sách theo Tỉnh/TP đã chọn).
    - Dropdown 3: Phường / Xã (tự động cập nhật danh sách theo Quận/Huyện đã chọn).
    - Ô nhập Số nhà, tên đường / Khu công nghiệp.
    - Khung xem trước địa chỉ hoàn chỉnh theo thời gian thực: `[Số nhà], [Phường/Xã], [Quận/Huyện], [Tỉnh/TP]`.
    - Khi chỉnh sửa nhà cung cấp, form tự động liên kết lại đúng Tỉnh/TP, Quận/Huyện, Phường/Xã đã lưu trước đó.


### Nhóm chức năng: QUẢN LÝ PHIẾU NHẬP KHO (Mã: K01 - K05 & QUY TRÌNH DUYỆT PHIẾU)
- **Thời gian hoàn thành:** 06/10/2026 23:50
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100% (Build: 0 lỗi, Dev & Backend đang chạy)
- **Các tập tin can thiệp:**
  1. `D:\crm-project\crm-frontend\src\App.tsx` (Truyền `currentStaff` vào `SuppliersPage`)
  2. `D:\crm-project\crm-frontend\src\pages\admin\Suppliers.tsx` (Triển khai K01 - K05, phân quyền nhân viên tạo - admin duyệt)
- **Quy tắc tuân thủ:** Theo chỉ đạo của người dùng: vì hệ thống đóng vai trò CRM nên không can thiệp tăng/giảm số lượng tồn kho của phụ tùng hoặc xe máy.

#### 1. QUY TRÌNH PHÂN QUYỀN DUYỆT PHIẾU (NHÂN VIÊN TẠO, ADMIN DUYỆT)
* **Mô tả yêu cầu:** Nhân viên tạo phiếu nhập kho; phiếu tạo xong bắt buộc ở trạng thái Chờ duyệt; chỉ có tài khoản Quản trị viên (Admin) mới có quyền duyệt phiếu nhập kho sang trạng thái Đã nhập kho. Không can thiệp cập nhật tồn kho vật lý.
* **Giải pháp đã thực hiện:**
  - `Suppliers.tsx`:
    - Nhận prop `currentStaff`. Xác định quyền hạn: `isAdmin = !currentStaff || currentStaff.vaiTro === 'SuperAdmin'`.
    - Khi tạo phiếu mới: Bắt buộc gán trạng thái `ChoDuyet` (Chờ duyệt).
    - Phân quyền duyệt:
      * Tài khoản Quản trị viên (`isAdmin = true`): Hiển thị nút **"✓ Duyệt"** trên bảng danh sách và nút **"✓ Admin xác nhận duyệt phiếu"** trong modal xem chi tiết. Khi bấm, phiếu chuyển sang `DaNhapKho`.
      * Tài khoản Nhân viên: Nút duyệt bị ẩn và thay thế bằng huy hiệu `⏳ Chờ Admin duyệt`, ngăn nhân viên tự duyệt phiếu.
      * Có nút **"✕ Hủy phiếu"** đối với các phiếu chờ duyệt.
    - Lưu trữ danh sách phiếu bền vững qua `localStorage` (`crm_purchase_receipts`).

#### 2. K01 – Nhân viên phụ trách tự động điền theo tài khoản đang đăng nhập
* **Mô tả lỗi:** Khi tạo phiếu nhập kho, trường Nhân viên phụ trách đang cho phép nhập tên nhân viên trực tiếp.
* **Kết quả mong đợi:** Tự động điền theo tài khoản đang đăng nhập.
* **Giải pháp đã thực hiện:**
  - `Suppliers.tsx`: Lấy thông tin tài khoản đăng nhập hiện tại `currentStaffDisplayName` (`${currentStaff.hoTen} (${currentStaff.chucVu})`).
  - Gắn vào trường Người lập phiếu dạng `readOnly` và `disabled` với biểu tượng ổ khóa 🔒 và ghi chú "Tự động theo tài khoản đang đăng nhập", khóa hoàn toàn việc sửa tay.

#### 3. K02 – Sản phẩm nhập chọn từ danh mục có sẵn, cấm nhập thủ công
* **Mô tả lỗi:** Khi tạo phiếu nhập kho, trường Sản phẩm nhập đang cho phép nhập tên sản phẩm bằng text.
* **Kết quả mong đợi:** Chuyển sang dropdown/danh sách chọn sản phẩm từ danh sách sản phẩm có sẵn trong hệ thống, không cho phép nhập thủ công.
* **Giải pháp đã thực hiện:**
  - `Suppliers.tsx`: Loại bỏ toàn bộ các input text tự do cho tên sản phẩm.
  - Cung cấp dropdown chọn trực tiếp sản phẩm từ danh mục hệ thống: Phụ tùng chính hãng (`availableParts`) hoặc Xe máy (`availableVehicles`).
  - Khi chọn sản phẩm: Tự động điền Mã SKU/ID, Tên sản phẩm, Đơn vị tính (ĐVT), và gợi ý Đơn giá nhập sỉ thực tế.

#### 4. K03 – Bổ sung chức năng nhập xe máy vào kho
* **Mô tả lỗi:** Phiếu nhập kho hiện chỉ hỗ trợ nhập phụ tùng, chưa có chức năng nhập xe vào kho.
* **Kết quả mong đợi:** Bổ sung chức năng nhập xe, cho phép chọn xe mẫu, số lượng và các thông tin liên quan.
* **Giải pháp đã thực hiện:**
  - `Suppliers.tsx`: Bổ sung 2 nút chọn dòng sản phẩm: **"+ 🏍️ Thêm dòng Xe máy"** và **"+ 📦 Thêm dòng Phụ tùng"**.
  - Dòng xe máy kết nối trực tiếp với danh mục xe mẫu: Honda SH 160i, Air Blade, Wave Alpha, Winner X, Yamaha Exciter, Grande, Vespa...
  - Tự động gán ĐVT = "Chiếc", cho phép nhập số lượng xe và đơn giá nhập, tự tính thành tiền.
  - Trên bảng danh sách phiếu hiển thị huy hiệu phân loại trực quan: `🏍️ Xe máy`, `📦 Phụ tùng`.

#### 5. K04 – Bổ sung bộ lọc toàn diện trên Trang Quản lý phiếu nhập
* **Mô tả lỗi:** Trang quản lý phiếu nhập chưa có chức năng lọc để tra cứu và quản lý phiếu nhập.
* **Kết quả mong đợi:** Bổ sung bộ lọc theo mã phiếu, nhà cung cấp, nhân viên phụ trách, loại nhập (Xe/Phụ tùng), thời gian nhập và trạng thái phiếu.
* **Giải pháp đã thực hiện:**
  - `Suppliers.tsx`: Xây dựng thanh điều khiển tập trung (**Unified Filter Bar**) với 6 tiêu chí lọc độc lập:
    1. Tìm kiếm từ khóa: Mã phiếu (`PN-xxxx`), tên NCC, người lập.
    2. Lọc theo Nhà cung cấp: Dropdown chọn cụ thể từng nhà cung cấp trong danh sách.
    3. Lọc theo Người lập phiếu: Dropdown danh sách các nhân viên đã lập phiếu.
    4. Lọc theo Loại hàng: Tất cả / Chỉ Xe máy / Chỉ Phụ tùng / Cả Xe & Phụ tùng.
    5. Lọc theo Trạng thái: Tất cả / Chờ duyệt / Đã nhập kho / Đã hủy.
    6. Lọc theo Thời gian nhập: Tất cả / Hôm nay / 7 ngày qua / 30 ngày qua / Tùy chọn ngày (Từ ngày – Đến ngày).
    7. Nút "↺ Đặt lại bộ lọc" khôi phục nhanh về mặc định.

#### 6. K05 – Tối ưu hóa sắp xếp danh sách phiếu nhập
* **Mô tả lỗi:** Danh sách phiếu nhập chưa ưu tiên hiển thị phiếu mới nhất và chưa có chức năng sắp xếp theo nhiều tiêu chí.
* **Kết quả mong đợi:** Mặc định phiếu nhập mới nhất hiển thị đầu tiên; bổ sung chức năng sắp xếp theo ngày nhập, mã phiếu, nhà cung cấp, tổng tiền theo thứ tự tăng/giảm.
* **Giải pháp đã thực hiện:**
  - `Suppliers.tsx`:
    - **Mặc định:** Sắp xếp giảm dần theo thời gian lập (`ngayNhap desc`), phiếu mới tạo luôn hiển thị ở dòng đầu tiên.
    - Cung cấp dropdown sắp xếp 8 chế độ: Ngày nhập (mới nhất / cũ nhất), Mã phiếu (tăng / giảm), Nhà cung cấp (A-Z / Z-A), Tổng tiền (cao-thấp / thấp-cao).
    - Hỗ trợ click trực tiếp vào các tiêu đề cột của bảng (MÃ PHIẾU, NHÀ CUNG CẤP, NGÀY NHẬP, TỔNG TIỀN) để đảo chiều sắp xếp kèm mũi tên chỉ hướng `▲` / `▼`.


### Nhóm chức năng: QUẢN LÝ NHÂN SỰ & PHÂN QUYỀN (Mã: NV01 - NV07)
- **Thời gian hoàn thành:** 07/10/2026 00:25
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100% (Build Vite: 0 lỗi, Backend models đồng bộ)
- **Các tập tin can thiệp:**
  1. `D:\crm-project\crm-frontend\src\data\mockData.ts` (Mở rộng interface `StaffAccount`, chuẩn hóa danh mục `STANDARD_STAFF_TITLES`, ngân hàng `POPULAR_BANKS` và dữ liệu mẫu đầy đủ thuộc tính)
  2. `D:\crm-project\crm-frontend\src\services\api.ts` (Map đầy đủ các trường nhân sự mở rộng trong `staffApi` và lưu trữ bền vững qua `localStorage`)
  3. `D:\crm-project\crm-frontend\src\App.tsx` (Lắng nghe sự kiện toàn cục `crm-staff-change` để đồng bộ session realtime, truyền props `currentStaff` và `onCurrentStaffChange` vào `StaffRolesPage`)
  4. `D:\crm-project\crm-frontend\src\pages\admin\StaffRoles.tsx` (Tái thiết kế toàn diện trang Phân quyền & Quản lý nhân sự: form thêm mới 3 phần, modal chi tiết hồ sơ, modal sửa hồ sơ, validate SĐT VN, dropdown chức danh chuẩn, chặn trùng CCCD/Email/SĐT, đồng bộ phiên làm việc, bộ lọc đa tiêu chí, sắp xếp linh hoạt)
  5. `D:\crm-project\CrmBackend\Models\NhanVien.cs` (Cập nhật DTO và model backend hỗ trợ CCCD, Ngày sinh, Giới tính, Địa chỉ, Lương cơ bản, Ngân hàng, Số tài khoản, Loại hợp đồng)

#### 1. NV01 – Lỗi form thêm nhân viên mới chưa đầy đủ thông tin
* **Mô tả lỗi:** Form thêm nhân viên trước đây chỉ có 5 trường cơ bản (Họ tên, Email, SĐT, Chức vụ nhập tự do, Vai trò), thiếu các thông tin nhân sự bắt buộc.
* **Kết quả mong đợi:** Thiết kế lại form, bổ sung đầy đủ các thông tin: Họ tên, Giới tính, Ngày sinh, Địa chỉ, CCCD, SĐT, Email, Ảnh cá nhân, Chức danh (Dropdown), Ngày bắt đầu làm việc, Loại nhân viên (Full-time/Part-time), Lương cơ bản và Thông tin tài khoản ngân hàng (Tên ngân hàng, Số tài khoản).
* **Giải pháp đã thực hiện:**
  - Tái cấu trúc form thêm nhân viên thành 3 nhóm thông tin chuyên nghiệp:
    1. **Thông tin cá nhân & Liên hệ:** Họ và tên (*), Giới tính (Nam/Nữ/Khác), Ngày sinh (Date picker, validate tuổi >= 18), Số CCCD (12 chữ số *), Số điện thoại (10 số *), Email (*), Địa chỉ thường trú (*), Chọn avatar nhanh từ 10 preset hoặc nhập URL.
    2. **Vị trí công việc & Phân quyền:** Chức danh (Dropdown chuẩn), Vai trò RBAC (SuperAdmin / NhanVienBanHang / NhanVienKyThuat), Hình thức làm việc (Full-time / Part-time), Ngày bắt đầu làm việc (Date picker).
    3. **Chế độ lương & Ngân hàng:** Lương cơ bản (VNĐ, có định dạng xem trước trực quan), Ngân hàng thụ hưởng (Dropdown chọn ngân hàng uy tín), Số tài khoản ngân hàng.
  - Xây dựng thêm **Modal Xem Hồ Sơ Chi Tiết** (Employee Profile Card) và **Modal Chỉnh Sửa Toàn Bộ Hồ Sơ Nhân Viên** cho phép quản trị viên xem lại và cập nhật mọi thông tin trên bất kỳ lúc nào.

#### 2. NV02 – Lỗi định dạng Số điện thoại (SĐT)
* **Mô tả lỗi:** SĐT nhập vào chưa kiểm tra đúng định dạng và không bắt lỗi khi không hợp lệ.
* **Kết quả mong đợi:** Kiểm tra số điện thoại theo định dạng Việt Nam (10 số, bắt đầu đúng đầu số di động 03, 05, 07, 08, 09), từ chối lưu nếu sai định dạng.
* **Giải pháp đã thực hiện:**
  - Áp dụng Regex chuẩn nhà mạng Việt Nam: `/^(03|05|07|08|09)\d{8}$/`.
  - Kiểm tra realtime: Hiển thị cảnh báo lỗi màu đỏ ngay dưới ô nhập và chặn submit (từ chối lưu) nếu SĐT thiếu số, thừa số hoặc sai đầu số.

#### 3. NV03 – Lỗi chức danh nhân viên chưa dùng dropdown chuẩn
* **Mô tả lỗi:** Chức danh đang cho nhập tự do bằng text, dễ gây sai lệch dữ liệu, sai chính tả và không thống nhất.
* **Kết quả mong đợi:** Chuyển sang Dropdown với giá trị cố định chuẩn hóa trong doanh nghiệp: Dữ liệu thống nhất, dễ lọc và báo cáo.
* **Giải pháp đã thực hiện:**
  - Thay thế trường nhập tay bằng thẻ `<select>` Dropdown chứa danh sách chức danh chuẩn hóa (`STANDARD_STAFF_TITLES`):
    * Quản lý Showroom (Tự động đề xuất vai trò `SuperAdmin`)
    * Chuyên viên Tư vấn & CSKH (Tự động đề xuất vai trò `NhanVienBanHang`)
    * Chuyên viên Bán xe & Trả góp (Tự động đề xuất vai trò `NhanVienBanHang`)
    * Chuyên viên Marketing & CRM (Tự động đề xuất vai trò `NhanVienBanHang`)
    * Kế toán Bán hàng & Thu ngân (Tự động đề xuất vai trò `NhanVienBanHang`)
    * Thủ kho & Quản lý phụ tùng (Tự động đề xuất vai trò `NhanVienKyThuat`)
    * Kỹ thuật viên Trưởng xưởng (Tự động đề xuất vai trò `NhanVienKyThuat`)
    * Kỹ thuật viên Sửa chữa máy (Tự động đề xuất vai trò `NhanVienKyThuat`)
    * Kỹ thuật viên Bảo dưỡng định kỳ (Tự động đề xuất vai trò `NhanVienKyThuat`)
    * Kỹ thuật viên Điện & Phụ tùng xe (Tự động đề xuất vai trò `NhanVienKyThuat`)
  - Khi người dùng chọn chức danh, hệ thống tự động nhận diện và chuyển vai trò RBAC mặc định tương ứng, giảm thiểu thao tác nhầm lẫn.

#### 4. NV04 – Lỗi tạo trùng nhân viên
* **Mô tả lỗi:** Khả năng tạo trùng người với cùng số CCCD, Email hoặc SĐT chưa được chặn.
* **Kết quả mong đợi:** Kiểm tra trùng lặp trước khi lưu; hiển thị thông báo chi tiết tương ứng, ngăn chặn dữ liệu lặp và sai lệch.
* **Giải pháp đã thực hiện:**
  - Xây dựng thuật toán kiểm tra tính duy nhất (Uniqueness Validator) trước khi submit (áp dụng cho cả Thêm mới và Sửa hồ sơ):
    * **CCCD:** Nếu trùng với nhân viên khác $\rightarrow$ Báo lỗi: *"Số CCCD [xxx] đã tồn tại trên hệ thống (thuộc nhân viên: [Tên] - [Mã NV])!"*.
    * **Email:** Nếu trùng với nhân viên khác $\rightarrow$ Báo lỗi: *"Email [xxx] đã được sử dụng (thuộc nhân viên: [Tên] - [Mã NV])!"*.
    * **SĐT:** Nếu trùng với nhân viên khác $\rightarrow$ Báo lỗi: *"Số điện thoại [xxx] đã được sử dụng (thuộc nhân viên: [Tên] - [Mã NV])!"*.
  - Từ chối lưu, viền đỏ trường bị trùng và hiển thị thông báo rõ ràng cho người quản trị.

#### 5. NV05 – Lỗi dữ liệu tài khoản không đồng bộ với nhân sự
* **Mô tả lỗi:** Khi thay đổi vai trò/quyền của nhân viên, hệ thống chưa đồng bộ với tài khoản đăng nhập.
* **Kết quả mong đợi:** Đồng bộ dữ liệu giữa bảng `NHAN_VIEN` và `TAI_KHOAN` sau khi cập nhật; tránh sai quyền truy cập hệ thống.
* **Giải pháp đã thực hiện:**
  - Khi Admin đổi vai trò phân quyền (RBAC) hoặc chỉnh sửa thông tin của bất kỳ nhân sự nào:
    * Nếu nhân sự được sửa chính là tài khoản đang đăng nhập trong phiên làm việc hiện tại (`currentStaff?.id === updated.id || currentStaff?.email === updated.email`), hệ thống tự động:
      1. Cập nhật đối tượng phiên làm việc trong `localStorage.setItem('crm_current_staff', ...)`.
      2. Gọi callback `onCurrentStaffChange` để cập nhật `App.tsx`.
      3. Phát sự kiện toàn cục `window.dispatchEvent(new Event('crm-staff-change'))`.
    * Menu Sidebar, huy hiệu vai trò, thanh điều hướng và quyền truy cập chức năng của `AdminLayout` cập nhật ngay lập tức mà không cần người dùng phải đăng xuất ra đăng nhập lại.

#### 6. NV06 – Lỗi tìm kiếm nhân viên chưa đủ tiêu chí
* **Mô tả lỗi:** Chỉ tìm theo tên/email/SĐT, chưa hỗ trợ lọc theo chức danh, trạng thái, phòng ban.
* **Kết quả mong đợi:** Thêm bộ lọc theo vai trò, chức danh, trạng thái, ngày bắt đầu để dễ quản lý nhân sự hơn.
* **Giải pháp đã thực hiện:**
  - Thiết kế thanh công cụ lọc nâng cao (**Advanced Filter Bar**) 2 hàng tiện ích:
    1. **Ô tìm kiếm từ khóa:** Tìm kiếm đa năng theo Họ tên, Email, SĐT, Số CCCD, Mã nhân viên STxxx.
    2. **Lọc theo Vai trò:** Tất cả / Super Admin / Nhân viên Bán hàng / Nhân viên Kỹ thuật.
    3. **Lọc theo Chức danh:** Dropdown danh sách các chức danh chuẩn hóa (NV03).
    4. **Lọc theo Trạng thái:** Tất cả / Đang hoạt động / Đã bị khóa.
    5. **Lọc theo Loại nhân viên:** Tất cả / Full-time / Part-time.
    6. **Lọc theo Ngày vào làm:** Chọn khoảng ngày linh hoạt (Từ ngày ... Đến ngày ...).
    7. **Nút "🔄 Đặt lại bộ lọc":** Xuất hiện khi có bộ lọc đang hoạt động, giúp khôi phục nhanh về mặc định.

#### 7. NV07 – Lỗi sắp xếp danh sách nhân viên chưa rõ ràng
* **Mô tả lỗi:** Danh sách nhân viên không hỗ trợ sắp xếp hiệu quả.
* **Kết quả mong đợi:** Cho phép sắp xếp theo tên, ngày bắt đầu, trạng thái, chức danh, lương cơ bản.
* **Giải pháp đã thực hiện:**
  - Cung cấp **Dropdown sắp xếp nhanh** với 9 chế độ:
    * Ngày vào làm: Mới nhất trước / Cũ nhất trước.
    * Họ và tên: A → Z / Z → A.
    * Chức danh công việc: A → Z.
    * Lương cơ bản: Cao nhất trước / Thấp nhất trước.
    * Trạng thái tài khoản: Ưu tiên Hoạt động / Ưu tiên Bị khóa.
  - Hỗ trợ **Click trực tiếp vào tiêu đề các cột của bảng**:
    * Cột *Nhân viên* (Họ tên), *Chức danh công việc*, *Ngày vào làm*, *Lương & Ngân hàng*, *Trạng thái*.
    * Hiển thị ký hiệu chỉ hướng sắp xếp trực quan: `▲` (Tăng dần), `▼` (Giảm dần), `⇅` (Trung hòa).

---

### Nhóm chức năng: KHÁCH HÀNG & BẢO MẬT TÀI KHOẢN (Mã lỗi H01 - H04, Khóa tài khoản, Cấp lại/Đổi mật khẩu)
- **Thời gian hoàn thành:** 07/10/2026 01:15
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100%

#### 1. H01 – Lỗi ngày sinh không hợp lệ khi tạo & chỉnh sửa khách hàng
* **Mô tả lỗi:** Cho phép chọn ngày sinh trong tương lai (ví dụ 27/10/2026) hoặc chưa đủ tuổi tối thiểu theo quy định đăng ký tài khoản.
* **Kết quả mong đợi:** Chặn ngày sinh trong tương lai; kiểm tra độ tuổi tối thiểu $\ge 16$ tuổi; thông báo lỗi trực quan ngay trên trường nhập liệu.
* **Giải pháp đã thực hiện:**
  - Cập nhật ràng buộc tại form Thêm mới & Sửa thông tin ở cả Quản trị (`Customers.tsx`) và Cổng Khách hàng (`CustomerLayout.tsx`, `CustomerDashboard.tsx`):
    * Thuộc tính `max={today}` trên thẻ `<input type="date">` ngăn chọn ngày tương lai từ lịch.
    * Thuật toán kiểm tra chính xác:
      - `if (birthDate > today)` $\rightarrow$ Báo lỗi: *"Ngày sinh không thể lớn hơn ngày hiện tại!"*.
      - `exactAge = today.getFullYear() - birthDate.getFullYear()` (điều chỉnh theo tháng/ngày). Nếu `< 16` $\rightarrow$ Báo lỗi: *"Khách hàng phải từ đủ 16 tuổi trở lên (hiện tại X tuổi)!"*.
  - Chặn submit và hiển thị viền đỏ cảnh báo khi ngày sinh không hợp lệ.

#### 2. H02 – Lỗi hiển thị và lưu trữ ảnh đại diện (Avatar) khách hàng
* **Mô tả lỗi:** Ảnh đại diện khách hàng không hiển thị rõ ràng, dễ bị ghi đè thành ảnh mặc định khi tải lại trang hoặc backend phản hồi.
* **Kết quả mong đợi:** Hỗ trợ cả kho avatar mẫu có sẵn (Presets) và tải ảnh tùy chọn (Upload/URL); lưu trữ bền vững và hiển thị sắc nét trong bảng và hồ sơ.
* **Giải pháp đã thực hiện:**
  - Khai báo danh sách ảnh mẫu chuẩn hóa `PRESET_CUSTOMER_AVATARS` (`/images/KH/kh1.jpg` đến `kh8.jpg`) trong `mockData.ts`.
  - Bổ sung thanh chọn avatar nhanh bằng vòng tròn ảnh thumbnail ở tất cả các modal (`AddModal`, `EditModal` tại `Customers.tsx`, `EditProfileModal` tại `CustomerDashboard.tsx`).
  - Tích hợp linh hoạt với `ImageUploader` để người dùng có thể tải ảnh từ máy tính hoặc dán link URL.
  - Cập nhật `customerApi.getAll()` bảo toàn ảnh đại diện từ `crm_custom_customers` trong `localStorage`, ngăn chặn bị ghi đè.

#### 3. H03 – Hồ sơ khách hàng liên kết 360° (Lịch sử đơn hàng, lịch hẹn, đánh giá & ưu đãi CLV)
* **Mô tả lỗi:** Nhấp vào khách hàng chỉ xem được danh sách xe đơn giản, thiếu thông tin lịch sử mua hàng, lịch hẹn dịch vụ, đánh giá và chính sách ưu tiên theo CLV.
* **Kết quả mong đợi:** Xây dựng modal Hồ sơ khách hàng 360° đa chiều gồm 5 tab liên kết toàn diện.
* **Giải pháp đã thực hiện:**
  - Thiết kế và triển khai `Customer360Modal` với 5 tab chức năng chi tiết:
    1. **Tab 1 - 👑 Phân tích CLV & Ưu đãi đặc quyền:**
       - Thẻ KPI: Tổng chi tiêu tích lũy, Hạng thành viên (VIP $\ge 10$tr, Thân thiết $4 - 10$tr, Mới $< 4$tr), số đơn hàng, số lượt dịch vụ, số xe sở hữu.
       - Chính sách chăm sóc & đặc quyền chi tiết theo từng hạng CLV (giảm giá phụ tùng $10\% / 5\%$, phòng chờ VIP Lounge, ưu tiên đặt hẹn, quà tặng sinh nhật, cố vấn 1:1, xe cứu hộ).
       - Thông tin nhân khẩu học & liên hệ đầy đủ.
    2. **Tab 2 - 📦 Lịch sử Đơn hàng (Xe & Phụ tùng):**
       - Lọc dữ liệu thời gian thực từ `mockOrders` / `orderApi` theo `customerId`, email và số điện thoại.
       - Bảng đơn: Mã đơn, Loại đơn (Xe/Phụ tùng), Ngày đặt, Chi tiết sản phẩm/xe, Tổng tiền (VND), Trạng thái đơn (badge màu).
    3. **Tab 3 - 📅 Lịch sử Đặt hẹn Dịch vụ:**
       - Lọc dữ liệu từ `mockAppointments` / `appointmentApi` theo khách hàng.
       - Bảng lịch hẹn: Mã hẹn, Loại dịch vụ (Bảo dưỡng/Sửa chữa/Lái thử/Nhận xe), Thời gian hẹn, Mẫu xe & biển số, Ghi chú, Trạng thái.
    4. **Tab 4 - ⭐ Đánh giá & Khảo sát CSKH:**
       - Tích hợp từ `mockFeedbacks` / `feedbackApi` của khách hàng.
       - Hiển thị số sao đánh giá (★ 1-5), phân loại dịch vụ, nội dung phản hồi, ngày gửi.
    5. **Tab 5 - 🏍️ Xe & Bảo hành Điện tử:**
       - Hiển thị danh sách xe sở hữu, biển số, số khung (VIN), màu sắc, năm sản xuất.
       - Tình trạng hạn bảo hành và nút gia hạn trực tiếp $+12$ tháng, $+24$ tháng.
  - Thêm nút hành động nhanh **"👁️ 360°"** trên từng hàng của bảng quản lý khách hàng và cho phép click trực tiếp vào tên khách hàng.

#### 4. H04 – Đồng bộ dữ liệu CRUD khách hàng và vận hành ổn định
* **Mô tả lỗi:** Thao tác Thêm, Sửa, Xóa khách hàng chưa đồng bộ tức thời giữa Quản trị và Cổng Khách hàng.
* **Kết quả mong đợi:** Mọi thay đổi dữ liệu được lưu tức thì vào `mockCustomers`, cache `crm_custom_customers`, gửi về backend API, và phát sự kiện `crm-data-refresh`.
* **Giải pháp đã thực hiện:**
  - Hoàn thiện toàn diện luồng Thêm mới: unshift vào mảng, lưu vào `localStorage`, gọi `customerApi.create`, phát `crm-data-refresh`.
  - Hoàn thiện luồng Cập nhật: cập nhật state, sửa `mockCustomers`, lưu `localStorage`, gọi `customerApi.update`, cập nhật phiên đang đăng nhập nếu trùng.
  - Hoàn thiện luồng Xóa: xóa khỏi state, loại khỏi `mockCustomers`, xóa trong `localStorage`, gọi `customerApi.deleteCustomer`.

#### 5. Bổ sung: Khóa tài khoản Khách hàng & Nhân viên không hoạt động
* **Mô tả lỗi:** Tài khoản bị khóa nhưng vẫn có thể đăng nhập hoặc tiếp tục thao tác bình thường.
* **Kết quả mong đợi:** Khi tài khoản ở trạng thái `BiKhoa`: Chặn đăng nhập ngay từ màn hình đăng nhập (cả Admin và Client); nếu đang mở phiên làm việc thì lập tức đăng xuất và hiển thị thông báo.
* **Giải pháp đã thực hiện:**
  - **Khách hàng:**
    * Tại `AdminLogin.tsx` & `CustomerLayout.tsx`: Kiểm tra `customer.trangThai === 'BiKhoa'` / `staff.trangThai === 'BiKhoa'` và chặn đăng nhập với thông báo cảnh báo rõ ràng.
    * Tại `CustomerDashboard.tsx` & `App.tsx`: Bổ sung listener tự động phát hiện khi tài khoản bị khóa trong `localStorage`, lập tức xóa phiên và đẩy ra ngoài với thông báo giải thích.
    * Tại `Customers.tsx`: Nút "🔒 Khóa / 🔓 Mở" thao tác 1 chạm, cập nhật backend qua `PUT /api/KhachHang/khoa/{maKh}` và cập nhật phiên hiện tại.
  - **Nhân viên:**
    * Tại `StaffRoles.tsx`: Nút khóa/mở khóa nhân viên cập nhật danh sách và gọi `syncLoggedInUserSession`.
    * Tại `App.tsx`: Chặn `currentStaff` truy cập nếu có trạng thái `BiKhoa`.

#### 6. Bổ sung: Chức năng Cấp lại & Đổi mật khẩu cho Nhân viên và Khách hàng
* **Mô tả lỗi:** Thiếu chức năng sửa/đổi mật khẩu cho tài khoản nhân viên và khách hàng.
* **Kết quả mong đợi:** Admin có thể cấp lại mật khẩu cho Nhân viên và Khách hàng; Khách hàng có thể tự đổi mật khẩu cá nhân; tuân thủ chuẩn mật khẩu an toàn.
* **Giải pháp đã thực hiện:**
  - **Cấp lại mật khẩu nhân viên:**
    * Thêm nút "🔑 MK" tại bảng Nhân sự (`StaffRoles.tsx`).
    * Mở modal cấp mật khẩu mới, hỗ trợ nút "⚡ Tạo ngẫu nhiên" (ví dụ `Admin@2026`).
    * Gọi `staffApi.changePassword(staffId, newPass)` cập nhật hệ thống và lưu trữ.
  - **Cấp lại mật khẩu khách hàng (Admin):**
    * Thêm nút "🔑 MK" tại bảng Khách hàng (`Customers.tsx`) và trong modal 360°.
    * Modal hỗ trợ tạo mật khẩu ngẫu nhiên hoặc nhập tay, validate chuẩn bảo mật $\ge 8$ ký tự gồm chữ hoa, thường, số, ký tự đặc biệt.
    * Gọi `customerApi.changePassword(email, newPass)` đồng bộ với backend endpoint `POST /api/KhachHang/dat-lai-mat-khau`.
  - **Đổi mật khẩu cá nhân (Khách hàng):**
    * Thêm nút "🔑 Đổi MK" tại thanh thông tin khách hàng trong `CustomerDashboard.tsx`.
    * Mở `ChangeCustomerPasswordModal` yêu cầu nhập mật khẩu hiện tại, mật khẩu mới và xác nhận mật khẩu.
    * Tự động kiểm tra mật khẩu mạnh và thông báo thành công sau khi cập nhật.

### Nhóm chức năng: TRUNG TÂM THÔNG BÁO, ĐÁNH GIÁ PHỤ TÙNG, KHẢO SÁT XE, CHI TIÊU CLV & ĐỔI MẬT KHẨU (TB01 - TB06)
- **Thời gian hoàn thành:** 07/10/2026 21:00
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100%

#### 1. TB01 – Trung tâm thông báo Khách hàng: Tách biệt tài khoản, điều hướng & highlight chính xác
* **Mô tả lỗi:**
  - Chuông thông báo vẫn hiển thị ngay cả khi khách hàng đã đăng xuất.
  - Thông báo của tất cả các tài khoản khách hàng bị dồn chung vào một tài khoản.
  - Khi bấm vào thông báo không nhảy đúng đến đối tượng tương ứng hoặc không có hiệu ứng nhận biết.
* **Kết quả mong đợi:**
  - Ẩn hoàn toàn chuông và popover thông báo khi chưa đăng nhập (`!currentCustomer`).
  - Dữ liệu thông báo lưu trữ và truy xuất độc lập theo từng `customerId`.
  - Khi bấm vào thông báo: Tự động điều hướng đến đúng tab (Đơn hàng, Lịch hẹn, Khảo sát) và làm nổi bật mục tiêu (viền đỏ nhấp nháy, huy hiệu "MỤC ĐƯỢC CHỌN" trong 7s).
* **Giải pháp đã thực hiện:**
  - Trong `CustomerLayout.tsx`: Ẩn chuông thông báo nếu không có `currentCustomer`. Lưu trữ thông báo theo `crm_cust_notifs_${customerId}`.
  - Khi click vào thông báo: Lưu highlight vào `sessionStorage` và phát sự kiện `crm-client-highlight-trigger`.
  - Trong `CustomerDashboard.tsx`: Lắng nghe sự kiện, tự chuyển tab (`tab = 0` cho đơn hàng, `tab = 2` cho lịch hẹn, `tab = 3` cho khảo sát), kích hoạt hiệu ứng `ring-4 ring-red-500` và badge nổi bật trong 7s.
* **Kết quả test:** Đăng xuất -> Không còn chuông; Đăng nhập KH A chỉ thấy thông báo của A; Bấm thông báo đơn hàng -> Chuyển tab đơn hàng và thẻ đơn hàng được viền đỏ nhấp nháy.

#### 2. TB02 – Trung tâm thông báo Admin: Giao diện trực quan, liên kết và highlight đối tượng
* **Mô tả lỗi:**
  - Trung tâm thông báo Admin hiển thị chật hẹp, khó quan sát và thao tác.
  - Nút "Xem chi tiết" liên kết chưa đồng bộ, không làm nổi bật được đối tượng cần xem trên trang đích.
* **Kết quả mong đợi:**
  - Giao diện mở rộng rộng rãi (600px), dạng card độc lập, phân chia tab rõ ràng (Tất cả, Đơn hàng, Lịch hẹn, Khách hàng, Đánh giá, v.v.).
  - Nút "Xem chi tiết →" điều hướng đúng trang và tự động highlight hàng dữ liệu tương ứng.
* **Giải pháp đã thực hiện:**
  - `AdminLayout.tsx`: Tinh chỉnh popover thông báo rộng 600px, tab phân loại rõ ràng, nút "Xem chi tiết →" nổi bật màu đỏ.
  - Trích xuất `targetId` và lưu vào `sessionStorage.setItem('crm_admin_highlight', ...)`, phát sự kiện `crm-admin-highlight-target`.
  - Tích hợp tại các trang đích (`Sales.tsx`, `Appointments.tsx`, `Customers.tsx`, `Feedback.tsx`): Tự động điền bộ lọc tìm kiếm, cuộn đến hàng dữ liệu (`scrollIntoView`), thêm viền `ring-4 ring-red-600 animate-pulse` và badge `★ ĐANG XEM` trong 7 giây.
* **Kết quả test:** Bấm "Xem chi tiết →" từ thông báo đơn hàng -> Mở trang Bán hàng, bảng đơn tự động cuộn đến đơn hàng cần xem và viền nhấp nháy màu đỏ nổi bật.

#### 3. TB03 – Đánh giá phụ tùng: Cho phép đánh giá sau khi giao thành công & đánh giá lại khi mua tiếp
* **Mô tả lỗi:**
  - Khách hàng đã nhận hàng thành công nhưng không có nút đánh giá phụ tùng tiện lợi.
  - Khách hàng mua lại phụ tùng ở các đơn hàng sau thì bị chặn, không thể đánh giá tiếp lần nữa.
* **Kết quả mong đợi:**
  - Cho phép đánh giá từng phụ tùng trực tiếp tại danh sách đơn hàng đã hoàn tất (`HoanThanh`).
  - Mua lại phụ tùng ở đơn hàng mới thì được phép gửi đánh giá tiếp tục.
* **Giải pháp đã thực hiện:**
  - `CustomerDashboard.tsx`: Bổ sung nút "⭐ Đánh giá" cạnh từng món phụ tùng trong đơn hàng `HoanThanh`, kèm modal gửi số sao và nhận xét chi tiết.
  - `PartsStore.tsx`: Cập nhật điều kiện cho phép đánh giá lại `canReviewAgain = completedPurchaseCount > customerReviews.length`. Hiển thị banner thông báo số lần đã mua và cho phép thêm đánh giá mới cho các lần mua tiếp theo.
* **Kết quả test:** Mua đơn hàng mới hoàn thành -> Xuất hiện nút "⭐ Đánh giá"; Đã đánh giá 1 lần nhưng mua thêm đơn thứ 2 -> Tiếp tục được gửi thêm đánh giá lần 2.

#### 4. TB04 – Đổi mật khẩu tài khoản Khách hàng
* **Mô tả lỗi:** Khách hàng chưa có chức năng tự thay đổi mật khẩu tài khoản cá nhân.
* **Kết quả mong đợi:** Khách hàng có thể đổi mật khẩu bất kỳ lúc nào từ Navbar hoặc Hồ sơ cá nhân; yêu cầu nhập mật khẩu cũ để xác thực; mật khẩu mới phải đạt chuẩn an toàn.
* **Giải pháp đã thực hiện:**
  - Backend (`KhachHangController.cs`): Thêm endpoint `POST api/KhachHang/doi-mat-khau` kiểm tra mật khẩu hiện tại và kiểm tra độ mạnh mật khẩu mới ($\ge 8$ ký tự, hoa, thường, số, ký tự đặc biệt).
  - Frontend (`CustomerLayout.tsx` & `CustomerDashboard.tsx`): Thêm mục "🔑 Đổi mật khẩu" tại dropdown avatar Navbar và nút trên Dashboard; modal nhập mật khẩu cũ, mật khẩu mới, xác nhận mật khẩu có nút ẩn/hiện mắt xem.
* **Kết quả test:** Nhập sai mật khẩu cũ -> Báo lỗi; Nhập mật khẩu mới yếu -> Báo lỗi; Nhập đúng chuẩn -> Cập nhật thành công và lưu vào CSDL.

#### 5. TB05 – Tự động gửi khảo sát xe sau khi mua xe thành công
* **Mô tả lỗi:** Khách hàng mua xe, thủ tục thành công và nhận xe nhưng hệ thống chưa tự động gửi khảo sát về chiếc xe đã mua.
* **Kết quả mong đợi:** Sau khi bàn giao xe thành công (trạng thái đơn chuyển `HoanThanh`), hệ thống tự động khởi tạo 1 bài khảo sát dành riêng cho khách hàng về xe vừa mua.
* **Giải pháp đã thực hiện:**
  - Trong `api.ts` (`orderApi.updateStatus`, `orderApi.createVehicleOrder`) và `Sales.tsx`: Khi đơn hàng xe chuyển sang `HoanThanh`, tự động kích hoạt `surveyApi.createVehiclePurchaseSurvey(customerId, customerName, vehicleName)`.
  - Bài khảo sát được lưu vào hệ thống khảo sát và tạo thông báo trực tiếp đến tài khoản khách hàng.
* **Kết quả test:** Bàn giao xe thành công -> Tab Khảo sát của khách hàng xuất hiện bài khảo sát "Khảo sát chất lượng bàn giao xe mới" kèm chấm ping đỏ thông báo.

#### 6. TB06 – Sửa lỗi chi tiêu khách hàng và thanh tiến trình CLV (media_1791310978988.png)
* **Mô tả lỗi:** Thanh tiến trình thăng hạng CLV luôn hiển thị 0% và thông báo còn thiếu 4.000.000đ mặc dù khách hàng đã có đơn hàng hoàn tất.
* **Kết quả mong đợi:** Tự động tổng hợp chi tiêu thực tế từ các đơn hàng hoàn tất (`HoanThanh`) của khách, tính toán % tiến trình thăng hạng và mức chi tiêu còn thiếu chính xác.
* **Giải pháp đã thực hiện:**
  - Trong `CustomerDashboard.tsx`: Thay thế giá trị tĩnh bằng `realCustomerSpending = useMemo(...)` tính tổng `tongTien` từ tất cả đơn hàng có trạng thái `HoanThanh` hoặc `DaHoanThanh`.
  - Tự động cập nhật `currentCustomer.tongChiTieu = realCustomerSpending` và lưu vào `localStorage`.
  - Thanh tiến trình co giãn động từ 0% đến 100% theo các mốc hạng (Đồng 0đ, Bạc 5tr, Vàng 20tr, Kim cương 50tr).
* **Kết quả test:** Khách hàng có đơn hoàn tất 1.500.000đ -> Tiến trình hiển thị chính xác 30% đến hạng Bạc và còn thiếu 3.500.000đ.

---

### Nhóm chức năng: QUẢN LÝ PHƯƠNG TIỆN & BẢO HIỂM XE (Mã PT01 - PT05 theo media_1791382403343.png)
- **Thời gian hoàn thành:** 07/10/2026 22:15
- **Trạng thái:** ĐÃ HOÀN TẤT & ĐÃ BIÊN DỊCH THÀNH CÔNG 100%

#### 1. PT01 – Nguồn gốc phương tiện: Phân biệt "Mua tại cửa hàng" vs "Xe mua ngoài hệ thống"
* **Mô tả yêu cầu:**
  - Xe do khách hàng tự đăng ký trên Web mặc định là "Xe mua ngoài hệ thống" (`nguonGoc: 'NgoaiHeThong'`), trạng thái ban đầu là "Chờ duyệt" (`trangThaiDuyet: 'ChoDuyet'`).
  - Xe do nhân viên tạo (lấy từ đơn hàng bán xe hoàn tất tại showroom) được xem là "Mua tại cửa hàng" (`nguonGoc: 'CuaHang'`), trạng thái "Đã duyệt" (`trangThaiDuyet: 'DaDuyet'`).
* **Giải pháp đã thực hiện:**
  - Cập nhật interface `Vehicle` trong `mockData.ts` bổ sung `nguonGoc?: 'CuaHang' | 'NgoaiHeThong'`, `ngayMua?: string`, `soMay?: string`, và `trangThaiBaoHanh` hỗ trợ thêm `'KhongApDung'`.
  - Trong `api.ts` (`vehicleApi.registerVehicle`): Gán mặc định `nguonGoc = 'NgoaiHeThong'`, `trangThaiDuyet = 'ChoDuyet'`, `trangThaiBaoHanh = 'KhongApDung'`.
  - Trong `api.ts` (`vehicleApi.createSoldVehicle`): Gán mặc định `nguonGoc = 'CuaHang'`, `trangThaiDuyet = 'DaDuyet'`, `trangThaiBaoHanh = 'ConHan'`.
* **Kết quả test:** Đăng ký xe mới trên web -> Xe tự động gắn nhãn "Xe mua ngoài hệ thống" và "Chờ duyệt"; Xe tạo từ đơn hàng -> Gắn nhãn "Mua tại cửa hàng" và có bảo hành chính hãng.

#### 2. PT02 – Quyền & Khóa chức năng Xem bảo hành
* **Mô tả yêu cầu:**
  - Chỉ có xe "Mua tại cửa hàng" mới có chức năng xem sổ bảo hành điện tử chính hãng.
  - Khi xe đã hết hạn bảo hành hoặc đối với xe mua ngoài hệ thống, nút "Xem bảo hành" phải bị KHÓA (`disabled`, icon 🔒, nền xám).
* **Giải pháp đã thực hiện:**
  - `CustomerDashboard.tsx`:
    * Xe mua tại cửa hàng còn hạn (`nguonGoc === 'CuaHang'` && `trangThaiBaoHanh === 'ConHan'`): Hiển thị nút `[📅 Xem bảo hành]`, click mở modal **SỔ BẢO HÀNH ĐIỆN TỬ CHÍNH HÃNG** (có mã số BH, số khung, số máy, thời hạn 36 tháng/30.000km, dấu xác thực điện tử và nút in sổ).
    * Xe hết hạn bảo hành: Mục bảo hành hiển thị `✕ Đã hết hạn`, nút chuyển thành `[🔒 Xem bảo hành]` (disabled, tooltip giải thích lý do).
    * Xe mua ngoài hệ thống: Mục bảo hành hiển thị `⚪ KHÔNG ÁP DỤNG` ("Bảo hành cửa hàng không áp dụng cho xe mua ngoài"), nút chuyển thành `[🔒 Xem bảo hành]` (disabled).
* **Kết quả test:** Xe Honda Vision 110 (còn hạn) -> Mở được Sổ bảo hành; Xe Air Blade 125 (hết hạn) -> Nút bị khóa; Xe SH 160i (mua ngoài) -> Nút bị khóa.

#### 3. PT03 – Tích hợp bảo hiểm xe & Tự động chuyển đổi nút "Mua bảo hiểm" -> "Xem bảo hiểm"
* **Mô tả yêu cầu:**
  - Xe chưa có bảo hiểm: Hiển thị mục `⚪ CHƯA CÓ BẢO HIỂM` và có nút `[🛡️ Mua bảo hiểm]`.
  - Xe đã có bảo hiểm: Hiển thị mục `🔵 ĐANG HIỆU LỰC` kèm tên gói + HSD, có nút `[🛡️ Xem bảo hiểm]`.
  - Khi khách hàng bấm "Mua bảo hiểm" và hoàn tất mua xe máy, nút đó trên thẻ xe lập tức chuyển thành `[🛡️ Xem bảo hiểm]`.
* **Giải pháp đã thực hiện:**
  - `CustomerDashboard.tsx`:
    * Kiểm tra hợp đồng bảo hiểm theo từng xe (`myInsurances.find(ins => ins.vehicleId === v.id || ins.bienSo === v.bienSo)`).
    * Nếu xe chưa có bảo hiểm: Render nút `[🛡️ Mua bảo hiểm]`, click mở modal đăng ký bảo hiểm xe đã tự động điền sẵn tên xe, biển số, số khung.
    * Khi submit hoàn tất mua: `insuranceApi.create` lưu hợp đồng mới vào `myInsurances`. State cập nhật tức thì làm `curIns` tìm thấy hợp đồng mới -> Nút `[🛡️ Mua bảo hiểm]` LẬP TỨC chuyển thành `[🛡️ Xem bảo hiểm]`!
    * Nút `[🛡️ Xem bảo hiểm]`: Click mở modal **GIẤY CHỨNG NHẬN BẢO HIỂM ĐIỆN TỬ** (chuẩn Nghị định 67/2023/NĐ-CP, có số GCN, thời hạn, phí bảo hiểm, nút in chứng nhận).
* **Kết quả test:** Xe chưa có bảo hiểm bấm "Mua bảo hiểm" -> Điền thông tin & xác nhận -> Nút trên thẻ xe chuyển ngay lập tức sang "Xem bảo hiểm", bấm vào xem trọn vẹn Giấy chứng nhận điện tử.

#### 4. PT04 – Trang Quản trị Admin: Duyệt xe, gắn tài khoản & Hiển thị xe khách sở hữu
* **Mô tả yêu cầu:**
  - Khi nhân viên xử lý/duyệt xe thì xe phải gắn chính thức vào tài khoản khách hàng.
  - Bên trang Admin Khách hàng: Phải hiển thị đầy đủ các xe khách hàng đã đăng ký sở hữu (cả mua tại showroom và mua ngoài hệ thống).
* **Giải pháp đã thực hiện:**
  - `Customers.tsx`:
    * Trong Bảng danh sách khách hàng: Thêm tag hiển thị số lượng xe sở hữu, biển số từng xe (badge xanh lá cho xe cửa hàng, badge slate cho xe mua ngoài, badge nhấp nháy `⏳ Chờ duyệt` nếu có xe vừa đăng ký chờ duyệt).
    * Trong Modal Hồ sơ 360° (Tab 5 "🏍️ Xe & Bảo hành"): Hiển thị đầy đủ mọi xe của khách hàng; hiển thị rõ nguồn gốc; nếu xe có trạng thái `ChoDuyet` thì hiển thị banner cảnh báo kèm nút `[✓ Duyệt xe & Gắn tài khoản]`.
    * Khi nhân viên bấm duyệt xe: Gọi `vehicleApi.approveVehicle(v.id)`, cập nhật `trangThaiDuyet = 'DaDuyet'`, gắn xe vào `soXe` của khách hàng, lưu cache `crm_custom_customers` & `crm_customer_vehicles`, đồng thời gửi thông báo realtime `addCustomerNotification` trực tiếp cho khách hàng.
* **Kết quả test:** Khách đăng ký xe ngoài -> Admin thấy ngay badge "⏳ Chờ duyệt" trên bảng khách hàng; Admin mở Hồ sơ 360° bấm "Duyệt xe & Gắn tài khoản" -> Xe chuyển thành đã duyệt và gắn vào tài khoản khách hàng thành công.

#### 5. PT05 – Giao diện trang "Phương tiện của tôi" theo đúng mockup media_1791382403343.png
* **Mô tả yêu cầu:** Thiết kế giao diện Phương tiện của tôi chuẩn 100% theo ảnh tham khảo mockup.
* **Giải pháp đã thực hiện:**
  - Header: Tiêu đề in hoa `PHƯƠNG TIỆN CỦA TÔI`, subtitle mô tả và nút đỏ `+ THÊM PHƯƠNG TIỆN`.
  - Bộ lọc Filter chips ngang: `Tất cả (count)`, `✓ Mua tại cửa hàng (count)`, `Xe mua ngoài hệ thống (count)`, `Đang bảo hành (count)`, `Có bảo hiểm (count)`.
  - Subtitle: `DANH SÁCH PHƯƠNG TIỆN (count)`.
  - Grid 3 cột các thẻ xe: Badge nguồn gốc, ảnh xe kèm biển số, tên xe in hoa, mục BẢO HÀNH ĐIỆN TỬ, mục BẢO HIỂM XE MÁY, và lưới 4 nút: `[🔍 Xem chi tiết]`, `[📅/🔒 Xem bảo hành]`, `[🛡️ Xem/Mua bảo hiểm]`, `[📅 Đặt lịch]`.
  - Modal Xem chi tiết phương tiện (`selectedDetailVehicle`) và Modal Sổ bảo hành điện tử chính hãng (`selectedWarrantyVehicle`).
* **Kết quả test:** Giao diện trực quan, sang trọng, responsive mượt mà trên cả desktop và mobile, build pass 0 lỗi TypeScript.

---

### Nhóm chức năng: ĐỒNG BỘ CHI TIÊU, XÓA TÀI KHOẢN, QUY TRÌNH BIỂN SỐ & CÀ VẸT XE, TRUNG TÂM THÔNG BÁO (Mã KH01 - KH04)
- **Thời gian hoàn thành:** 07/10/2026 23:30
- **Trạng thái:** ĐÃ HOÀN TẤT & ĐÃ BIÊN DỊCH VITE BUILD THÀNH CÔNG 100%

#### 1. KH01 – Xóa tài khoản khách hàng chưa hoạt động (Khắc phục lỗi khóa ngoại FK SQL Server & Dọn dẹp Frontend)
* **Mô tả lỗi:**
  - Khi nhân viên bấm "Xóa khách hàng" trên trang Admin `Customers.tsx`, Backend `CrmBackend` gặp lỗi xung đột khóa ngoại (Foreign Key Constraint Violation) do các bản ghi liên quan trong các bảng `DON_HANG`, `CHI_TIET_DON_HANG`, `LICH_HEN`, `PHAN_HOI`, `KET_QUA_KHAO_SAT`, `XE_KHACH_HANG` và `TAI_KHOAN`.
  - Frontend vẫn giữ cache cũ trong localStorage (`crm_custom_customers`, xe, đơn hàng), dẫn đến xóa ảo hoặc lỗi hệ thống.
* **Kết quả mong đợi:**
  - Cho phép xóa sạch tài khoản khách hàng an toàn bằng Transaction Cascade ở CSDL SQL Server và dọn sạch dữ liệu liên quan ở frontend.
* **Giải pháp đã thực hiện:**
  - Backend (`KhachHangController.cs`): Chuyển endpoint `DELETE api/KhachHang/{id}` sang khối `using var trans = await _db.Database.BeginTransactionAsync()` xóa cascade tuần tự:
    1. Xóa `CHI_TIET_DON_HANG` thuộc các đơn hàng của khách.
    2. Xóa `DON_HANG` của khách.
    3. Xóa `LICH_HEN` của khách.
    4. Xóa `PHAN_HOI` của khách.
    5. Xóa `KET_QUA_KHAO_SAT` của khách.
    6. Xóa `XE_KHACH_HANG` của khách.
    7. Xóa `KHACH_HANG`.
    8. Xóa tài khoản đăng nhập tương ứng trong bảng `TAI_KHOAN` (theo `TenDangNhap = SĐT`).
    9. `Commit` giao dịch an toàn.
  - Frontend (`api.ts` & `Customers.tsx`):
    - `customerApi.deleteCustomer`: Dọn sạch `mockCustomers`, `crm_custom_customers`, xóa các xe của khách trong `crm_customer_vehicles`, xóa các đơn hàng trong `crm_custom_orders`, và đăng xuất tự động nếu trùng tài khoản đang đăng nhập.
    - `handleDeleteCustomer`: Thực thi bất đồng bộ `async/await`, cập nhật tức thì danh sách trên state và phát sự kiện `crm-customer-data-changed`.
* **Kết quả test:** Xóa khách hàng trên Admin -> CSDL xóa sạch từ gốc, bảng danh sách khách hàng cập nhật ngay lập tức mà không gặp lỗi khóa ngoại.

#### 2. KH02 – Đồng bộ chi tiêu khách hàng giữa Server, Admin và Customer (Sửa lỗi media_1791386598061.png)
* **Mô tả lỗi:**
  - Theo ảnh `media_1791386598061.png`, cột "Chi tiêu & Hạng CLV" trên Admin `Customers.tsx` hiển thị `0 đ - Khách mới` dù khách hàng đã có đơn mua hàng hoàn tất.
  - Bảng `KHACH_HANG` trong CSDL không lưu tổng chi tiêu, và API Backend chưa tính tổng đơn hàng hoàn tất.
* **Kết quả mong đợi:**
  - Cột "Chi tiêu & Hạng CLV" ở Admin và trên Customer Dashboard phải đồng bộ hoàn toàn với tổng giá trị các đơn hàng hoàn tất (`HoanThanh`).
* **Giải pháp đã thực hiện:**
  - Backend (`KhachHang.cs` & `KhachHangController.cs`):
    - Bổ sung trường `public decimal TongChiTieu { get; set; }` vào DTO `KhachHangDto`.
    - Trong `GetAll()` và `GetById()`: Thêm subquery SQL tính realtime:
      `TongChiTieu = ISNULL((SELECT SUM(TongTien) FROM DON_HANG WHERE MaKH = k.MaKH AND TrangThai IN (N'Hoàn thành', N'HoanThanh', N'DaHoanThanh', N'Đã hoàn thành')), 0)`.
  - Frontend (`Customers.tsx`):
    - Nạp đồng thời `customerApi.getAll()` và `orderApi.getAll()`.
    - Tính động `realSpent = Math.max(c.tongChiTieu || 0, sum(đơn HoanThanh của khách))`.
    - Hiển thị `{formatVND(realSpent)}` kèm phân hạng CLV realtime (Đồng: 0đ, Bạc: từ 5tr, Vàng: từ 20tr, Kim cương: từ 50tr) khắc phục 100% tình trạng lệch chi tiêu.
* **Kết quả test:** Khách hàng có đơn hoàn thành 50.490.000đ -> Admin hiển thị ngay `50.490.000 đ - Kim cương` khớp hoàn toàn với Customer Dashboard.

#### 3. KH03 – Quy trình cấp & phê duyệt Biển số xe & Cà vẹt xe (Xe mua tại Showroom & Xe đăng ký ngoài hệ thống)
* **Mô tả yêu cầu:**
  - **Xe mua tại showroom:** Sau khi khách hàng hoàn tất thủ tục cọc/mua xe, xe được tự động gắn vào tài khoản ở trạng thái "Chưa có biển số". Khách hàng có nút cập nhật biển số xe kèm tải ảnh Cà vẹt xe (giấy đăng ký xe). Nhân viên Admin duyệt thì biển số mới chính thức hiển thị trên hồ sơ và sổ bảo hành.
  - **Xe đăng ký ngoài hệ thống:** Khi khách hàng tự đăng ký xe trên Web, bắt buộc phải tải lên ảnh Cà vẹt xe. Nhân viên kiểm tra ảnh cà vẹt trước khi bấm duyệt xe gắn vào tài khoản.
* **Giải pháp đã thực hiện:**
  - Frontend Model & API (`mockData.ts`, `api.ts`):
    - Mở rộng interface `Vehicle`: `anhCaVet?: string`, `bienSoChoDuyet?: string`, `trangThaiDuyetBienSo?: 'ChoCapNhat' | 'ChoDuyet' | 'DaDuyet'`.
    - `vehicleApi.createSoldVehicle`: Tự động khởi tạo xe với `bienSo: 'Chưa có biển số'` và `trangThaiDuyetBienSo: 'ChoCapNhat'`.
    - `vehicleApi.requestLicensePlateUpdate`: Lưu biển số đề xuất, lưu ảnh cà vẹt, chuyển trạng thái `ChoDuyet`, bắn thông báo cho Showroom và Khách hàng.
    - `vehicleApi.approveLicensePlate`: Nhân viên duyệt -> biển số chính thức cập nhật, chuyển `DaDuyet`.
    - `vehicleApi.registerVehicle`: Bắt buộc đính kèm `anhCaVet`, chuyển sang trạng thái `ChoDuyet`.
  - Customer (`CustomerDashboard.tsx`):
    - Thẻ xe Tab 0: Xe chưa có biển số hiển thị badge vàng `⚠️ Chưa có biển số` kèm banner hướng dẫn và nút `[📋 Cập nhật Biển số & Tải Cà vẹt xe]`.
    - Modal `UpdatePlateModal`: Khách nhập biển số mong muốn + tải ảnh Cà vẹt xe (hỗ trợ preview ảnh tức thì và bộ ảnh mẫu).
    - Modal Đăng ký xe ngoài (`AddVehicleModal`): Bổ sung bắt buộc ô upload ảnh Cà vẹt xe, validate chặt chẽ nếu chưa chọn ảnh.
  - Admin (`Customers.tsx`):
    - Tab 5 "Xe & Bảo hành": Thêm khung xem ảnh Cà vẹt xe với tính năng phóng to popup `previewCaVetUrl`.
    - Xe mua showroom có biển số chờ duyệt: Hiển thị nút `[✓ Phê duyệt biển số (BS đề xuất)]`.
    - Xe ngoài hệ thống: Hiển thị nút `[✓ Duyệt xe & Cà vẹt]`.
* **Kết quả test:** Khách đặt xe -> Xe ở trạng thái Chưa có biển số -> Khách gửi biển số & ảnh cà vẹt -> Admin kiểm tra ảnh cà vẹt và bấm phê duyệt -> Biển số chính thức xuất hiện trên thẻ xe và sổ bảo hành của khách.

#### 4. KH04 – Trung tâm thông báo tương tác hai chiều & Highlight mục tiêu khi nhấp vào thông báo
* **Mô tả yêu cầu:**
  - Khi khách hàng mua xe, mua phụ tùng, đặt lịch hẹn thành công hoặc thất bại, hệ thống gửi thông báo cho khách hàng biết.
  - Khi nhấp vào thông báo, chuyển đến đúng trang/tab và làm nổi bật (highlight, cuộn tới) mục tương ứng.
* **Giải pháp đã thực hiện:**
  - `Checkout.tsx`: Bắn `addCustomerNotification` thông báo thành công hoặc thất bại khi đặt mua phụ tùng.
  - `VehiclesShowroom.tsx`: Bắn thông báo chúc mừng đặt xe thành công, kèm hướng dẫn nhận xe và cập nhật biển số.
  - `ServiceBooking.tsx`: Bắn thông báo đặt lịch hẹn thành công hoặc thất bại.
  - `CustomerLayout.tsx`: Click thông báo sẽ điều hướng chính xác về `tab` tương ứng trên `CustomerDashboard.tsx` (`orders`, `vehicles`, `appts`, `surveys`), đồng thời truyền `highlightTargetId`.
  - `CustomerDashboard.tsx`: Thêm hiệu ứng viền đỏ `animate-pulse` và huy hiệu `★ MỤC ĐƯỢC CHỌN` trong 6 giây tại xe/đơn hàng/lịch hẹn được trỏ tới từ thông báo.
* **Kết quả test:** Đặt mua phụ tùng/xe -> Nhận thông báo tức thì; Nhấp vào thông báo -> Chuyển sang đúng tab và thẻ tương ứng phát sáng viền đỏ nổi bật.

---

### Nhóm chức năng: BẢO HÀNH TOÀN DIỆN (Mã lỗi BH01 - BH05)
- **Thời gian hoàn thành:** 08/10/2026 16:15
- **Tài liệu tham khảo:** 5 hình ảnh mockup & flowchart (`media_1791439256831.png`, `media_1791439256830.png`, `media_1791439256835.png`, `media_1791439256839.png`, `media_1791439256844.png`, `media_1791440662731.png`)
- **Trạng thái:** ĐÃ FIX & TEST HOÀN TẤT 100%

#### 1. BH01 – Trang Chi tiết bảo hành phương tiện (Chuẩn 100% Mockup Ảnh 1 - media_1791439256831.png)
* **Mô tả yêu cầu:**
  - Khách hàng bấm "Xem bảo hành" trên thẻ xe sẽ chuyển sang trang chi tiết bảo hành riêng biệt.
  - Card chính: Thông tin xe, huy hiệu "ĐANG TRONG HẠN BẢO HÀNH", 2 thanh Progress bar trực quan (Thời hạn % / 36 tháng; Quãng đường % / 30.000 km).
  - 3 nút hành động chuẩn: "Gia hạn bảo hành", "Yêu cầu bảo hành", "Tải sổ bảo hành điện tử".
  - Timeline Lịch sử bảo hành dọc: Hiển thị đầy đủ mã phiếu `#BH-...`, ngày thực hiện, chi nhánh, ODO, KTV, linh kiện thay thế, chi phí 0đ, trạng thái Hoàn tất.
  - Card Gói bảo hành mở rộng Care+ (1 Năm & 2 Năm) và Card Điều kiện & Chính sách bảo hành chính hãng.
* **Giải pháp đã thực hiện:**
  - Xây dựng component `WarrantyDetailView` trong `WarrantyViews.tsx`.
  - Kết nối trạng thái với `CustomerDashboard.tsx`.
  - Chức năng "Tải sổ bảo hành điện tử": Tự động tạo và tải xuống file sổ bảo hành dạng chứng từ điện tử đầy đủ thông số phương tiện và lịch sử sửa chữa.

#### 2. BH02 – Form Gửi yêu cầu kiểm tra bảo hành (Chuẩn 100% Mockup Ảnh 3 - media_1791439256835.png)
* **Mô tả yêu cầu:**
  - Khách hàng điền thông tin tình trạng xe để gửi lịch hẹn bảo hành tới đại lý.
  - Form 6 mục: 1. Vấn đề xe gặp phải (checkbox đa chọn các nhóm lỗi: Động cơ, Điện, Phanh, Phuộc, Thân vỏ, Khác); 2. Mô tả chi tiết; 3. Số KM Odo; 4. Upload ảnh/video lỗi; 5. Chọn ngày giờ & chi nhánh; 6. Thông tin khách hàng.
  - Cột phải hiển thị thẻ tóm tắt phương tiện và hotline kỹ thuật 1900 8888.
* **Giải pháp đã thực hiện:**
  - Xây dựng component `WarrantyClaimFormView` trong `WarrantyViews.tsx`.
  - Tích hợp kiểm tra validate bắt buộc chọn ít nhất 1 vấn đề và nhập mô tả.
  - Tích hợp công cụ tải ảnh minh họa đa nguồn (chọn file máy tính hoặc dán URL) kèm preview và xóa ảnh.
  - Tự động sinh mã phiếu `#BH-DDMMYY-XX`, gửi thông báo cho khách và Admin.

#### 3. BH03 – Trang Quản lý Lịch hẹn Bảo hành Admin (Chuẩn 100% Mockup Ảnh 4 - media_1791439256839.png)
* **Mô tả yêu cầu:**
  - Giao diện Admin quản lý danh sách yêu cầu bảo hành với bộ lọc tabs đếm số lượng (Tất cả, Chờ xác nhận, Đã xác nhận, Đang xử lý, Hoàn tất, Từ chối).
  - Bộ lọc thời gian (Tuần này, Tháng này), lọc chi nhánh, ô tìm kiếm mã phiếu / tên khách / biển số.
  - Nút thao tác nhanh "Xác nhận yêu cầu" ngay tại hàng bảng và nút "Xem chi tiết".
  - Nút "Đặt lịch tại quầy" mở modal tiếp nhận xe trực tiếp cho khách vãng lai.
* **Giải pháp đã thực hiện:**
  - Xây dựng trang Admin `Warranty.tsx` (`WarrantyPage`).
  - Menu Admin: Thêm mục "Yêu cầu bảo hành" kèm icon cờ lê `wrench` trong `AdminLayout.tsx`.
  - Nút Xác nhận nhanh: Chuyển trạng thái sang `DaXacNhan` và gửi thông báo xác nhận cho khách hàng tức thì.

#### 4. BH04 – Trang Thẩm định kỹ thuật KTV & Luồng rẽ nhánh quyết định (Chuẩn 100% Mockup Ảnh 5 & Flowchart Ảnh 2 & Flow)
* **Mô tả yêu cầu:**
  - Khi xe đến xưởng và trạng thái đạt "Đã xác nhận", nhân viên/KTV cập nhật "Tiếp nhận xe" -> "Đang kiểm tra".
  - Form Thẩm định KTV: Ghi nhận bộ phận hư hỏng, ODO thực tế, ảnh kiểm tra tại xưởng, kết luận KTV.
  - Bảng Quyết định phương án xử lý (Flowchart):
    * **Nhánh 1 (ĐƯỢC BẢO HÀNH - 0 đ):** Lỗi thuộc trách nhiệm nhà sản xuất -> Chuyển sang "Đang sửa chữa BH" -> "Kiểm tra sau sửa BH" -> "Hoàn tất" (In Phiếu bảo hành 0 đ & tự động ghi vào Lịch sử bảo hành xe).
    * **Nhánh 2 (TỪ CHỐI BẢO HÀNH):** Xe độ chế hoặc lỗi do người dùng:
      + *TH1: Khách hàng đồng ý sửa chữa có phí:* KTV báo giá -> "Đang sửa chữa có phí" -> "Kiểm tra sau sửa" -> "Hoàn tất" (In Hóa đơn sửa chữa có phí).
      + *TH2: Khách hàng không đồng ý sửa chữa:* Đóng yêu cầu -> Trả xe nguyên trạng (In Biên bản bàn giao trả xe).
* **Giải pháp đã thực hiện:**
  - Xây dựng chi tiết luồng workflow trong `warrantyApi` (`api.ts`) và View chi tiết yêu cầu trong `Warranty.tsx`.
  - Thanh Timeline 6 bước tiến trình tương tác trực quan.
  - Radio chọn 3 phương án quyết định rõ ràng kèm input báo giá linh hoạt.
  - Cập nhật tự động vào `WarrantyRecord` của xe khi hoàn tất bảo hành.

#### 5. BH05 – Hệ thống In ấn Chứng từ Bảo hành & Gói mở rộng Care+
* **Mô tả yêu cầu:**
  - Tại bước Hoàn tất hoặc Đóng yêu cầu, cung cấp chức năng in ấn các loại chứng từ:
    * **Phiếu bảo hành điện tử (0 đ):** Thể hiện chi tiết phụ tùng miễn phí 100%.
    * **Hóa đơn sửa chữa dịch vụ:** Thể hiện chi tiết linh kiện tính phí và tiền công.
    * **Biên bản bàn giao trả xe:** Thể hiện tình trạng xe nguyên trạng khi khách từ chối sửa.
  - Cung cấp tính năng mua và kích hoạt Gói bảo hành mở rộng Care+ (1 Năm & 2 Năm) tự động cộng nối tiếp thời hạn bảo hành cho xe.
* **Giải pháp đã thực hiện:**
  - Modal in ấn chứng từ trực tiếp chuẩn in khổ A4 / POS trong `Warranty.tsx`.
  - Modal `ExtendedWarrantyModal` trong `WarrantyViews.tsx` cho phép khách hàng gia hạn xe một chạm.
  - Đã kiểm tra biên dịch Vite & TypeScript: **0 errors, build thành công 100%**.

### Nhóm chức năng: GIA HẠN BẢO HÀNH MỞ RỘNG (4 BƯỚC) & ĐĂNG KÝ BẢO HIỂM PHƯƠNG TIỆN (WEB & ADMIN POS)
- **Thời gian hoàn thành:** 09/10/2026 00:05
- **Trạng thái:** ĐÃ FIX & ĐÃ KIỂM THỬ THÀNH CÔNG 100%

#### 1. GHBH01 – Wizard Gia Hạn Bảo Hành Mở Rộng 4 Bước (Chuẩn 100% Mockup 1-4 & Flow)
* **Mô tả yêu cầu:**
  - Quy trình 4 bước thẩm định và mua bảo hành mở rộng chính hãng:
    * **Bước 1 (Xác nhận thông tin & Minh chứng ODO - Mockup 1):** Tự động nạp thông tin xe và chủ sở hữu; Khách hàng nhập số km ODO thực tế; Bắt buộc upload minh chứng (tối đa 4 ảnh/video: đồng hồ ODO, xe nhìn nghiêng, mặt trước); Checkbox cam kết thông tin trung thực.
    * **Bước 2 (Kiểm tra điều kiện thẩm định - Mockup 2 & 3):** Xét duyệt tự động lịch sử bảo dưỡng & sửa chữa qua 3 tiêu chí cốt lõi:
      - ODO dưới 30.000 km.
      - Bảo dưỡng định kỳ tối thiểu 3 lần/năm tại hệ thống.
      - 100% linh kiện sửa chữa chính hãng.
      - *TH1 (Đạt điều kiện - Mockup 2):* 3 tiêu chí tích xanh, mở nút "Tiếp tục sang bước chọn gói".
      - *TH2 (Không đạt - Mockup 3):* Báo đỏ tiêu chí vi phạm, timeline chỉ rõ lần can thiệp ngoài, khóa nút tiếp tục, hiển thị nút "Liên hệ hỗ trợ".
    * **Bước 3 (Chọn gói bảo hành mở rộng - Mockup 4):** Lưới các gói bảo hành phân cấp; chỉ cho phép chọn những gói đủ điều kiện (Gói Tiêu chuẩn 1 năm 350.000đ, Gói Toàn diện 2 năm 600.000đ); khóa các gói không đủ điều kiện có kèm lý do rõ ràng (Gói 3 năm 850.000đ khóa do xe quá 1 năm; Gói Côn tay khóa do là xe tay ga).
    * **Bước 4 (Thanh toán & Nối hạn bảo hành):** Hóa đơn điện tử, cổng thanh toán VietQR (mô phỏng quét mã, thành công / thất bại), tự động cộng nối hạn bảo hành vào Sổ bảo hành điện tử.
* **Giải pháp đã thực hiện:**
  - Xây dựng component `WarrantyExtensionWizard.tsx` (`src/components/customer/WarrantyExtensionWizard.tsx`).
  - Tích hợp vào `CustomerDashboard.tsx` tại Tab Phương tiện khi khách chọn nút "Gia hạn BH mở rộng".
  - Bổ sung `warrantyApi.verifyWarrantyExtension` và `warrantyApi.buyExtendedWarranty` trong `api.ts`.

#### 2. BHX06 – Đăng ký & Mua Bảo Hiểm Xe Trên Web Khách Hàng (Chuẩn 100% Mockup 1)
* **Mô tả yêu cầu:**
  - Khách hàng mua bảo hiểm trực tuyến:
    * Nhập thông tin KH: tự động điền từ tài khoản, có icon bút chì ✏️ để chỉnh sửa nhanh.
    * Chọn phương tiện: danh sách xe dạng radio cards, có nút `+ Thêm phương tiện mới` (chuyển nhanh sang form đăng ký xe).
    * Chọn gói bảo hiểm: 3 gói chuẩn (Cơ bản 66.000đ, Nâng cao 150.000đ, Toàn diện 1.250.000đ); thời hạn 1-3 năm; mã giảm giá.
    * Xem trước **Hợp đồng bảo hiểm Demo** chuẩn pháp lý trước khi thanh toán.
    * **Bắt buộc chuyển khoản ngân hàng (VietQR)** theo yêu cầu thiết kế web.
    * Thanh toán thành công: Hợp đồng tự động lưu vào lịch sử, xem và in GCN điện tử bất cứ lúc nào, hỗ trợ chức năng **Gia hạn hợp đồng**.
* **Giải pháp đã thực hiện:**
  - Xây dựng component `OnlineInsurancePurchaseView.tsx` (`src/components/customer/OnlineInsurancePurchaseView.tsx`).
  - Tích hợp vào Tab 2 (Bảo hiểm) của `CustomerDashboard.tsx`.
  - Hỗ trợ modal xem Demo Hợp đồng và popup VietQR thanh toán bắt buộc.

#### 3. BHX07 – Đăng ký Bảo Hiểm Tại Cửa Hàng POS Cho Nhân Viên (Chuẩn 100% Mockup 2)
* **Mô tả yêu cầu:**
  - Nhân viên trực tiếp tạo đơn tại quầy:
    * Ấn nút "Đăng ký bảo hiểm tại quầy (POS)".
    * **Tìm kiếm tài khoản khách hàng:** thông qua SĐT hoặc Email do khách hàng cung cấp (autocomplete gợi ý realtime).
    * **Chọn phương tiện mua hàng:** chỉ hiển thị các xe thuộc sở hữu của tài khoản khách hàng đó, có tùy chọn thêm xe mới nếu cần.
    * **Chọn gói bảo hiểm:** 3 gói theo quy định (Cơ bản 66k, Nâng cao 150k, Toàn diện 1.250k), thời hạn 1-3 năm, mã giảm giá.
    * **Phương thức thanh toán:** linh hoạt chọn **Tiền mặt tại quầy** HOẶC **Chuyển khoản VietQR**.
    * Thanh toán thành công: Lưu vào lịch sử hệ thống, in Giấy chứng nhận / Hóa đơn ngay tức thì.
    * Chức năng **Gia hạn hợp đồng tại quầy**: Nút `[🔄 Gia hạn]` trực tiếp trên bảng quản trị.
* **Giải pháp đã thực hiện:**
  - Nâng cấp toàn diện Modal Cấp Mới trong `Insurance.tsx` (`src/pages/admin/Insurance.tsx`).
  - Tích hợp tìm kiếm tài khoản theo SĐT/Email, autocomplete danh sách khách hàng khớp.
  - Lọc chính xác xe theo `customerId`, hỗ trợ nhập xe mới.
  - Xây dựng component tái sử dụng `RenewInsuranceModal.tsx` (`src/components/customer/RenewInsuranceModal.tsx`) dùng chung cho cả Web Khách hàng (bắt buộc VietQR) và Admin POS (chọn tiền mặt hoặc VietQR).
  - Bổ sung `insuranceApi.renewContract` tự động tính nối tiếp thời hạn từ ngày kết thúc cũ, cấp số GCN mới và gửi thông báo đa kênh.
  - Đã kiểm tra biên dịch toàn diện: `npm run build` thành công 100% (0 lỗi).




### Nhóm chức năng: TÁI CẤU TRÚC GIAO DIỆN CÁ NHÂN KHÁCH HÀNG & ĐỒNG BỘ FE-BE (Mã: UI-CUST-01 - UI-CUST-08)
- **Thời gian hoàn thành:** 09/10/2026 16:05
- **Trạng thái:** ĐÃ HOÀN THÀNH 100% THEO ĐÚNG BỘ 8 MOCKUP & BIÊN DỊCH 0 LỖI (VITE + TYPESCRIPT)

#### 1. UI-CUST-01 – Thiết kế lại Layout Cá Nhân: Sidebar dọc 6 mục chuẩn Dark Theme (Ảnh 1 - 8)
* **Mô tả yêu cầu:**
  - Chuyển đổi toàn bộ layout trang cá nhân `CustomerDashboard.tsx` từ dạng thanh tab ngang sang **Sidebar dọc bên trái** nền tối sang trọng (`#141416`), viền ngăn cách `#27272a`.
  - 6 mục điều hướng chuẩn:
    1. `🏍️ Phương tiện của tôi` (Tab 0)
    2. `🛍️ Đơn mua hàng` (Tab 1)
    3. `📅 Lịch hẹn` (Tab 2)
    4. `🕒 Lịch sử dịch vụ` (Tab 3)
    5. `🛡️ Bảo hiểm` (Tab 4)
    6. `📝 Khảo sát & Đánh giá` (Tab 5)
  - Hiệu ứng active: viền bo tròn nền đỏ mờ (`bg-red-950/50 text-red-400 border border-red-800/80`).

#### 2. UI-CUST-02 – Tab 0: Phương tiện của tôi (Chuẩn Ảnh 1)
* **Mô tả yêu cầu:**
  - Header lời chào: *"Chào buổi sáng, {Tên khách hàng}"* - *"Mọi thông tin về bạn và những hành trình, trong một không gian."*
  - Card 1: Avatar đỏ viền tròn, Mã KH `AU-008246`, SĐT, Email, nút `[Chỉnh sửa thông tin ✏️]`.
  - Card 2: Thành viên Autora - `Hạng VIP` [Đặc quyền], Hạn đến 31/12/2026, link `Xem quyền lợi thành viên`.
  - 5 thẻ thống kê (Stats): Tổng tiền đã chi tiêu (`158.500.000 đ`), Phương tiện (`02`), Đơn hàng (`08`), Bảo hiểm (`02`), Bảo hành (`02`).
  - Lưới thẻ xe thể thao: Badge xuất xứ (`Xe mua tại hệ thống` / `Xe mua ngoài hệ thống`), Badge biển số nổi bật (`59Y - 155.55`, `59S1 - 123.45`, `59G1 - 678.90`), 2 trạng thái con (Bảo hành điện tử, Bảo hiểm xe máy), 4 nút thao tác (`[🔍 Xem chi tiết]`, `[🔒 Xem bảo hành]`, `[🛡️ Xem bảo hiểm]`, `[📅 Đặt lịch]`).

#### 3. UI-CUST-03 – Tab 1: Đơn mua hàng (Chuẩn Ảnh 2 & 3 - Bổ sung nút ⭐ Đánh giá)
* **Mô tả yêu cầu:**
  - 2 sub-tabs cấp cao: `[  XE  ]` và `[  PHỤ TÙNG  ]`.
  - Bộ lọc trạng thái (Tất cả, Chờ xử lý, Đang giao, Đã hoàn thành) + Lọc thời gian (30 ngày, 6 tháng, Năm nay) + Nút `[Lọc]`.
  - Thẻ đơn xe (Mã `#MS-100234`, `#MS-098432`) & Thẻ đơn phụ tùng (Mã `#MS-009842`, `#MS-008311`, `#MS-007502`).
  - **YÊU CẦU ĐẶC BIỆT:** Bổ sung nút **`[⭐ Đánh giá]`** cho các đơn đã giao thành công / hoàn thành, mở modal viết đánh giá kèm số sao và nhận xét chi tiết.

#### 4. UI-CUST-04 – Tab 2: Lịch hẹn (Chuẩn Ảnh 4 & 5)
* **Mô tả yêu cầu:**
  - 5 Sub-tabs dịch vụ: `[📅 XEM LỊCH TỔNG]`, `[🟠 SỬA CHỮA]`, `[🔵 BẢO DƯỠNG]`, `[🟢 LÁI THỬ]`, `[🔴 BẢO HÀNH]`.
  - Màn hình Lịch tổng (Ảnh 4):
    * Cột trái: Bảng Calendar Grid tháng 10/2026 (7 cột T2 -> CN, 31 ngày), highlight các ô có lịch hẹn ngày 12 (Bảo dưỡng), ngày 17 (Sửa chữa), ngày 20 (Bảo hành/Đã hủy), ngày 27 (Sửa chữa).
    * Cột phải: Chi tiết lịch trình đã xác nhận với badge to `ĐÃ XÁC NHẬN`, thời gian, xe, địa điểm, nút Chi tiết, Hủy lịch.
  - Màn hình từng dịch vụ (Ảnh 5): Thẻ ngang viền đỏ, tiêu đề màu cam, badge to `✓ ĐÃ XÁC NHẬN`, `⌛ CHỜ XÁC NHẬN`, `✕ BỊ HỦY` (kèm lý do hủy và nút Đặt lịch lại).

#### 5. UI-CUST-05 – Tab 3: Lịch sử dịch vụ (Chuẩn Ảnh 6 - Tuyệt đối BỎ nút Đánh giá)
* **Mô tả yêu cầu:**
  - 5 Sub-tabs dịch vụ: `[📋 TẤT CẢ]`, `[⚙️ BẢO DƯỠNG]`, `[🛠️ SỬA CHỮA]`, `[🏍️ LÁI THỬ]`, `[🛡️ BẢO HÀNH]`.
  - Tìm kiếm theo biển số/dịch vụ + Lọc thời gian.
  - Danh sách thẻ dịch vụ hoàn thành: Xe, ngày hoàn thành, cơ sở, chi phí, trạng thái `✓ ĐÃ HOÀN THÀNH`.
  - Các nút: `[Chi tiết]`, `[Xem hóa đơn]` / `[Biên bản]`.
  - **YÊU CẦU ĐẶC BIỆT:** Bỏ hoàn toàn nút Đánh giá theo đúng chỉ đạo của người dùng.

#### 6. UI-CUST-06 – Tab 4: Bảo hiểm (Chuẩn Ảnh 7 - Quản lý theo từng xe)
* **Mô tả yêu cầu:**
  - Header: **QUẢN LÝ BẢO HIỂM THEO TỪNG XE**.
  - Phân nhóm hợp đồng bảo hiểm theo từng xe mà khách hàng đang sở hữu (`myVehicles`).
  - Mỗi xe có ảnh xe, biển số, và nút đỏ lớn nổi bật: **`+ MUA BẢO HIỂM CHO XE NÀY`**.
  - Danh sách hợp đồng theo xe: Nhà cung cấp (MIC, Bảo Việt, PVI), HSD, badge trạng thái (`🟢 ĐANG HIỆU LỰC`, `🟠 SẮP HẾT HẠN - Còn 35 ngày`, `🔴 ĐÃ HẾT HẠN`), nút `[Xem chi tiết]`, `[Gia hạn ngay]`, `[Mua lại/Gia hạn]`.

#### 7. UI-CUST-07 – Tab 5: Khảo sát & Đánh giá (Chuẩn Ảnh 8)
* **Mô tả yêu cầu:**
  - 3 Sub-tabs: `[✍️ CHỜ ĐÁNH GIÁ (2)]`, `[☑️ ĐÃ ĐÁNH GIÁ]`, `[📊 KHẢO SÁT TỪ HỆ THỐNG]`.
  - Chờ đánh giá: Card Đánh giá dịch vụ Bảo dưỡng 5000km xe SH 150i (5 sao, nút `[VIẾT ĐÁNH GIÁ]`, `Bỏ qua`), Card Đánh giá sản phẩm Lốp Michelin Pilot Street 2 (5 sao, nút `[VIẾT ĐÁNH GIÁ]`, `Bỏ qua`), Card Khảo sát phòng chờ nhận voucher 50K (`[THAM GIA KHẢO SÁT]`).
  - Đã đánh giá: Danh sách đánh giá đã gửi của khách hàng.
  - Khảo sát hệ thống: Tích hợp `DynamicSurveyTab` cho các bài khảo sát admin phân công.

#### 8. UI-CUST-08 – Đồng bộ hệ thống FE và BE
* **Mô tả yêu cầu & giải pháp:**
  - Dữ liệu khách hàng, xe, đơn hàng, lịch hẹn, đánh giá và bảo hiểm được đồng bộ thời gian thực:
    * Khởi chạy Backend .NET Core tại `http://localhost:5208` (API: `http://localhost:5208/api`).
    * Khởi chạy Frontend React Vite tại `http://localhost:5173`.
    * Kiểm tra và xác minh API `GET /api/KhachHang`, `PUT /api/DonHang/{id}/huy`, `PUT /api/LichHen/{id}`, `POST /api/PhanHoi`, `POST /api/XeKhachHang`.
    * Chuẩn hóa mock data cho khách hàng `KH001` (Nguyễn Minh Anh - VIP - 158.500.000đ) khớp 100% bộ 8 ảnh mockup.
    * Đã kiểm tra biên dịch toàn diện: `npm run build` thành công 100% (0 lỗi).

#### 9. UI-CUST-09 – Phục hồi toàn diện 100% Tính năng & Modal nghiệp vụ cũ trong CustomerDashboard.tsx
* **Mô tả yêu cầu:**
  - Sau khi chuyển đổi giao diện sang Dark Theme Sidebar 6 tabs theo 8 Mockup mới, cần khôi phục lại đầy đủ 100% các tính năng, modal, validation, workflow nghiệp vụ cũ từ file sao lưu `CustomerDashboard.backup.tsx` (4.514 dòng) và các mã lỗi trong `FIX_LOG.md`.
* **Giải pháp đã thực hiện:**
  - **Profile & Security (H01, H02, TB04, TB06, Khóa TK):**
    * `EditProfileModal`: Validate ngày sinh $\ge 16$ tuổi, preset 10 avatar + bộ chọn tải ảnh `ImageUploader`.
    * `ChangeCustomerPasswordModal`: Validate 5 tiêu chí mật khẩu mạnh (chữ hoa, chữ thường, số, ký tự đặc biệt, độ dài $\ge 8$).
    * Progress bar CLV Spending động (Đồng, Bạc, Vàng, Kim Cương) theo tổng chi tiêu thực tế.
    * Cơ chế phát hiện tài khoản bị khóa (`trangThai === 'BiKhoa'`) và tự động đăng xuất với thông báo rõ ràng.
    * Banner nhắc lịch hẹn sắp tới (hôm nay / ngày mai - LH14).
    * Hiệu ứng Highlight viền đỏ và cuộn mượt khi nhấp từ thông báo (TC10, TB01).
  - **Tab 0 - Phương tiện & Bảo hành (PT01-05, KH03, BH01-05, GHBH01):**
    * Thẻ xe chuẩn Dark Theme với đầy đủ thông số ODO, biển số, hạn bảo hành, hạn bảo hiểm.
    * Modal `AddVehicleModal`: Validate biển số chuẩn VN, bắt buộc upload ảnh Cà vẹt xe.
    * Modal `PlateUpdateModal`: Cho phép khách cập nhật biển số & cà vẹt cho xe mua tại showroom để Admin duyệt.
    * Bộ lọc xe linh hoạt: Tất cả, Mua cửa hàng, Xe ngoài, Đang BH, Có BH.
    * Tích hợp `WarrantyDetailView`: Sổ bảo hành điện tử chính hãng 36 tháng / 30.000 km, timeline lịch sử bảo dưỡng 0đ, tải sổ bảo hành điện tử.
    * Tích hợp `WarrantyClaimFormView`: Gửi yêu cầu kiểm tra bảo hành kỹ thuật.
    * Tích hợp `WarrantyExtensionWizard`: Quy trình 4 bước gia hạn Care+ với thẩm định ODO và thanh toán VietQR.
  - **Tab 1 - Đơn mua hàng (ĐH01, PT-FLOW-01-04, XM-FIX-03, TB03):**
    * 2 Sub-tabs `[XE]` & `[PHỤ TÙNG]` kèm bộ lọc trạng thái và thời gian.
    * Modal `VehiclePickupQrModal`: Xem mã lịch hẹn, mã QR Code nhận xe tại showroom, bản đồ chỉ dẫn và hotline.
    * Modal `OrderDetailModal`: Chi tiết đơn hàng, danh sách phụ tùng, địa chỉ nhận hàng, hóa đơn.
    * Modal `CancelOrderModal`: Hủy đơn với 6 lý do chuẩn, tự động hoàn trả tồn kho phụ tùng & hoàn trả xe vào showroom.
    * Nút `[⭐ Đánh giá]`: Đánh giá sản phẩm/đơn hàng sau khi giao thành công.
  - **Tab 2 - Lịch hẹn (LH01-14):**
    * 5 Sub-tabs: Lịch tổng (Calendar Grid 31 ngày + Lịch hẹn gần nhất), Sửa chữa, Bảo dưỡng, Lái thử, Bảo hành.
    * Đầy đủ trạng thái: Đã xác nhận, Chờ xác nhận, Bị hủy (kèm lý do và nút đặt lại).
  - **Tab 3 - Lịch sử dịch vụ (UI-CUST-05):**
    * 5 Sub-tabs dịch vụ, tìm kiếm biển số/dịch vụ, xem chi tiết và in biên bản/hóa đơn dịch vụ.
    * **Tuyệt đối BỎ nút đánh giá** theo đúng chỉ đạo thiết kế.
  - **Tab 4 - Bảo hiểm (BHX06, BHX07, PT03, UI-CUST-06):**
    * Quản lý hợp đồng phân nhóm theo từng xe sở hữu (`myVehicles`).
    * Tích hợp `OnlineInsurancePurchaseView`: Mua bảo hiểm online, xem trước Hợp đồng Demo, thanh toán VietQR bắt buộc.
    * Tích hợp `RenewInsuranceModal`: Gia hạn bảo hiểm nối tiếp hạn cũ.
    * Xem và in Giấy chứng nhận bảo hiểm điện tử trực tiếp.
  - **Tab 5 - Khảo sát & Đánh giá (KS01-08, ĐG01-16, UI-CUST-07):**
    * 3 Sub-tabs: Chờ đánh giá, Đã đánh giá, Khảo sát từ hệ thống.
    * Form đánh giá 5 tiêu chí chi tiết, upload ảnh minh chứng.
    * Tích hợp `DynamicSurveyTab`: Khảo sát động phân phối theo CLV, countdown 4s toast, cuộn mượt đến câu chưa hoàn thành.
* **Kết quả kiểm thử:**
  - TypeScript build (`npm run build`): **0 errors, build thành công 100%**.
  - Backend .NET Core và Frontend Vite Dev Server đang chạy ổn định.

