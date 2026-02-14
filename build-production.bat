@echo off
echo ========================================
echo  Building Kunlun Shop for Production
echo ========================================
echo.

REM Clean old build files
echo [1/5] Cleaning old build files...
if exist dist rmdir /s /q dist
if exist app-*.js del /q app-*.js
if exist style-*.css del /q style-*.css
if exist assets rmdir /s /q assets

REM Ensure node_modules exists
echo [2/5] Checking dependencies...
if not exist node_modules (
    echo Installing dependencies...
    call npm install
) else (
    echo Dependencies already installed
)

REM Try to build with vite
echo [3/5] Building project...
call npx vite build

REM Check if build was successful
if exist dist\index.html (
    echo [4/5] Build successful!
    
    REM Copy dist files to root
    echo [5/5] Deploying files...
    xcopy /Y dist\* .
    
    echo.
    echo ========================================
    echo  BUILD COMPLETED SUCCESSFULLY!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Upload these files to your server:
    echo    - index.html
    echo    - app-*.js
    echo    - style-*.css
    echo.
    echo 2. Restart your API server
    echo.
    echo 3. Test at https://getkunlun.me
    echo.
) else (
    echo.
    echo ========================================
    echo  BUILD FAILED!
    echo ========================================
    echo.
    echo Please try:
    echo 1. Delete node_modules folder
    echo 2. Run: npm install
    echo 3. Run this script again
    echo.
)

pause
