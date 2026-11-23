@echo off
chcp 65001 >nul
title PHUC HOI CSDL MOTOSHOP CRM TU BAN SAO LUU MOI NHAT
powershell -ExecutionPolicy Bypass -File "%~dp0Restore_Database_Latest.ps1"
pause
