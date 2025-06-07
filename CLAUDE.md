# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
# Run locally (no build step needed - pure vanilla JS)
python3 -m http.server 8000
# or
npx http-server -p 8000

# Run with Docker
docker-compose up -d

# Stop Docker container
docker-compose down
```

### Deployment
The production server (10.10.1.66) has a self-hosted GitHub Actions runner configured.
Deployment happens automatically when pushing to the main branch:

```bash
# Just push to main - deployment is automatic
git push origin main

# The workflow on prod server will:
# 1. Pull latest code
# 2. Rebuild Docker container
# 3. Restart the service
# 4. Verify deployment
```

Production details:
- URL: Served through Cloudflare tunnel on port 8085
- Container: metal-snake-web-metal-snake-web-1
- Workflow: .github/workflows/deploy.yml (on prod server)

### Testing
No automated tests are configured. Test manually by opening index.html in a browser.

## Architecture

This is a vanilla JavaScript web game with a modular architecture:

- **js/config/constants.js**: Central configuration (CONFIG object) containing all game parameters, states, and enums
- **js/core/**: Core game components
  - **game.js**: Main game controller managing state transitions, game loop, and coordinating all systems
  - **renderer.js**: Canvas rendering logic handling all visual elements (with dynamic grid sizing)
  - **snake.js**: Snake entity logic including movement, collision, and growth
  - **assets.js**: Asset loading and management system
- **js/systems/**: Independent game systems (achievements, combo, particles, powerups, score, sound, collision)
- **js/managers/**: Game managers
  - **input.js**: Centralized input handling for keyboard and touch controls
- **js/utils/**: Utility functions
  - **colors.js**: Color management for power-ups and visual effects

Key patterns:
- ES6 modules for code organization
- Event-driven communication between systems
- Single source of truth for game state in Game class
- Separation of rendering logic from game logic
- Each system manages its own state and lifecycle