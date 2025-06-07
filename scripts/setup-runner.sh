#!/bin/bash

# GitHub Actions Self-Hosted Runner Setup Script
# This script documents the setup process for reference

echo "GitHub Actions Self-Hosted Runner Setup"
echo "======================================="
echo ""
echo "This script provides instructions for setting up a self-hosted runner."
echo "It does not contain any sensitive information."
echo ""

# Check if running on the production server
if [[ $(hostname) != "pxlfd" ]] && [[ $(whoami) != "zero" ]]; then
    echo "WARNING: This appears to not be the production server."
    echo "The runner should be installed on the production server only."
    echo ""
fi

echo "Prerequisites:"
echo "- GitHub account with repository access"
echo "- Docker and docker compose installed"
echo "- Systemd for service management"
echo ""

echo "Steps to set up the runner:"
echo ""
echo "1. Download the GitHub Actions runner:"
echo "   mkdir -p ~/actions-runner"
echo "   cd ~/actions-runner"
echo "   curl -o actions-runner-linux-x64-2.321.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.321.0/actions-runner-linux-x64-2.321.0.tar.gz"
echo "   tar xzf ./actions-runner-linux-x64-2.321.0.tar.gz"
echo ""
echo "2. Get a registration token from GitHub:"
echo "   - Go to your repository settings"
echo "   - Navigate to Actions → Runners"
echo "   - Click 'New self-hosted runner'"
echo "   - Copy the registration token"
echo ""
echo "3. Configure the runner:"
echo "   ./config.sh --url https://github.com/YOUR_USERNAME/YOUR_REPO --token YOUR_TOKEN"
echo ""
echo "4. Install as a service:"
echo "   sudo ./svc.sh install"
echo "   sudo ./svc.sh start"
echo ""
echo "5. Verify the runner is online in GitHub settings"
echo ""
echo "For multiple repositories, repeat steps 2-5 for each repo,"
echo "installing each runner in its own directory."