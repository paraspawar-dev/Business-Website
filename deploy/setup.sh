#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting Caliber Link Production Setup..."

# 1. Update system and install dependencies
echo "📦 Installing system dependencies..."
sudo dnf check-update || true
sudo dnf install -y curl nginx ufw gcc-c++ make

# 2. Install Node.js (v20)
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs
fi

# 3. Install PM2 globally
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# 4. Setup application directory
echo "📁 Setting up application directory..."
sudo mkdir -p /var/www/caliber-link
sudo chown -R $USER:$USER /var/www/caliber-link

# Note: In a real scenario, you'd clone your git repo here
# git clone https://github.com/your-repo /var/www/caliber-link
# For this script, we assume the code is already in /var/www/caliber-link

# 5. Install NPM dependencies
echo "📦 Installing Node modules..."
cd /var/www/caliber-link/server
npm install --production

# 6. Setup Environment File
if [ ! -f .env ]; then
    echo "⚙️ Creating .env file from template..."
    cp .env.example .env
    echo "⚠️ PLEASE UPDATE /var/www/caliber-link/server/.env WITH YOUR SECRETS"
fi

# 7. Configure Nginx
echo "⚙️ Configuring Nginx..."
sudo cp /var/www/caliber-link/deploy/nginx.conf /etc/nginx/sites-available/caliber-link
sudo ln -sf /etc/nginx/sites-available/caliber-link /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

# 8. Setup UFW Firewall
echo "🛡️ Configuring Firewall..."
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
# Allow local network to access admin port directly just in case (optional, Nginx handles proxying)
sudo ufw allow from 192.168.0.0/16 to any port 4000
sudo ufw allow from 10.0.0.0/8 to any port 4000
sudo ufw --force enable

# 9. Start Application with PM2
echo "🚀 Starting application via PM2..."
cd /var/www/caliber-link
pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup | tail -n 1 | bash -

echo "✅ Setup Complete!"
echo "🌐 Public site running on port 80 (proxied to 3000)"
echo "🔒 Admin site running locally at admin.caliberlink.local (proxied to 4000)"
