// js/core/game.js
import { CONFIG, GameState, Direction, PowerUpType } from '../config/constants.js';
import { Snake } from './snake.js';
import { Renderer } from './renderer.js';
import { AssetLoader } from './assets.js';
import { ParticleSystem } from '../systems/particle.js';
import { PowerUpManager } from '../systems/powerup.js';
import { ComboSystem } from '../systems/combo.js';
import { AchievementSystem } from '../systems/achievement.js';
import { ScoreManager } from '../systems/score.js';
import { SoundManager } from '../systems/sound.js';

const DEBUG = false;
console.log('Loaded constants:', { GameState, PowerUpType });

export class Game {
  constructor(canvas) {
    // Create a deep copy of config to prevent modifications to the original
    this.config = JSON.parse(JSON.stringify(CONFIG));
    this.canvas = canvas;
    this.score = 0;
    this.frameCount = 0;
    this.state = GameState.MENU;
    this.scoreMultiplier = 1;
    this.obstacles = [];
    this.obstaclesEnabled = false;
    this.playerName = "";
    this.tempScore = 0;
    this.tempMode = "classic";
    this.notifications = [];
    this.lastSnakeMoveTime = 0;
    this.debugMode = true;  // Enable debugging output

    this.initializeSystems();
    this.initializeGameState();
    this.bindEvents();
    this.resize();
  }

  initializeSystems() {
    // Create asset loader for images and sounds
    this.assetLoader = new AssetLoader();
    
    // Initialize core game systems in the correct order
    this.renderer = new Renderer(this.canvas, this.config, this.assetLoader);
    this.snake = new Snake(this.config);
    this.particleSystem = new ParticleSystem(this.config);
    this.powerUpManager = new PowerUpManager(this.config);
    this.comboSystem = new ComboSystem(this.config);
    this.achievementSystem = new AchievementSystem(this.config);
    this.scoreManager = new ScoreManager(this.config);
    this.soundManager = new SoundManager(this.assetLoader);
  }

  initializeGameState() {
    this.foodPos = this.getRandomPosition();
  }

  getRandomPosition(includePowerUps = false) {
    if (!this.snake || !this.snake.body) {
      console.warn('Attempting to get random position before snake initialization');
      return { x: 0, y: 0 };
    }
    
    // Keep track of all attempts to avoid infinite loops
    const maxAttempts = 100;
    for (let attempts = 0; attempts < maxAttempts; attempts++) {
      const x = Math.floor(Math.random() * this.config.GRID_COLS);
      const y = Math.floor(Math.random() * this.config.GRID_ROWS);
      const pos = { x, y };
      
      // Check for collisions with all game objects
      const snakeCollision = this.snake.body.some(seg => seg.x === x && seg.y === y);
      const foodCollision = this.foodPos && this.foodPos.x === x && this.foodPos.y === y;
      const obstacleCollision = this.obstacles.some(ob => ob.x === x && ob.y === y);
      const powerUpCollision = includePowerUps ? 
        this.powerUpManager.powerUps.some(pu => pu.x === x && pu.y === y) : false;
      
      // Return position if no collisions found
      if (!snakeCollision && !foodCollision && !obstacleCollision && !powerUpCollision) {
        return pos;
      }
    }
    
    console.warn('Could not find valid random position after maximum attempts');
    return { x: 0, y: 0 };
  }

  bindEvents() {
    // Window event listeners
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    
    // Handle audio context resuming for both desktop and mobile
    const resumeAudioContext = () => {
      if (this.soundManager.audioCtx && this.soundManager.audioCtx.state === 'suspended') {
        this.soundManager.audioCtx.resume().then(() => {
          this.soundManager.playBackgroundMusic();
        });
      }
    };
    
    this.canvas.addEventListener('click', resumeAudioContext);
    this.canvas.addEventListener('touchstart', resumeAudioContext);
  }

  resize() {
    this.renderer.resize(window.innerWidth, window.innerHeight);
    if (this.renderer.updateOffscreenBackground) {
      this.renderer.updateOffscreenBackground();
    }
  }

  handleVisibilityChange() {
    if (document.hidden && this.state === GameState.PLAY) {
      this.state = GameState.PAUSE;
    }
  }

  handleKeyDown(e) {
    // Try to resume audio context if suspended
    if (this.soundManager.audioCtx && this.soundManager.audioCtx.state === 'suspended') {
      this.soundManager.audioCtx.resume();
    }

    switch (this.state) {
      case GameState.MENU:
        this.handleMenuInput(e);
        break;
      case GameState.PLAY:
        this.handleGameInput(e);
        break;
      case GameState.PAUSE:
        this.handlePauseInput(e);
        break;
      case GameState.GAME_OVER:
        this.handleGameOverInput(e);
        break;
      case GameState.HIGHSCORES:
        this.handleHighScoresInput(e);
        break;
      case GameState.SETTINGS:
        this.handleSettingsInput(e);
        break;
    }
  }

  handleMenuInput(e) {
    switch (e.key.toLowerCase()) {
      case 'p':
        this.state = GameState.PLAY;
        this.resetGame();
        this.soundManager.playSound('select', { type: 'sine', frequency: 660, duration: 0.1 });
        break;
      case 'h':
        this.state = GameState.HIGHSCORES;
        this.soundManager.playSound('select', { type: 'sine', frequency: 550, duration: 0.1 });
        break;
      case 'o':
        this.obstaclesEnabled = !this.obstaclesEnabled;
        this.soundManager.playSound('toggle', { type: 'square', frequency: this.obstaclesEnabled ? 660 : 440, duration: 0.1 });
        break;
      case 's':
        this.state = GameState.SETTINGS;
        this.soundManager.playSound('select', { type: 'sine', frequency: 440, duration: 0.1 });
        break;
    }
  }

  handleSettingsInput(e) {
    switch (e.key.toLowerCase()) {
      case 'm':
        this.soundManager.toggleMusic();
        break;
      case 'arrowup':
        const bgUp = this.assetLoader.sounds['background'];
        if (bgUp) {
          bgUp.volume = Math.min(1.0, bgUp.volume + 0.1);
        }
        break;
      case 'arrowdown':
        const bgDown = this.assetLoader.sounds['background'];
        if (bgDown) {
          bgDown.volume = Math.max(0.0, bgDown.volume - 0.1);
        }
        break;
      case 'escape':
        this.state = GameState.MENU;
        this.soundManager.playSound('select', { type: 'sine', frequency: 660, duration: 0.1 });
        break;
    }
  }

  handleHighScoresInput(e) {
    if (e.key === 'Escape') {
      this.state = GameState.MENU;
      this.soundManager.playSound('select', { type: 'sine', frequency: 660, duration: 0.1 });
    }
  }

  handlePauseInput(e) {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'p') {
      this.state = GameState.PLAY;
      this.soundManager.playSound('unpause', { type: 'sine', frequency: 440, duration: 0.2 });
    }
  }

  handleGameInput(e) {
    switch (e.key) {
      case 'ArrowUp':
        this.snake.setDirection(Direction.UP);
        break;
      case 'ArrowDown':
        this.snake.setDirection(Direction.DOWN);
        break;
      case 'ArrowLeft':
        this.snake.setDirection(Direction.LEFT);
        break;
      case 'ArrowRight':
        this.snake.setDirection(Direction.RIGHT);
        break;
      case 'Escape':
        this.state = GameState.PAUSE;
        this.soundManager.playSound('pause', { type: 'sine', frequency: 330, duration: 0.2 });
        break;
      case 'm':
        this.soundManager.toggleMusic();
        break;
    }
  }

  handleGameOverInput(e) {
    if (e.key === 'Enter') {
      const finalName = this.playerName.trim() || "Player";
      this.scoreManager.addScore(finalName, this.tempScore, this.tempMode);
      this.playerName = "";
      this.state = GameState.HIGHSCORES;
      this.soundManager.playSound('select', { type: 'sine', frequency: 660, duration: 0.1 });
    } else if (e.key === 'Backspace') {
      this.playerName = this.playerName.slice(0, -1);
    } else if (e.key.length === 1 && this.playerName.length < 15) {
      this.playerName += e.key;
      this.soundManager.playSound('type', { type: 'sine', frequency: 880, duration: 0.05 });
    }
  }

  resetGame() {
    // Reset snake and basic game state
    this.snake = new Snake(this.config);
    this.foodPos = this.getRandomPosition();
    this.score = 0;
    
    // Reset power-up system
    this.powerUpManager.powerUps = [];
    this.powerUpManager.activePowerUps = {};
    this.powerUpManager.spawnTimer = 0;
    
    // Reset game modifiers
    this.scoreMultiplier = 1;
    this.config.GAME_SPEED = this.config.BASE_GAME_SPEED;
    this.snake.invincible = false;
    
    // Reset or initialize obstacles
    this.obstacles = [];
    if (this.obstaclesEnabled) {
        for (let i = 0; i < this.config.OBSTACLE_COUNT; i++) {
            this.obstacles.push(this.getRandomPosition());
        }
    }
    
    // Reset auxiliary systems
    this.comboSystem.reset();
    this.notifications = [];
    this.lastSnakeMoveTime = performance.now();
}

  update() {
    // Add debug logging
    if (this.debugMode && this.frameCount % 60 === 0) {
      console.log('Game status:', {
        state: this.state,
        powerUps: this.powerUpManager.powerUps.length,
        spawnTimer: this.powerUpManager.spawnTimer,
        score: this.score
      });
    }

    const now = performance.now();
    if (this.state === GameState.PLAY) {
      // Update game systems
      this.comboSystem.update();
      this.achievementSystem.checkAchievements(this);
      this.powerUpManager.update(this);
      this.particleSystem.update();
      
      // Update notifications
      this.notifications = this.notifications.filter(n => {
        n.duration--;
        return n.duration > 0;
      });

      // Handle snake movement
      const moveInterval = 1000 / this.config.GAME_SPEED;
      if (now - this.lastSnakeMoveTime > moveInterval) {
        this.lastSnakeMoveTime = now;
        const alive = this.snake.move(this.foodPos, this.obstacles);
        
        if (!alive) {
          this.handleGameOver();
          return;
        }
        
        const head = this.snake.headPosition();
        if (head.x === this.foodPos.x && head.y === this.foodPos.y) {
          this.handleFoodCollection(head);
        }
      }

      // Handle magnet power-up effect
      if (this.powerUpManager.magnetActive) {
        this.attractFood();
      }
    }
    
    this.frameCount++;
  }

  handleGameOver() {
    this.tempScore = this.score;
    this.tempMode = this.obstaclesEnabled ? "obstacles" : "classic";
    this.state = GameState.GAME_OVER;
    
    // Check achievements one final time before game over
    this.achievementSystem.checkAchievements(this);
    
    this.soundManager.playGameOverSound();
}

  handleFoodCollection(head) {
    const obstacleBonus = this.obstaclesEnabled ? (1 + this.config.OBSTACLE_BONUS) : 1;
    const comboMultiplier = this.comboSystem.incrementCombo();
    const totalScore = Math.round(obstacleBonus * this.scoreMultiplier * comboMultiplier);
    
    // Update score and spawn new food
    this.score += totalScore;
    this.foodPos = this.getRandomPosition();
    
    // Play sound effects
    this.soundManager.playFoodPickupSound();
    if (comboMultiplier > 1) {
      this.soundManager.playComboSound(this.comboSystem.comboCount);
    }
    
    // Create visual effects
    const pos = this.renderer.gridToScreen(head.x, head.y);
    this.particleSystem.emit(
      pos.x + this.renderer.cellSize / 2,
      pos.y + this.renderer.cellSize / 2,
      this.config.PARTICLE_COUNT,
      "255,0,0"
    );
    
    // Add score notification
    this.notifications.push({
      text: `+${totalScore}`,
      duration: 60,
      color: this.config.COLORS.YELLOW
    });
  }

  attractFood() {
    if (!this.foodPos) return;
    
    const head = this.snake.headPosition();
    const dx = head.x - this.foodPos.x;
    const dy = head.y - this.foodPos.y;
    
    // Determine movement direction
    let moveX = 0, moveY = 0;
    if (Math.abs(dx) > Math.abs(dy)) {
      moveX = dx > 0 ? 1 : -1;
    } else {
      moveY = dy > 0 ? 1 : -1;
    }
    
    // Calculate new position
    const newPos = {
      x: this.foodPos.x + moveX,
      y: this.foodPos.y + moveY
    };

    // Check for collisions with snake body and power-ups
    const collision = this.snake.body.some(seg => seg.x === newPos.x && seg.y === newPos.y)
                    || this.powerUpManager.powerUps.some(pu => pu.x === newPos.x && pu.y === newPos.y);
    
    // Only move food if new position is valid and within bounds
    if (!collision &&
        newPos.x >= 0 && newPos.x < this.config.GRID_COLS &&
        newPos.y >= 0 && newPos.y < this.config.GRID_ROWS) {
      this.foodPos = newPos;
    }
  }

  render() {
    // Clear the canvas before each render
    this.renderer.clear();

    // Render appropriate screen based on game state
    switch (this.state) {
      case GameState.MENU:
        this.renderer.drawMenu(this);
        break;
      case GameState.PLAY:
        this.renderGameplay();
        break;
      case GameState.PAUSE:
        this.renderGameplay();
        this.renderer.drawOverlay(0.5);
        this.renderer.drawText("PAUSED", this.canvas.width / 2, this.canvas.height / 2, 48, this.config.COLORS.WHITE, true, true);
        break;
      case GameState.GAME_OVER:
        this.renderGameOver();
        break;
      case GameState.HIGHSCORES:
        this.renderHighScores();
        break;
      case GameState.SETTINGS:
        this.renderSettings();
        break;
    }
  }

  renderGameplay() {
    // Draw animated background and overlay
    this.renderer.drawAnimatedBackground(this.frameCount);
    this.renderer.drawOverlay(0.2);

    // Draw food with magnet effect if active
    this.renderer.drawFood(this.foodPos, this.frameCount, this.powerUpManager.magnetActive ? 3 : 0);
    
    // Draw all active power-ups
    this.powerUpManager.powerUps.forEach(powerUp => {
      this.renderer.drawPowerUp(powerUp, this.frameCount);
    });
    
    // Draw obstacles if enabled
    if (this.obstaclesEnabled) {
      this.obstacles.forEach(obstacle => {
        const pos = this.renderer.gridToScreen(obstacle.x, obstacle.y);
        this.renderer.ctx.fillStyle = this.config.COLORS.GRAY;
        this.renderer.ctx.fillRect(pos.x, pos.y, this.renderer.cellSize, this.renderer.cellSize);
      });
    }
    
    // Draw snake, particles, UI elements
    this.renderer.drawSnake(this.snake, this.frameCount);
    this.renderer.drawParticles(this.particleSystem.particles);
    this.renderer.drawUI(this);
    this.renderer.drawActivePowerupsStatus(this.powerUpManager.activePowerUps, this.config.FPS);
  }

  renderGameOver() {
    // Draw the gameplay state in background
    this.renderGameplay();
    
    // Add dark overlay
    this.renderer.drawOverlay(0.8);
    
    // Draw game over text and score
    this.renderer.drawText("GAME OVER!", this.canvas.width / 2, this.canvas.height / 2 - 80, 40, this.config.COLORS.RED, true, true);
    this.renderer.drawText(`Score: ${this.tempScore}`, this.canvas.width / 2, this.canvas.height / 2 - 40, 30, this.config.COLORS.WHITE, true);
    
    // Draw name entry interface
    this.renderer.drawText("Enter your name:", this.canvas.width / 2, this.canvas.height / 2, 24, this.config.COLORS.WHITE, true);
    this.renderer.drawText(this.playerName + (this.frameCount % 60 < 30 ? "_" : ""), this.canvas.width / 2, this.canvas.height / 2 + 30, 24, this.config.COLORS.BLUE, true);
    this.renderer.drawText("[ENTER] Submit | [ESC] Menu", this.canvas.width / 2, this.canvas.height / 2 + 70, 20, this.config.COLORS.WHITE, true);
  }

  renderHighScores() {
    // Draw background and overlay
    this.renderer.drawAnimatedBackground(this.frameCount);
    this.renderer.drawOverlay(0.5);
    
    // Draw title
    this.renderer.drawText("HIGH SCORES", this.canvas.width / 2, 40, 40, this.config.COLORS.BLUE, true, true);
    
    // Draw classic mode scores
    let yOffset = 100;
    const classicScores = this.scoreManager.getHighScores("classic");
    this.renderer.drawText("Classic Mode:", this.canvas.width / 2, yOffset, 28, this.config.COLORS.WHITE, true);
    yOffset += 40;
    classicScores.forEach((entry, i) => {
      this.renderer.drawText(`${i + 1}. ${entry.name} - ${entry.score}`, this.canvas.width / 2, yOffset, 24, this.config.COLORS.WHITE, true);
      yOffset += 30;
    });
    
    // Draw obstacle mode scores
    yOffset += 20;
    const obstacleScores = this.scoreManager.getHighScores("obstacles");
    this.renderer.drawText("Obstacle Mode:", this.canvas.width / 2, yOffset, 28, this.config.COLORS.WHITE, true);
    yOffset += 40;
    obstacleScores.forEach((entry, i) => {
      this.renderer.drawText(`${i + 1}. ${entry.name} - ${entry.score}`, this.canvas.width / 2, yOffset, 24, this.config.COLORS.WHITE, true);
      yOffset += 30;
    });
    
    // Draw return instruction
    this.renderer.drawText("[ESC] Return to Menu", this.canvas.width / 2, this.canvas.height - 30, 24, this.config.COLORS.WHITE, true);
  }

  renderSettings() {
    // Draw background and overlay
    this.renderer.drawAnimatedBackground(this.frameCount);
    this.renderer.drawOverlay(0.5);
    
    // Draw title
    this.renderer.drawText("SETTINGS", this.canvas.width / 2, 50, 40, this.config.COLORS.WHITE, true, true);
    
    // Draw settings options
    const settingsItems = [
      "[M] Toggle Music",
      "[↑/↓] Music Volume",
      "[ESC] Return to Menu"
    ];
    settingsItems.forEach((item, index) => {
      this.renderer.drawText(item, this.canvas.width / 2, 150 + (index * 40), 24, this.config.COLORS.WHITE, true);
    });
    
    // Draw current music status
    const bg = this.assetLoader.sounds['background'];
    const musicStatus = bg && !bg.paused ? "On" : "Off";
    this.renderer.drawText(`Music: ${musicStatus}`, this.canvas.width / 2, 310, 24, this.config.COLORS.WHITE, true);
    if (bg) {
      this.renderer.drawText(`Volume: ${Math.round(bg.volume * 100)}%`, this.canvas.width / 2, 350, 24, this.config.COLORS.WHITE, true);
    }
  }

  async start() {
    try {
      // Load game assets
      await this.assetLoader.loadAssets();
      
      // Initialize visual elements
      this.renderer.updateOffscreenBackground();
      
      // Start background music (will wait for user interaction)
      this.soundManager.playBackgroundMusic().catch(err => {
        if (this.debugMode) {
          console.log('Audio will play after user interaction');
        }
      });
      
      // Start game loop
      this.gameLoop();
      
      if (this.debugMode) {
        console.log('Game started successfully');
      }
      
      return true;
    } catch (err) {
      console.error("Error starting game:", err);
      // Continue with game loop even if asset loading fails
      this.gameLoop();
      return false;
    }
  }

  gameLoop() {
    this.update();
    this.render();
    requestAnimationFrame(() => this.gameLoop());
  }
}

