@echo off
REM === Auto Build, Copy, Commit, and Push to GitHub Pages ===
cd /d %~dp0

REM 1. Build project
call npm run build
IF %ERRORLEVEL% NEQ 0 (
  echo Build failed!
  pause
  exit /b %ERRORLEVEL%
)

REM 2. Copy dist to root
call npm run copy:dist
IF %ERRORLEVEL% NEQ 0 (
  echo Copy dist failed!
  pause
  exit /b %ERRORLEVEL%
)

REM 3. Add all changes
git add .

REM 4. Commit with timestamp
for /f "tokens=1-4 delims=/ " %%a in ("%date%") do set datestamp=%%d-%%b-%%c
for /f "tokens=1-2 delims=: " %%a in ("%time%") do set timestamp=%%a%%b
set msg=auto: deploy %datestamp%_%timestamp%
git commit -m "%msg%"

REM 5. Push to GitHub
git push

if %ERRORLEVEL% EQU 0 (
  echo === DEPLOY COMPLETE ===
) else (
  echo === DEPLOY ERROR ===
)
pause
