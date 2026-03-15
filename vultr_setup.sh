#!/bin/bash
# BillClarity Vultr Setup Script (Ubuntu 24.04/22.04)

set -e

echo "--- Starting BillClarity Backend Setup ---"

# 1. Update system and install dependencies
sudo apt-get update
sudo apt-get install -y python3-pip python3-venv nginx git libpango-1.0-0 libharfbuzz0b libpangoft2-1.0-0 libpangocairo-1.0-0

# 2. Create App Directory
sudo mkdir -p /var/www/billclarity
sudo chown -R $USER:$USER /var/www/billclarity
cd /var/www/billclarity

# 3. Code will be synced here by the user (scp/rsync)
echo "Ensuring backend directory exists..."
mkdir -p backend

# 4. Setup Virtual Environment
if [ ! -d "backend/venv" ]; then
    python3 -m venv backend/venv
fi
source backend/venv/bin/activate

# 5. Install Python dependencies
pip install --upgrade pip
if [ -f "backend/requirements.txt" ]; then
    pip install -r backend/requirements.txt
else
    echo "Warning: backend/requirements.txt not found!"
fi

# 6. Configure systemd Service
cat <<EOF | sudo tee /etc/systemd/system/billclarity.service
[Unit]
Description=Gunicorn instance to serve BillClarity FastAPI
After=network.target

[Service]
User=$USER
Group=www-data
WorkingDirectory=/var/www/billclarity/backend
Environment="PATH=/var/www/billclarity/backend/venv/bin"
ExecStart=/var/www/billclarity/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable billclarity
sudo systemctl restart billclarity

# 7. Configure Nginx
cat <<EOF | sudo tee /etc/nginx/sites-available/billclarity
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # WebSocket support
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/billclarity /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "--- Setup Complete! BillClarity should be live at http://$(curl -s ifconfig.me) ---"
