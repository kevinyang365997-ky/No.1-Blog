@echo off
setlocal
cd /d "%~dp0all"
call npm run seo:audit
if errorlevel 1 (
  echo SEO check failed.
  pause
  exit /b 1
)
start "" "%~dp0all\.seo-reports\latest.html"
endlocal
