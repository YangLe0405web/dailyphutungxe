@echo off
chcp 65001 >nul
title SAO LUU TU DONG CO SO DU LIEU MOTOSHOP CRM
powershell -ExecutionPolicy Bypass -File "%~dp0Backup_Database_Auto.ps1"
pause
