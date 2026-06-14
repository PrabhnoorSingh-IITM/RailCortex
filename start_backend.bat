@echo off
title RailCortex Backend
echo =============================================
echo  RailCortex Backend Startup
echo =============================================
echo.

REM Show which Python is active (should be conda base)
echo Using Python:
python --version
python -c "import sys; print(sys.executable)"
echo.

REM Quick dep check - install anything still missing
echo Checking dependencies...
python -m pip install --quiet ^
    "langgraph>=0.2.0" ^
    "langchain-core>=0.3.0" ^
    "aiosqlite>=0.20.0" ^
    "pulp>=2.9.0" ^
    "shap>=0.46.0"

echo Dependencies OK.
echo.
echo Backend : http://localhost:8000
echo API docs: http://localhost:8000/docs
echo Press Ctrl+C to stop.
echo.

cd /d "%~dp0backend"
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
