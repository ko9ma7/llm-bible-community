@echo off
setlocal
cd /d "%~dp0"
echo.
echo ==> Checking project
where git >nul 2>nul || (echo [ERROR] git not found.& pause & exit /b 1)
where npm >nul 2>nul || (echo [ERROR] npm not found.& pause & exit /b 1)
where gh >nul 2>nul || (echo [ERROR] GitHub CLI not found.& pause & exit /b 1)

echo.
echo ==> Building v2.3.0
call npm ci || goto :fail
call npm run build || goto :fail

echo.
echo ==> Committing fix
git add -A || goto :fail
git diff --cached --quiet
if errorlevel 1 (
  git commit -m "Fix DB permission setup and add MCP starter framework" || goto :fail
) else (
  echo [OK] No new changes to commit.
)

echo.
echo ==> Pushing main
git push || goto :fail

echo.
echo ==> Triggering Pages workflow
gh workflow run deploy.yml >nul 2>nul
if errorlevel 1 echo [WARN] Manual workflow dispatch skipped. Push event should still deploy automatically.

echo.
echo [OK] Push complete.
echo Open GitHub ^> Actions ^> Deploy LLM Bible to GitHub Pages and wait until it is green.
echo Then reload the Pages URL with Ctrl+F5.
pause
exit /b 0

:fail
echo.
echo [ERROR] Redeploy failed with exit code %errorlevel%.
pause
exit /b %errorlevel%
