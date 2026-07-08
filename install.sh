#!/bin/bash
set -e

echo "==============================================="
echo "   Caliber Link - Installation & Setup Script  "
echo "==============================================="

# 1. Install System Dependencies (Ubuntu 26.04 LTS compatible)
echo "📦 Checking and installing system dependencies (Node.js, npm, build tools)..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update -y
    # Install nodejs, npm, build tools (for better-sqlite3), and puppeteer dependencies (for whatsapp-web.js)
    sudo apt-get install -y nodejs npm build-essential python3 \
        libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 libxkbcommon0 \
        libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2
else
    echo "⚠️ Not an apt-based system. Skipping system package installation."
fi

# 2. Check for Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is still not installed. Please install manually."
    exit 1
fi
echo "✅ Node.js is installed ($(node -v))."

# 3. Install PM2 globally if missing
if ! command -v pm2 &> /dev/null; then
    echo "🔄 PM2 not found. Installing PM2 globally (requires sudo)..."
    sudo npm install -g pm2
else
    echo "✅ PM2 is already installed."
fi

# 4. Setup server dependencies
echo "📦 Installing backend dependencies..."
cd server
npm install

# 5. Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️ Creating .env from .env.example..."
    cp .env.example .env
    
    # Generate a random JWT secret
    RANDOM_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    sed -i "s/change-this-to-a-random-string/$RANDOM_SECRET/" .env
    echo "✅ .env file created and JWT_SECRET randomized."
else
    echo "✅ .env file already exists."
fi

# 6. Start the application with PM2
echo "🚀 Starting Caliber Link Server with PM2..."
# Stop existing process if it exists to ensure clean start
pm2 stop caliber-link-server 2>/dev/null || true
pm2 delete caliber-link-server 2>/dev/null || true

# Start server
pm2 start index.js --name "caliber-link-server"

# 7. Configure PM2 to auto-start on system boot
echo "⚙️ Configuring PM2 to auto-start on system boot..."
# PM2 requires the startup script to be run with root privileges in some cases, 
# but pm2 save will at least save the current process list.
pm2 save

echo "==============================================="
echo "🎉 Installation Complete!"
echo "   Public Site: http://localhost:3000"
echo "   Admin Panel: http://localhost:4000/admin/dashboard.html"
echo ""
echo "Note: To ensure the server restarts on server reboot, you may need to run:"
echo "      pm2 startup"
echo "      (and follow the instructions it prints on your screen)"
echo "==============================================="
