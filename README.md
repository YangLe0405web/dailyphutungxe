# 🏍️ Motoshop CRM & E-Commerce Management System

Hệ thống Quản lý Khách hàng (CRM) và Bán hàng Đại lý Xe máy & Phụ tùng.

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
