#!/bin/bash

echo "Starting G-Weather Email Backend..."
echo

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp env.example .env
    echo
    echo "Please edit .env file with your Gmail credentials!"
    echo "1. Set GMAIL_USER to your Gmail address"
    echo "2. Set GMAIL_APP_PASSWORD to your 16-character App Password"
    echo
    read -p "Press enter to continue after editing .env file..."
fi

echo "Starting server..."
npm start
