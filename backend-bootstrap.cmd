@echo off
setlocal
cd /d "%~dp0"
echo.
echo LLM Bible - connect existing Supabase + install schema + admin setup
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\backend-bootstrap.ps1"
set code=%errorlevel%
echo.
if not "%code%"=="0" echo [ERROR] Backend setup exited with code %code%.
pause
exit /b %code%
