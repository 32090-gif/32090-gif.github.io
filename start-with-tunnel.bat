@echo off
echo Starting Kunlun API Server and Cloudflared Tunnel...

REM Start API server in background
echo Starting API server on port 3001...
start /B "API Server" node server\server.js

REM Wait a bit for server to start
timeout /t 3 /nobreak > nul

REM Start cloudflared tunnel
echo Starting Cloudflared tunnel...
cloudflared.exe tunnel --url http://localhost:3001

REM If tunnel stops, show message
echo.
echo Tunnel stopped. Press any key to exit...
pause > nul