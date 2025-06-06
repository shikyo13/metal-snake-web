// js/core/renderer.js
import { Direction, PowerUpType } from '../config/constants.js';

// Debug flag to enable visual debugging features
const DEBUG = false;

export class Renderer {
  constructor(canvas, config, assetLoader) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.config = config;
    this.assetLoader = assetLoader;
    this.cellSize = config.BASE_CELL_SIZE;
    this.xOffset = 0;
    this.yOffset = 0;

    // Create auxiliary canvases for performance optimization
    this.bgCanvas = document.createElement('canvas');
    this.bgCtx = this.bgCanvas.getContext('2d');

    this.noiseCanvas = document.createElement('canvas');
    this.noiseCtx = this.noiseCanvas.getContext('2d');

    this.offscreenBackground = document.createElement('canvas');
    this.offscreenBackgroundCtx = this.offscreenBackground.getContext('2d');

    // Initialize visual effects
    this.createGradients();
    this.generateNoiseTexture();

    if (DEBUG) console.log('Renderer initialized with config:', config);
  }

  resize(width, height) {
    // Resize all canvases
    this.canvas.width = width;
    this.canvas.height = height;
    this.bgCanvas.width = width;
    this.bgCanvas.height = height;
    this.noiseCanvas.width = width;
    this.noiseCanvas.height = height;
    this.offscreenBackground.width = width;
    this.offscreenBackground.height = height;

    // Calculate game dimensions
    this.cellSize = Math.min(
      Math.floor(width / this.config.GRID_COLS),
      Math.floor(height / this.config.GRID_ROWS)
    );
    this.xOffset = Math.floor((width - this.cellSize * this.config.GRID_COLS) / 2);
    this.yOffset = Math.floor((height - this.cellSize * this.config.GRID_ROWS) / 2);

    this.createGradients();
    this.generateNoiseTexture();
    this.updateOffscreenBackground();

    if (DEBUG) {
      console.log('Renderer resized:', {
        width,
        height,
        cellSize: this.cellSize,
        xOffset: this.xOffset,
        yOffset: this.yOffset
      });
    }
  }

  updateOffscreenBackground() {
    const ctx = this.offscreenBackgroundCtx;
    const width = this.offscreenBackground.width;
    const height = this.offscreenBackground.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw either loaded background image or gradient
    if (this.assetLoader?.images?.['background']) {
      ctx.drawImage(this.assetLoader.images['background'], 0, 0, width, height);
    } else {
      ctx.fillStyle = this.backgroundGradient;
      ctx.fillRect(0, 0, width, height);
    }
  }

  createGradients() {
    this.backgroundGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    
    // Use configured colors or fallback to defaults
    const darkColor = this.config.COLORS.BACKGROUND_DARK || '#1a002a';
    const midColor = this.config.COLORS.BACKGROUND_MID || '#0d192b';
    const lightColor = this.config.COLORS.BACKGROUND_LIGHT || '#001a1a';

    this.backgroundGradient.addColorStop(0, darkColor);
    this.backgroundGradient.addColorStop(0.5, midColor);
    this.backgroundGradient.addColorStop(1, lightColor);
  }

  generateNoiseTexture() {
    const imageData = this.noiseCtx.createImageData(this.noiseCanvas.width, this.noiseCanvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255;
      data[i] = data[i + 1] = data[i + 2] = value;
      data[i + 3] = 15;  // Semi-transparent noise
    }
    
    this.noiseCtx.putImageData(imageData, 0, 0);
  }

  clear() {
    this.ctx.fillStyle = this.config.COLORS.BLACK;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawAnimatedBackground(frameCount) {
    // Draw the cached background
    this.ctx.drawImage(this.offscreenBackground, 0, 0);
    
    // Add darkening overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Add animated noise effect
    this.ctx.save();
    this.ctx.globalCompositeOperation = 'overlay';
    this.ctx.globalAlpha = 0.1;
    this.ctx.translate(
      Math.sin(frameCount * 0.01) * 10,
      Math.cos(frameCount * 0.01) * 10
    );
    this.ctx.drawImage(this.noiseCanvas, 0, 0);
    this.ctx.restore();
    
    this.drawGrid();
  }

  drawGrid() {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;

    // Draw vertical grid lines
    for (let x = 0; x <= this.config.GRID_COLS; x++) {
      const xPos = this.xOffset + x * this.cellSize;
      this.ctx.beginPath();
      this.ctx.moveTo(xPos, this.yOffset);
      this.ctx.lineTo(xPos, this.yOffset + this.config.GRID_ROWS * this.cellSize);
      this.ctx.stroke();
    }

    // Draw horizontal grid lines
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
      const effectiveSize = snake.shrinkActive ? snake.size * 0.5 : snake.size;
      const baseRadius = (this.cellSize / 2 - 2) * pulse * effectiveSize;

      // Create glowing gradient effect
      const gradient = this.ctx.createRadialGradient(
        pos.x + this.cellSize / 2,
        pos.y + this.cellSize / 2,
        0,
        pos.x + this.cellSize / 2,
        pos.y + this.cellSize / 2,
        baseRadius * 1.5
      );

      // Set colors based on snake state
      if (isHead) {
        gradient.addColorStop(0, snake.invincible ? '#50ffff' : '#50ff50');
        gradient.addColorStop(0.6, snake.invincible ? '#30aaaa' : '#30aa30');
      } else {
        gradient.addColorStop(0, snake.invincible ? '#40c0c0' : '#40c040');
        gradient.addColorStop(0.6, snake.invincible ? '#208080' : '#208020');
      }
      gradient.addColorStop(1, 'transparent');

      // Draw snake segment with glow
      this.ctx.save();
      this.ctx.shadowColor = snake.invincible ? '#50ffff' : '#50ff50';
      this.ctx.shadowBlur = 15;
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(
        pos.x + this.cellSize / 2,
        pos.y + this.cellSize / 2,
        baseRadius,
        0,
        Math.PI * 2
      );
      this.ctx.fill();
      this.ctx.restore();

      // Draw eyes on head segment
      if (isHead) {
        this.drawSnakeEyes(pos, snake.direction, baseRadius);
      }
    });
  }

  drawSnakeEyes(pos, direction, baseRadius) {
    const eyeRadius = baseRadius * 0.2;
    const eyeOffset = baseRadius * 0.4;
    let leftEyeX, leftEyeY, rightEyeX, rightEyeY;

    // Position eyes based on snake direction
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

    // Draw eyes with glow effect
    this.ctx.save();
    this.ctx.shadowColor = '#ffffff';
    this.ctx.shadowBlur = 5;
    this.ctx.fillStyle = '#ffffff';
    
    // Left eye
    this.ctx.beginPath();
    this.ctx.arc(leftEyeX, leftEyeY, eyeRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    // Right eye
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

    // Draw magnet attraction field if active
    if (attractionRadius > 0) {
      const fieldGradient = this.ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, attractionRadius * this.cellSize
      );
      fieldGradient.addColorStop(0, 'rgba(255, 255, 0, 0.2)');
      fieldGradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = fieldGradient;
      this.ctx.beginPath();
      this.ctx.arc(centerX, centerY, attractionRadius * this.cellSize, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Draw food with glow effect
    this.ctx.save();
    this.ctx.shadowColor = '#ff3030';
    this.ctx.shadowBlur = 20;
    const gradient = this.ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, baseRadius
    );
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
    if (DEBUG) {
      console.log('Drawing power-up:', {
        type: powerUp.type,
        position: { x: powerUp.x, y: powerUp.y }
      });
    }

    const pos = this.gridToScreen(powerUp.x, powerUp.y);
    const centerX = pos.x + this.cellSize / 2;
    const centerY = pos.y + this.cellSize / 2;

    // Add debug rectangle to verify positioning
    if (DEBUG) {
      this.ctx.save();
      this.ctx.strokeStyle = 'red';
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(pos.x, pos.y, this.cellSize, this.cellSize);
      this.ctx.restore();
    }

    // Apply floating animation
    const floatOffset = Math.sin(frameCount * 0.05) * 5;
    const pulse = 1 + 0.15 * Math.sin(frameCount * 0.1);
    const baseRadius = (this.cellSize / 2 - 2) * pulse;

    // Get power-up specific color from config
    const colors = {
      speed_boost: this.config.COLORS.YELLOW,
      invincibility: this.config.COLORS.CYAN,
      score_multiplier: this.config.COLORS.MAGENTA,
      magnet: this.config.COLORS.GREEN,
      shrink: this.config.COLORS.ORANGE,
      time_slow: this.config.COLORS.PURPLE
    };
    const color = colors[powerUp.type] || this.config.COLORS.WHITE;

    // Create glowing effect for power-up
    this.ctx.save();
    this.ctx.shadowColor = color;
    this.ctx.shadowBlur = 15;

    // Create radial gradient for power-up body
    const gradient = this.ctx.createRadialGradient(
      centerX,
      centerY - floatOffset,
      0,
      centerX,
      centerY - floatOffset,
      baseRadius
    );
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.6, this.adjustColor(color, -30)); // Darker version of the same color
    gradient.addColorStop(1, 'transparent');

    // Draw the power-up with a glow effect
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(
      centerX,
      centerY - floatOffset,
      baseRadius,
      0,
      Math.PI * 2
    );
    this.ctx.fill();

    // Add debug indicators if debug mode is enabled
    if (DEBUG) {
      // Draw crosshair at center point
      this.ctx.beginPath();
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 1;
      this.ctx.moveTo(centerX - 5, centerY);
      this.ctx.lineTo(centerX + 5, centerY);
      this.ctx.moveTo(centerX, centerY - 5);
      this.ctx.lineTo(centerX, centerY + 5);
      this.ctx.stroke();

      // Draw power-up type label
      this.ctx.fillStyle = 'white';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(powerUp.type, centerX, centerY + baseRadius + 15);
    }

    this.ctx.restore();
  }

  drawText(text, x, y, size = 24, color = '#ffffff', center = false, glow = false) {
    this.ctx.save();
    this.ctx.font = `${size}px 'Press Start 2P', monospace`;
    this.ctx.fillStyle = color;
    this.ctx.textAlign = center ? "center" : "left";
    
    // Add glow effect if requested
    if (glow) {
      this.ctx.shadowColor = color;
      this.ctx.shadowBlur = 10;
    }
    
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  drawAchievementNotification(notification) {
    const padding = 20;
    const width = 300;
    const height = 80;
    const x = this.canvas.width - width - padding;
    const y = padding + (notification.index || 0) * (height + 10);

    // Draw notification background with glow effect
    this.ctx.save();
    this.ctx.shadowColor = this.config.COLORS.GOLD;
    this.ctx.shadowBlur = 15;
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    this.ctx.strokeStyle = this.config.COLORS.GOLD;
    this.ctx.lineWidth = 2;
    
    // Draw rounded rectangle for notification
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, 10);
    this.ctx.fill();
    this.ctx.stroke();
    
    // Draw notification content
    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = this.config.COLORS.GOLD;
    this.ctx.font = "16px 'Press Start 2P'";
    this.ctx.fillText(notification.text, x + 15, y + 30);
    
    // Draw description if present
    if (notification.description) {
        this.ctx.font = "12px 'Press Start 2P'";
        this.ctx.fillStyle = this.config.COLORS.WHITE;
        this.ctx.fillText(notification.description, x + 15, y + 55);
    }
    
    // Draw fade effect based on remaining duration
    const fadeAlpha = Math.min(1, notification.duration / 30);
    this.ctx.globalAlpha = fadeAlpha;
    
    this.ctx.restore();
  }
  
  drawUI(game) {
    // Draw basic game info
    this.drawText(`Score: ${game.score}`, 10 + this.xOffset, 30 + this.yOffset);
    this.drawText(
        `Multiplier: x${game.scoreMultiplier.toFixed(1)}`,
        10 + this.xOffset,
        60 + this.yOffset,
        24,
        this.config.COLORS.MAGENTA
    );

    // Draw combo counter if active
    if (game.comboSystem.comboCount > 0) {
        this.drawText(
            `Combo: x${game.comboSystem.getComboMultiplier().toFixed(1)}`,
            10 + this.xOffset,
            90 + this.yOffset,
            24,
            this.config.COLORS.YELLOW
        );
    }

    // Draw notifications with improved visibility
    game.notifications.forEach((notification, index) => {
        if (notification.text.includes('Achievement Unlocked')) {
            notification.index = index;
            this.drawAchievementNotification(notification);
        } else {
            const alpha = Math.min(1, notification.duration / 60);
            this.drawText(
                notification.text,
                this.canvas.width / 2,
                120 + (index * 30),
                24,
                `rgba(${notification.color}, ${alpha})`,
                true
            );
        }
    });
  }

  
  gridToScreen(x, y) {
    // Convert grid coordinates to screen pixels
    return {
      x: x * this.cellSize + this.xOffset,
      y: y * this.cellSize + this.yOffset
    };
  }

  drawOverlay(alpha = 0.5) {
    // Draw semi-transparent overlay
    this.ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawMenu(game) {
    // Draw animated background with overlay
    this.drawAnimatedBackground(game.frameCount);
    this.drawOverlay(0.5);

    // Draw game title
    this.drawText(
      "METAL SNAKE",
      this.canvas.width / 2,
      this.canvas.height / 2 - 100,
      48,
      this.config.COLORS.WHITE,
      true,
      true
    );

    // Draw menu options
    const menuItems = [
      "[P] Play Game",
      "[H] Highscores",
      `[O] Obstacles: ${game.obstaclesEnabled ? "ON" : "OFF"}`,
      "[S] Settings"
    ];

    menuItems.forEach((item, index) => {
      this.drawText(
        item,
        this.canvas.width / 2,
        this.canvas.height / 2 - 20 + (index * 40),
        24,
        this.config.COLORS.WHITE,
        true
      );
    });
  }

  drawParticles(particles) {
    particles.forEach(particle => {
      // Calculate particle properties
      const alpha = particle.life / particle.config.PARTICLE_LIFETIME;
      const radius = Math.max(1, particle.life / 6);

      // Create particle gradient
      const gradient = this.ctx.createRadialGradient(
        particle.x, particle.y,
        0,
        particle.x, particle.y,
        radius
      );

      // Handle different color formats
      let colorString;
      if (particle.color.startsWith("rgba(")) {
        const match = particle.color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d\.]+\)/);
        if (match) {
          const [, r, g, b] = match;
          colorString = `rgba(${r},${g},${b},${alpha})`;
        } else {
          colorString = particle.color;
        }
      } else {
        colorString = `rgba(${particle.color}, ${alpha})`;
      }

      // Apply gradient colors
      gradient.addColorStop(0, colorString);
      gradient.addColorStop(1, 'transparent');

      // Draw particle
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
      this.ctx.fill();
    });
  }

  drawActivePowerupsStatus(activePowerUps, fps) {
    // Calculate position for power-up status display
    const horizontalMargin = 10;
    let x = this.canvas.width - (horizontalMargin + this.xOffset);
    let y = 30 + this.yOffset;
    
    const iconRadius = 12;
    const barWidth = 40;
    const barHeight = 5;
    
    this.ctx.save();
    this.ctx.textAlign = "right";
    this.ctx.font = "16px 'Press Start 2P', monospace";
    
    Object.entries(activePowerUps).forEach(([type, remaining]) => {
      const secondsRemaining = (remaining / fps).toFixed(1);
      
      // Get power-up color
      const colors = {
        speed_boost: this.config.COLORS.YELLOW,
        invincibility: this.config.COLORS.CYAN,
        score_multiplier: this.config.COLORS.MAGENTA,
        magnet: this.config.COLORS.GREEN,
        shrink: this.config.COLORS.ORANGE,
        time_slow: this.config.COLORS.PURPLE
      };
      const color = colors[type] || this.config.COLORS.WHITE;

      // Format power-up name
      const formattedName = type.split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      // Draw power-up icon
      this.ctx.save();
      const iconGradient = this.ctx.createRadialGradient(
        x - iconRadius, y + iconRadius,
        iconRadius * 0.3,
        x - iconRadius, y + iconRadius,
        iconRadius
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
      
      // Draw power-up name and timer
      this.ctx.fillStyle = color;
      this.ctx.fillText(formattedName, x - iconRadius - 5, y + iconRadius - 10);
      this.ctx.fillText(`${secondsRemaining}s`, x - iconRadius - 5, y + iconRadius + 5);
      
      // Draw timer bar
      const fullDuration = this.config.POWERUP_DURATION;
      const fraction = remaining / fullDuration;
      const currentBarWidth = barWidth * fraction;
      
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(
        x - iconRadius - currentBarWidth / 2,
        y + iconRadius + 10,
        barWidth,
        barHeight
      );
      
      this.ctx.fillStyle = color;
      this.ctx.fillRect(
        x - iconRadius - currentBarWidth / 2,
        y + iconRadius + 10,
        currentBarWidth,
        barHeight
      );
      
      // Move to next power-up position
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