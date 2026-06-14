@echo off
title RailCortex Frontend
echo =============================================
echo  RailCortex Frontend Startup
echo =============================================
echo.

cd /d "%~dp0frontend"

REM Install node_modules if not present
if not exist "node_modules\" (
    echo [1/2] node_modules not found. Running npm install...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: npm install failed.
        pause
        exit /b 1
    )
) else (
    echo [1/2] node_modules already present. Skipping install.
)

echo [2/2] Starting Vite dev server...
echo.
echo Frontend will be available at: http://localhost:5173
echo Press Ctrl+C to stop.
echo.

npm run dev
