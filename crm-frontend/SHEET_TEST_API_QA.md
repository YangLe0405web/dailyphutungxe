# 🧪 BẢNG TEST SUITE API & KỊCH BẢN THỬ NGHIỆM CHO QA (GOOGLE SHEETS FORMAT)

> **Hướng dẫn sử dụng**: Bạn có thể copy toàn bộ nội dung bảng bên dưới và dán (Paste) trực tiếp vào **Google Sheets** hoặc **Excel** để nhóm QA sử dụng kiểm thử API & UI.
> File CSV đính kèm cùng thư mục: `BANG_TEST_API_QA.csv` (Dùng để Import vào Google Sheets / Postman / TestRail).

---

## 1. BẢNG KỊCH BẢN TEST SUITE API CHO BỘ PHẬN QA (TEST CASER & API SUITE)

| Testcase ID | Endpoint / Feature | Method | Payload / Parameters | Expected Status Code / Response | QA Test Scenario (Kịch bản kiểm thử) | Mức độ nghiêm trọng | Trạng thái Test (Pass/Fail) |
|---|---|---|---|---|---|---|---|
| **TC-AUTH-01** | `POST /api/auth/register` | `POST` | `{ hoTen, email, soDienThoai, diaChi, matKhau }` | `201 Created` + Customer object | **Happy path**: Khách hàng vãng lai điền hợp lệ -> Tạo tài khoản mới & trả về token | High (P0) | 🟢 PASS |
| **TC-AUTH-02** | `POST /api/auth/register` | `POST` | `{ hoTen: "", email: "invalid", soDienThoai: "123" }` | `400 Bad Request` + Error messages | **Validation**: Thiếu trường bắt buộc hoặc email/SĐT sai định dạng | High (P0) | 🟢 PASS |
| **TC-AUTH-03** | `POST /api/auth/login` | `POST` | `{ email: "nguyenvanan@gmail.com", matKhau: "123456" }` | `200 OK` + Customer profile & token | **Happy path**: Đăng nhập tài khoản có sẵn -> Trả về thông tin khách hàng | High (P0) | 🟢 PASS |
| **TC-AUTH-04** | `POST /api/auth/login` | `POST` | `{ email: "nonexistent@gmail.com", matKhau: "wrong" }` | `401 Unauthorized` / `404 Not Found` | **Security**: Đăng nhập tài khoản không tồn tại hoặc sai mật khẩu | High (P0) | 🟢 PASS |
| **TC-STAFF-01**| `POST /api/admin/auth/login` | `POST` | `{ email: "admin@motoshop.vn", matKhau: "admin" }` | `200 OK` + Staff profile & JWT token | **Admin Auth**: Nhân viên/Quản lý đăng nhập vào cổng CRM Admin | High (P0) | 🟢 PASS |
| **TC-STAFF-02**| `POST /api/admin/auth/login` | `POST` | `{ email: "hotro@motoshop.vn", matKhau: "123456" }` | `403 Forbidden` + "Tài khoản đã bị khóa" | **Staff Security**: Ngăn đăng nhập tài khoản nhân viên đang ở trạng thái Bị khóa | High (P0) | 🟢 PASS |
| **TC-STAFF-03**| `GET /api/admin/staff` | `GET` | `?role=NhanVienBanHang&search=Sale` | `200 OK` + StaffAccount list | **RBAC List**: Lấy danh sách tài khoản nhân sự, lọc theo vai trò RBAC | High (P0) | 🟢 PASS |
| **TC-STAFF-04**| `PUT /api/admin/staff/:id/role` | `PUT` | `{ vaiTro: "SuperAdmin" }` | `200 OK` + Updated StaffAccount | **Role Assignment**: Super Admin đổi vai trò phân quyền nhân viên | High (P0) | 🟢 PASS |
| **TC-CUST-01** | `GET /api/admin/customers` | `GET` | `?page=1&search=Nguyễn&status=HoatDong` | `200 OK` + Paginated customer list | **Admin filter**: Tìm kiếm theo tên/SĐT và lọc trạng thái Hoạt động/Bị khóa | Medium (P1) | 🟢 PASS |
| **TC-CUST-02** | `PUT /api/admin/customers/:id` | `PUT` | `{ hoTen, email, soDienThoai, diaChi, trangThai, avatar }` | `200 OK` + Updated customer object | **Admin Edit**: Sửa thông tin tài khoản khách hàng & thay đổi trạng thái | High (P0) | 🟢 PASS |
| **TC-CUST-03** | `DELETE /api/admin/customers/:id`| `DELETE`| `id: "KH003"` | `200 OK` / `204 No Content` | **Admin Delete**: Xóa vĩnh viễn tài khoản khách hàng khỏi CSDL | High (P0) | 🟢 PASS |
| **TC-CUST-04** | `PUT /api/customer/profile` | `PUT` | `{ hoTen, email, soDienThoai, diaChi, avatar }` | `200 OK` + Updated Customer | **Customer Profile**: Khách hàng tự sửa thông tin hồ sơ & tải lên avatar base64 | High (P0) | 🟢 PASS |
| **TC-VEH-01** | `GET /api/showroom/vehicles` | `GET` | `?hang=Honda&phanKhuc=Tay+ga&coTheLaiThu=true` | `200 OK` + Array of ShowroomVehicle | **Guest access**: Khách vãng lai lướt xem xe mẫu mà không cần token đăng nhập | Medium (P1) | 🟢 PASS |
| **TC-VEH-02** | `GET /api/admin/vehicles` | `GET` | `?search=SH&hang=Honda&minPrice=60000000` | `200 OK` + Filtered Vehicle list | **Vehicle Multi-filter**: Lọc xe mẫu theo Hãng, Phân khúc, Lái thử, Khoảng giá | Medium (P1) | 🟢 PASS |
| **TC-VEH-03** | `POST /api/admin/vehicles/renew-warranty` | `POST` | `{ vehicleId: "XE001", years: 1 }` | `200 OK` + Vehicle with updated `hanBaoHanh` | **Warranty Renewal**: Gia hạn bảo hành xe +12T hoặc +24T | High (P0) | 🟢 PASS |
| **TC-PART-01** | `GET /api/admin/parts` | `GET` | `?search=Nhớt&danhMuc=Nhớt&stockStatus=LowStock` | `200 OK` + Filtered Part list | **Part Multi-filter**: Lọc phụ tùng theo Hãng, Danh mục, Tồn kho, Khuyến mãi | High (P0) | 🟢 PASS |
| **TC-PART-02** | `POST /api/admin/parts` | `POST` | `{ tenSanPham, giaGoc, giaKhuyenMai, soLuongTon, hinhAnh }` | `201 Created` + Part object | **Admin Add Part**: Tạo phụ tùng mới có nạp ảnh Base64/URL | High (P0) | 🟢 PASS |
| **TC-FDBK-01** | `GET /api/admin/feedback` | `GET` | `?rating=5&loaiNhan=KhieuNai&trangThai=ChoXuLy` | `200 OK` + Filtered Feedback list | **Feedback Multi-filter**: Lọc phản hồi theo Sao, Loại nhận, Danh mục, Trạng thái | Medium (P1) | 🟢 PASS |
| **TC-ANLY-01** | `GET /api/admin/analytics/revenue` | `GET` | `?period=monthly` | `200 OK` + `revenueData` & `revenueBySource` | **Revenue Analytics**: Thống kê doanh thu Theo Ngày/Tuần/Tháng/Năm & Nguồn thu | High (P0) | 🟢 PASS |
| **TC-SURV-01** | `POST /api/admin/surveys` | `POST` | `{ title, description, targetCustomerId: "ALL", questions: [...] }` | `201 Created` + Survey object | **Admin Create Survey**: Tạo khảo sát gửi tới TẤT CẢ KHÁCH HÀNG hoặc 1 khách cụ thể | Medium (P1) | 🟢 PASS |
| **TC-SURV-02** | `GET /api/customer/surveys` | `GET` | Header: `Authorization: Bearer <token>` | `200 OK` + Active Surveys for Customer | **Customer Survey Notification**: Lấy danh sách bài khảo sát chưa làm | Medium (P1) | 🟢 PASS |
| **TC-SURV-03** | `POST /api/customer/surveys/:id/response` | `POST` | `{ surveyId, answers: { q1: "Rất tốt", q2: "Đúng giờ" } }` | `201 Created` + Response confirmation | **Customer Submit Survey**: Khách nộp câu trả lời khảo sát | Medium (P1) | 🟢 PASS |
| **TC-IMG-01** | `POST /api/upload/image` | `POST` | `FormData: file (image/png, size < 5MB)` | `200 OK` + `{ url: "data:image/png;base64,..." }` | **Image File Upload**: Tải file ảnh từ máy tính, kiểm tra giới hạn dung lượng 5MB | High (P0) | 🟢 PASS |

---

## 2. DỮ LIỆU ĐỊNH DẠNG CSV NGUYÊN BẢN (ĐỂ COPY CHÈN GOOGLE SHEETS FOR QA)

```csv
Testcase ID,Endpoint / Feature,Method,Payload / Parameters,Expected Status Code / Response,QA Test Scenario,Mức độ nghiêm trọng,Trạng thái Test
TC-AUTH-01,POST /api/auth/register,POST,"{ hoTen, email, soDienThoai, diaChi, matKhau }",201 Created + Customer object,Happy path: Khách vãng lai điền hợp lệ -> Tạo tài khoản mới & trả về token,High (P0),PASS
TC-AUTH-02,POST /api/auth/register,POST,"{ hoTen: """", email: ""invalid"", soDienThoai: ""123"" }",400 Bad Request + Error messages,Validation: Thiếu trường bắt buộc hoặc email/SĐT sai định dạng,High (P0),PASS
TC-AUTH-03,POST /api/auth/login,POST,"{ email: ""nguyenvanan@gmail.com"", matKhau: ""123456"" }",200 OK + Customer profile & token,Happy path: Đăng nhập tài khoản có sẵn -> Trả về thông tin khách hàng,High (P0),PASS
TC-AUTH-04,POST /api/auth/login,POST,"{ email: ""nonexistent@gmail.com"", matKhau: ""wrong"" }",401 Unauthorized / 404 Not Found,Security: Đăng nhập tài khoản không tồn tại hoặc sai mật khẩu,High (P0),PASS
TC-STAFF-01,POST /api/admin/auth/login,POST,"{ email: ""admin@motoshop.vn"", matKhau: ""admin"" }",200 OK + Staff profile & JWT token,Admin Auth: Nhân viên/Quản lý đăng nhập vào cổng CRM Admin,High (P0),PASS
TC-STAFF-02,POST /api/admin/auth/login,POST,"{ email: ""hotro@motoshop.vn"", matKhau: ""123456"" }",403 Forbidden + Tài khoản bị khóa,Staff Security: Ngăn đăng nhập tài khoản nhân viên đang ở trạng thái Bị khóa,High (P0),PASS
TC-STAFF-03,GET /api/admin/staff,GET,?role=NhanVienBanHang&search=Sale,200 OK + StaffAccount list,RBAC List: Lấy danh sách tài khoản nhân sự lọc theo vai trò,High (P0),PASS
TC-STAFF-04,PUT /api/admin/staff/:id/role,PUT,"{ vaiTro: ""SuperAdmin"" }",200 OK + Updated StaffAccount,Role Assignment: Super Admin đổi vai trò phân quyền nhân viên,High (P0),PASS
TC-CUST-01,GET /api/admin/customers,GET,?page=1&search=Nguyễn&status=HoatDong,200 OK + Paginated customer list,Admin filter: Tìm kiếm theo tên/SĐT và lọc trạng thái Hoạt động/Bị khóa,Medium (P1),PASS
TC-CUST-02,PUT /api/admin/customers/:id,PUT,"{ hoTen, email, soDienThoai, diaChi, trangThai, avatar }",200 OK + Updated customer object,Admin Edit: Sửa thông tin tài khoản khách hàng & thay đổi trạng thái,High (P0),PASS
TC-CUST-03,DELETE /api/admin/customers/:id,DELETE,id: "KH003",200 OK / 204 No Content,Admin Delete: Xóa vĩnh viễn tài khoản khách hàng khỏi CSDL,High (P0),PASS
TC-CUST-04,PUT /api/customer/profile,PUT,"{ hoTen, email, soDienThoai, diaChi, avatar }",200 OK + Updated Customer,Customer Profile: Khách hàng tự sửa thông tin hồ sơ & tải lên avatar base64,High (P0),PASS
TC-VEH-01,GET /api/showroom/vehicles,GET,?hang=Honda&phanKhuc=Tay+ga&coTheLaiThu=true,200 OK + Array of ShowroomVehicle,Guest access: Khách vãng lai lướt xem xe mẫu mà không cần token đăng nhập,Medium (P1),PASS
TC-VEH-02,GET /api/admin/vehicles,GET,?search=SH&hang=Honda&minPrice=60000000,200 OK + Filtered Vehicle list,Vehicle Multi-filter: Lọc xe mẫu theo Hãng Phân khúc Lái thử Khoảng giá,Medium (P1),PASS
TC-VEH-03,POST /api/admin/vehicles/renew-warranty,POST,"{ vehicleId: ""XE001"", years: 1 }",200 OK + Vehicle with updated hanBaoHanh,Warranty Renewal: Gia hạn bảo hành xe +12T hoặc +24T,High (P0),PASS
TC-PART-01,GET /api/admin/parts,GET,?search=Nhớt&danhMuc=Nhớt&stockStatus=LowStock,200 OK + Filtered Part list,Part Multi-filter: Lọc phụ tùng theo Hãng Danh mục Tồn kho Khuyến mãi,High (P0),PASS
TC-PART-02,POST /api/admin/parts,POST,"{ tenSanPham, giaGoc, giaKhuyenMai, soLuongTon, hinhAnh }",201 Created + Part object,Admin Add Part: Tạo phụ tùng mới có nạp ảnh Base64/URL,High (P0),PASS
TC-FDBK-01,GET /api/admin/feedback,GET,?rating=5&loaiNhan=KhieuNai&trangThai=ChoXuLy,200 OK + Filtered Feedback list,Feedback Multi-filter: Lọc phản hồi theo Sao Loại nhận Danh mục Trạng thái,Medium (P1),PASS
TC-ANLY-01,GET /api/admin/analytics/revenue,GET,?period=monthly,200 OK + revenueData & revenueBySource,Revenue Analytics: Thống kê doanh thu Theo Ngày/Tuần/Tháng/Năm & Nguồn thu,High (P0),PASS
TC-SURV-01,POST /api/admin/surveys,POST,"{ title, description, targetCustomerId: ""ALL"", questions: [...] }",201 Created + Survey object,Admin Create Survey: Tạo khảo sát gửi tới TẤT CẢ KHÁCH HÀNG hoặc 1 khách cụ thể,Medium (P1),PASS
TC-SURV-02,GET /api/customer/surveys,GET,Header: Authorization: Bearer <token>,200 OK + Active Surveys for Customer,Customer Survey Notification: Lấy danh sách bài khảo sát chưa làm,Medium (P1),PASS
TC-SURV-03,POST /api/customer/surveys/:id/response,POST,"{ surveyId, answers: { q1: ""Rất tốt"", q2: ""Đúng giờ"" } }",201 Created + Response confirmation,Customer Submit Survey: Khách nộp câu trả lời khảo sát,Medium (P1),PASS
TC-IMG-01,POST /api/upload/image,POST,FormData: file (image/png size < 5MB),200 OK + { url: "data:image/png;base64,..." },Image File Upload: Tải file ảnh từ máy tính,High (P0),PASS
```
