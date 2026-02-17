@echo off
REM Start All Services Script for LOI Parser (Windows)
REM This script starts all three services in separate command windows

echo.
echo ========================================
echo Starting LOI Parser - All Services
echo ========================================
echo.

REM Check if we're in the right directory
if not exist "backend" (
    echo Error: Please run this script from the 'LOI Parser' directory
    pause
    exit /b 1
)

echo Checking prerequisites...

REM Check for Python
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

REM Check for Node
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

echo Prerequisites check passed
echo.

REM Start Backend
echo Starting Backend (Python/FastAPI)...
if exist "backend\.env" (
    if exist "backend\venv" (
        start "LOI Parser - Backend" cmd /k "cd backend && venv\Scripts\activate && uvicorn app.main:app --reload --port 8000"
        echo Backend starting on http://localhost:8000
    ) else (
        echo Warning: Backend venv not found
        echo Please run: cd backend ^&^& python -m venv venv ^&^& venv\Scripts\activate ^&^& pip install -r requirements.txt
    )
) else (
    echo Warning: Backend .env not found
    echo Please create backend\.env with GROQ_API_KEY
)

timeout /t 2 /nobreak >nul

REM Start Frontend
echo Starting Frontend (React/Vite)...
if exist "frontend\node_modules" (
    start "LOI Parser - Frontend" cmd /k "cd frontend && npm run dev"
    echo Frontend starting on http://localhost:5173
) else (
    echo Warning: Frontend node_modules not found
    echo Please run: cd frontend ^&^& npm install
)

timeout /t 2 /nobreak >nul

REM Start Document Service
echo Starting Document Service (Node.js)...
if exist "document-service\node_modules" (
    if exist "document-service\template.docx" (
        start "LOI Parser - Document Service" cmd /k "cd document-service && npm start"
        echo Document Service starting on http://localhost:3001
    ) else (
        echo Warning: Document Service template.docx not found
        echo Please create it (see TEMPLATE_GUIDE.md)
    )
) else (
    echo Warning: Document Service node_modules not found
    echo Please run: cd document-service ^&^& npm install
)

echo.
echo ========================================
echo All services started!
echo.
echo URLs:
echo    Frontend:  http://localhost:5173
echo    Backend:   http://localhost:8000
echo    API Docs:  http://localhost:8000/docs
echo    Doc Svc:   http://localhost:3001
echo.
echo Open http://localhost:5173 in your browser to get started!
echo Check the new command windows for logs
echo.
echo To stop: Close the command windows or press Ctrl+C in each
echo ========================================
echo.
pause
