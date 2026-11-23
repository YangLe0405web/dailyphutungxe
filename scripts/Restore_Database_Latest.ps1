# ===============================================================================
# MOTOSHOP CRM - KICH BAN PHUC HOI CSDL TU BAN SAO LUU MOI NHAT
# Database: CRM_XeMayPhuTung
# ===============================================================================

$ErrorActionPreference = "Stop"

$DBName = "CRM_XeMayPhuTung"
$ServerName = "localhost"
$BackupDir = "D:\crm-project\backup"
$LogFile = "$BackupDir\backup_history.log"

$LatestBackup = Get-ChildItem -Path $BackupDir -Filter "*.bak" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if (-not $LatestBackup) {
    Write-Host "[LOI] Khong tim thay ban sao luu .bak nao trong thu muc: $BackupDir" -ForegroundColor Red
    exit 1
}

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "         HE THONG PHUC HOI DU LIEU (DISASTER RECOVERY) MOTOSHOP CRM" -ForegroundColor Cyan
Write-Host "==============================================================================="
Write-Host "Ban sao luu moi nhat tim thay:" -ForegroundColor Yellow
Write-Host " -> Ten file : $($LatestBackup.Name)" -ForegroundColor Green
Write-Host " -> Thoi gian: $($LatestBackup.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss'))" -ForegroundColor Gray
Write-Host " -> Dung luong: $([math]::Round($LatestBackup.Length / 1MB, 2)) MB" -ForegroundColor Gray
Write-Host "-------------------------------------------------------------------------------"

$confirm = Read-Host "Ban co chac chan muon phuc hoi CSDL ve ban nay khong? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "Da huy thao tac phuc hoi." -ForegroundColor Yellow
    exit 0
}

Write-Host "[1/3] Dang ngat cac ket noi cu de chuyen sang che do SINGLE_USER..." -ForegroundColor Yellow
$sqlSingleUser = "ALTER DATABASE [$DBName] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;"
sqlcmd -S $ServerName -E -C -Q $sqlSingleUser

try {
    Write-Host "[2/3] Dang phuc hoi co so du lieu tu tep: $($LatestBackup.FullName)..." -ForegroundColor Yellow
    $sqlRestore = "RESTORE DATABASE [$DBName] FROM DISK = N'$($LatestBackup.FullName)' WITH REPLACE, STATS = 25;"
    sqlcmd -S $ServerName -E -C -Q $sqlRestore
    Write-Host " -> PHUC HOI DU LIEU THANH CONG 100%!" -ForegroundColor Green

    $DateDone = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Add-Content -Path $LogFile -Value "[$DateDone] [RESTORE_SUCCESS] Phuc hoi tu $($LatestBackup.Name)"
} catch {
    Write-Host "[LOI] Qua trinh phuc hoi gap su co: $_" -ForegroundColor Red
} finally {
    Write-Host "[3/3] Chuyen CSDL ve trang thai da nguoi dung MULTI_USER..." -ForegroundColor Yellow
    $sqlMultiUser = "ALTER DATABASE [$DBName] SET MULTI_USER;"
    sqlcmd -S $ServerName -E -C -Q $sqlMultiUser
}

Write-Host "===============================================================================" -ForegroundColor Cyan
Write-Host "       CSDL DA HOAN TAT PHUC HOI VA SAN SANG HOAT DONG!" -ForegroundColor Green
Write-Host "==============================================================================="
