// js/systems/powerup.js
import { PowerUpType } from '../config/constants.js';

export class PowerUp {
  constructor(x, y, type, config) {
    this.x = x;
    this.y = y + 50;
    this.type = type;
    this.config = config;
    this.duration = this.config.POWERUP_DURATION;
    this.remainingDuration = this.duration;
    this.collected = false;
  }

  position() {
    return { x: this.x, y: this.y };
  }

  apply(game) {
    this.collected = true;
    switch (this.type) {
      case PowerUpType.SPEED_BOOST:
        // Increase game speed by 3 units.
        game.config.GAME_SPEED += 3;
        game.powerUpManager.activePowerUps[this.type] = this.duration;
        game.soundManager.playPowerUpSound(this.type);
        break;
      case PowerUpType.INVINCIBILITY:
        game.snake.invincible = true;
        game.powerUpManager.activePowerUps[this.type] = this.duration;
        game.soundManager.playPowerUpSound(this.type);
        break;
      case PowerUpType.SCORE_MULTIPLIER:
        game.scoreMultiplier = 2;  // Double the score
        game.powerUpManager.activePowerUps[this.type] = this.duration;
        game.soundManager.playPowerUpSound(this.type);
        break;
      case PowerUpType.MAGNET:
        game.powerUpManager.magnetActive = true;
        game.powerUpManager.activePowerUps[this.type] = this.duration;
        game.soundManager.playPowerUpSound(this.type);
        break;
      case PowerUpType.SHRINK:
        game.snake.shrinkActive = true;
        game.powerUpManager.activePowerUps[this.type] = this.duration;
        game.soundManager.playPowerUpSound(this.type);
        break;
      case PowerUpType.TIME_SLOW:
        // Multiply the current game speed by 0.25 to dramatically slow down movement.
        // (If a speed boost is active, the slowdown applies to that increased speed.)
        game.config.GAME_SPEED = game.config.GAME_SPEED * 0.25;
        game.powerUpManager.activePowerUps[this.type] = this.duration;
        game.soundManager.playPowerUpSound(this.type);
        break;
      default:
        console.warn("Unhandled power-up type in apply():", this.type);
        break;
    }
  }

  // Note: We no longer call this method directly; expiration is handled centrally.
  expire(game) {
    switch (this.type) {
      case PowerUpType.SPEED_BOOST:
        game.config.GAME_SPEED = Math.max(game.config.BASE_GAME_SPEED, game.config.GAME_SPEED - 3);
        break;
      case PowerUpType.INVINCIBILITY:
        game.snake.invincible = false;
        break;
      case PowerUpType.SCORE_MULTIPLIER:
        game.scoreMultiplier = 1;
        break;
      case PowerUpType.MAGNET:
        game.powerUpManager.magnetActive = false;
        break;
      case PowerUpType.SHRINK:
        game.snake.shrinkActive = false;
        break;
      case PowerUpType.TIME_SLOW:
        // When time slow expires, restore the game speed to the base value.
        // (If other speed modifiers are active, a more robust recalculation would be needed.)
        game.config.GAME_SPEED = game.config.BASE_GAME_SPEED;
        break;
      default:
        break;
    }
    delete game.powerUpManager.activePowerUps[this.type];
  }
}

export class PowerUpManager {
  constructor(config) {
    this.config = config;
    this.activePowerUps = {};
    this.powerUps = [];
    this.spawnTimer = 0;
    this.magnetActive = false;
  }

  spawnPowerUp(game) {
    // Limit the number of power-ups on the field
    if (this.powerUps.length >= this.config.POWERUP_COUNT) return;
    
    const types = Object.values(PowerUpType);
    const type = types[Math.floor(Math.random() * types.length)];
    
    let pos;
    let attempts = 0;
    do {
      pos = game.getRandomPosition(true);
      attempts++;
    } while (attempts < 10 && (pos.x === game.foodPos.x && pos.y === game.foodPos.y));
    
    const powerup = new PowerUp(pos.x, pos.y, type, this.config);
    this.powerUps.push(powerup);
  }

  update(game) {
    // Handle power-up spawning
    this.spawnTimer++;
    if (this.spawnTimer >= this.config.POWERUP_SPAWN_INTERVAL) {
      this.spawnPowerUp(game);
      this.spawnTimer = 0;
    }

    // Update active power-ups by decrementing their timers.
    for (let type in this.activePowerUps) {
      this.activePowerUps[type]--;
      if (this.activePowerUps[type] <= 0) {
        this.expirePowerUp(type, game);
      }
    }

    // Check for power-up collection
    const head = game.snake.headPosition();
    this.powerUps = this.powerUps.filter(pu => {
      if (pu.x === head.x && pu.y === head.y) {
        pu.apply(game);
        // Award bonus score for power-up collection.
        game.score += 5 * game.scoreMultiplier;
        const pos = game.renderer.gridToScreen(pu.x, pu.y);
        game.particleSystem.emit(
          pos.x + game.renderer.cellSize / 2,
          pos.y + game.renderer.cellSize / 2,
          this.config.PARTICLE_COUNT,
          "rgba(255,255,0,1)"
        );
        return false;
      }
      return true;
    });
  }

  expirePowerUp(type, game) {
    switch (type) {
      case PowerUpType.SPEED_BOOST:
        game.config.GAME_SPEED = Math.max(game.config.BASE_GAME_SPEED, game.config.GAME_SPEED - 3);
        break;
      case PowerUpType.INVINCIBILITY:
        game.snake.invincible = false;
        break;
      case PowerUpType.SCORE_MULTIPLIER:
        game.scoreMultiplier = 1;
        break;
      case PowerUpType.MAGNET:
        game.powerUpManager.magnetActive = false;
        break;
      case PowerUpType.SHRINK:
        game.snake.shrinkActive = false;
        break;
      case PowerUpType.TIME_SLOW:
        game.config.GAME_SPEED = game.config.BASE_GAME_SPEED;
        break;
      default:
        break;
    }
    delete this.activePowerUps[type];
  }
}
