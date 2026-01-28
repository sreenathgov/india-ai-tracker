#!/bin/bash

echo "=== India AI Tracker - Service Status ==="
echo ""

# Check Flask backend (port 5001)
echo "1. Flask Backend (API + Admin):"
if lsof -ti:5001 > /dev/null 2>&1; then
    echo "   ✅ Running on port 5001"
    curl -s http://localhost:5001/api/health | python3 -c "import sys, json; data=json.load(sys.stdin); print(f'   ✅ Healthy - {data[\"updates_count\"]} articles in database')" 2>/dev/null || echo "   ⚠️  Port 5001 occupied but not responding correctly"
else
    echo "   ❌ NOT RUNNING"
    echo "   To start: cd backend && PYTHONPATH=. venv/bin/python3 app.py &"
fi

echo ""

# Check Frontend HTTP server (port 8080)
echo "2. Frontend HTTP Server (Public Site):"
if lsof -ti:8080 > /dev/null 2>&1; then
    echo "   ✅ Running on port 8080"
else
    echo "   ❌ NOT RUNNING"
    echo "   To start: python3 -m http.server 8080 &"
fi

echo ""
echo "=== 🔗 Access URLs ==="
echo ""
echo "📱 PUBLIC SITE:"
echo "   http://localhost:8080/index.html"
echo ""
echo "🔐 ADMIN (login required):"
echo "   http://localhost:5001/admin/login"
echo ""
echo "🔧 API:"
echo "   http://localhost:5001/api/health"
echo ""
