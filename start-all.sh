#!/bin/bash

# Start All Services Script for LOI Parser
# This script starts all three services in separate terminal windows

echo "🚀 Starting LOI Parser - All Services"
echo "======================================"

# Check if we're in the right directory
if [ ! -d "backend" ] || [ ! -d "frontend" ] || [ ! -d "document-service" ]; then
    echo "❌ Error: Please run this script from the 'LOI Parser' directory"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "Checking prerequisites..."

if ! command_exists python; then
    echo "❌ Python not found. Please install Python 3.10+"
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Start Backend
echo "📦 Starting Backend (Python/FastAPI)..."
if [ -f "backend/.env" ]; then
    cd backend
    if [ -d "venv" ]; then
        # Start in new terminal
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && source venv/bin/activate && uvicorn app.main:app --reload --port 8000"'
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
            # Windows (Git Bash)
            start cmd /k "cd backend && venv\\Scripts\\activate && uvicorn app.main:app --reload --port 8000"
        else
            # Linux
            gnome-terminal -- bash -c "cd backend && source venv/bin/activate && uvicorn app.main:app --reload --port 8000; exec bash"
        fi
        echo "✅ Backend starting in new terminal on http://localhost:8000"
    else
        echo "⚠️  Backend venv not found. Please run: cd backend && python -m venv venv && source venv/bin/activate && pip install -r requirements.txt"
    fi
    cd ..
else
    echo "⚠️  Backend .env not found. Please create backend/.env with GROQ_API_KEY"
fi

sleep 2

# Start Frontend
echo "🎨 Starting Frontend (React/Vite)..."
if [ -d "frontend/node_modules" ]; then
    cd frontend
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && npm run dev"'
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        # Windows
        start cmd /k "cd frontend && npm run dev"
    else
        # Linux
        gnome-terminal -- bash -c "cd frontend && npm run dev; exec bash"
    fi
    echo "✅ Frontend starting in new terminal on http://localhost:5173"
    cd ..
else
    echo "⚠️  Frontend node_modules not found. Please run: cd frontend && npm install"
fi

sleep 2

# Start Document Service
echo "📄 Starting Document Service (Node.js)..."
if [ -d "document-service/node_modules" ]; then
    if [ -f "document-service/template.docx" ]; then
        cd document-service
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            osascript -e 'tell app "Terminal" to do script "cd \"'$(pwd)'\" && npm start"'
        elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
            # Windows
            start cmd /k "cd document-service && npm start"
        else
            # Linux
            gnome-terminal -- bash -c "cd document-service && npm start; exec bash"
        fi
        echo "✅ Document Service starting in new terminal on http://localhost:3001"
        cd ..
    else
        echo "⚠️  Document Service template.docx not found. Please create it (see TEMPLATE_GUIDE.md)"
    fi
else
    echo "⚠️  Document Service node_modules not found. Please run: cd document-service && npm install"
fi

echo ""
echo "======================================"
echo "🎉 All services started!"
echo ""
echo "📍 URLs:"
echo "   Frontend:  http://localhost:5173"
echo "   Backend:   http://localhost:8000"
echo "   Docs:      http://localhost:8000/docs"
echo "   Doc Svc:   http://localhost:3001"
echo ""
echo "💡 Open http://localhost:5173 in your browser to get started!"
echo "💡 Check the new terminal windows for logs"
echo ""
echo "To stop all services: Close the terminal windows or press Ctrl+C in each"
