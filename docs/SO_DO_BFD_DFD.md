# 📊 HỆ THỐNG SƠ ĐỒ BFD VÀ DFD (MỨC 0, 1, 2)
### DỰ ÁN: HỆ THỐNG CRM & E-COMMERCE ĐẠI LÝ XE MÁY VÀ PHỤ TÙNG (MOTOSHOP)

---

## I. SƠ ĐỒ PHÂN RÃ CHỨC NĂNG BFD (BUSINESS FUNCTION DIAGRAM) — ĐẦY ĐỦ 3 MỨC (0, 1, 2)

Sơ đồ BFD thể hiện cấu trúc phân cấp chức năng nghiệp vụ từ mức cao nhất (Mức 0) xuống các phân hệ (Mức 1) và các thao tác nghiệp vụ chi tiết (Mức 2).

---

### 1. Sơ đồ BFD Mức 0 (Mức Tổng quan / Ngữ cảnh chức năng)
Mô tả hệ thống tổng thể MOTOSHOP phân rã thành **7 phân hệ chức năng lớn**:

```mermaid
flowchart TD
    ROOT["HỆ THỐNG CRM & ĐẠI LÝ XE MÁY PHỤ TÙNG MOTOSHOP"]

    ROOT --> F1["1.0 Phân hệ Quản trị Hệ thống & Phân quyền"]
    ROOT --> F2["2.0 Phân hệ Quản lý Kho & Danh mục Hàng hóa"]
    ROOT --> F3["3.0 Phân hệ Đối tác & Chuỗi cung ứng"]
    ROOT --> F4["4.0 Phân hệ Bán hàng & Quản lý Đơn hàng"]
    ROOT --> F5["5.0 Phân hệ Lịch hẹn & Dịch vụ Kỹ thuật"]
    ROOT --> F6["6.0 Phân hệ Khách hàng & Chăm sóc CRM"]
    ROOT --> F7["7.0 Phân hệ Báo cáo & Thống kê"]
```

---

### 2. Sơ đồ BFD Mức 1 (Mức Phân hệ chức năng)
Phân rã 7 phân hệ lớn thành **các chức năng nghiệp vụ cụ thể**:

```mermaid
flowchart TD
    ROOT["HỆ THỐNG CRM & ĐẠI LÝ MOTOSHOP"]

    %% Cấp 1
    F1["1.0 Quản trị Hệ thống"]
    F2["2.0 Quản lý Kho Hàng"]
    F3["3.0 Chuỗi Cung Ứng"]
    F4["4.0 Bán Hàng & Đơn Hàng"]
    F5["5.0 Lịch Hẹn & Dịch Vụ"]
    F6["6.0 Khách Hàng & CRM"]
    F7["7.0 Báo Cáo Thống Kê"]

    ROOT --> F1
    ROOT --> F2
    ROOT --> F3
    ROOT --> F4
    ROOT --> F5
    ROOT --> F6
    ROOT --> F7

    %% Phân rã 1.0
    F1 --> F1_1["1.1 Đăng nhập & Xác thực"]
    F1 --> F1_2["1.2 Quản lý tài khoản nhân viên"]
    F1 --> F1_3["1.3 Phân quyền: SuperAdmin / Sale / Kỹ thuật"]
    F1 --> F1_4["1.4 Khóa / Mở khóa tài khoản"]

    %% Phân rã 2.0
    F2 --> F2_1["2.1 Quản lý phụ tùng & phụ kiện"]
    F2 --> F2_2["2.2 Quản lý xe mẫu trưng bày"]
    F2 --> F2_3["2.3 Tra cứu, tìm kiếm & lọc hàng"]
    F2 --> F2_4["2.4 Cảnh báo định mức tồn kho"]

    %% Phân rã 3.0
    F3 --> F3_1["3.1 Quản lý hồ sơ Nhà cung cấp"]
    F3 --> F3_2["3.2 Quản lý Phiếu nhập kho"]
    F3 --> F3_3["3.3 Quản lý Chi tiết mặt hàng nhập"]
    F3 --> F3_4["3.4 Kiểm duyệt & Tăng tồn kho"]
    F3 --> F3_5["3.5 In biên bản giao nhận hàng hóa"]

    %% Phân rã 4.0
    F4 --> F4_1["4.1 Giỏ hàng & Đặt hàng online"]
    F4 --> F4_2["4.2 Tiếp nhận & Xét duyệt đơn hàng"]
    F4 --> F4_3["4.3 Điều phối giao vận & Thanh toán"]
    F4 --> F4_4["4.4 Hủy đơn & Trừ tồn kho tự động"]

    %% Phân rã 5.0
    F5 --> F5_1["5.1 Đặt lịch: Bảo dưỡng / Sửa chữa / Lái thử"]
    F5 --> F5_2["5.2 Tiếp nhận & Xác nhận lịch hẹn"]
    F5 --> F5_3["5.3 Theo dõi tiến độ kỹ thuật xưởng"]
    F5 --> F5_4["5.4 Lưu bệnh án & Lịch sử xe"]

    %% Phân rã 6.0
    F6 --> F6_1["6.1 Quản lý hồ sơ khách hàng"]
    F6 --> F6_2["6.2 Quản lý xe khách hàng sở hữu"]
    F6 --> F6_3["6.3 Tiếp nhận phản hồi & Khiếu nại"]
    F6 --> F6_4["6.4 Khảo sát độ hài lòng khách hàng"]
    F6 --> F6_5["6.5 Đánh giá & Bình luận sản phẩm"]

    %% Phân rã 7.0
    F7 --> F7_1["7.1 Thống kê doanh thu bán hàng & dịch vụ"]
    F7 --> F7_2["7.2 Thống kê doanh số xe vs phụ tùng"]
    F7 --> F7_3["7.3 Thống kê chi phí nhập hàng từ NCC"]
    F7 --> F7_4["7.4 Phân tích cơ cấu khách hàng & dịch vụ"]
```

---

### 3. Sơ đồ BFD Mức 2 (Mức Chức năng chi tiết từng nghiệp vụ)
Đi sâu vào các tác vụ con của **3 phân hệ nghiệp vụ cốt lõi nhất**:

#### 3.1. Phân rã chi tiết Phân hệ 3.0: Chuỗi cung ứng & Nhập kho
```mermaid
flowchart TD
    F3["3.0 PHÂN HỆ ĐỐI TÁC & CHUỖI CUNG ỨNG"]

    F3 --> F3_1["3.1 Quản lý Nhà cung cấp"]
    F3 --> F3_2["3.2 Lập Phiếu nhập kho"]
    F3 --> F3_3["3.3 Nghiệm thu & Duyệt kho"]
    F3 --> F3_4["3.4 In ấn & Lưu trữ chứng từ"]

    %% Chi tiết 3.1
    F3_1 --> F3_1_1["3.1.1 Thêm thông tin đối tác & MST"]
    F3_1 --> F3_1_2["3.1.2 Cập nhật chiết khấu & địa chỉ kho"]
    F3_1 --> F3_1_3["3.1.3 Quản lý liên hệ hotline & email"]

    %% Chi tiết 3.2
    F3_2 --> F3_2_1["3.2.1 Chọn NCC & người lập phiếu"]
    F3_2 --> F3_2_2["3.2.2 Thêm danh mục mặt hàng nhập"]
    F3_2 --> F3_2_3["3.2.3 Tự động tính đơn giá vốn & thành tiền"]
    F3_2 --> F3_2_4["3.2.4 Lưu phiếu ở trạng thái Chờ duyệt"]

    %% Chi tiết 3.3
    F3_3 --> F3_3_1["3.3.1 Kiểm tra quy cách ngoại quan hàng"]
    F3_3 --> F3_3_2["3.3.2 Xác nhận duyệt nhập kho"]
    F3_3 --> F3_3_3["3.3.3 Tự động cộng tồn kho phụ tùng & xe"]

    %% Chi tiết 3.4
    F3_4 --> F3_4_1["3.4.1 Xem biên bản có 4 chữ ký xác nhận"]
    F3_4 --> F3_4_2["3.4.2 In biên bản giao nhận ra A4 / PDF"]
```

#### 3.2. Phân rã chi tiết Phân hệ 4.0: Bán hàng & Đơn hàng
```mermaid
flowchart TD
    F4["4.0 PHÂN HỆ BÁN HÀNG & QUẢN LÝ ĐƠN HÀNG"]

    F4 --> F4_1["4.1 Mua hàng & Giỏ hàng online"]
    F4 --> F4_2["4.2 Tiếp nhận & Xét duyệt đơn"]
    F4 --> F4_3["4.3 Điều phối giao vận"]
    F4 --> F4_4["4.4 Hoàn tất & Thanh toán"]

    %% Chi tiết 4.1
    F4_1 --> F4_1_1["4.1.1 Tra cứu & chọn mua phụ tùng"]
    F4_1 --> F4_1_2["4.1.2 Thêm vào giỏ & tăng giảm số lượng"]
    F4_1 --> F4_1_3["4.1.3 Nhập địa chỉ & thông tin nhận hàng"]
    F4_1 --> F4_1_4["4.1.4 Xác nhận đặt đơn hàng online"]

    %% Chi tiết 4.2
    F4_2 --> F4_2_1["4.2.1 Kiểm tra số lượng tồn kho thực tế"]
    F4_2 --> F4_2_2["4.2.2 Xác nhận duyệt đơn hàng"]
    F4_2 --> F4_2_3["4.2.3 Tự động trừ tồn kho phụ tùng"]

    %% Chi tiết 4.3
    F4_3 --> F4_3_1["4.3.1 Đóng gói kiện hàng"]
    F4_3 --> F4_3_2["4.3.2 Chuyển trạng thái Đang giao"]
    F4_3 --> F4_3_3["4.3.3 Cung cấp thông tin shipper cho khách"]

    %% Chi tiết 4.4
    F4_4 --> F4_4_1["4.4.1 Thu tiền COD hoặc chuyển khoản"]
    F4_4 --> F4_4_2["4.4.2 Chuyển trạng thái Hoàn thành đơn"]
    F4_4 --> F4_4_3["4.4.3 Xuất hóa đơn điện tử cho khách"]
```

#### 3.3. Phân rã chi tiết Phân hệ 5.0: Lịch hẹn Dịch vụ Kỹ thuật & Lái thử
```mermaid
flowchart TD
    F5["5.0 PHÂN HỆ QUẢN LÝ LỊCH HẸN & DỊCH VỤ"]

    F5 --> F5_1["5.1 Đăng ký lịch hẹn online"]
    F5 --> F5_2["5.2 Tiếp nhận & Phân công"]
    F5 --> F5_3["5.3 Thực hiện dịch vụ tại xưởng"]
    F5 --> F5_4["5.4 Nghiệm thu & Lưu bệnh án"]

    %% Chi tiết 5.1
    F5_1 --> F5_1_1["5.1.1 Chọn loại dịch vụ: Bảo dưỡng / Sửa chữa / Lái thử"]
    F5_1 --> F5_1_2["5.1.2 Chọn xe mẫu trưng bày hoặc nhập xe của khách"]
    F5_1 --> F5_1_3["5.1.3 Chọn ngày & khung giờ đón tiếp"]
    F5_1 --> F5_1_4["5.1.4 Gửi yêu cầu đặt lịch hẹn"]

    %% Chi tiết 5.2
    F5_2 --> F5_2_1["5.2.1 Kiểm tra khoang bảo dưỡng còn trống"]
    F5_2 --> F5_2_2["5.2.2 Phân công kỹ thuật viên phụ trách"]
    F5_2 --> F5_2_3["5.2.3 Xác nhận lịch & gửi thông báo cho khách"]

    %% Chi tiết 5.3
    F5_3 --> F5_3_1["5.3.1 Đón tiếp khách & nhận bàn giao xe"]
    F5_3 --> F5_3_2["5.3.2 Chuyển trạng thái Đang thực hiện"]
    F5_3 --> F5_3_3["5.3.3 Thay thế phụ tùng & bảo dưỡng theo quy trình"]

    %% Chi tiết 5.4
    F5_4 --> F5_4_1["5.4.1 Kiểm tra vận hành nghiệm thu xe"]
    F5_4 --> F5_4_2["5.4.2 Ghi nhật ký bảo dưỡng & phụ tùng đã thay vào hồ sơ xe"]
    F5_4 --> F5_4_3["5.4.3 Chuyển trạng thái Hoàn thành & in phiếu thanh toán"]
```

---

## II. SƠ ĐỒ DFD MỨC 0 (MỨC NGỮ CẢNH — CONTEXT DIAGRAM)

Sơ đồ thể hiện luồng trao đổi thông tin tổng quát giữa Hệ thống MOTOSHOP với 3 Tác nhân bên ngoài (External Entities):
1. **Khách hàng (Customer)**
2. **Nhân viên / Quản trị viên (Staff / Admin)**
3. **Nhà cung cấp / Phân phối (Supplier)**

```mermaid
flowchart LR
    KH["👤 KHÁCH HÀNG"]
    HT(("⚙️ 0.0 HỆ THỐNG CRM & ĐẠI LÝ XE MÁY MOTOSHOP"))
    NV["👔 NHÂN VIÊN / QUẢN TRỊ VIÊN"]
    NCC["🏢 NHÀ CUNG CẤP / PHÂN PHỐI"]

    %% Luồng Khách hàng
    KH -- "1. Đăng ký/Đăng nhập, Cập nhật thông tin cá nhân<br/>2. Đặt mua phụ tùng, Yêu cầu đặt lịch hẹn dịch vụ<br/>3. Gửi đánh giá, phản hồi, phiếu khảo sát" --> HT
    HT -- "1. Xác nhận tài khoản, Thông tin hồ sơ<br/>2. Hóa đơn đơn hàng, Xác nhận lịch hẹn dịch vụ<br/>3. Danh mục xe, phụ tùng, kết quả xử lý phản hồi" --> KH

    %% Luồng Nhân viên / Admin
    NV -- "1. Thông tin đăng nhập, Yêu cầu phân quyền<br/>2. Cập nhật trạng thái đơn hàng, duyệt lịch hẹn<br/>3. Thêm/sửa danh mục xe, phụ tùng, trả lời phản hồi<br/>4. Lập phiếu nhập kho, cấu hình hệ thống" --> HT
    HT -- "1. Quyền truy cập, Thông báo đơn hàng/lịch hẹn mới<br/>2. Danh sách khách hàng, danh sách phản hồi<br/>3. Báo cáo doanh thu, thống kê tồn kho" --> NV

    %% Luồng Nhà cung cấp
    NCC -- "1. Báo giá, Thông tin sản phẩm/xe máy mới<br/>2. Hóa đơn giao hàng, Biên bản bàn giao hàng hóa" --> HT
    HT -- "1. Đơn đặt hàng từ đại lý, Yêu cầu nhập kho<br/>2. Biên bản nghiệm thu nhập kho, Thông tin thanh toán" --> NCC
```

---

## III. SƠ ĐỒ DFD MỨC 1 (MỨC ĐỈNH — TOP-LEVEL DIAGRAM)

Phân rã hệ thống thành **7 Tiến trình xử lý cốt lõi** và **6 Kho lưu trữ dữ liệu (Data Stores)**:
- `D1: TAI_KHOAN & NHAN_VIEN`
- `D2: KHO_HANG (PHU_TUNG & SAN_PHAM_XE)`
- `D3: NHA_CUNG_CAP & PHIEU_NHAP`
- `D4: DON_HANG & CHI_TIET_DON_HANG`
- `D5: LICH_HEN_DICH_VU`
- `D6: KHACH_HANG, XE_KH, PHAN_HOI & KHAO_SAT`

```mermaid
flowchart TD
    %% Tác nhân
    KH["👤 Khách hàng"]
    NV["👔 Nhân viên / Admin"]
    NCC["🏢 Nhà cung cấp"]

    %% Tiến trình
    P1(("1.0 Xác thực & Phân quyền"))
    P2(("2.0 Quản lý Danh mục Kho"))
    P3(("3.0 Quản lý Đối tác & Nhập kho"))
    P4(("4.0 Quản lý Đơn hàng & Bán hàng"))
    P5(("5.0 Quản lý Lịch hẹn & Dịch vụ"))
    P6(("6.0 Quản lý Khách hàng & CRM"))
    P7(("7.0 Báo cáo & Thống kê"))

    %% Kho dữ liệu
    D1[("D1: TÀI KHOẢN & NHÂN VIÊN")]
    D2[("D2: KHO HÀNG (XE & PHỤ TÙNG)")]
    D3[("D3: ĐỐI TÁC & PHIẾU NHẬP")]
    D4[("D4: ĐƠN HÀNG & CHI TIẾT")]
    D5[("D5: LỊCH HẸN DỊCH VỤ")]
    D6[("D6: KHÁCH HÀNG & PHẢN HỒI")]

    %% Luồng P1
    KH -- "Thông tin tài khoản" --> P1
    NV -- "Tài khoản nhân viên" --> P1
    P1 <--> D1
    P1 -- "Quyền truy cập & Phiên làm việc" --> KH
    P1 -- "Quyền quản trị theo vai trò" --> NV

    %% Luồng P2
    NV -- "Cập nhật giá, mô tả, ảnh SP" --> P2
    P2 <--> D2
    P2 -- "Thông tin xe & phụ tùng" --> KH

    %% Luồng P3
    NCC -- "Hóa đơn & Hàng hóa" --> P3
    NV -- "Lập phiếu nhập kho" --> P3
    P3 <--> D3
    P3 -- "Tăng số lượng tồn kho" --> D2
    P3 -- "Biên bản nhập kho" --> NCC
    P3 -- "Phiếu nhập đã duyệt" --> NV

    %% Luồng P4
    KH -- "Yêu cầu đặt mua phụ tùng" --> P4
    P4 <--> D4
    P4 -- "Kiểm tra & Giảm tồn kho" --> D2
    NV -- "Duyệt & Cập nhật trạng thái giao hàng" --> P4
    P4 -- "Hóa đơn & Trạng thái đơn" --> KH

    %% Luồng P5
    KH -- "Đăng ký bảo dưỡng / sửa chữa / lái thử" --> P5
    NV -- "Xác nhận & Cập nhật tiến độ" --> P5
    P5 <--> D5
    P5 -- "Lưu lịch sử dịch vụ vào xe khách" --> D6
    P5 -- "Lịch hẹn đã xác nhận" --> KH

    %% Luồng P6
    KH -- "Gửi đánh giá, khiếu nại, khảo sát" --> P6
    NV -- "Xử lý phản hồi, quản lý hồ sơ KH" --> P6
    P6 <--> D6
    P6 -- "Kết quả hỗ trợ, chăm sóc" --> KH

    %% Luồng P7
    D2 -. "Số liệu tồn kho" .-> P7
    D3 -. "Chi phí nhập hàng" .-> P7
    D4 -. "Doanh thu bán hàng" .-> P7
    D5 -. "Doanh số dịch vụ" .-> P7
    D6 -. "Chỉ số hài lòng & độ tuổi" .-> P7
    P7 -- "Báo cáo doanh thu & biểu đồ phân tích" --> NV
```

---

## IV. SƠ ĐỒ DFD MỨC 2 (MỨC DƯỚI ĐỈNH — CHI TIẾT TỪNG NGHIỆP VỤ)

Ở mức 2, chúng ta phân rã sâu vào **3 phân hệ nghiệp vụ quan trọng nhất** của đề tài:
1. **Phân rã 3.0: Quản lý Đối tác & Nhập kho (Chuỗi cung ứng)**
2. **Phân rã 4.0: Quản lý Đơn hàng & Bán hàng**
3. **Phân rã 5.0: Quản lý Lịch hẹn Dịch vụ & Lái thử**

---

### 1. DFD Mức 2 — Phân rã Tiến trình 3.0: Quản lý Đối tác & Nhập kho

```mermaid
flowchart TD
    NV["👔 Nhân viên Thủ kho / Admin"]
    NCC["🏢 Nhà cung cấp / Đối tác"]

    P3_1(("3.1 Tiếp nhận & Quản lý Nhà cung cấp"))
    P3_2(("3.2 Lập Phiếu nhập kho & Chi tiết"))
    P3_3(("3.3 Nghiệm thu giao nhận & Duyệt kho"))
    P3_4(("3.4 In biên bản & Cập nhật tồn kho"))

    D2[("D2: KHO HÀNG (XE & PHỤ TÙNG)")]
    D3_1[("D3.1: NHÀ CUNG CẤP")]
    D3_2[("D3.2: PHIẾU NHẬP KHO")]
    D3_3[("D3.3: CHI TIẾT PHIẾU NHẬP")]

    %% 3.1
    NCC -- "Thông tin pháp nhân, MST, Báo giá" --> P3_1
    NV -- "Thêm / Sửa đối tác cung ứng" --> P3_1
    P3_1 <--> D3_1
    P3_1 -- "Hồ sơ đối tác đã lưu" --> NV

    %% 3.2
    NV -- "Chọn NCC, Nhập danh mục mặt hàng" --> P3_2
    D3_1 -. "Thông tin NCC & Chiết khấu" .-> P3_2
    D2 -. "Mã sản phẩm (SKU) có sẵn" .-> P3_2
    P3_2 --> D3_2
    P3_2 --> D3_3
    P3_2 -- "Phiếu nhập ở trạng thái Chờ duyệt" --> NV

    %% 3.3
    NCC -- "Hàng hóa & Tài xế giao hàng" --> P3_3
    NV -- "Kiểm tra ngoại quan & Duyệt nhập kho" --> P3_3
    P3_3 <--> D3_2
    P3_3 <--> D3_3

    %% 3.4
    P3_3 -- "Xác nhận duyệt thành công" --> P3_4
    P3_4 -- "Tự động cộng thêm số lượng tồn" --> D2
    P3_4 -- "Biên bản giao nhận có chữ ký (PDF/A4)" --> NV
    P3_4 -- "Biên bản hoàn tất nhập kho" --> NCC
```

---

### 2. DFD Mức 2 — Phân rã Tiến trình 4.0: Quản lý Bán hàng & Đơn hàng phụ tùng

```mermaid
flowchart TD
    KH["👤 Khách hàng"]
    NV["💼 Nhân viên Bán hàng / Admin"]

    P4_1(("4.1 Chọn hàng & Lập đơn online"))
    P4_2(("4.2 Kiểm tra tồn kho & Xác nhận đơn"))
    P4_3(("4.3 Đóng gói & Điều phối giao vận"))
    P4_4(("4.4 Hoàn tất & Cập nhật thanh toán"))

    D2[("D2: KHO HÀNG (PHỤ TÙNG)")]
    D4_1[("D4.1: ĐƠN HÀNG")]
    D4_2[("D4.2: CHI TIẾT ĐƠN HÀNG")]

    %% 4.1
    D2 -. "Xem danh mục, giá bán lẻ, tồn kho" .-> P4_1
    KH -- "Thêm vào giỏ & Gửi thông tin giao hàng" --> P4_1
    P4_1 --> D4_1
    P4_1 --> D4_2
    P4_1 -- "Mã đơn hàng #DHxxx (Chờ duyệt)" --> KH

    %% 4.2
    NV -- "Xem đơn mới & Xác nhận đơn" --> P4_2
    P4_2 <--> D4_1
    P4_2 <--> D4_2
    P4_2 -- "Trừ số lượng tồn kho theo số lượng đặt" --> D2
    P4_2 -- "Thông báo đơn hàng đã xác nhận" --> KH

    %% 4.3
    NV -- "Chuyển trạng thái Đang giao" --> P4_3
    P4_3 <--> D4_1
    P4_3 -- "Thông tin kiện hàng & Shipper" --> KH

    %% 4.4
    KH -- "Nhận hàng & Thanh toán (COD/CK)" --> P4_4
    NV -- "Cập nhật Hoàn thành đơn" --> P4_4
    P4_4 <--> D4_1
    P4_4 -- "Hóa đơn điện tử hoàn tất" --> KH
```

---

### 3. DFD Mức 2 — Phân rã Tiến trình 5.0: Quản lý Lịch hẹn Dịch vụ Kỹ thuật & Lái thử

```mermaid
flowchart TD
    KH["👤 Khách hàng"]
    KT["🔧 Nhân viên Kỹ thuật / Cố vấn dịch vụ"]

    P5_1(("5.1 Đăng ký lịch hẹn trực tuyến"))
    P5_2(("5.2 Tiếp nhận & Điều phối khung giờ"))
    P5_3(("5.3 Tiếp nhận xe & Thực hiện dịch vụ"))
    P5_4(("5.4 Nghiệm thu, Thanh toán & Lưu bệnh án xe"))

    D2[("D2: XE MẪU TRƯNG BÀY")]
    D5[("D5: LỊCH HẸN DỊCH VỤ")]
    D6_1[("D6.1: XE KHÁCH HÀNG")]

    %% 5.1
    D2 -. "Danh sách xe mẫu lái thử" .-> P5_1
    KH -- "Chọn loại dịch vụ, ngày giờ, thông tin xe" --> P5_1
    P5_1 --> D5
    P5_1 -- "Phiếu hẹn Chờ duyệt" --> KH

    %% 5.2
    KT -- "Kiểm tra khoang bảo dưỡng & Duyệt hẹn" --> P5_2
    P5_2 <--> D5
    P5_2 -- "Thông báo xác nhận lịch hẹn kèm giờ đón" --> KH

    %% 5.3
    KH -- "Mang xe đến Showroom / Đi lái thử" --> P5_3
    KT -- "Chuyển trạng thái Đang thực hiện" --> P5_3
    P5_3 <--> D5
    D6_1 -. "Tra cứu lịch sử bảo dưỡng trước đây" .-> P5_3

    %% 5.4
    KT -- "Hoàn thành bảo dưỡng / sửa chữa" --> P5_4
    P5_4 <--> D5
    P5_4 -- "Ghi nhật ký bảo dưỡng & phụ tùng đã thay" --> D6_1
    P5_4 -- "Biên bản nghiệm thu & Phiếu thanh toán dịch vụ" --> KH
```

---

## V. BẢNG ĐỐI CHIẾU THỰC THỂ, TIẾN TRÌNH VÀ KHO DỮ LIỆU

| Ký hiệu | Tên đối tượng | Ý nghĩa trong hệ thống CRM MOTOSHOP |
|:---:|:---|:---|
| **Tác nhân** | `👤 Khách hàng` | Người dùng mua phụ tùng, xem xe, đặt lịch dịch vụ, gửi phản hồi |
| **Tác nhân** | `👔 Nhân viên / Admin` | Ban quản trị, nhân viên bán hàng, kỹ thuật viên xưởng dịch vụ |
| **Tác nhân** | `🏢 Nhà cung cấp` | Các hãng xe (Honda, Yamaha) & thương hiệu phụ tùng (Motul, Michelin, Brembo...) |
| **Tiến trình 1.0** | Xác thực & Phân quyền | Quản lý đăng nhập, cấp quyền theo vai trò (`SuperAdmin`, `Sale`, `Kỹ thuật`) |
| **Tiến trình 2.0** | Quản lý Danh mục Kho | Quản lý 18+ mã phụ tùng và 14+ mẫu xe máy trưng bày |
| **Tiến trình 3.0** | Đối tác & Nhập kho | Quản lý nhà phân phối, tạo phiếu nhập kho, biên bản giao nhận và tăng tồn |
| **Tiến trình 4.0** | Đơn hàng & Bán hàng | Giỏ hàng, duyệt đơn, xuất kho, điều phối giao hàng |
| **Tiến trình 5.0** | Lịch hẹn & Dịch vụ | Đặt hẹn bảo dưỡng/sửa chữa/lái thử, điều phối kỹ thuật, lưu bệnh án xe |
| **Tiến trình 6.0** | Khách hàng & CRM | Quản lý hồ sơ KH, xe sở hữu, giải quyết khiếu nại, khảo sát ý kiến |
| **Tiến trình 7.0** | Báo cáo & Thống kê | Tổng hợp doanh thu, lợi nhuận gộp, cơ cấu khách hàng và dịch vụ |
| **Kho D1** | `TAI_KHOAN` | Lưu trữ username, password băm, quyền hạn, nhân viên |
| **Kho D2** | `KHO_HANG` | Lưu trữ `PHU_TUNG` (tồn kho, giá) và `SAN_PHAM_XE` |
| **Kho D3** | `DOI_TAC_NHAP_KHO` | Lưu trữ `NHA_CUNG_CAP`, `PHIEU_NHAP` và `CHI_TIET_PHIEU_NHAP` |
| **Kho D4** | `DON_HANG` | Lưu trữ `DON_HANG` và `CHI_TIET_DON_HANG` |
| **Kho D5** | `LICH_HEN` | Lưu trữ thông tin hẹn dịch vụ, ngày giờ, loại dịch vụ, trạng thái |
| **Kho D6** | `KHACH_HANG_CRM` | Lưu trữ `KHACH_HANG`, `XE_KHACH_HANG`, `PHAN_HOI`, `KHAO_SAT` |
