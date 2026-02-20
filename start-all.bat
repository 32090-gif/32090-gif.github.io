@echo off
title Kunlun Shop - Server & Cloudflare
echo ========================================
echo    Kunlun Shop - Full Stack Setup
echo ========================================
echo.

echo [1/3] Stopping existing services...
taskkill /f /im node.exe 2>nul
taskkill /f /im cloudflared.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Starting Node.js Server...
start "Kunlun Server" cmd /k "cd /d C:\Users\User\Desktop\ProjectCustomer\Slumzick && npm run dev"

echo Waiting for server to start...
timeout /t 5 /nobreak >nul

echo [3/3] Starting Cloudflare Tunnel...
start "Cloudflare Tunnel" cmd /k "cd /d C:\Users\User\Desktop\ProjectCustomer\Slumzick && cloudflared tunnel run 7820d6f9-d088-463e-ad5f-d934b22c3f8e"

echo.
echo ========================================
echo Both services are starting...
echo Server: http://127.0.0.1:3001
echo Website: https://getkunlun.me
echo ========================================
echo.
echo Press any key to stop all services...
pause >nul

echo.
echo Stopping all services...
taskkill /f /im node.exe 2>nul
taskkill /f /im cloudflared.exe 2>nul
echo Done!
pause
