# 🏍️ Motoshop CRM & E-Commerce Management System

Hệ thống Quản lý Khách hàng (CRM) và Bán hàng Đại lý Xe máy & Phụ tùng.

---

## 📂 Thư mục Tài liệu Dự án (`docs/`)

Tất cả tài liệu hướng dẫn, báo cáo và bảng phân chia công việc đã được gom vào thư mục **[`docs/`](./docs/)**:

| Tên tài liệu | Định dạng | Mô tả |
|-------------|:---------:|-------|
| [**HUONG_DAN_NHOM.md**](./docs/HUONG_DAN_NHOM.md) | `.md` | 🚀 **Hướng dẫn làm việc nhóm Backend** (Git, Docker, Code mẫu, Test API, Push GitHub, Lưu ý) |
| [**BAO_CAO_CONG_VIEC.md**](./docs/BAO_CAO_CONG_VIEC.md) | `.md` | 📋 Báo cáo chi tiết toàn bộ tính năng Frontend & Backend đã hoàn thành |
| [**PROJECT_SPECS.md**](./docs/PROJECT_SPECS.md) | `.md` | 📐 Đặc tả kiến trúc kỹ thuật & kết nối Database |
| [**FRONTEND_NOTES.md**](./docs/FRONTEND_NOTES.md) | `.md` | 🎨 Ghi chú kiến trúc và giao diện Frontend |
| [**BANG_MODEL_CHIA_VIEC.csv**](./docs/BANG_MODEL_CHIA_VIEC.csv) | `.csv` (Excel) | 📊 Bảng phân công Model cho các thành viên nhóm |
| [**BANG_TEST_API_QA.csv**](./docs/BANG_TEST_API_QA.csv) | `.csv` (Excel) | 🧪 Bảng kịch bản Test API chi tiết cho QA |
| [**SHEET_CHIA_VIEC_NHOM_MODEL.md**](./docs/SHEET_CHIA_VIEC_NHOM_MODEL.md) | `.md` | 📑 Bản Markdown của bảng phân chia Model |
| [**SHEET_TEST_API_QA.md**](./docs/SHEET_TEST_API_QA.md) | `.md` | 📑 Bản Markdown của bảng Test API |

---

## 🛠️ Cấu trúc Dự án

```
crm-project/
├── docs/             # 📁 Toàn bộ tài liệu, hướng dẫn, báo cáo, file Excel/CSV
├── CrmBackend/       # 🔧 Backend API ASP.NET Core (.NET 10) + Dapper
├── crm-frontend/     # 💻 Frontend React 19 + Vite + Tailwind CSS
├── init-db/          # 🗄️ Script khởi tạo Database SQL Server (init.sql)
└── docker-compose.yml# 🐳 Docker Compose chạy SQL Server 2022
```

---

## 🚀 Khởi chạy nhanh

- **Backend**: Xem chi tiết tại [docs/HUONG_DAN_NHOM.md](./docs/HUONG_DAN_NHOM.md)
- **Frontend**: `cd crm-frontend && npm run dev` (chạy tại `http://localhost:5174`)
- **Swagger API**: Chạy Backend và truy cập `http://localhost:5208/swagger`
