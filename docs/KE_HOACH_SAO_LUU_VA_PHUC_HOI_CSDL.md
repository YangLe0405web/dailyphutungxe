# KẾ HOẠCH SAO LƯU VÀ PHỤC HỒI CƠ SỞ DỮ LIỆU TỰ ĐỘNG
### HỆ THỐNG QUẢN LÝ QUAN HỆ KHÁCH HÀNG & KINH DOANH MOTOSHOP CRM

> **Cơ sở dữ liệu:** `CRM_XeMayPhuTung` (Microsoft SQL Server)  
> **Mục tiêu:** Đảm bảo an toàn tuyệt đối dữ liệu tài chính (tiền cọc xe máy, doanh thu phụ tùng, hóa đơn công thợ, sổ bảo hành 36 tháng).

---

## 1. MỤC TIÊU PHỤC HỒI DỊCH VỤ (RPO & RTO)

| Chỉ số | Tên chỉ số | Giá trị cam kết | Giải thích nghiệp vụ |
| :---: | :--- | :---: | :--- |
| **RPO** | *Recovery Point Objective* | **<= 1 giờ** | Trong trường hợp xấu nhất (cháy nổ phần cứng, virus), lượng dữ liệu giao dịch bị mất mát tối đa không vượt quá 1 giờ làm việc của đại lý. |
| **RTO** | *Recovery Time Objective* | **<= 15 phút** | Thời gian tối đa từ khi phát hiện sự cố đến khi CSDL được khôi phục hoàn toàn và hệ thống Showroom tiếp tục bán hàng / xưởng tiếp tục nhận xe. |

---

## 2. LỊCH BIỂU SAO LƯU TỰ ĐỘNG (BACKUP SCHEDULE)

Áp dụng mô hình kết hợp **Full Backup + Differential/Log Backup**:

```
[Chủ Nhật 00:00] ─── Full Backup (Toàn phần) ───► Lưu file .bak gốc
        │
        ├── Thứ 2 (23:00) ───► Auto Backup vi sai ngày
        ├── Thứ 3 (23:00) ───► Auto Backup vi sai ngày
        ├── Thứ 4 (23:00) ───► Auto Backup vi sai ngày
        ├── Thứ 5 (23:00) ───► Auto Backup vi sai ngày
        ├── Thứ 6 (23:00) ───► Auto Backup vi sai ngày
        └── Thứ 7 (23:00) ───► Auto Backup vi sai ngày
```

* **Thời gian thực thi:** **23:00 mỗi đêm** (ngoài giờ hành chính, khi showroom đã đóng cửa, tránh xung đột I/O đĩa cứng).
* **Nơi lưu trữ:** `D:\crm-project\backup\`
* **Quy tắc đặt tên file tự động:** `CRM_XeMayPhuTung_AutoBackup_YYYYMMDD_HHMMSS.bak`
* **Chính sách lưu trữ (Retention Policy):** Hệ thống tự động quét và xóa các bản backup cũ hơn **30 ngày** để giải phóng dung lượng ổ cứng.

---

## 3. CÁC CÔNG CỤ & SCRIPT ĐÃ TRIỂN KHAI TRONG ĐỒ ÁN

Tất cả các kịch bản tự động hóa đã được xây dựng sẵn trong thư mục `scripts/`:

| Tên file script | Công dụng |
| :--- | :--- |
| **`Backup_Database_Auto.bat`** | Nhấp đúp chuột để chạy sao lưu ngay lập tức (In ra tiến độ % và dung lượng file). |
| **`Cai_Dat_Lich_Sao_Luu_23H_Hang_Ngay.bat`** | 1-click tự động đăng ký tiến trình vào **Windows Task Scheduler** để chạy ngầm lúc 23:00 mỗi đêm. |
| **`Restore_Database_Latest.bat`** | Tự động tìm bản backup mới nhất và phục hồi CSDL khi có sự cố. |
| **`backup_history.log`** | File nhật ký ghi nhận thời gian, trạng thái Thành công / Thất bại của từng ca sao lưu. |

---

## 4. QUY TRÌNH PHỤC HỒI DỮ LIỆU KHI XẢY RA SỰ CỐ (DISASTER RECOVERY)

Khi phát hiện sự cố CSDL bị hỏng hoặc nhân viên xóa nhầm dữ liệu:
1. **Bước 1:** Kỹ trị viên hệ thống mở thư mục `scripts/`.
2. **Bước 2:** Nhấp đúp chuột vào file `Restore_Database_Latest.bat`.
3. **Bước 3:** Hệ thống tự động:
   - Ngắt toàn bộ kết nối hiện tại (`ALTER DATABASE CRM_XeMayPhuTung SET SINGLE_USER WITH ROLLBACK IMMEDIATE`).
   - Nạp lại dữ liệu từ tệp `.bak` mới nhất (`RESTORE DATABASE ... WITH REPLACE`).
   - Mở lại chế độ đa người dùng (`SET MULTI_USER`).
4. **Bước 4:** Kiểm tra tính toàn vẹn và khởi động lại Backend API (`dotnet run`). Toàn bộ quá trình mất **dưới 1 phút**.
