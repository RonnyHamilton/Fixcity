@echo off
echo ============================================
echo FixCity Face Verification Server Setup
echo ============================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation
    pause
    exit /b 1
)

echo Python found. Installing dependencies...
echo.

REM Install dependencies
pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ============================================
    echo NOTE: face-recognition requires dlib which needs Visual C++ Build Tools
    echo.
    echo If installation failed, try these steps:
    echo 1. Install Visual Studio Build Tools from:
    echo    https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo 2. Select "Desktop development with C++" workload
    echo 3. Restart your terminal and run this script again
    echo ============================================
    pause
    exit /b 1
)

echo.
echo ============================================
echo Dependencies installed successfully!
echo.
echo Starting Face Verification Server...
echo Server will run on http://localhost:8000
echo ============================================
echo.

REM Start the server
python face_server.py
