@echo off
cd /d "%~dp0"
echo Starting Kunlun API Server and Cloudflared Tunnel...

REM Start API server in background
echo Starting API server on port 3001...
start /B "API Server" node server\server.js

REM Wait a bit for server to start
timeout /t 5 /nobreak > nul

REM Start cloudflared tunnel with config
echo Starting Cloudflared tunnel...
cloudflared.exe tunnel --config config.yml run a0b83939-c4eb-47ca-857f-3c142b3a0ca9

REM If tunnel stops, show message
echo.
echo Tunnel stopped. Press any key to exit...
pause > nul