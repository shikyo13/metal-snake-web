# Deployment Setup

This document describes the deployment setup for Metal Snake Web.

## Overview

The game is deployed using GitHub Actions with a self-hosted runner on the production server. When code is pushed to the main branch, it automatically deploys to production.

## Production Environment

- **Server**: Ubuntu Linux (10.10.1.66)
- **Container**: Docker with nginx serving the game
- **Port**: 8085 (exposed via Cloudflare tunnel)
- **Runner**: Self-hosted GitHub Actions runner

## Deployment Workflow

The deployment workflow (`.github/workflows/deploy.yml`) performs these steps:

1. Runs on the self-hosted runner labeled `metal-snake-web`
2. Pulls the latest code from the main branch
3. Rebuilds the Docker container without cache
4. Restarts the service
5. Verifies the deployment is accessible

## Setting Up a Self-Hosted Runner

If you need to set up the runner again:

1. Go to Settings → Actions → Runners in your GitHub repository
2. Click "New self-hosted runner"
3. Follow the instructions to download and configure the runner
4. Install as a systemd service for automatic startup

The runner is installed at `/home/zero/actions-runner/metal-snake-web/` on the production server.

## Manual Deployment

If needed, you can deploy manually on the production server:

```bash
cd /home/zero/metal-snake-web
git pull origin main
docker compose build --no-cache
docker compose up -d
```

## Monitoring

- Check runner status: `sudo systemctl status 'actions.runner.*metal-snake*'`
- View runner logs: `sudo journalctl -u 'actions.runner.*metal-snake*' -f`
- Check container status: `docker ps | grep metal-snake`
- View container logs: `docker logs metal-snake-web-metal-snake-web-1`

## Troubleshooting

### Runner Issues
- If the runner is offline, check the systemd service
- Ensure the runner has permission to execute docker commands
- Check GitHub repository settings for runner status

### Deployment Failures
- Check the Actions tab in GitHub for workflow logs
- Verify Docker is running on the production server
- Ensure there's enough disk space for Docker builds

### Git Ownership Issues
The workflow includes a fix for git ownership issues:
```bash
git config --global --add safe.directory /home/zero/metal-snake-web
```

## Security Notes

- No SSH keys or secrets are stored in the repository
- The runner uses local file system access only
- Deployment happens entirely on the production server
- The server is not exposed to the internet except through Cloudflare tunnel