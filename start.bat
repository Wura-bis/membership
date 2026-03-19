@echo off
echo ============================================================
echo  BIS Membership System - Start Application
echo ============================================================
echo.

cd /d "%~dp0membership-backend"

REM Check that the frontend has been built
if not exist "dist\index.html" (
    echo WARNING: Frontend not built yet.
    echo Please run build.bat first before starting.
    echo.
    pause
    exit /b 1
)

echo Starting Flask server on http://0.0.0.0:5000
echo.
echo  *** Open your browser to http://localhost:5000 ***
echo  *** Testers on your local network use http://YOUR-IP:5000 ***
echo.
echo To find your IP address, open a new Command Prompt and type: ipconfig
echo.
echo Press Ctrl+C to stop the server.
echo.

python app.py
pause
