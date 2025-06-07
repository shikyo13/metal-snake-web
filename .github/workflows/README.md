# GitHub Actions Deployment Setup

This directory contains GitHub Actions workflows for automatic deployment to production.

## Setup Instructions

### 1. GitHub Secrets Configuration

You need to add the following secrets to your GitHub repository:

1. Go to your repository on GitHub
2. Navigate to Settings → Secrets and variables → Actions
3. Click "New repository secret" and add:

- **DEPLOY_HOST**: Your production server hostname or IP address
- **DEPLOY_USER**: SSH username for deployment
- **DEPLOY_PATH**: Full path to the web directory on your server (e.g., `/var/www/metal-snake-web`)
- **DEPLOY_KEY**: Your private SSH key for authentication (see below)
- **DEPLOY_PORT** (optional): SSH port if not 22

### 2. SSH Key Setup

Generate a deployment SSH key pair on your local machine:

```bash
ssh-keygen -t ed25519 -f ~/.ssh/metal-snake-deploy -C "github-actions@metal-snake"
```

Then:
1. Copy the contents of `~/.ssh/metal-snake-deploy` (private key) to the `DEPLOY_KEY` secret
2. Add the contents of `~/.ssh/metal-snake-deploy.pub` (public key) to `~/.ssh/authorized_keys` on your production server

### 3. Server Preparation

On your production server:

```bash
# Create the deployment directory
sudo mkdir -p /var/www/metal-snake-web
sudo chown $USER:www-data /var/www/metal-snake-web
sudo chmod 755 /var/www/metal-snake-web

# Add the deployment public key
echo "YOUR_PUBLIC_KEY_HERE" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

### 4. Web Server Configuration

Example Nginx configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;
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
}
```

## Workflow Options

1. **deploy.yml** - Main deployment workflow using rsync
2. **deploy-scp.yml.example** - Alternative using SCP (rename to .yml to use)

## Manual Deployment

You can also trigger deployment manually:

1. From GitHub: Actions tab → Select workflow → Run workflow
2. From command line: `./scripts/deploy.sh` (requires environment variables)

## Troubleshooting

- Ensure your server allows SSH key authentication
- Check that the deployment user has write permissions to the deployment path
- Verify the GitHub secrets are properly set (no extra spaces or newlines)
- Check the Actions tab in GitHub for deployment logs