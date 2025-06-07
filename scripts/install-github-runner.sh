#!/bin/bash

# Script to install GitHub Actions self-hosted runner
# Run this on a machine that has access to your LAN

# Create a folder for the runner
mkdir -p ~/actions-runner && cd ~/actions-runner

# Download the latest runner package
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract the installer
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure the runner
echo "Go to your GitHub repo → Settings → Actions → Runners → New self-hosted runner"
echo "Follow the configuration instructions there to get your token"
echo "Then run: ./config.sh --url https://github.com/YOUR_REPO --token YOUR_TOKEN"

# Install and start as a service
echo "After configuration, run:"
echo "sudo ./svc.sh install"
echo "sudo ./svc.sh start"