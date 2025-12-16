// js/core/game.js
import { CONFIG, GameState, Direction, PowerUpType, SOUND_PRESETS, DEBUG } from '../config/constants.js';
import { Snake } from './snake.js';
import { Renderer } from './renderer.js';
import { AssetLoader } from './assets.js';
import { CollisionSystem } from '../systems/collision.js';
import { InputManager } from '../managers/input.js';
import { ParticleSystem } from '../systems/particle.js';
import { PowerUpManager } from '../systems/powerup.js';
import { ComboSystem } from '../systems/combo.js';
import { AchievementSystem } from '../systems/achievement.js';
import { ScoreManager } from '../systems/score.js';
import { SoundManager } from '../systems/sound.js';
import { EffectsSystem, SnakeTrail, FloatingText, ParticlePresets } from '../systems/effects.js';
import { ProgressionSystem } from '../systems/progression.js';
import { errorManager } from '../systems/error.js';
import { MathUtils } from '../utils/math.js';
import { performanceMonitor } from '../systems/performance.js';

console.log('Loaded constants:', { GameState, PowerUpType });

export class Game {
  constructor(canvas) {
    if (!canvas) {
      throw new Error('Canvas element is required for game initialization');
    }
    
    // Create a deep copy of config to prevent modifications to the original
    this.config = JSON.parse(JSON.stringify(CONFIG));
    this.canvas = canvas;
    this.score = 0;
    this.frameCount = 0;
    this._state = GameState.MENU;
    this.scoreMultiplier = 1;
    this.obstacles = [];
    this.obstaclesEnabled = false;
    this.playerName = "";
    this.tempScore = 0;
    this.tempMode = "classic";
    this.notifications = [];
    this.lastSnakeMoveTime = 0;
    this.debugMode = CONFIG.DEBUG;
    this.errorCount = 0;
    this.criticalError = false;
    
    // Game statistics tracking
    this.gameStats = {
      startTime: 0,
      powerUpsCollected: 0,
      maxCombo: 0,
      foodEaten: 0
    };
    
    // Visual effects
    this.snakeTrail = null;
    this.floatingTexts = [];

    try {
      this.initializeSystems();
      this.initializeGameState();
      this.bindEvents();
      this.resize();
      
      // Make game instance available globally for error tracking
      window.gameInstance = this;
      
      // Create performance debug overlay if in debug mode
      if (CONFIG.DEBUG) {
        performanceMonitor.createDebugOverlay();
      }
    } catch (error) {
      errorManager.handleError(error, { 
        type: 'initialization',
        phase: 'constructor' 
      }, 'critical');
      throw error;
    }
  }
  
  get state() {
    return this._state;
  }
  
  set state(newState) {
    this._state = newState;
    if (this.inputManager) {
      this.inputManager.setGameState(newState);
    }
  }

  initializeSystems() {
    try {
      // Create asset loader for images and sounds
      this.assetLoader = new AssetLoader();
      if (!this.assetLoader) throw new Error('Failed to create AssetLoader');
      
      // Initialize collision system
      this.collisionSystem = new CollisionSystem(this.config);
      if (!this.collisionSystem) throw new Error('Failed to create CollisionSystem');
      
      // Initialize input manager
      this.inputManager = new InputManager();
      if (!this.inputManager) throw new Error('Failed to create InputManager');
      
      // Initialize core game systems in the correct order
      this.renderer = new Renderer(this.canvas, this.config, this.assetLoader);
      if (!this.renderer || !this.renderer.ctx) {
        throw new Error('Failed to create Renderer or get canvas context');
      }
      
      this.snake = new Snake(this.config);
      this.particleSystem = new ParticleSystem(this.config);
      this.powerUpManager = new PowerUpManager(this.config);
      this.comboSystem = new ComboSystem(this.config);
      this.achievementSystem = new AchievementSystem(this.config);
      this.scoreManager = new ScoreManager(this.config);
      this.soundManager = new SoundManager(this.assetLoader);
      
      // Initialize new systems
      this.effectsSystem = new EffectsSystem(this.renderer);
      this.progressionSystem = new ProgressionSystem();
      this.snakeTrail = new SnakeTrail(20);
      
      // Set up input handlers
      this.setupInputHandlers();
    } catch (error) {
      errorManager.handleError(error, {
        type: 'system_initialization',
        phase: 'initializeSystems'
      }, 'critical');
      errorManager.createErrorModal(
        'Initialization Failed',
        'Failed to initialize game systems. Please refresh the page.',
        error.message
      );
      throw error;
    }
  }

  initializeGameState() {
    this.foodPos = this.getRandomPosition();
  }

  getRandomPosition(excludeFood = false) {
    if (!this.snake || !this.snake.body) {
      console.warn('Attempting to get random position before snake initialization');
      return { x: 0, y: 0 };
    }
    
    // Use CollisionSystem to find a valid position
    const options = {
      excludeFood: excludeFood,
      excludePowerUps: false // Always check power-ups
    };
    
    return this.collisionSystem.findValidPosition(this, options);
  }

  setupInputHandlers() {
    // Wrap all input handlers with error boundaries
    const safeHandler = (fn) => errorManager.createErrorBoundary(fn, {
      type: 'input',
      strategy: 'input'
    });
    
    // Movement controls (only active during gameplay)
    this.inputManager.on('move_up', safeHandler(() => {
      if (this.state === GameState.PLAY) {
        this.snake.setDirection(Direction.UP);
      }
    }));
    
    this.inputManager.on('move_down', safeHandler(() => {
      if (this.state === GameState.PLAY) {
        this.snake.setDirection(Direction.DOWN);
      }
    }));
    
    this.inputManager.on('move_left', safeHandler(() => {
      if (this.state === GameState.PLAY) {
        this.snake.setDirection(Direction.LEFT);
      }
    }));
    
    this.inputManager.on('move_right', safeHandler(() => {
      if (this.state === GameState.PLAY) {
        this.snake.setDirection(Direction.RIGHT);
      }
    }));
    
    // Game controls
    this.inputManager.on('pause', safeHandler(() => {
      if (this.state === GameState.PLAY) {
        this.state = GameState.PAUSE;
        this.soundManager.playSound('pause', SOUND_PRESETS.PAUSE);
      } else if (this.state === GameState.PAUSE) {
        this.state = GameState.PLAY;
        this.soundManager.playSound('unpause', SOUND_PRESETS.SELECT);
      }
    }));
    
    this.inputManager.on('toggle_music', safeHandler(() => {
      this.soundManager.toggleMusic();
    }));
    
    // Menu controls
    this.inputManager.on('play', safeHandler(() => {
      if (this.state === GameState.MENU) {
        this.state = GameState.PLAY;
        this.resetGame();
        this.soundManager.playSound('select', SOUND_PRESETS.SELECT);
        this.enterFullscreen();
      }
    }));
    
    this.inputManager.on('select', safeHandler(() => {
      if (this.state === GameState.MENU) {
        this.state = GameState.PLAY;
        this.resetGame();
        this.soundManager.playSound('select', SOUND_PRESETS.SELECT);
      } else if (this.state === GameState.GAME_OVER) {
        this.state = GameState.MENU;
        this.soundManager.playSound('select', SOUND_PRESETS.SELECT);
      }
    }));
    
    this.inputManager.on('highscores', safeHandler(() => {
      if (this.state === GameState.MENU) {
        this.state = GameState.HIGHSCORES;
        this.soundManager.playSound('select', SOUND_PRESETS.SELECT);
      }
    }));
    
    this.inputManager.on('toggle_obstacles', safeHandler(() => {
      if (this.state === GameState.MENU) {
        this.obstaclesEnabled = !this.obstaclesEnabled;
        const soundPreset = this.obstaclesEnabled ? SOUND_PRESETS.TOGGLE_ON : SOUND_PRESETS.TOGGLE_OFF;
        this.soundManager.playSound('toggle', soundPreset);
      }
    }));
    
    this.inputManager.on('settings', safeHandler(() => {
      if (this.state === GameState.MENU) {
        this.state = GameState.SETTINGS;
        this.soundManager.playSound('select', SOUND_PRESETS.SELECT);
      }
    }));
    
    this.inputManager.on('back', safeHandler(() => {
      if (this.state === GameState.HIGHSCORES || this.state === GameState.SETTINGS) {
        this.state = GameState.MENU;
        this.soundManager.playSound('back', SOUND_PRESETS.BACK);
      }
    }));
    
    // Settings controls
    this.inputManager.on('volume_up', safeHandler(() => {
      if (this.state === GameState.SETTINGS) {
        this.soundManager.adjustVolume(0.1);
        this.soundManager.playSound('volume', SOUND_PRESETS.SELECT);
      }
    }));
    
    this.inputManager.on('volume_down', safeHandler(() => {
      if (this.state === GameState.SETTINGS) {
        this.soundManager.adjustVolume(-0.1);
        this.soundManager.playSound('volume', SOUND_PRESETS.SELECT);
      }
    }));
  }

  bindEvents() {
    // Window event listeners
    window.addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    
    // Special handler for game over text input
    window.addEventListener('keydown', (e) => {
      if (this.state === GameState.GAME_OVER) {
        this.handleGameOverInput(e);
      }
    });
    
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
    try {
      const width = MathUtils.clamp(window.innerWidth, 100, 10000);
      const height = MathUtils.clamp(window.innerHeight, 100, 10000);
      
      this.renderer.resize(width, height);
      if (this.renderer.updateOffscreenBackground) {
        this.renderer.updateOffscreenBackground();
      }
    } catch (error) {
      errorManager.handleError(error, {
        type: 'resize',
        width: window.innerWidth,
        height: window.innerHeight
      }, 'warning');
    }
  }
  
  enterFullscreen() {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => {
        console.log('Fullscreen request failed:', err);
      });
    } else if (elem.webkitRequestFullscreen) { // Safari
      elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE/Edge
      elem.msRequestFullscreen();
    }
  }
  
  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { // Safari
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE/Edge
      document.msExitFullscreen();
    }
  }

  handleVisibilityChange() {
    if (document.hidden && this.state === GameState.PLAY) {
      this.state = GameState.PAUSE;
    }
  }

  // Handle game over name input separately since it needs special handling
  handleGameOverInput(e) {
    try {
      if (!e || !e.key) return;
      
      if (e.key === 'Enter') {
        const finalName = this.playerName.trim() || "Player";
        this.scoreManager.addScore(finalName, this.tempScore, this.tempMode);
        this.playerName = "";
        this.state = GameState.HIGHSCORES;
        this.soundManager.playSound('select', SOUND_PRESETS.SELECT);
      } else if (e.key === 'Backspace') {
        this.playerName = this.playerName.slice(0, -1);
      } else if (e.key.length === 1 && this.playerName.length < 15) {
        this.playerName += e.key;
        this.soundManager.playSound('type', SOUND_PRESETS.COLLECT);
      }
    } catch (error) {
      errorManager.handleError(error, {
        type: 'input',
        strategy: 'input',
        context: 'game_over_input'
      }, 'warning');
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
    
    // Reset visual effects
    this.snakeTrail = new SnakeTrail(20);
    this.floatingTexts = [];
    
    // Reset game statistics
    this.gameStats = {
      startTime: Date.now(),
      powerUpsCollected: 0,
      maxCombo: 0,
      foodEaten: 0
    };
    
    // Increment games played
    this.progressionSystem.playerData.gamesPlayed++;
    this.progressionSystem.savePlayerData();
}

  update() {
    try {
      // Add debug logging
      if (this.debugMode && this.frameCount % 60 === 0) {
        console.log('Game status:', {
          state: this.state,
          powerUps: this.powerUpManager.powerUps.length,
          spawnTimer: this.powerUpManager.spawnTimer,
          score: this.score,
          errors: errorManager.getErrorStats()
        });
      }

      const now = performance.now();
      if (this.state === GameState.PLAY) {
      // Update game systems
      this.comboSystem.update();
      this.achievementSystem.checkAchievements(this);
      this.powerUpManager.update(this);
      this.particleSystem.update();
      this.effectsSystem.update();
      this.snakeTrail.update();
      
      // Update floating texts
      this.floatingTexts = this.floatingTexts.filter(text => text.update());
      
      // Update max combo stat
      if (this.comboSystem.comboCount > this.gameStats.maxCombo) {
        this.gameStats.maxCombo = this.comboSystem.comboCount;
      }
      
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
        
        // Add position to snake trail
        const screenPos = this.renderer.gridToScreen(head.x, head.y);
        const trailColor = this.snake.invincible ? '#00ffff' : '#00ff00';
        this.snakeTrail.addPosition(
          screenPos.x + this.renderer.cellSize / 2,
          screenPos.y + this.renderer.cellSize / 2,
          trailColor
        );
        
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
    } catch (error) {
      this.handleGameLoopError(error);
    }
  }
  
  handleGameLoopError(error) {
    this.errorCount++;
    
    const result = errorManager.handleError(error, {
      type: 'game_loop',
      strategy: 'game_loop',
      errorCount: this.errorCount,
      gameState: this.state
    }, 'critical');
    
    if (result && result.stop) {
      this.criticalError = true;
      this.state = GameState.GAME_OVER;
    }
  }

  handleGameOver() {
    this.tempScore = this.score;
    this.tempMode = this.obstaclesEnabled ? "obstacles" : "classic";
    this.state = GameState.GAME_OVER;
    
    // Check achievements one final time before game over
    this.achievementSystem.checkAchievements(this);
    
    // Add screen shake effect
    this.effectsSystem.shake(15, 500);
    
    // Create death explosion particles
    const head = this.snake.headPosition();
    const pos = this.renderer.gridToScreen(head.x, head.y);
    const preset = ParticlePresets.DEATH_EXPLOSION;
    
    // Emit multiple bursts with different colors for dramatic effect
    preset.colors.forEach(color => {
      this.particleSystem.emit(
        pos.x + this.renderer.cellSize / 2,
        pos.y + this.renderer.cellSize / 2,
        Math.floor(preset.count / preset.colors.length),
        color
      );
    });
    
    // Calculate game time
    const gameTime = Math.floor((Date.now() - this.gameStats.startTime) / 1000);
    
    // Get progression rewards
    const rewards = this.progressionSystem.getGameEndRewards(
      this.score,
      this.gameStats.maxCombo,
      gameTime,
      this.gameStats.powerUpsCollected
    );
    
    // Apply rewards
    this.progressionSystem.addCoins(rewards.coins);
    this.progressionSystem.addXP(rewards.xp);
    
    // Store rewards for display
    this.gameEndRewards = rewards;
    
    // Update player statistics
    this.progressionSystem.playerData.totalScore += this.score;
    if (this.score > this.progressionSystem.playerData.bestScore) {
      this.progressionSystem.playerData.bestScore = this.score;
    }
    if (this.gameStats.maxCombo > this.progressionSystem.playerData.bestCombo) {
      this.progressionSystem.playerData.bestCombo = this.gameStats.maxCombo;
    }
    this.progressionSystem.playerData.statistics.foodEaten += this.gameStats.foodEaten;
    this.progressionSystem.playerData.statistics.powerUpsCollected += this.gameStats.powerUpsCollected;
    this.progressionSystem.playerData.totalPlayTime += gameTime;
    this.progressionSystem.savePlayerData();
    
    this.soundManager.playGameOverSound();
}

  handleFoodCollection(head) {
    const obstacleBonus = this.obstaclesEnabled ? (1 + this.config.OBSTACLE_BONUS) : 1;
    const comboMultiplier = this.comboSystem.incrementCombo();
    const totalScore = Math.round(obstacleBonus * this.scoreMultiplier * comboMultiplier);
    
    // Update score and spawn new food
    this.score += totalScore;
    this.foodPos = this.getRandomPosition();
    
    // Update game stats
    this.gameStats.foodEaten++;
    
    // Play sound effects
    this.soundManager.playFoodPickupSound();
    if (comboMultiplier > 1) {
      this.soundManager.playComboSound(this.comboSystem.comboCount);
    }
    
    // Create visual effects
    const pos = this.renderer.gridToScreen(head.x, head.y);
    
    // Create ripple effect
    this.effectsSystem.createRipple(
      pos.x + this.renderer.cellSize / 2,
      pos.y + this.renderer.cellSize / 2,
      '#ff0000',
      this.renderer.cellSize * 2
    );
    
    // Use particle preset for food collection
    const preset = comboMultiplier > 1 ? ParticlePresets.COMBO_BURST : ParticlePresets.FOOD_COLLECT;
    
    // Emit particles with multiple colors for variety
    const particlesPerColor = Math.floor(preset.count / preset.colors.length);
    preset.colors.forEach(color => {
      this.particleSystem.emit(
        pos.x + this.renderer.cellSize / 2,
        pos.y + this.renderer.cellSize / 2,
        particlesPerColor,
        color
      );
    });
    
    // Add floating score text
    this.floatingTexts.push(new FloatingText(
      pos.x + this.renderer.cellSize / 2,
      pos.y + this.renderer.cellSize / 2,
      `+${totalScore}`,
      comboMultiplier > 1 ? this.config.COLORS.GOLD : this.config.COLORS.YELLOW,
      comboMultiplier > 1 ? 28 : 24
    ));
    
    // Add score notification
    this.notifications.push({
      text: `+${totalScore}`,
      duration: 60,
      color: this.config.COLORS.YELLOW
    });
    
    // Update daily challenges
    if (this.gameStats.foodEaten >= 50) {
      this.progressionSystem.updateChallenge('collector', this.gameStats.foodEaten);
    }
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
    
    // Calculate new position with safety checks
    const newPos = {
      x: MathUtils.clamp(this.foodPos.x + moveX, 0, this.config.GRID_COLS - 1),
      y: MathUtils.clamp(this.foodPos.y + moveY, 0, this.config.GRID_ROWS - 1)
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
    try {
      // Clear the canvas before each render
      this.renderer.clear();

      // Render appropriate screen based on game state
      switch (this.state) {
      case GameState.MENU:
        this.renderer.drawMenu(this);
        break;
      case GameState.PLAY:
        this.renderGameplay();
        // Render floating texts on top of gameplay
        this.floatingTexts.forEach(text => text.render(this.renderer.ctx));
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
    } catch (error) {
      errorManager.handleError(error, {
        type: 'render',
        gameState: this.state
      }, 'critical');
      // Try to show basic error screen
      this.renderErrorScreen(error);
    }
  }
  
  renderErrorScreen(error) {
    try {
      this.renderer.clear();
      this.renderer.drawOverlay(0.9);
      this.renderer.drawText(
        "RENDERING ERROR",
        this.canvas.width / 2,
        this.canvas.height / 2 - 40,
        32,
        '#ff0000',
        true
      );
      this.renderer.drawText(
        "Please refresh the page",
        this.canvas.width / 2,
        this.canvas.height / 2,
        24,
        '#ffffff',
        true
      );
    } catch (e) {
      console.error('Failed to render error screen:', e);
    }
  }

  renderGameplay() {
    // Draw animated background and overlay
    this.renderer.drawAnimatedBackground(this.frameCount, this.effectsSystem);
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
        this.renderer.ctx.fillRect(pos.x, pos.y, this.renderer.cellWidth, this.renderer.cellHeight);
      });
    }
    
    // Draw snake, particles, UI elements
    this.renderer.drawSnake(this.snake, this.frameCount, this.snakeTrail);
    this.renderer.drawParticles(this.particleSystem.particles);
    this.renderer.drawUI(this);
    this.renderer.drawActivePowerupsStatus(this.powerUpManager.activePowerUps, this.config.FPS);
    
    // Render effects on top
    this.renderer.renderEffects(this.effectsSystem);
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
    this.renderer.drawAnimatedBackground(this.frameCount, this.effectsSystem);
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
    this.renderer.drawAnimatedBackground(this.frameCount, this.effectsSystem);
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
      
      // Check if critical assets failed to load
      if (this.assetLoader.loadErrors.length > 0) {
        this.notifications.push({
          text: "Some assets failed to load",
          duration: 180,
          color: this.config.COLORS.YELLOW
        });
        console.warn('Asset loading errors:', this.assetLoader.loadErrors);
      }
      
      // Initialize visual elements only if background image loaded
      if (this.assetLoader.images['background']) {
        this.renderer.updateOffscreenBackground();
      }
      
      // Start background music only if it loaded successfully
      if (this.assetLoader.sounds['background']) {
        this.soundManager.playBackgroundMusic().catch(err => {
          if (this.debugMode) {
            console.log('Audio will play after user interaction');
          }
        });
      }
      
      // Start game loop
      this.gameLoop();
      
      if (this.debugMode) {
        console.log('Game started successfully');
      }
      
      return true;
    } catch (err) {
      console.error("Error starting game:", err);
      // Show error to user
      this.notifications.push({
        text: "Error starting game",
        duration: 300,
        color: this.config.COLORS.RED
      });
      // Continue with game loop even if asset loading fails
      this.gameLoop();
      return false;
    }
  }

  gameLoop() {
    // Record frame timing
    performanceMonitor.recordFrameTime();
    
    try {
      const updateStart = performance.now();
      this.update();
      const updateEnd = performance.now();
      performanceMonitor.recordUpdateTime(updateEnd - updateStart);
      
      const renderStart = performance.now();
      this.render();
      const renderEnd = performance.now();
      performanceMonitor.recordRenderTime(renderEnd - renderStart);
    } catch (error) {
      console.error('Critical game loop error:', error);
      this.handleGameLoopError(error);
    }
    
    if (!this.criticalError) {
      requestAnimationFrame(() => this.gameLoop());
    }
  }
}

