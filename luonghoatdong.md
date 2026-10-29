# Đặc tả luồng hoạt động hệ thống quản lý mua bán xe

> Tài liệu tổng hợp luồng nghiệp vụ mua xe, duyệt biển số, quản lý dịch vụ và các quy tắc cần chốt trước khi triển khai.

## 1. Luồng mua xe

### 1.1. Mua xe giao tận nơi

1. Khách hàng chọn mua xe và thanh toán **100% giá trị đơn hàng**.
2. Đơn hàng được gửi đến mục **Quản lý đơn hàng xe** của admin.
3. Admin xác nhận đơn hàng. Trạng thái chuyển thành **Chờ khách hàng xác nhận ngày nhận xe**.
4. Khách hàng nhận thông báo về ngày nhận xe và xác nhận ngày nhận xe.
5. Sau khi khách xác nhận, khách hàng không thể tự thay đổi ngày nhận xe bằng thao tác thông thường.
6. Sau khi khách xác nhận ngày nhận xe, admin có thể in hóa đơn/phiếu theo quy trình giao xe.
7. Xe được giao cho khách. Trạng thái đơn hàng lần lượt chuyển qua:
   - **Đang giao xe**
   - **Đã giao**
   - **Hoàn thành**
8. Khi đơn hàng hoàn thành, đơn hàng bị khóa các thao tác chỉnh sửa thông thường.

**Quy tắc cần áp dụng:**
- Chỉ cho phép xác nhận đơn khi hệ thống đã xác minh thanh toán đủ 100%.
- Trạng thái hóa đơn và trạng thái giao hàng phải được lưu riêng; thao tác in hóa đơn không tự động chứng minh rằng xe đã được giao.
- Nếu khách không xác nhận ngày nhận xe trong thời hạn quy định, hệ thống nên có cơ chế nhắc nhở hoặc xử lý quá hạn.

### 1.2. Mua xe nhận tại showroom — đặt cọc 2.000.000 đồng

1. Khách hàng đặt mua xe và thanh toán tiền cọc **2.000.000 đồng**.
2. Đơn hàng được gửi đến mục **Quản lý đơn hàng xe** của admin.
3. Admin xác nhận đơn hàng và đề xuất ngày nhận xe. Trạng thái chuyển thành **Chờ khách hàng xác nhận ngày nhận xe**.
4. Khách hàng xác nhận ngày nhận xe.
5. Sau khi khách xác nhận:
   - Lịch nhận xe xuất hiện trong lịch hẹn của khách hàng.
   - Lịch nhận xe được đồng bộ vào mục **Quản lý dịch vụ** và **Lịch biểu** của admin.
   - Khách hàng không thể tự thay đổi ngày nhận xe bằng thao tác thông thường.
6. Khi khách đến showroom, nhân viên xác nhận đã thu đủ số tiền còn lại.
7. Admin tạo hóa đơn. Với đơn đặt cọc, bắt buộc xác nhận đã thu đủ tiền trước khi phát hành hóa đơn hoàn tất.
8. Sau khi hóa đơn được phát hành theo đúng điều kiện, đơn hàng chuyển thành **Hoàn thành** và bị khóa các thao tác chỉnh sửa thông thường.
9. Khi lịch nhận xe hoàn thành, lịch không còn xuất hiện trong danh sách lịch đang chờ/sắp tới nhưng vẫn được lưu trong lịch sử.

**Quy tắc thanh toán:**

`Số tiền còn phải thu = Tổng tiền phải trả - Tổng tiền đã thanh toán`

Chỉ cho phép hoàn tất hóa đơn khi số tiền còn phải thu bằng 0 và hệ thống có bản ghi xác nhận thanh toán tương ứng. Checkbox “Đã thu đủ tiền” có thể dùng làm bước xác nhận của nhân viên, nhưng không thay thế dữ liệu giao dịch.

### 1.3. Mua xe nhận tại showroom — thanh toán đủ ngay từ đầu

1. Khách hàng đặt mua xe và thanh toán đủ 100% giá trị đơn hàng.
2. Đơn hàng được gửi đến mục **Quản lý đơn hàng xe** của admin.
3. Admin xác nhận đơn và đề xuất ngày nhận xe. Trạng thái chuyển thành **Chờ khách hàng xác nhận ngày nhận xe**.
4. Khách hàng xác nhận ngày nhận xe.
5. Lịch nhận xe được đồng bộ giữa khách hàng và admin, xuất hiện trong mục **Quản lý dịch vụ** và **Lịch biểu** của admin.
6. Admin tạo và in hóa đơn. Không hiển thị nút “Thu đủ tiền” vì hệ thống đã xác minh thanh toán đủ.
7. Sau khi hóa đơn được phát hành theo đúng điều kiện, đơn hàng chuyển thành **Hoàn thành** và bị khóa các thao tác chỉnh sửa thông thường.
8. Khi lịch nhận xe hoàn thành, lịch không còn xuất hiện trong danh sách lịch đang chờ/sắp tới nhưng vẫn được lưu trong lịch sử.

### 1.4. Mua xe trực tiếp tại showroom do admin/nhân viên tạo đơn

1. Admin hoặc nhân viên tạo đơn hàng cho khách.
2. Chọn khách hàng, xe, phiên bản, màu sắc, bảo hiểm mua kèm và hình thức thanh toán.
3. Xác nhận thanh toán và lập hóa đơn theo quy trình.
4. Bàn giao xe, ghi nhận ngày nhận xe và hoàn tất đơn hàng.
5. Sau khi giao dịch hoàn tất, xe xuất hiện trong mục **Phương tiện của tôi** của khách hàng.

**Trường hợp khách chưa có tài khoản:** cần có quy trình liên kết đơn hàng với tài khoản khách hàng sau này để khách có thể xem xe đã mua và lịch sử giao dịch.

### 1.5. Quy tắc chung sau khi hoàn tất đơn hàng

- Xe phải xuất hiện trong **Phương tiện của tôi** với đúng thông tin xe đã mua.
- Nếu khách mua kèm bảo hiểm, bảo hiểm phải được liên kết đúng với đơn hàng và chiếc xe tương ứng.
- Tạo yêu cầu khảo sát và yêu cầu đánh giá xe cho khách hàng; tránh tạo nhiều yêu cầu trùng lặp.
- Lưu lịch sử đơn hàng, thanh toán, hóa đơn và bàn giao; không xóa dữ liệu gốc.
- Nếu chưa có biển số, hiển thị yêu cầu cập nhật biển số xe trong mục **Phương tiện của tôi**.

**Số khung và số VIN:**
- Với xe thật, số khung và VIN phải lấy từ thông tin chính xác của xe, không tự sinh ngẫu nhiên rồi xem như dữ liệu thật.
- Với dữ liệu mô phỏng/đồ án, có thể tạo mã giả duy nhất và đánh dấu rõ là dữ liệu thử nghiệm, ví dụ `DEMO-VIN-...`.
- Nên quản lý từng xe vật lý bằng mã định danh riêng để tránh bán trùng một xe cho nhiều khách.

## 2. Duyệt biển số xe

1. Sau khi đơn hàng mua xe hoàn tất và xe xuất hiện trong **Phương tiện của tôi**, nếu chưa có biển số thì hiển thị yêu cầu cập nhật biển số.
2. Khách hàng mở yêu cầu và nhập biển số xe, đồng thời tải ảnh cà vẹt.
3. **Biển số và ảnh cà vẹt là bắt buộc**, không được để trống.
4. Sau khi khách gửi hồ sơ, admin nhận được thông báo.
5. Admin mở mục **Quản lý biển số**, xem hồ sơ và chọn duyệt hoặc từ chối.

### 2.1. Nếu admin duyệt

- Cập nhật trạng thái hồ sơ thành **Đã duyệt**.
- Hiển thị biển số trên phương tiện tương ứng của khách hàng.
- Gửi thông báo duyệt thành công cho khách hàng.
- Lưu người duyệt, thời gian duyệt và lịch sử xử lý.

### 2.2. Nếu admin từ chối

- Bắt buộc nhập lý do từ chối.
- Gửi thông báo cho khách hàng kèm lý do.
- Cho phép khách hàng chỉnh sửa và gửi lại hồ sơ.
- Không xóa hồ sơ cũ; lưu lịch sử các lần gửi và kết quả duyệt.

### 2.3. Trạng thái hồ sơ biển số

- **Chưa cập nhật**
- **Chờ duyệt**
- **Đã duyệt**
- **Bị từ chối**
- **Đã gửi lại**

### 2.4. Kiểm tra và bảo vệ hồ sơ

- Kiểm tra định dạng, dung lượng và loại tệp ảnh được phép tải lên.
- Phân quyền người được xem ảnh cà vẹt.
- Lưu lịch sử duyệt để có thể truy vết.
- Khi khách gửi lại hồ sơ, tạo phiên gửi lại hoặc bản ghi lịch sử mới thay vì ghi đè mất toàn bộ dữ liệu cũ.

## 3. Quản lý dịch vụ và lịch hẹn

Mục **Quản lý dịch vụ** chỉ hiển thị các loại lịch sau:

1. **Lịch nhận xe**
2. **Lịch lái thử**
3. **Lịch bảo hành**
4. **Lịch bảo dưỡng**

### 3.1. Quy tắc hiển thị lịch nhận xe

- Lịch nhận xe chỉ xuất hiện sau khi khách hàng xác nhận ngày nhận xe.
- Áp dụng cho luồng mua xe nhận tại showroom theo yêu cầu nghiệp vụ.
- Lịch của khách hàng và lịch biểu admin phải sử dụng cùng dữ liệu lịch hẹn trong cơ sở dữ liệu; không tạo hai bản ghi độc lập cho hai giao diện.
- Khi hoàn tất bàn giao, lịch chuyển thành **Hoàn thành** và không còn xuất hiện trong danh sách lịch đang chờ/sắp tới.
- Lịch đã hoàn thành vẫn phải được lưu để xem lịch sử.

### 3.2. Quy tắc các loại lịch khác

- **Lái thử:** xuất hiện sau khi khách đặt lịch và lịch được xác nhận theo quy trình.
- **Bảo hành:** xuất hiện khi có lịch hẹn bảo hành hoặc lịch tiếp nhận xe.
- **Bảo dưỡng:** xuất hiện khi khách đặt lịch hoặc nhân viên tạo lịch.

## 4. Thông báo của admin và khách hàng

> **Giữ nguyên phần thông báo theo yêu cầu hiện tại.**

- Khi bấm vào thông báo, hệ thống phải dẫn đến **đúng trang và đúng bản ghi liên quan**.
- Khu vực hoặc bản ghi đích cần có **outline rõ ràng** để người dùng nhận biết nội dung vừa được điều hướng đến.
- Không chỉ mở trang danh sách chung; cần mở đúng chi tiết đơn hàng, lịch hẹn, phương tiện hoặc hồ sơ tương ứng.

| Loại thông báo | Trang đích khi bấm xem |
|---|---|
| Đơn hàng cần xác nhận | Chi tiết đơn hàng tương ứng trong Quản lý đơn hàng xe |
| Khách xác nhận ngày nhận xe | Đơn hàng và lịch nhận xe tương ứng |
| Khách gửi hồ sơ biển số | Chi tiết hồ sơ trong Quản lý biển số |
| Hồ sơ biển số bị từ chối | Phương tiện tương ứng và lý do từ chối |
| Đến lịch bảo dưỡng | Chi tiết lịch hẹn bảo dưỡng |
| Yêu cầu đánh giá xe | Trang đánh giá đúng chiếc xe khách đã mua |

Thông tin dữ liệu cần có để điều hướng chính xác gồm mã đối tượng liên quan, chẳng hạn `orderId`, `vehicleId`, `appointmentId` hoặc `plateRequestId`, tùy loại thông báo.

## 5. Các quy tắc nghiệp vụ cần chốt trước khi triển khai



### 5.2. Đổi ngày nhận xe

- Sau khi khách xác nhận ngày nhận xe, khách không thể tự thay đổi bằng thao tác thông thường.
- Admin có thể xử lý trường hợp đặc biệt qua quy trình đổi lịch có lý do và lưu lịch sử.
- Khi đổi lịch hợp lệ, phải đồng bộ ngày mới ở cả giao diện khách hàng và admin.

### 5.3. Đồng bộ dữ liệu

- Trạng thái đơn hàng, thanh toán, hóa đơn, lịch hẹn, xe đã mua, bảo hiểm và biển số phải liên kết bằng mã dữ liệu thống nhất.
- Admin và khách hàng đọc cùng nguồn dữ liệu; không tự cập nhật trạng thái riêng biệt ở frontend.
- Các thao tác quan trọng cần được kiểm tra quyền và điều kiện ở backend.

### 5.4. Khóa cứng đơn hàng

- Đơn hoàn thành không được sửa bằng thao tác thông thường.
- Nếu cần điều chỉnh đặc biệt, chỉ người có quyền mới được thực hiện; phải nhập lý do và lưu nhật ký kiểm toán.
- Không xóa lịch sử thanh toán hoặc hóa đơn đã phát hành.

