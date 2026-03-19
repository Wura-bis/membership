@echo off
echo ============================================================
echo  BIS Membership System - Build Frontend
echo ============================================================
echo.

cd /d "%~dp0membership-frontend\membership-frontend"

echo [1/2] Installing / checking npm packages...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: npm install failed.
    pause
    exit /b 1
)

echo.
echo [2/2] Building React app into Flask backend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Build failed. Check the output above.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo  Build complete! Frontend is in membership-backend\dist\
echo  You can now run start.bat to launch the application.
echo ============================================================
pause
