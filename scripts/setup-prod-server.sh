#!/bin/bash

# Setup script for production server
# Run this on your production server (10.10.1.66)

echo "Setting up Metal Snake deployment on production server..."

# Create web directory
sudo mkdir -p /var/www/metal-snake-web
sudo chown $USER:www-data /var/www/metal-snake-web
sudo chmod 755 /var/www/metal-snake-web

# Generate deployment key pair (if not exists)
if [ ! -f ~/.ssh/metal-snake-deploy ]; then
    ssh-keygen -t ed25519 -f ~/.ssh/metal-snake-deploy -N "" -C "github-actions@metal-snake"
    echo ""
    echo "=================================================="
    echo "ADD THIS PUBLIC KEY TO GitHub Secrets as DEPLOY_KEY:"
    echo "=================================================="
    cat ~/.ssh/metal-snake-deploy
    echo "=================================================="
    echo ""
    echo "ADD THIS PUBLIC KEY TO ~/.ssh/authorized_keys:"
    echo "=================================================="
    cat ~/.ssh/metal-snake-deploy.pub
    echo "=================================================="
fi

# Add the public key to authorized_keys
cat ~/.ssh/metal-snake-deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# Create nginx config (if using nginx)
if command -v nginx &> /dev/null; then
    sudo tee /etc/nginx/sites-available/metal-snake << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/metal-snake-web;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|mp3)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/metal-snake /etc/nginx/sites-enabled/
    sudo nginx -t && sudo systemctl reload nginx
    echo "Nginx configured successfully!"
fi

echo ""
echo "Production server setup complete!"
echo ""
echo "GitHub Secrets to configure:"
echo "- DEPLOY_HOST: 10.10.1.66 (or your Cloudflare tunnel hostname)"
echo "- DEPLOY_USER: $USER"
echo "- DEPLOY_PATH: /var/www/metal-snake-web"
echo "- DEPLOY_KEY: (contents of ~/.ssh/metal-snake-deploy)"