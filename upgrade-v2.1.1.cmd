@echo off
setlocal
cd /d "%~dp0"
echo.
echo ============================================================
echo  LLM Bible v2.1.1 - Category shards + Copy UX + Supabase Auth upgrade
echo ============================================================
echo.
echo This will:
echo   1. Connect/reuse the existing Supabase project
echo   2. Guide schema + research seed + admin setup
echo   3. Rebuild and redeploy GitHub Pages
echo.
call "%~dp0backend-bootstrap.cmd"
if errorlevel 1 (
  echo.
  echo [ERROR] Backend setup did not complete.
  pause
  exit /b 1
)
echo.
call "%~dp0redeploy-pages.cmd"
if errorlevel 1 (
  echo.
  echo [ERROR] GitHub Pages redeploy did not complete.
  pause
  exit /b 1
)
echo.
echo [OK] Upgrade workflow finished.
echo Open: https://ko9ma7.github.io/llm-bible-community/#/account
echo.
pause
