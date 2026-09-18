# 📊 BẢNG PHÂN CHIA CÔNG VIỆC THEO MODEL (GOOGLE SHEETS FORMAT)

> **Hướng dẫn sử dụng**: Bạn có thể copy toàn bộ nội dung bảng bên dưới và dán (Paste) trực tiếp vào **Google Sheets** hoặc **Excel**. Hệ thống sẽ tự động chia cột đúng định dạng.
> File CSV đính kèm cùng thư mục: `BANG_MODEL_CHIA_VIEC.csv` (Dùng để Import vào Google Sheets).

---

## 1. BẢNG PHÂN CHIA WORKLOAD THEO MODEL & MODULE (CHIA VIỆC NHÓM)

| STT | Model / Module | Trường dữ liệu (Fields & Types) | Module phụ trách | Nhân sự đảm nhận | Ước tính (Hours) | Độ ưu tiên | Trạng thái |
|---|---|---|---|---|---|---|---|
| 1 | **Customer** (Khách hàng) | `id`, `hoTen`, `email`, `soDienThoai`, `diaChi`, `ngaySinh`, `gioiTinh`, `trangThai`, `ngayDangKy`, `soXe`, `tongChiTieu`, `avatar` | CRM Admin & Customer Profile | **DEV-01 (FE)** + **DEV-02 (BE)** | 16h | High (P0) | ✅ Done |
| 2 | **Vehicle** (Phương tiện) | `id`, `customerId`, `tenXe`, `bienSo`, `namSanXuat`, `hanBaoHanh`, `mauSac`, `trangThaiBaoHanh`, `soKhung`, `hinhAnh` | Quản lý Xe & Bảo hành Điện tử | **DEV-01 (FE)** + **DEV-03 (BE)** | 14h | High (P0) | ✅ Done |
| 3 | **ShowroomVehicle** (Xe mẫu) | `id`, `tenXe`, `hang`, `phanKhuc`, `giaNiemYet`, `mauSac`, `moTa`, `hinhAnh`, `coTheLaiThu`, `dongCo`, `congSuat` | Admin Kho xe & Showroom Khách | **DEV-02 (FE)** | 12h | Medium (P1) | ✅ Done |
| 4 | **Part** (Phụ tùng & Phụ kiện) | `id`, `tenSanPham`, `thuongHieu`, `giaGoc`, `giaKhuyenMai`, `soLuongTon`, `danhMuc`, `moTa`, `hinhAnh`, `rating`, `luotDanh` | Admin Phụ tùng & Store Khách | **DEV-03 (FE)** + **DEV-02 (BE)** | 16h | High (P0) | ✅ Done |
| 5 | **CartItem / Cart** (Giỏ hàng) | `part: Part`, `soLuong: number` | E-Commerce Khách hàng | **DEV-01 (FE)** | 8h | Medium (P1) | ✅ Done |
| 6 | **Order** (Đơn hàng) | `id`, `customerId`, `hoTenKH`, `ngayDat`, `trangThai`, `tongTien`, `diaChiGiao`, `items: OrderItem[]` | Đặt hàng Khách & Admin Đơn hàng | **DEV-02 (FE)** + **DEV-03 (BE)** | 16h | High (P0) | ✅ Done |
| 7 | **Appointment** (Lịch hẹn) | `id`, `customerId`, `hoTenKH`, `soDienThoai`, `loaiDichVu`, `ngayHen`, `gioHen`, `trangThai`, `ghiChu`, `tenXe`, `bienSo` | Đặt lịch dịch vụ / Lái thử | **DEV-01 (FE)** + **DEV-02 (BE)** | 12h | Medium (P1) | ✅ Done |
| 8 | **Feedback** (Phản hồi & Khiếu nại) | `id`, `customerId`, `hoTen`, `noiDung`, `diemDanhGia`, `ngayGui`, `loaiDanhGia`, `trangThai`, `loaiNhan` | Admin Xử lý Khiếu nại & Đánh giá | **DEV-03 (FE)** | 10h | Low (P2) | ✅ Done |
| 9 | **Survey & Question** (Khảo sát) | `id`, `title`, `description`, `targetCustomerId`, `createdDate`, `questions: SurveyQuestion[]`, `status` | Admin Tạo & Gửi Khảo sát | **DEV-02 (FE)** + **DEV-01 (BE)** | 14h | Medium (P1) | ✅ Done |
| 10 | **SurveyResponse** (KQ Khảo sát) | `id`, `surveyId`, `customerId`, `customerName`, `answers: Record<string, string>`, `submittedDate` | Khách làm khảo sát & Admin xem KQ | **DEV-02 (FE)** + **DEV-03 (BE)** | 10h | Medium (P1) | ✅ Done |
| 11 | **StaffAccount & AdminRole** (Nhân sự RBAC) | `id`, `hoTen`, `email`, `soDienThoai`, `chucVu`, `vaiTro: SuperAdmin\|NhanVienBanHang\|NhanVienKyThuat`, `trangThai`, `avatar`, `ngayThamGia` | Quản lý Phân quyền Staff & Topbar Switcher | **DEV-01 (FE)** + **DEV-02 (BE)** | 14h | High (P0) | ✅ Done |
| 12 | **RevenueAnalytics** (Doanh thu đa dạng) | `period: daily\|weekly\|monthly\|yearly`, `revenueData: DataPoint[]`, `revenueBySource: SourceItem[]` | Biểu đồ Dashboard & Báo cáo Doanh thu | **DEV-03 (FE)** + **DEV-01 (BE)** | 12h | High (P0) | ✅ Done |
| 13 | **ImageUploader** (Tải ảnh) | `value`, `onChange`, `label`, `error`, `placeholder`, `FileReader Base64` | Component dùng chung toàn bộ App | **DEV-01 (FE)** | 8h | High (P0) | ✅ Done |

---

## 2. DỮ LIỆU ĐỊNH DẠNG CSV NGUYÊN BẢN (ĐỂ COPY CHÈN GOOGLE SHEETS)

```csv
STT,Model / Module,Trường dữ liệu,Module phụ trách,Nhân sự đảm nhận,Ước tính (Hours),Độ ưu tiên,Trạng thái
1,Customer,"id, hoTen, email, soDienThoai, diaChi, ngaySinh, gioiTinh, trangThai, ngayDangKy, soXe, tongChiTieu, avatar",CRM Admin & Customer Profile,DEV-01 (FE) + DEV-02 (BE),16h,High (P0),Done
2,Vehicle,"id, customerId, tenXe, bienSo, namSanXuat, hanBaoHanh, mauSac, trangThaiBaoHanh, soKhung, hinhAnh",Quản lý Xe & Bảo hành Điện tử,DEV-01 (FE) + DEV-03 (BE),14h,High (P0),Done
3,ShowroomVehicle,"id, tenXe, hang, phanKhuc, giaNiemYet, mauSac, moTa, hinhAnh, coTheLaiThu, dongCo, congSuat",Admin Kho xe & Showroom Khách,DEV-02 (FE),12h,Medium (P1),Done
4,Part,"id, tenSanPham, thuongHieu, giaGoc, giaKhuyenMai, soLuongTon, danhMuc, moTa, hinhAnh, rating, luotDanh",Admin Phụ tùng & Store Khách,DEV-03 (FE) + DEV-02 (BE),16h,High (P0),Done
5,CartItem / Cart,"part: Part, soLuong: number",E-Commerce Khách hàng,DEV-01 (FE),8h,Medium (P1),Done
6,Order,"id, customerId, hoTenKH, ngayDat, trangThai, tongTien, diaChiGiao, items: OrderItem[]",Đặt hàng Khách & Admin Đơn hàng,DEV-02 (FE) + DEV-03 (BE),16h,High (P0),Done
7,Appointment,"id, customerId, hoTenKH, soDienThoai, loaiDichVu, ngayHen, gioHen, trangThai, ghiChu, tenXe, bienSo",Đặt lịch dịch vụ / Lái thử,DEV-01 (FE) + DEV-02 (BE),12h,Medium (P1),Done
8,Feedback,"id, customerId, hoTen, noiDung, diemDanhGia, ngayGui, loaiDanhGia, trangThai, loaiNhan",Admin Xử lý Khiếu nại & Đánh giá,DEV-03 (FE),10h,Low (P2),Done
9,Survey & Question,"id, title, description, targetCustomerId, createdDate, questions: SurveyQuestion[], status",Admin Tạo & Gửi Khảo sát,DEV-02 (FE) + DEV-01 (BE),14h,Medium (P1),Done
10,SurveyResponse,"id, surveyId, customerId, customerName, answers: Record<string, string>, submittedDate",Khách làm khảo sát & Admin xem KQ,DEV-02 (FE) + DEV-03 (BE),10h,Medium (P1),Done
11,StaffAccount & AdminRole,"id, hoTen, email, soDienThoai, chucVu, vaiTro, trangThai, avatar, ngayThamGia",Quản lý Phân quyền Staff & Topbar Switcher,DEV-01 (FE) + DEV-02 (BE),14h,High (P0),Done
12,RevenueAnalytics,"period, revenueData, revenueBySource",Biểu đồ Dashboard & Báo cáo Doanh thu,DEV-03 (FE) + DEV-01 (BE),12h,High (P0),Done
13,ImageUploader,"value, onChange, label, error, placeholder, FileReader Base64",Component dùng chung toàn bộ App,DEV-01 (FE),8h,High (P0),Done
```
