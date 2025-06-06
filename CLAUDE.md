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

### Testing
No automated tests are configured. Test manually by opening index.html in a browser.

## Architecture

This is a vanilla JavaScript web game with a modular architecture:

- **js/config/constants.js**: Central configuration (CONFIG object) containing all game parameters, states, and enums
- **js/core/game.js**: Main game controller managing state transitions, game loop, and coordinating all systems
- **js/core/renderer.js**: Canvas rendering logic handling all visual elements
- **js/core/snake.js**: Snake entity logic including movement, collision, and growth
- **js/systems/**: Independent game systems (achievements, combo, particles, powerups, score, sound)

Key patterns:
- ES6 modules for code organization
- Event-driven communication between systems
- Single source of truth for game state in Game class
- Separation of rendering logic from game logic
- Each system manages its own state and lifecycle