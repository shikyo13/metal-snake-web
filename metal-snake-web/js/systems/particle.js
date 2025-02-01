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
  }

  emit(x, y, count, color) {
    // Create specified number of particles
    for (let i = 0; i < count; i++) {
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
      
      // Return dead particles to pool for reuse
      if (!alive) {
        this.particlePool.push(particle);
      }
      
      return alive;
    });
  }
}