@echo off
rem Nexora website: build, copy, deploy, point both domains, check. Double-click to run.
cd /d "%~dp0"
node tools\publish-site.js
echo.
pause
