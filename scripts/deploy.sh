#!/bin/bash

# Deployment script for Metal Snake Web
# This script can be called from GitHub Actions or run manually

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check required environment variables
if [ -z "$DEPLOY_HOST" ] || [ -z "$DEPLOY_USER" ] || [ -z "$DEPLOY_PATH" ]; then
    echo -e "${RED}Error: Missing required environment variables${NC}"
    echo "Required: DEPLOY_HOST, DEPLOY_USER, DEPLOY_PATH"
    exit 1
fi

echo -e "${YELLOW}Starting deployment to $DEPLOY_HOST${NC}"

# Files and directories to exclude
EXCLUDES=(
    '.git'
    '.github'
    'node_modules'
    '.DS_Store'
    '*.log'
    '.env'
    'scripts'
    'Dockerfile'
    'docker-compose.yml'
)

# Build exclude flags for rsync
EXCLUDE_FLAGS=""
for exclude in "${EXCLUDES[@]}"; do
    EXCLUDE_FLAGS="$EXCLUDE_FLAGS --exclude=$exclude"
done

# Deploy using rsync
echo -e "${YELLOW}Syncing files...${NC}"
rsync -avz --delete $EXCLUDE_FLAGS \
    -e "ssh -o StrictHostKeyChecking=no" \
    ./ $DEPLOY_USER@$DEPLOY_HOST:$DEPLOY_PATH/

# Optional: Run post-deployment commands
if [ -n "$POST_DEPLOY_COMMAND" ]; then
    echo -e "${YELLOW}Running post-deployment commands...${NC}"
    ssh $DEPLOY_USER@$DEPLOY_HOST "$POST_DEPLOY_COMMAND"
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"