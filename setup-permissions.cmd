@echo off
setlocal
cd /d "%~dp0"
echo.
echo ==========================================
echo   LLM Bible DB / Permission Setup v2.2.1
echo ==========================================
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\setup-permissions.ps1"
set ERR=%ERRORLEVEL%
echo.
if not "%ERR%"=="0" (
  echo [ERROR] Setup stopped with exit code %ERR%.
) else (
  echo [OK] Setup guide finished.
)
echo.
pause
exit /b %ERR%
