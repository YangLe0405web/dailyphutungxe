@echo off
chcp 65001 >nul
title KHOI DONG HE THONG MOTOSHOP CRM - DO AN TOT NGHIEP
color 0b

echo ===============================================================================
echo        HỆ THỐNG QUẢN LÝ QUAN HỆ KHÁCH HÀNG & KINH DOANH MOTOSHOP CRM
echo                         (DÙNG CHO BẢO VỆ ĐỒ ÁN)
echo ===============================================================================
echo.
echo [1/3] Đang khởi động Backend Web API (ASP.NET Core)...
start "MOTOSHOP BACKEND (PORT 5208)" cmd /k "cd /d %~dp0CrmBackend && echo Dang chay Backend tai http://localhost:5208/api ... && dotnet run"

echo [2/3] Đang khởi động Frontend Web App (React Vite)...
start "MOTOSHOP FRONTEND (PORT 5173)" cmd /k "cd /d %~dp0crm-frontend && echo Dang chay Frontend tai http://localhost:5173 ... && npm run dev"

echo [3/3] Đang mở trình duyệt vào hệ thống...
timeout /t 4 /nobreak >nul
start http://localhost:5173

echo.
echo ===============================================================================
echo                           DANH SÁCH TÀI KHOẢN DEMO
echo ===============================================================================
echo  1. QUẢN TRỊ VIÊN (SuperAdmin / Ban Giám Đốc):
echo     - Tài khoản: admin
echo     - Mật khẩu : 123456
echo.
echo  2. NHÂN VIÊN BÁN HÀNG (Sales Staff):
echo     - Tài khoản: anhnguyen  (hoặc: hoangtran, hale, baopham)
echo     - Mật khẩu : 123456
echo.
echo  3. KỸ THUẬT VIÊN XƯỞNG (Technician Staff):
echo     - Tài khoản: thanhnguyen  (hoặc: ductran, namle, huypham)
echo     - Mật khẩu : 123456
echo.
echo  4. KHÁCH HÀNG (Customer):
echo     - Tài khoản: nguyenvanan  (hoặc: tranthibich, lehoangcuong)
echo     - Mật khẩu : 123456
echo ===============================================================================
echo  * Frontend: http://localhost:5173
echo  * Backend : http://localhost:5208/api
echo  * Swagger : http://localhost:5208/swagger
echo ===============================================================================
echo.
echo Giữ 2 cửa sổ Backend va Frontend mở trong suốt buổi chấm thi!
echo Bấm phím bất kỳ để đóng bảng hướng dẫn này (hệ thống vẫn chạy bình thường)...
pause >nul
