import { UI_CONFIG } from '../config/constants.js';

// The Particle class represents a single particle in the effect system
export class Particle {
  constructor(x, y, color, config) {
    this.config = config;
    this.color = color;
    this.reset(x, y);
  }

  reset(x, y) {
    // Set starting position
    this.x = x;
    this.y = y;
    
    // Calculate random velocity for organic movement
    const angle = Math.random() * Math.PI * 2; // Random direction
    const speed = Math.random() * this.config.PARTICLE_SPEED + 
                 this.config.PARTICLE_SPEED * 0.5; // Variable speed
    
    // Convert angle and speed to velocity components
    this.dx = Math.cos(angle) * speed;
    this.dy = Math.sin(angle) * speed;
    
    // Set particle lifetime
    this.life = this.config.PARTICLE_LIFETIME;
  }

  update() {
    // Update position based on velocity
    this.x += this.dx;
    
    // Add gravity effect
    this.dy += 0.1;
    this.y += this.dy;
    
    // Decrease lifetime
    this.life--;
    
    // Return whether particle is still alive
    return this.life > 0;
  }
}

// The ParticleSystem manages groups of particles and handles object pooling
export class ParticleSystem {
  constructor(config) {
    this.config = config;
    this.particles = [];      // Active particles
    this.particlePool = [];   // Recycled particles pool for efficiency
    this.maxPoolSize = UI_CONFIG.PARTICLE_POOL_SIZE || 100;
    this.maxActiveParticles = UI_CONFIG.MAX_ACTIVE_PARTICLES || 200;
  }

  emit(x, y, count, color) {
    // Limit total active particles to prevent memory issues
    const availableSlots = Math.max(0, this.maxActiveParticles - this.particles.length);
    const actualCount = Math.min(count, availableSlots);
    
    if (actualCount === 0) {
      if (this.config.DEBUG) {
        console.warn('Particle limit reached, skipping emission');
      }
      return;
    }
    
    // Create specified number of particles
    for (let i = 0; i < actualCount; i++) {
      let particle;
      
      // Reuse particle from pool if available
      if (this.particlePool.length > 0) {
        particle = this.particlePool.pop();
        particle.color = color;
        particle.reset(x, y);
      } else {
        // Create new particle if pool is empty
        particle = new Particle(x, y, color, this.config);
      }
      
      this.particles.push(particle);
    }
  }

  update() {
    // Update and filter particles in one pass
    this.particles = this.particles.filter(particle => {
      const alive = particle.update();
      
      // Return dead particles to pool for reuse (if pool isn't full)
      if (!alive && this.particlePool.length < this.maxPoolSize) {
        this.particlePool.push(particle);
      }
      
      return alive;
    });
    
    // Clean up if we have too many particles
    this.cleanup();
  }
  
  cleanup() {
    // Remove oldest particles if over limit
    if (this.particles.length > this.maxActiveParticles) {
      const toRemove = this.particles.length - this.maxActiveParticles;
      this.particles.splice(0, toRemove);
    }
    
    // Trim pool if it's too large
    if (this.particlePool.length > this.maxPoolSize) {
      this.particlePool.length = this.maxPoolSize;
    }
  }
}