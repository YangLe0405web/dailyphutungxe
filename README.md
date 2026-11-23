# 🏍️ MOTOSHOP CRM & E-COMMERCE MANAGEMENT SYSTEM

> **Hệ thống Quản lý Quan hệ Khách hàng (CRM) & Kinh doanh Showroom Xe máy, Phụ tùng chính hãng**  
> *Đồ án tốt nghiệp / Khóa luận chuyên ngành Công nghệ Thông tin & Hệ thống Thông tin*

---

<p align="center">
  <img src="https://img.shields.io/badge/.NET-10.0%20%2F%208.0-512BD4?style=for-the-badge&logo=dotnet&logoColor=white" alt=".NET 10" />
  <img src="https://img.shields.io/badge/ASP.NET_Core-Web_API-512BD4?style=for-the-badge&logo=.net&logoColor=white" alt="ASP.NET Core" />
  <img src="https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/Microsoft_SQL_Server-2022-CC292B?style=for-the-badge&logo=microsoftsqlserver&logoColor=white" alt="SQL Server 2022" />
  <img src="https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Architecture-3--Tier%20Client--Server-success?style=for-the-badge" alt="3-Tier Architecture" />
</p>

---

## 📑 MỤC LỤC
1. [Giới thiệu Tổng quan](#-1-giới-thiệu-tổng-quan)
2. [Kiến trúc Hệ thống (3-Tier Architecture)](#-2-kiến-trúc-hệ-thống-3-tier-architecture)
3. [Mô hình hóa Nghiệp vụ (BFD & DFD)](#-3-mô-hình-hóa-nghiệp-vụ-bfd--dfd)
4. [Các Phân hệ Chức năng Cốt lõi](#-4-các-phân-hệ-chức-năng-cốt-lõi)
5. [Cấu trúc Thư mục Dự án](#-5-cấu-trúc-thư-mục-dự-án)
6. [Hướng dẫn Cài đặt & Khởi động](#-6-hướng-dẫn-cài-đặt--khởi-động)
7. [Danh sách Tài khoản Demo (Chấm thi)](#-7-danh-sách-tài-khoản-demo-chấm-thi)
8. [Phương án Bảo mật & Sao lưu CSDL Tự động](#-8-phương-án-bảo-mật--sao-lưu-csdl-tự-động)
9. [Công nghệ Sử dụng](#-9-công-nghệ-sử-dụng)

---

## 🌟 1. GIỚI THIỆU TỔNG QUAN

**MotoShop CRM** là giải pháp phần mềm toàn diện giải quyết triệt để các bài toán phân tán, thất thoát và thủ công trong quy trình vận hành chuỗi đại lý ủy quyền xe máy & phụ tùng chính hãng (Honda, Yamaha, Piaggio, Vespa, Suzuki, SYM):

* **Số hóa quy trình bán lẻ & đặt cọc trực tuyến:** Khách hàng có thể trải nghiệm xem xe 360°, chọn phiên bản màu sắc, thanh toán đặt cọc 2.000.000đ qua mã VietQR động, và nhận ngay **Mã QR bàn giao xe 1-lần** khi đến showroom.
* **Hồ sơ khách hàng 360° & Định giá vòng đời (CLV):** Tự động phân hạng thành viên (Đồng, Bạc, Vàng, Kim Cương) dựa trên tổng chi tiêu tích lũy, quản lý giấy tờ cà vẹt và định danh phương tiện.
* **Xóa bỏ sổ bảo hành giấy truyền thống:** Thay thế bằng **Sổ bảo hành điện tử chính hãng 36 tháng / 30.000 km**, minh bạch các mốc bảo dưỡng định kỳ 0đ, chống tua đồng hồ ODO và gian lận kỹ thuật.
* **Quản trị xưởng dịch vụ thông minh:** Điều phối công suất bàn nâng KTV, tiếp nhận xe theo khung giờ hẹn, lập phiếu báo giá và xuất hóa đơn dịch vụ tích hợp công thợ & linh kiện.
* **Báo cáo quản trị thời gian thực (BI Dashboard):** Tách bạch chuẩn xác doanh thu 3 mảng (Xe mới, Phụ tùng, Dịch vụ kỹ thuật), thống kê tỷ lệ phản hồi và chỉ số hài lòng khách hàng CSAT.

---

## 🏛️ 2. KIẾN TRÚC HỆ THỐNG (3-TIER ARCHITECTURE)

Hệ thống được thiết kế theo **Kiến trúc 3 Tầng vật lý và logic độc lập (3-Tier Decoupled Architecture)** kết hợp mô hình Client-Server hiện đại:

```
┌──────────────────────────────────────────────────────────────────────────┐
│ 1. PRESENTATION TIER (Tầng Trình Diễn - Single Page App)                 │
│    • Framework: React 19 + TypeScript + Vite + TailwindCSS 4.0           │
│    • Trực quan hóa: Recharts, Canvas QR Generator, Responsive Grid UI    │
│    • Cổng truy cập: http://localhost:5173                                │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ Gọi RESTful API (HTTP/JSON + CORS)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 2. APPLICATION / BUSINESS TIER (Tầng Xử Lý Nghiệp Vụ - Web API)          │
│    • Nền tảng: ASP.NET Core Web API (.NET 10 / C#)                       │
│    • Data Access: Dapper Micro-ORM (High Performance, Parameterized SQL) │
│    • Tài liệu hóa: Swagger / OpenAPI UI                                  │
│    • Cổng API: http://localhost:5208/api | Swagger: :5208/swagger        │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │ T-SQL Queries (TCP 1433)
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│ 3. DATA TIER (Tầng Dữ Liệu - Relational Database)                        │
│    • Hệ quản trị: Microsoft SQL Server 2022                              │
│    • Database: CRM_XeMayPhuTung (12 bảng thực thể, toàn vẹn khóa ngoại)  │
│    • Cơ chế: Transaction ACID, Indexing, Auto Scheduled Backup          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 📊 3. MÔ HÌNH HÓA NGHIỆP VỤ (BFD & DFD)

Đồ án tuân thủ đầy đủ quy chuẩn môn *Phân tích & Thiết kế Hệ thống Thông tin (PTTKHTTT)* theo phong cách giáo trình đại học:

* **Sơ đồ phân cấp chức năng (BFD) mức 2:** Phân rã mục tiêu hệ thống (Mức 0) thành 5 phân hệ mức 1 và 18 chức năng tác nghiệp mức 2.
* **Sơ đồ luồng dữ liệu (DFD) mức ngữ cảnh:** Tiến trình trung tâm 0.0 kết nối 2 chiều với 5 tác nhân ngoài (*Khách Hàng, Ban Lãnh Đạo, Nhân Viên Bán Hàng, Kỹ Thuật Viên Xưởng, Cổng VietQR*).
* **Sơ đồ luồng dữ liệu (DFD) mức đỉnh (Level 1):** Phân rã 5 tiến trình lớn liên kết 7 kho dữ liệu chuẩn Gane & Sarson (`D1` đến `D7`).
* **Sơ đồ luồng dữ liệu (DFD) mức dưới đỉnh (Level 2):** Phân rã chuyên sâu Phân hệ Bán hàng (3.0) và Phân hệ Dịch vụ Xưởng (4.0).

> 🌐 **Xem trang trực quan hóa Vector SVG có nút xuất ảnh:** [crm-frontend/public/mo-hinh-nghiep-vu-bfd-dfd.html](./crm-frontend/public/mo-hinh-nghiep-vu-bfd-dfd.html)  
> 🖼️ **Thư mục ảnh PNG 2x Retina & SVG cho Word:** [crm-frontend/public/hinh-anh-do-an-word/](./crm-frontend/public/hinh-anh-do-an-word/)

---

## ⚡ 4. CÁC PHÂN HỆ CHỨC NĂNG CỐT LÕI

| Phân hệ | Tính năng chính |
| :--- | :--- |
| **1. Quản trị Hệ thống (Admin & RBAC)** | Phân quyền 4 vai trò độc lập, quản lý tài khoản nhân sự, khóa/mở tài khoản, giám sát log kiểm toán hệ thống. |
| **2. CRM Khách hàng 360°** | Hồ sơ khách hàng tập trung, tự động xếp hạng CLV (Đồng, Bạc, Vàng, Kim Cương), quản lý phương tiện cá nhân, xét duyệt giấy tờ cà vẹt & biển số xe. |
| **3. Bán hàng & Showroom Xe máy** | Catalog xe máy đa phân khúc (Xe ga, Xe số, Côn tay, Xe điện), thông số kỹ thuật, bộ lọc giá niêm yết, đặt cọc 2.000.000đ trực tuyến, quét mã QR nhận xe tại quầy. |
| **4. Kho Phụ tùng & Linh kiện** | Quản lý danh mục phụ tùng chính hãng, cảnh báo tồn kho an toàn, giỏ hàng bán lẻ trực tuyến, cơ chế tự động khấu trừ tồn kho khả dụng khi phát sinh đơn. |
| **5. Dịch vụ Kỹ thuật & Bàn nâng** | Đặt lịch hẹn bảo dưỡng/sửa chữa/lái thử trực tuyến, ma trận điều phối bàn nâng xưởng theo ca KTV, lịch Calendar 31 ngày tránh trùng lịch. |
| **6. Sổ Bảo hành & Bảo hiểm** | Sổ bảo hành điện tử chính hãng 36 tháng / 30.000 km, theo dõi tiến độ ODO, duyệt chi phí bảo hành 0đ, gói bảo hành mở rộng Care+ và cấp bảo hiểm xe máy tại quầy POS. |
| **7. Khảo sát & CSAT** | Đánh giá sao kèm nhận xét sau đơn hàng, bài khảo sát độ hài lòng động theo phân khúc khách hàng, ghi nhận khiếu nại và phản hồi dịch vụ. |
| **8. Báo cáo & Thống kê (BI)** | Dashboard tổng hợp, tách bạch doanh thu xe mới - phụ tùng - công thợ dịch vụ, lọc theo ngày/tháng chuẩn giờ Việt Nam (UTC+7), xuất báo cáo in ấn A4. |

---

## 📁 5. CẤU TRÚC THƯ MỤC DỰ ÁN

```
crm-project/
├── CHAY_DO_AN.bat            # ⚡ Script 1-Click khởi động toàn bộ hệ thống
├── docker-compose.yml        # Container hóa MS SQL Server 2022
│
├── CrmBackend/               # 🔧 BACKEND: ASP.NET Core Web API (.NET 10 / C#)
│   ├── Controllers/          # API Endpoints (DonHang, KhachHang, LichHen, XeMau...)
│   ├── Models/               # DTOs & Domain Models
│   ├── appsettings.json      # Cấu hình chuỗi kết nối Database
│   └── Program.cs            # Khởi tạo DI, Dapper Connection, CORS & Middleware
│
├── crm-frontend/             # 💻 FRONTEND: React 19 + TypeScript + Vite
│   ├── src/
│   │   ├── pages/admin/      # Giao diện Quản trị (Dashboard, Sales, Appointments...)
│   │   ├── pages/customer/   # Giao diện Khách hàng (Showroom, Booking, Profile...)
│   │   ├── components/       # UI Components tái sử dụng (Header, Sidebar, Modals...)
│   │   ├── contexts/         # State Management (AuthContext, CartContext...)
│   │   └── services/api.ts   # Axios/Fetch API client kết nối Backend
│   └── public/
│       ├── hinh-anh-do-an-word/ # Thư viện ảnh sơ đồ PNG & SVG phục vụ chèn Word
│       ├── mo-hinh-nghiep-vu-bfd-dfd.html # Trang xem sơ đồ BFD & DFD chuẩn giáo trình
│       └── chuong-4-trien-khai-bao-tri-huong-dan-su-dung.html # Báo cáo Chương 4
│
├── init-db/                  # 🗄️ CSDL: Script khởi tạo Database & Seed Data
│   └── init.sql              # Cấu trúc bảng + Dữ liệu mẫu (16 Users, 31 Xe, Phụ tùng)
│
├── scripts/                  # 🤖 KỊCH BẢN TỰ ĐỘNG HÓA (AUTOMATION)
│   ├── Backup_Database_Auto.bat / .ps1 # Kịch bản sao lưu CSDL tự động
│   ├── Cai_Dat_Lich_Sao_Luu_23H_Hang_Ngay.bat # Đăng ký Windows Task Scheduler
│   └── Restore_Database_Latest.bat / .ps1    # Kịch bản khôi phục CSDL 1-Click
│
└── docs/                     # 📚 TÀI LIỆU ĐỒ ÁN & BÁO CÁO KỸ THUẬT
    ├── HUONG_DAN_CHAY_DO_AN_CHAM_THI.md # Hướng dẫn chạy và kịch bản chấm thi
    ├── KE_HOACH_SAO_LUU_VA_PHUC_HOI_CSDL.md # Đặc tả chỉ số RPO/RTO & Backup
    └── CHUONG_4_TRIEN_KHAI_BAO_TRI_HUONG_DAN_SU_DUNG.md # Nội dung Chương 4
```

---

## 🚀 6. HƯỚNG DẪN CÀI ĐẶT & KHỞI ĐỘNG

### ⚡ Cách 1: Khởi động nhanh bằng 1-Click (Khuyên dùng khi chấm thi)
Nhấp đúp chuột vào file:
```cmd
CHAY_DO_AN.bat
```
File sẽ tự động:
1. Mở Backend API tại `http://localhost:5208`
2. Mở Frontend Web App tại `http://localhost:5173`
3. Tự động bật trình duyệt web truy cập trang chủ
4. In sẵn danh sách tài khoản demo trên màn hình!

---

### 💻 Cách 2: Khởi động thủ công qua Terminal

#### 1. Khởi động Backend API:
```powershell
cd CrmBackend
dotnet run
```
> Khi Terminal hiển thị: `Now listening on: http://localhost:5208` là Backend đã kết nối SQL Server thành công.

#### 2. Khởi động Frontend:
```powershell
cd crm-frontend
npm run dev
```
> Khi Terminal hiển thị: `Local: http://localhost:5173/` là Frontend đã sẵn sàng. Truy cập trình duyệt tại **`http://localhost:5173`**.

---

## 🔑 7. DANH SÁCH TÀI KHOẢN DEMO (CHẤM THI)

Tất cả tài khoản hệ thống sử dụng mật khẩu chung: **`123456`**

| Vai trò (Role) | Tên đăng nhập (Username) | Mật khẩu | Kịch bản demo trọng tâm |
| :--- | :--- | :---: | :--- |
| **Quản trị viên (SuperAdmin)** | `admin` | `123456` | • Dashboard Báo cáo Doanh thu 3 mảng (Xe, Phụ tùng, Dịch vụ)<br>• Phân tích CSAT và tăng trưởng kinh doanh<br>• Quản trị phân quyền RBAC, khóa/mở tài khoản |
| **Nhân viên Bán hàng (Sales)** | `anhnguyen`<br>*(hoặc: hoangtran, hale)* | `123456` | • Xem danh mục xe mẫu, bảng giá niêm yết<br>• Tiếp nhận đơn cọc xe máy 2.000.000đ<br>• Quét/nhập mã QR nhận xe và bàn giao chìa khóa |
| **Kỹ thuật viên Xưởng (KTV)** | `thanhnguyen`<br>*(hoặc: ductran, namle)* | `123456` | • Giám sát lịch tiếp nhận xe vào bàn nâng xưởng<br>• Thẩm định bảo hành chính hãng (36 tháng / 30.000 km)<br>• Cập nhật ODO, xuất phụ tùng và nghiệm thu hoàn thành |
| **Khách hàng (Customer)** | `nguyenvanan`<br>*(hoặc: tranthibich)* | `123456` | • Xem xe 360°, đặt cọc giữ xe online (VietQR)<br>• Nhận Mã QR nhận xe tại Showroom<br>• Đặt lịch hẹn bảo dưỡng định kỳ và đánh giá CSAT |

---

## 🛡️ 8. PHƯƠNG ÁN BẢO MẬT & SAO LƯU CSDL TỰ ĐỘNG

* **Cam kết an toàn dữ liệu:** **RPO &le; 1 giờ** *(Recovery Point Objective)* và **RTO &le; 15 phút** *(Recovery Time Objective)*.
* **Lập lịch tự động qua Windows Task Scheduler:** Tác vụ `MotoShopCRM_AutoBackup_Daily` tự động kích hoạt vào **23:00 hàng ngày** (ngoài giờ kinh doanh showroom).
* **Kịch bản tự động:** File `scripts/Backup_Database_Auto.bat` / `.ps1` tự động xuất file `.bak` nén và tự động dọn dẹp các bản sao lưu cũ hơn 30 ngày (Retention Policy).
* **Phục hồi sự cố 1-Click (Disaster Recovery):** Khi có sự cố, chạy file `scripts/Restore_Database_Latest.bat` để phục hồi 100% CSDL từ bản sao lưu gần nhất trong vòng **5 giây**.

---

## 🛠️ 9. CÔNG NGHỆ SỬ DỤNG

* **Frontend:** React 19, TypeScript 5.7, Vite 8.0, TailwindCSS 4.0, Lucide React Icons, Recharts Analytics.
* **Backend:** ASP.NET Core Web API (.NET 10 / 8), C#, Dapper Micro-ORM, Microsoft.Data.SqlClient, Swagger UI.
* **Database:** Microsoft SQL Server 2022 (T-SQL, Stored Procedures, Foreign Keys Constraints).
* **Thanh toán & Tích hợp:** VietQR Payment Gateway (Mã QR động chuyển khoản liên ngân hàng).

---

<p align="center">
  <b>© 2026 MotoShop CRM Project. All rights reserved.</b><br>
  <i>Được phát triển phục vụ công tác nghiên cứu, đào tạo và bảo vệ đồ án tốt nghiệp.</i>
</p>
