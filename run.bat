@echo off
title AttendAI Project Runner

echo ==========================================
echo Starting AttendAI...
echo ==========================================

echo [1/2] Starting Backend API on Port 5000...
start cmd /k "title AttendAI Backend && cd backend && npm run dev"

echo [2/2] Starting Frontend App...
start cmd /k "title AttendAI Frontend && cd frontend && npm run dev"

echo ==========================================
echo Both servers have been launched in new windows!
echo.
echo MOBILE ACCESS INSTRUCTIONS:
echo Look at the "AttendAI Frontend" window that just opened.
echo You will see two URLs printed by Vite:
echo   - Local:   http://localhost:5173/
echo   - Network: https://192.168.x.x:5173/ (Your IP will be different)
echo.
echo Type the "Network" URL into your mobile phone to access the app!
echo Remember to accept the "Not Secure" warning on your phone since it's a local dev server.
echo ==========================================
pause
