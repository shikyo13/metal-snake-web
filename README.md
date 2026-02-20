# Metal Snake

A retro-styled snake game with a Heavy Metal theme, available in two versions:

- **[Web Version](#web-version)** — HTML5 Canvas with modern JavaScript, playable at [metalsnake.zeronexus.net](https://metalsnake.zeronexus.net/)
- **[Python CLI Version](#python-cli-version)** — Pygame-based desktop version with glow effects, power-ups, and sound synthesis

---

## Python CLI Version

The `python/` directory contains a standalone Pygame implementation featuring:

- Background music and programmatic sound synthesis
- Magnet, speed, and other power-ups
- Glow and particle visual effects with object pooling
- High score persistence
- Responsive window resizing

### Running

```bash
cd python
pip install pygame numpy
python src/metalsnake/snake.py
```

---

## Web Version

Metal Snake is a retro-styled snake game with a Heavy Metal theme built for the web using HTML5 Canvas and modern JavaScript (ES6 modules). The game features smooth client‑side rendering with dynamic visual effects, multiple power‑ups with distinct audio and visual feedback, combo scoring, and responsive design for both desktop and mobile devices.

## Table of Contents

- [Features](#features)
- [Demo](#demo)
- [Installation](#installation)
  - [Local Development](#local-development)
  - [Docker Instructions](#docker-instructions)
- [Usage](#usage)
- [Project Structure](#project-structure)
- [Technical Details](#technical-details)
- [Known Issues & Future Improvements](#known-issues--future-improvements)
- [License](#license)

## Features

- **Smooth Client‑Side Rendering:**  
  Uses HTML5 Canvas with offscreen caching and an optimized game loop (via `requestAnimationFrame()`) for responsive visuals.

- **Multiple Power‑Ups:**  
  Includes power‑ups such as Speed Boost, Invincibility, Score Multiplier, Magnet, Shrink, and Time Slow. Each power‑up has unique visual effects and sound cues.

- **Combo System & Score Multiplier:**  
  Combos increase your score multiplier, with visual feedback displayed on-screen.

- **Dynamic Audio:**  
  Audio is generated via the Web Audio API using an oscillator‑based system for both background music and sound effects. A unified sound manager handles different audio events, and a fallback timeout ensures the game starts even if the AudioContext isn't resumed immediately on mobile.

- **Responsive & Mobile‑Friendly:**  
  The game is designed to work on both desktop and mobile devices. Touch events are handled to resume audio and start the game on mobile, and a fallback timer ensures that the loading screen is dismissed after 6 seconds if no gesture is detected.

## Demo

A live demo of Metal Snake is available at:  
https://metalsnake.zeronexus.net/

## Installation

### Local Development

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/shikyo13/metal-snake-web.git
   cd metal-snake-web
   ```

2. **Serve the Files Locally:**
   Because the game uses ES6 modules, you must run it from a web server. One simple option is to use http-server:
   ```bash
   npm install -g http-server
   http-server .
   ```
   Then open your browser at the address provided (e.g., http://localhost:8080).

   *(Optional) Transpile to ES5:*
   If you need to support older mobile browsers, set up a build process with Babel (or use a bundler such as Webpack or Rollup) to transpile your ES6 code into ES5.

### Docker Instructions

#### Prerequisites
- Docker installed on your system
- Docker Compose installed (usually comes with Docker Desktop)

#### Installation for Snap Users

If you're using Snap, you'll need to install Docker slightly differently:

1. **Install Docker via Snap:**
   ```bash
   sudo snap install docker
   ```

2. **Configure Docker to Run Without Sudo:**
   ```bash
   sudo snap connect docker:home
   sudo groupadd -f docker
   sudo usermod -aG docker $USER
   newgrp docker  # Apply group changes immediately
   ```

#### Running the Project

1. **Clone the Repository:**
   ```bash
   git clone https://github.com/shikyo13/metal-snake-web.git
   cd metal-snake-web
   ```

2. **Build and Run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```
   This command does two things:
   - Builds the Docker image for the Metal Snake game
   - Starts the container, mapping port 8085 on your host to port 80 in the container

3. **Access the Game:**
   Open your web browser and navigate to:
   ```
   http://localhost:8085
   ```

#### Additional Docker Commands

- **Stop the Container:**
  ```bash
  docker-compose down
  ```

- **Rebuild the Image (if you make changes):**
  ```bash
  docker-compose up --build
  ```

#### Notes for Snap Users
- The Docker installation via Snap provides a confined environment
- You might need to use `sudo` for some Docker commands depending on your system configuration
- Ensure you've followed the group configuration steps to run Docker without sudo

#### Persistent Data
The Docker setup uses a named volume `metal-snake-data` to persist game data like high scores. This volume will remain even after stopping the container, allowing you to maintain your game progress.

## Usage

**Desktop Controls:**
- Use the arrow keys to change the snake's direction.
- Press P to pause, M to toggle music, and H to view high scores.

**Mobile Controls:**
- Tap on the screen to resume audio (if needed) and start the game.
- The loading screen will be dismissed either by a touch gesture or automatically after 6 seconds.

**Power‑Ups:**
When the snake collects a power‑up, a sound plays and a timer bar appears on the screen (aligned to the top, opposite the score display) with the power‑up's name and remaining time. Different power‑ups provide different gameplay effects (e.g., TIME SLOW dramatically reduces the snake's movement speed, SHRINK reduces the snake's size, etc.).

## Project Structure

```bash
metal-snake-web/
├── assets
│   ├── audio
│   │   └── midnightcarnage.mp3
│   └── images
│       └── snake.png
├── css
│   └── styles.css
├── docker-compose.yml
├── Dockerfile
├── index.html
└── js
    ├── config
    │   └── constants.js       # Game configuration and constants
    ├── core
    │   ├── game.js            # Main game loop and state management
    │   ├── renderer.js        # Canvas rendering and visual effects
    │   └── snake.js           # Snake behavior and movement
    └── systems
        ├── achievement.js     # Achievement tracking
        ├── combo.js           # Combo system logic
        ├── particle.js        # Particle effects with object pooling
        ├── powerup.js         # Power-up spawning, application, and expiration
        ├── score.js           # Score management and high score storage
        └── sound.js           # SoundManager using the Web Audio API
```

## Testing

### Running Tests

The project uses Jest for unit testing with comprehensive test coverage for all core systems.

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run tests:**
   ```bash
   npm test
   ```

3. **Run tests with coverage:**
   ```bash
   npm run coverage
   ```

4. **Watch mode for development:**
   ```bash
   npm run test:watch
   ```

### Test Coverage

The test suite includes comprehensive coverage for:
- **Snake class**: Movement, collision detection, growth mechanics
- **PowerUpManager**: All 6 power-up types, spawning, collection, expiration
- **ScoreManager**: Score calculation, high score persistence, combo multipliers
- **CollisionSystem**: Boundary, self-collision, obstacle, and power-up detection
- **Game class**: State transitions, game loop, initialization

Target coverage is 80% for all metrics (statements, branches, functions, lines).

### Continuous Integration

Tests automatically run on every push and pull request via GitHub Actions. The CI pipeline:
- Runs all unit tests
- Generates coverage reports
- Builds and tests the Docker container
- Uploads coverage artifacts for review

## Technical Details

**Rendering:**
The game uses offscreen caching for static layers (like the background image and grid) to reduce per‑frame computations. Dynamic elements (the snake, food, particles, power‑up effects) are redrawn each frame.

**Game Loop:**
The game loop uses requestAnimationFrame() to update and render the game state. Movement timing is decoupled from rendering so that input remains snappy even if the frame rate fluctuates.

**Audio:**
The SoundManager uses the Web Audio API. It initializes the AudioContext on a user gesture and uses a fallback timeout so that the game can proceed if the AudioContext isn't resumed immediately on mobile.

**Mobile Compatibility:**
Special handling for touch events (via touchstart) ensures that the AudioContext is resumed on mobile devices. A fallback timer in index.html dismisses the loading screen after 6 seconds if no gesture is detected.

**ES6 Modules:**
The project is written using ES6 modules. Modern mobile browsers support these features. For older browsers, consider using Babel to transpile your code to ES5.

## Known Issues & Future Improvements

- **Mobile Asset Loading:**
  Some older mobile devices may require transpiling to ES5 or additional polyfills. Future updates may include a build step to ensure broader compatibility.

- **Power-Up Modifier Combinations:**
  Currently, power-up effects (e.g., SPEED BOOST and TIME SLOW) do not combine gracefully. A future improvement would be to implement a modifier system that calculates a net effective speed based on all active modifiers.

- **Input Responsiveness:**
  Lowering the game speed (e.g., during TIME SLOW) increases the interval between snake moves. Future iterations could decouple input handling from movement timing even further.

- **Mobile Testing:**
  Further testing on a wide range of devices might reveal additional adjustments for optimal performance.

## License

This project is licensed under the MIT License.
