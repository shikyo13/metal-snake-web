// js/core/renderer.js
import { Direction } from '../config/constants.js';

export class Renderer {
  constructor(canvas, config, assetLoader) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.config = config;
    this.assetLoader = assetLoader; // Used for background image
    this.cellSize = config.BASE_CELL_SIZE;
    this.xOffset = 0;
    this.yOffset = 0;

    // Auxiliary canvases for performance optimization
    this.bgCanvas = document.createElement('canvas');
    this.bgCtx = this.bgCanvas.getContext('2d');

    this.noiseCanvas = document.createElement('canvas');
    this.noiseCtx = this.noiseCanvas.getContext('2d');

    // Offscreen canvas to cache the static background
    this.offscreenBackground = document.createElement('canvas');
    this.offscreenBackgroundCtx = this.offscreenBackground.getContext('2d');

    this.createGradients();
    this.generateNoiseTexture();
  }

  resize(width, height) {
    // Resize main and auxiliary canvases
    this.canvas.width = width;
    this.canvas.height = height;
    this.bgCanvas.width = width;
    this.bgCanvas.height = height;
    this.noiseCanvas.width = width;
    this.noiseCanvas.height = height;
    this.offscreenBackground.width = width;
    this.offscreenBackground.height = height;

    // Recalculate game dimensions
    this.cellSize = Math.min(
      Math.floor(width / this.config.GRID_COLS),
      Math.floor(height / this.config.GRID_ROWS)
    );
    this.xOffset = Math.floor((width - this.cellSize * this.config.GRID_COLS) / 2);
    this.yOffset = Math.floor((height - this.cellSize * this.config.GRID_ROWS) / 2);

    this.createGradients();
    this.generateNoiseTexture();
    this.updateOffscreenBackground();
  }

  updateOffscreenBackground() {
    const ctx = this.offscreenBackgroundCtx;
    const width = this.offscreenBackground.width;
    const height = this.offscreenBackground.height;
    ctx.clearRect(0, 0, width, height);
    if (this.assetLoader && this.assetLoader.images && this.assetLoader.images['background']) {
      ctx.drawImage(this.assetLoader.images['background'], 0, 0, width, height);
    } else {
      ctx.fillStyle = this.backgroundGradient;
      ctx.fillRect(0, 0, width, height);
    }
  }

  createGradients() {
    this.backgroundGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    if (!this.config.COLORS.BACKGROUND_DARK ||
        !this.config.COLORS.BACKGROUND_MID ||
        !this.config.COLORS.BACKGROUND_LIGHT) {
      this.backgroundGradient.addColorStop(0, '#1a002a');
      this.backgroundGradient.addColorStop(0.5, '#0d192b');
      this.backgroundGradient.addColorStop(1, '#001a1a');
    } else {
      this.backgroundGradient.addColorStop(0, this.config.COLORS.BACKGROUND_DARK);
      this.backgroundGradient.addColorStop(0.5, this.config.COLORS.BACKGROUND_MID);
      this.backgroundGradient.addColorStop(1, this.config.COLORS.BACKGROUND_LIGHT);
    }
  }

  generateNoiseTexture() {
    const imageData = this.noiseCtx.createImageData(this.noiseCanvas.width, this.noiseCanvas.height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 15;
    }
    this.noiseCtx.putImageData(imageData, 0, 0);
  }

  clear() {
    this.ctx.fillStyle = this.config.COLORS.BLACK;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawAnimatedBackground(frameCount) {
    this.ctx.drawImage(this.offscreenBackground, 0, 0);
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'overlay';
    this.ctx.globalAlpha = 0.1;
    this.ctx.translate(Math.sin(frameCount * 0.01) * 10, Math.cos(frameCount * 0.01) * 10);
    this.ctx.drawImage(this.noiseCanvas, 0, 0);
    this.ctx.restore();
    this.drawGrid();
  }

  drawGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    for (let x = 0; x <= this.config.GRID_COLS; x++) {
      const xPos = this.xOffset + x * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(xPos, this.yOffset);
      this.ctx.lineTo(xPos, this.yOffset + this.config.GRID_ROWS * this.cellSize);
      this.ctx.stroke();
    }
    for (let y = 0; y <= this.config.GRID_ROWS; y++) {
      const yPos = this.yOffset + y * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(this.xOffset, yPos);
      this.ctx.lineTo(this.xOffset + this.config.GRID_COLS * this.cellSize, yPos);
      this.ctx.stroke();
    }
  }

  drawSnake(snake, frameCount) {
    snake.body.forEach((segment, index) => {
      const pos = this.gridToScreen(segment.x, segment.y);
      const isHead = index === 0;
      const pulse = 1 + 0.1 * Math.sin(frameCount * 0.1 + index * 0.2);
      // If shrink is active, reduce the snake’s effective size.
      const effectiveSize = snake.shrinkActive ? snake.size * 0.5 : snake.size;
      const baseRadius = (this.cellSize / 2 - 2) * pulse * effectiveSize;

      const gradient = this.ctx.createRadialGradient(
        pos.x + this.cellSize / 2,
        pos.y + this.cellSize / 2,
        0,
        pos.x + this.cellSize / 2,
        pos.y + this.cellSize / 2,
        baseRadius * 1.5
      );
      if (isHead) {
        gradient.addColorStop(0, snake.invincible ? '#50ffff' : '#50ff50');
        gradient.addColorStop(0.6, snake.invincible ? '#30aaaa' : '#30aa30');
      } else {
        gradient.addColorStop(0, snake.invincible ? '#40c0c0' : '#40c040');
        gradient.addColorStop(0.6, snake.invincible ? '#208080' : '#208020');
      }
      gradient.addColorStop(1, 'transparent');

      this.ctx.save();
      this.ctx.shadowColor = snake.invincible ? '#50ffff' : '#50ff50';
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(pos.x + this.cellSize / 2, pos.y + this.cellSize / 2, baseRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      if (isHead) {
        this.drawSnakeEyes(pos, snake.direction, baseRadius);
      }
    });
  }

  drawSnakeEyes(pos, direction, baseRadius) {
    const eyeRadius = baseRadius * 0.2;
    const eyeOffset = baseRadius * 0.4;
    let leftEyeX, leftEyeY, rightEyeX, rightEyeY;
    switch (direction) {
      case Direction.UP:
        leftEyeX = pos.x + this.cellSize / 2 - eyeOffset;
        rightEyeX = pos.x + this.cellSize / 2 + eyeOffset;
        leftEyeY = rightEyeY = pos.y + this.cellSize / 2 - eyeOffset;
        break;
      case Direction.DOWN:
        leftEyeX = pos.x + this.cellSize / 2 - eyeOffset;
        rightEyeX = pos.x + this.cellSize / 2 + eyeOffset;
        leftEyeY = rightEyeY = pos.y + this.cellSize / 2 + eyeOffset;
        break;
      case Direction.LEFT:
        leftEyeX = rightEyeX = pos.x + this.cellSize / 2 - eyeOffset;
        leftEyeY = pos.y + this.cellSize / 2 - eyeOffset;
        rightEyeY = pos.y + this.cellSize / 2 + eyeOffset;
        break;
      case Direction.RIGHT:
        leftEyeX = rightEyeX = pos.x + this.cellSize / 2 + eyeOffset;
        leftEyeY = pos.y + this.cellSize / 2 - eyeOffset;
        rightEyeY = pos.y + this.cellSize / 2 + eyeOffset;
        break;
    }
    this.ctx.save();
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 5;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(rightEyeX, rightEyeY, eyeRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawFood(foodPos, frameCount, attractionRadius = 0) {
    const pos = this.gridToScreen(foodPos.x, foodPos.y);
    const centerX = pos.x + this.cellSize / 2;
    const centerY = pos.y + this.cellSize / 2;
    const pulse = 1 + 0.15 * Math.sin(frameCount * 0.1);
    const baseRadius = (this.cellSize / 2 - 2) * pulse;

    if (attractionRadius > 0) {
      const fieldGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, attractionRadius * this.cellSize);
      fieldGradient.addColorStop(0, 'rgba(255, 255, 0, 0.2)');
      fieldGradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = fieldGradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, attractionRadius * this.cellSize, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.save();
    this.ctx.shadowColor = '#ff3030';
    this.ctx.shadowBlur = 20;
    const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
    gradient.addColorStop(0, '#ff5050');
    gradient.addColorStop(0.6, '#ff0000');
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawPowerUp(powerUp, frameCount) {
    // Draw power-up visuals similar to the food.
    const pos = this.gridToScreen(powerUp.x, powerUp.y);
    const centerX = pos.x + this.cellSize / 2;
    const centerY = pos.y + this.cellSize / 2;
    const floatOffset = Math.sin(frameCount * 0.05) * 5;
    const pulse = 1 + 0.15 * Math.sin(frameCount * 0.1);
    const baseRadius = (this.cellSize / 2 - 2) * pulse;
    const colors = {
      speed_boost: this.config.COLORS.YELLOW,
      invincibility: this.config.COLORS.CYAN,
      score_multiplier: this.config.COLORS.MAGENTA,
      magnet: this.config.COLORS.GREEN,
      shrink: this.config.COLORS.ORANGE,
      time_slow: this.config.COLORS.PURPLE
    };
    const color = colors[powerUp.type] || this.config.COLORS.WHITE;
    
    this.ctx.save();
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 15;
    const gradient = this.ctx.createRadialGradient(centerX, centerY - floatOffset, 0, centerX, centerY - floatOffset, baseRadius);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.6, this.adjustColor(color, -30));
    gradient.addColorStop(1, 'transparent');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(centerX, centerY - floatOffset, baseRadius, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.restore();
  }

  drawText(text, x, y, size = 24, color = '#ffffff', center = false, glow = false) {
    this.ctx.save();
    this.ctx.font = `${size}px 'Press Start 2P', monospace`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = center ? "center" : "left";
    if (glow) {
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10;
    }
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  drawUI(game) {
    // Display the score at the top left
    this.drawText(`Score: ${game.score}`, 10 + this.xOffset, 30 + this.yOffset);
    // Display the score multiplier just below the score.
    this.drawText(`Multiplier: x${game.scoreMultiplier.toFixed(1)}`, 10 + this.xOffset, 60 + this.yOffset, 24, this.config.COLORS.MAGENTA);
    // Display combo info (if any) below that.
    if (game.comboSystem.comboCount > 0) {
      this.drawText(`Combo: x${game.comboSystem.getComboMultiplier().toFixed(1)}`, 10 + this.xOffset, 90 + this.yOffset, 24, this.config.COLORS.YELLOW);
    }
    // Draw notifications (score popups, etc.)
    game.notifications.forEach((notification, index) => {
      const alpha = Math.min(1, notification.duration / 60);
      this.drawText(notification.text, this.canvas.width / 2, 120 + (index * 30), 24, `rgba(${notification.color}, ${alpha})`, true);
    });
  }

  gridToScreen(x, y) {
    return {
      x: x * this.cellSize + this.xOffset,
      y: y * this.cellSize + this.yOffset
    };
  }

  drawOverlay(alpha = 0.5) {
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawMenu(game) {
    this.drawAnimatedBackground(game.frameCount);
    this.drawOverlay(0.5);
    this.drawText("METAL SNAKE", this.canvas.width / 2, this.canvas.height / 2 - 100, 48, this.config.COLORS.WHITE, true, true);
    const menuItems = [
      "[P] Play Game",
      "[H] Highscores",
      `[O] Obstacles: ${game.obstaclesEnabled ? "ON" : "OFF"}`,
      "[S] Settings"
    ];
    menuItems.forEach((item, index) => {
      this.drawText(item, this.canvas.width / 2, this.canvas.height / 2 - 20 + (index * 40), 24, this.config.COLORS.WHITE, true);
    });
  }

  drawParticles(particles) {
    particles.forEach(particle => {
      const alpha = particle.life / particle.config.PARTICLE_LIFETIME;
      const radius = Math.max(1, particle.life / 6);
      const gradient = this.ctx.createRadialGradient(particle.x, particle.y, 0, particle.x, particle.y, radius);
      let colorString;
      if (particle.color.startsWith("rgba(")) {
        const match = particle.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/);
        if (match) {
          const r = match[1], g = match[2], b = match[3];
          colorString = `rgba(${r},${g},${b},${alpha})`;
        } else {
          colorString = particle.color;
        }
      } else {
        colorString = `rgba(${particle.color}, ${alpha})`;
      }
      gradient.addColorStop(0, colorString);
      gradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawActivePowerupsStatus(activePowerUps, fps) {
    // Instead of a fixed margin value, align the display with the score.
    // Score is drawn at x = 10 + this.xOffset and y = 30 + this.yOffset.
    const horizontalMargin = 10;  // Same as used for score text
    let x = this.canvas.width - (horizontalMargin + this.xOffset);
    let y = 30 + this.yOffset;    // Align with the score's y-coordinate
    
    const iconRadius = 12;
    const barWidth = 40; // Maximum width of the timer bar
    const barHeight = 5; // Height of the timer bar
    
    this.ctx.save();
    this.ctx.textAlign = "right";
    this.ctx.font = "16px 'Press Start 2P', monospace";
    
    Object.entries(activePowerUps).forEach(([type, remaining]) => {
      const secondsRemaining = (remaining / fps).toFixed(1);
      const colors = {
        speed_boost: this.config.COLORS.YELLOW,
        invincibility: this.config.COLORS.CYAN,
        score_multiplier: this.config.COLORS.MAGENTA,
        magnet: this.config.COLORS.GREEN,
        shrink: this.config.COLORS.ORANGE,
        time_slow: this.config.COLORS.PURPLE
      };
      const color = colors[type] || this.config.COLORS.WHITE;
      // Format the power-up name for display (e.g., "speed_boost" → "Speed Boost")
      const formattedName = type.split('_')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ');
      
      // Draw the circular icon
      this.ctx.save();
      const iconGradient = this.ctx.createRadialGradient(
        x - iconRadius, y + iconRadius, iconRadius * 0.3,
        x - iconRadius, y + iconRadius, iconRadius
      );
      iconGradient.addColorStop(0, color);
      iconGradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = iconGradient;
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10;
      this.ctx.beginPath();
      this.ctx.arc(x - iconRadius, y + iconRadius, iconRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();
  
      // Draw the power-up name above the icon
      this.ctx.fillStyle = color;
      this.ctx.fillText(formattedName, x - iconRadius - 5, y + iconRadius - 10);
  
      // Draw the remaining time (in seconds) next to the icon
      this.ctx.fillText(`${secondsRemaining}s`, x - iconRadius - 5, y + iconRadius + 5);
  
      // Draw the timer bar beneath the icon.
      const fullDuration = this.config.POWERUP_DURATION;
      const fraction = remaining / fullDuration;
      const currentBarWidth = barWidth * fraction;
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(x - iconRadius - currentBarWidth / 2, y + iconRadius + 10, barWidth, barHeight);
      this.ctx.fillStyle = color;
      this.ctx.fillRect(x - iconRadius - currentBarWidth / 2, y + iconRadius + 10, currentBarWidth, barHeight);
  
      // Increment y for the next active power-up display.
      y += iconRadius * 2 + 15;
    });
    
    this.ctx.restore();
  }



  adjustColor(color, amount) {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }
}
