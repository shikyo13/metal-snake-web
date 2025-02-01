// js/core/game.js
import { CONFIG, GameState, Direction, PowerUpType } from '../config/constants.js';
import { Snake } from './snake.js';
import { Renderer } from './renderer.js';
import { ParticleSystem } from '../systems/particle.js';
import { PowerUpManager } from '../systems/powerup.js';
import { ComboSystem } from '../systems/combo.js';
import { AchievementSystem } from '../systems/achievement.js';
import { ScoreManager } from '../systems/score.js';
import { SoundManager } from '../systems/sound.js';

export class Game {
  constructor(canvas) {
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

    this.initializeSystems();
    this.initializeGameState();
    this.bindEvents();
    this.resize();
  }

  initializeSystems() {
    // Create asset loader for images and sounds.
    this.assetLoader = new AssetLoader();
    
    // Pass the asset loader to the renderer so it can access the background image.
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
    for (let attempts = 0; attempts < 100; attempts++) {
      const x = Math.floor(Math.random() * this.config.GRID_COLS);
      const y = Math.floor(Math.random() * this.config.GRID_ROWS);
      const pos = { x, y };
      const snakeCollision = this.snake.body.some(seg => seg.x === x && seg.y === y);
      if (snakeCollision) continue;
      if (includePowerUps && this.powerUpManager) {
        const powerUpCollision = this.powerUpManager.powerUps.some(pu => pu.x === x && pu.y === y);
        if (powerUpCollision) continue;
      }
      const obstacleCollision = this.obstacles.some(ob => ob.x === x && ob.y === y);
      if (obstacleCollision) continue;
      return pos;
    }
    return { x: 0, y: 0 };
  }

  bindEvents() {
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange());
    
    // Listen for clicks on the canvas (desktop)
    this.canvas.addEventListener('click', () => {
      if (this.soundManager.audioCtx && this.soundManager.audioCtx.state === 'suspended') {
        this.soundManager.audioCtx.resume();
        this.soundManager.playBackgroundMusic();
      }
    });
    
    // Also listen for touch events on the canvas (mobile)
    this.canvas.addEventListener('touchstart', () => {
      if (this.soundManager.audioCtx && this.soundManager.audioCtx.state === 'suspended') {
        this.soundManager.audioCtx.resume();
        this.soundManager.playBackgroundMusic();
      }
    });
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
    this.snake = new Snake(this.config);
    this.foodPos = this.getRandomPosition();
    this.score = 0;
    this.powerUpManager.powerUps = [];
    this.powerUpManager.activePowerUps = {};
    this.scoreMultiplier = 1;
    this.config.GAME_SPEED = this.config.BASE_GAME_SPEED;
    this.snake.invincible = false;
    this.obstacles = [];
    if (this.obstaclesEnabled) {
      for (let i = 0; i < this.config.OBSTACLE_COUNT; i++) {
        this.obstacles.push(this.getRandomPosition());
      }
    }
    this.comboSystem.reset();
    this.notifications = [];
    this.lastSnakeMoveTime = performance.now();
  }

  update() {
    const now = performance.now();
    if (this.state === GameState.PLAY) {
      this.comboSystem.update();
      this.achievementSystem.checkAchievements(this);
      this.powerUpManager.update(this);
      this.particleSystem.update();
      this.notifications = this.notifications.filter(n => {
        n.duration--;
        return n.duration > 0;
      });
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
    this.soundManager.playGameOverSound();
  }

  handleFoodCollection(head) {
    const obstacleBonus = this.obstaclesEnabled ? (1 + this.config.OBSTACLE_BONUS) : 1;
    const comboMultiplier = this.comboSystem.incrementCombo();
    const totalScore = Math.round(obstacleBonus * this.scoreMultiplier * comboMultiplier);
    this.score += totalScore;
    this.foodPos = this.getRandomPosition();
    this.soundManager.playFoodPickupSound();
    if (comboMultiplier > 1) {
      this.soundManager.playComboSound(this.comboSystem.comboCount);
    }
    const pos = this.renderer.gridToScreen(head.x, head.y);
    this.particleSystem.emit(
      pos.x + this.renderer.cellSize / 2,
      pos.y + this.renderer.cellSize / 2,
      this.config.PARTICLE_COUNT,
      "255,0,0"
    );
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
    let moveX = 0, moveY = 0;
    if (Math.abs(dx) > Math.abs(dy)) {
      moveX = dx > 0 ? 1 : -1;
    } else {
      moveY = dy > 0 ? 1 : -1;
    }
    const newPos = {
      x: this.foodPos.x + moveX,
      y: this.foodPos.y + moveY
    };
    const collision = this.snake.body.some(seg => seg.x === newPos.x && seg.y === newPos.y)
                    || this.powerUpManager.powerUps.some(pu => pu.x === newPos.x && pu.y === newPos.y);
    if (!collision &&
        newPos.x >= 0 && newPos.x < this.config.GRID_COLS &&
        newPos.y >= 0 && newPos.y < this.config.GRID_ROWS) {
      this.foodPos = newPos;
    }
  }

  render() {
    this.renderer.clear();
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
    this.renderer.drawAnimatedBackground(this.frameCount);
    this.renderer.drawOverlay(0.2);
    this.renderer.drawFood(this.foodPos, this.frameCount, this.powerUpManager.magnetActive ? 3 : 0);
    this.powerUpManager.powerUps.forEach(powerUp => {
      this.renderer.drawPowerUp(powerUp, this.frameCount);
    });
    if (this.obstaclesEnabled) {
      this.obstacles.forEach(obstacle => {
        const pos = this.renderer.gridToScreen(obstacle.x, obstacle.y);
        this.renderer.ctx.fillStyle = this.config.COLORS.GRAY;
        this.renderer.ctx.fillRect(pos.x, pos.y, this.renderer.cellSize, this.renderer.cellSize);
      });
    }
    this.renderer.drawSnake(this.snake, this.frameCount);
    this.renderer.drawParticles(this.particleSystem.particles);
    this.renderer.drawUI(this);
    this.renderer.drawActivePowerupsStatus(this.powerUpManager.activePowerUps, this.config.FPS);
  }

  renderGameOver() {
    this.renderGameplay();
    this.renderer.drawOverlay(0.8);
    this.renderer.drawText("GAME OVER!", this.canvas.width / 2, this.canvas.height / 2 - 80, 40, this.config.COLORS.RED, true, true);
    this.renderer.drawText(`Score: ${this.tempScore}`, this.canvas.width / 2, this.canvas.height / 2 - 40, 30, this.config.COLORS.WHITE, true);
    this.renderer.drawText("Enter your name:", this.canvas.width / 2, this.canvas.height / 2, 24, this.config.COLORS.WHITE, true);
    this.renderer.drawText(this.playerName + (this.frameCount % 60 < 30 ? "_" : ""), this.canvas.width / 2, this.canvas.height / 2 + 30, 24, this.config.COLORS.BLUE, true);
    this.renderer.drawText("[ENTER] Submit | [ESC] Menu", this.canvas.width / 2, this.canvas.height / 2 + 70, 20, this.config.COLORS.WHITE, true);
  }

  renderHighScores() {
    this.renderer.drawAnimatedBackground(this.frameCount);
    this.renderer.drawOverlay(0.5);
    this.renderer.drawText("HIGH SCORES", this.canvas.width / 2, 40, 40, this.config.COLORS.BLUE, true, true);
    let yOffset = 100;
    const classicScores = this.scoreManager.getHighScores("classic");
    this.renderer.drawText("Classic Mode:", this.canvas.width / 2, yOffset, 28, this.config.COLORS.WHITE, true);
    yOffset += 40;
    classicScores.forEach((entry, i) => {
      this.renderer.drawText(`${i + 1}. ${entry.name} - ${entry.score}`, this.canvas.width / 2, yOffset, 24, this.config.COLORS.WHITE, true);
      yOffset += 30;
    });
    yOffset += 20;
    const obstacleScores = this.scoreManager.getHighScores("obstacles");
    this.renderer.drawText("Obstacle Mode:", this.canvas.width / 2, yOffset, 28, this.config.COLORS.WHITE, true);
    yOffset += 40;
    obstacleScores.forEach((entry, i) => {
      this.renderer.drawText(`${i + 1}. ${entry.name} - ${entry.score}`, this.canvas.width / 2, yOffset, 24, this.config.COLORS.WHITE, true);
      yOffset += 30;
    });
    this.renderer.drawText("[ESC] Return to Menu", this.canvas.width / 2, this.canvas.height - 30, 24, this.config.COLORS.WHITE, true);
  }

  renderSettings() {
    this.renderer.drawAnimatedBackground(this.frameCount);
    this.renderer.drawOverlay(0.5);
    this.renderer.drawText("SETTINGS", this.canvas.width / 2, 50, 40, this.config.COLORS.WHITE, true, true);
    const settingsItems = [
      "[M] Toggle Music",
      "[↑/↓] Music Volume",
      "[ESC] Return to Menu"
    ];
    settingsItems.forEach((item, index) => {
      this.renderer.drawText(item, this.canvas.width / 2, 150 + (index * 40), 24, this.config.COLORS.WHITE, true);
    });
    const bg = this.assetLoader.sounds['background'];
    const musicStatus = bg && !bg.paused ? "On" : "Off";
    this.renderer.drawText(`Music: ${musicStatus}`, this.canvas.width / 2, 310, 24, this.config.COLORS.WHITE, true);
    if (bg) {
      this.renderer.drawText(`Volume: ${Math.round(bg.volume * 100)}%`, this.canvas.width / 2, 350, 24, this.config.COLORS.WHITE, true);
    }
  }

  async start() {
    try {
      await this.assetLoader.loadAssets();
      this.renderer.updateOffscreenBackground();
      this.soundManager.playBackgroundMusic();
      this.gameLoop();
      return true;
    } catch (err) {
      console.error("Error starting game:", err);
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

// Asset loader class definition
class AssetLoader {
  constructor() {
    this.images = {};
    this.sounds = {};
  }

  loadImage(name, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images[name] = img;
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  loadAudio(name, src) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.onloadeddata = () => {
        this.sounds[name] = audio;
        resolve(audio);
      };
      audio.onerror = reject;
      audio.src = src;
      audio.loop = (name === 'background');
    });
  }

  loadAssets() {
    return Promise.all([
      this.loadImage('background', 'assets/images/snake.png'),
      this.loadAudio('background', 'assets/audio/midnightcarnage.mp3')
    ]);
  }
}
