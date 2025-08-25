@echo off
echo Starting G-Weather Email Backend...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from template...
    copy env.example .env
    echo.
    echo Please edit .env file with your Gmail credentials!
    echo 1. Set GMAIL_USER to your Gmail address
    echo 2. Set GMAIL_APP_PASSWORD to your 16-character App Password
    echo.
    pause
)

echo Starting server...
npm start
