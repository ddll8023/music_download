@echo off
chcp 65001 >nul
cd /d "%~dp0"

cd sys_electron
set ELECTRON_DISABLE_SANDBOX=1
npm run dev
