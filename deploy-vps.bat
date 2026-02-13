@echo off
echo 🚀 Starting Slumzick deployment on VPS...

REM Check if .env.production exists
if not exist ".env.production" (
    echo ⚠️  Creating .env.production file...
    echo # Production Environment - Auto-detect API URL > .env.production
    echo VITE_API_BASE_URL= >> .env.production
    echo ✅ .env.production created (using auto-detection)
) else (
    echo ✅ .env.production already exists
)

REM Install frontend dependencies
echo 📦 Installing frontend dependencies...
call npm install

REM Install backend dependencies
echo 📦 Installing backend dependencies...
cd server
call npm install
cd ..

REM Build frontend for production
echo 🏗️  Building frontend for production...
call npm run build

if %errorlevel% equ 0 (
    echo ✅ Build successful!
    echo.
    echo 🎉 Deployment completed!
    echo.
    echo To start the server:
    echo   npm start
    echo.
    echo The website will be available at:
    echo   http://localhost:3001
    echo   or http://YOUR_VPS_IP:3001
    echo.
    echo API will be available at:
    echo   http://localhost:3001/api
    echo   or http://YOUR_VPS_IP:3001/api
) else (
    echo ❌ Build failed!
    exit /b 1
)