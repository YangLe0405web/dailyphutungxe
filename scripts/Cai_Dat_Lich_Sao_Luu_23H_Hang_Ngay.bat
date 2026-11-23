@echo off
chcp 65001 >nul
title DANG KY LICH SAO LUU TU DONG MOTOSHOP CRM (TASK SCHEDULER)

echo Dang dang ky tien trinh vao Windows Task Scheduler...
schtasks /create /tn "MotoShopCRM_AutoBackup_Daily" /tr "powershell.exe -ExecutionPolicy Bypass -File \"D:\crm-project\scripts\Backup_Database_Auto.ps1\"" /sc daily /st 23:00 /f

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ===============================================================================
    echo [THANH CONG] Da tao thanh cong lich sao luu tu dong:
    echo   - Ten Tac Vu : MotoShopCRM_AutoBackup_Daily
    echo   - Tan Suat   : Hang ngay vao luc 23:00 (Moi dem)
    echo   - Thu muc luu: D:\crm-project\backup\
    echo   - Chinh sach : Tu dong xoa cac ban backup cu hon 30 ngay
    echo ===============================================================================
) else (
    echo.
    echo [CHU Y] Neu bao loi quyen, hay chuot phai vao file nay chon 'Run as administrator'!
)
pause
