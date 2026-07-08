#!/bin/bash
set -e

echo "==========================================="
echo "   Caliber Link - Production Deployment    "
echo "==========================================="

echo "1. Installing Node.js dependencies..."
cd server
npm install --production
cd ..

echo "2. Installing PM2 globally (if not installed)..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

echo "3. Starting backend server via PM2..."
pm2 start ecosystem.config.js
pm2 save

echo "4. Setting up auto-start on boot..."
# pm2 startup

echo "==========================================="
echo " Deployment Complete! "
echo " Backend is running on ports 3000 and 4000."
echo " To view logs, run: pm2 logs caliber-link-server"
echo "==========================================="
