# ===============================================================================
# MOTOSHOP CRM - KICH BAN SAO LUU CO SO DU LIEU TU DONG
# Database: CRM_XeMayPhuTung
# ===============================================================================

$ErrorActionPreference = "Stop"

$DBName = "CRM_XeMayPhuTung"
$ServerName = "localhost"
$BackupDir = "D:\crm-project\backup"
$LogFile = "$BackupDir\backup_history.log"

if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir -Force | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = "$BackupDir\$($DBName)_AutoBackup_$Timestamp.bak"

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "         HE THONG SAO LUU TU DONG CO SO DU LIEU MOTOSHOP CRM" -ForegroundColor Cyan
Write-Host "==============================================================================="
Write-Host "[1/3] Dang sao luu Database: $DBName" -ForegroundColor Yellow
Write-Host "      Tep dich: $BackupFile" -ForegroundColor Gray

$DateNow = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Add-Content -Path $LogFile -Value "[$DateNow] [START] Sao luu CSDL $DBName..."

try {
    # Backup chuẩn hỗ trợ mọi phiên bản SQL Server (Express, Standard, Enterprise)
    $sqlQuery = "BACKUP DATABASE [$DBName] TO DISK = N'$BackupFile' WITH FORMAT, MEDIANAME = 'CRMMedia', NAME = 'Full Backup MotoShop', STATS = 25"
    sqlcmd -S $ServerName -E -C -Q $sqlQuery

    if (Test-Path $BackupFile) {
        $sizeMB = [math]::Round((Get-Item $BackupFile).Length / 1MB, 2)
        Write-Host "[2/3] SAO LUU THANH CONG! Dung luong file: $sizeMB MB" -ForegroundColor Green
        $DateDone = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Add-Content -Path $LogFile -Value "[$DateDone] [SUCCESS] File: $BackupFile ($sizeMB MB)"
    } else {
        throw "Tep sao luu khong ton tai."
    }
} catch {
    Write-Host "[LOI] Sao luu that bai: $_" -ForegroundColor Red
    $DateErr = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $LogFile -Value "[$DateErr] [FAILED] Loi: $_"
    exit 1
}

# Retention Policy: Xoa cac ban backup cu hon 30 ngay
Write-Host "[3/3] Kiem tra chinh sach luu tru (Xoa ban cu > 30 ngay)..." -ForegroundColor Yellow
$limitDate = (Get-Date).AddDays(-30)
$oldFiles = Get-ChildItem -Path $BackupDir -Filter "*.bak" | Where-Object { $_.LastWriteTime -lt $limitDate }

if ($oldFiles) {
    foreach ($file in $oldFiles) {
        Remove-Item $file.FullName -Force
        Write-Host " -> Da xoa file cu: $($file.Name)" -ForegroundColor DarkGray
        $DateDel = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        Add-Content -Path $LogFile -Value "[$DateDel] [CLEANUP] Da xoa $($file.Name)"
    }
} else {
    Write-Host " -> Khong co ban sao luu nao cu hon 30 ngay can xoa." -ForegroundColor Gray
}

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "                HOAN TAT CHU TRINH SAO LUU AN TOAN!" -ForegroundColor Green
Write-Host "==============================================================================="
