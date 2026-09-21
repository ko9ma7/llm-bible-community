@echo off
setlocal
cd /d "%~dp0"
echo.
echo LLM Bible - verify existing Supabase Auth and LLM Bible schema
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\verify-backend.ps1"
echo.
pause
