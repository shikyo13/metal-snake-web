// js/systems/effects.js - New visual effects system for Metal Snake
import { CONFIG } from '../config/constants.js';

export class EffectsSystem {
  constructor(renderer) {
    this.renderer = renderer;
    this.screenShake = { x: 0, y: 0, intensity: 0 };
    this.chromatic = 0;
    this.slowMotion = { active: false, factor: 1 };
    this.ripples = [];
  }

  // Screen shake for impacts
  shake(intensity = 10, duration = 300) {
    this.screenShake.intensity = intensity;
    this.screenShake.duration = duration;
    this.screenShake.startTime = performance.now();
  }

  // Chromatic aberration for power-ups
  chromaticBurst(intensity = 5, duration = 200) {
    this.chromatic = intensity;
    this.chromaticDuration = duration;
    this.chromaticStart = performance.now();
  }

  // Slow motion for dramatic moments
  slowMotion(factor = 0.3, duration = 1000) {
    this.slowMotion = {
      active: true,
      factor,
      duration,
      startTime: performance.now()
    };
  }

  // Ripple effect at position
  createRipple(x, y, color = '#ffffff', maxRadius = 100) {
    this.ripples.push({
      x, y, color,
      radius: 0,
      maxRadius,
      opacity: 1,
      speed: 3
    });
  }

  update() {
    const now = performance.now();

    // Update screen shake
    if (this.screenShake.intensity > 0) {
      const elapsed = now - this.screenShake.startTime;
      const progress = Math.min(elapsed / this.screenShake.duration, 1);
      
      this.screenShake.intensity *= (1 - progress);
      this.screenShake.x = (Math.random() - 0.5) * this.screenShake.intensity;
      this.screenShake.y = (Math.random() - 0.5) * this.screenShake.intensity;
      
      if (progress >= 1) {
        this.screenShake.intensity = 0;
      }
    }

    // Update chromatic aberration
    if (this.chromatic > 0) {
      const elapsed = now - this.chromaticStart;
      const progress = Math.min(elapsed / this.chromaticDuration, 1);
      this.chromatic *= (1 - progress);
    }

    // Update slow motion
    if (this.slowMotion.active) {
      const elapsed = now - this.slowMotion.startTime;
      if (elapsed > this.slowMotion.duration) {
        this.slowMotion.active = false;
        this.slowMotion.factor = 1;
      }
    }

    // Update ripples
    this.ripples = this.ripples.filter(ripple => {
      ripple.radius += ripple.speed;
      ripple.opacity = 1 - (ripple.radius / ripple.maxRadius);
      return ripple.opacity > 0;
    });
  }

  applyToCanvas(ctx) {
    // Apply screen shake
    if (this.screenShake.intensity > 0) {
      ctx.save();
      ctx.translate(this.screenShake.x, this.screenShake.y);
    }

    // Apply chromatic aberration (simplified version)
    if (this.chromatic > 0) {
      ctx.shadowColor = 'red';
      ctx.shadowBlur = this.chromatic;
      ctx.shadowOffsetX = -this.chromatic / 2;
      ctx.globalCompositeOperation = 'screen';
    }
  }

  renderEffects(ctx) {
    // Render ripples
    this.ripples.forEach(ripple => {
      ctx.save();
      ctx.globalAlpha = ripple.opacity;
      ctx.strokeStyle = ripple.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // Reset canvas state
    if (this.screenShake.intensity > 0) {
      ctx.restore();
    }
    if (this.chromatic > 0) {
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  getTimeScale() {
    return this.slowMotion.active ? this.slowMotion.factor : 1;
  }
}

// Trail effect for snake movement
export class SnakeTrail {
  constructor(maxLength = 30) {
    this.positions = [];
    this.maxLength = maxLength;
  }

  addPosition(x, y, color = '#00ff00') {
    this.positions.push({ x, y, color, alpha: 1 });
    if (this.positions.length > this.maxLength) {
      this.positions.shift();
    }
  }

  update() {
    this.positions.forEach((pos, i) => {
      pos.alpha = (i / this.positions.length) * 0.5;
    });
  }

  render(ctx, cellSize) {
    this.positions.forEach((pos, i) => {
      if (i === 0) return;
      
      const prevPos = this.positions[i - 1];
      ctx.save();
      ctx.globalAlpha = pos.alpha;
      ctx.strokeStyle = pos.color;
      ctx.lineWidth = cellSize * 0.3 * (i / this.positions.length);
      ctx.lineCap = 'round';
      
      ctx.beginPath();
      ctx.moveTo(prevPos.x, prevPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
      ctx.restore();
    });
  }
}

// Floating text for score popups
export class FloatingText {
  constructor(x, y, text, color = '#ffffff', size = 24) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.size = size;
    this.velocityY = -2;
    this.alpha = 1;
    this.lifetime = 60;
  }

  update() {
    this.y += this.velocityY;
    this.velocityY *= 0.95;
    this.lifetime--;
    this.alpha = this.lifetime / 60;
    return this.lifetime > 0;
  }

  render(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.font = `${this.size}px 'Press Start 2P'`;
    ctx.textAlign = 'center';
    ctx.fillText(this.text, this.x, this.y);
    ctx.restore();
  }
}

// Particle burst configurations
export const ParticlePresets = {
  FOOD_COLLECT: {
    count: 20,
    speed: 5,
    colors: ['#ff0000', '#ff6600', '#ffff00'],
    gravity: 0.3,
    fadeSpeed: 0.02
  },
  POWERUP_COLLECT: {
    count: 30,
    speed: 8,
    colors: ['#00ffff', '#ff00ff', '#ffff00'],
    gravity: 0.1,
    fadeSpeed: 0.015
  },
  DEATH_EXPLOSION: {
    count: 50,
    speed: 10,
    colors: ['#ff0000', '#ff6600', '#ffffff'],
    gravity: 0.5,
    fadeSpeed: 0.01
  },
  COMBO_BURST: {
    count: 15,
    speed: 6,
    colors: ['#ffff00', '#ffd700', '#ffa500'],
    gravity: -0.2, // Float upward
    fadeSpeed: 0.02
  }
};