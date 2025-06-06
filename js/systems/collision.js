// Collision detection system for unified collision checking
export class CollisionSystem {
  constructor(config) {
    this.config = config;
  }
  
  // Check if a position collides with any segment of the snake
  checkSnakeCollision(position, snake) {
    return snake.body.some(seg => seg.x === position.x && seg.y === position.y);
  }
  
  // Check if a position collides with any obstacle
  checkObstacleCollision(position, obstacles) {
    return obstacles.some(ob => ob.x === position.x && ob.y === position.y);
  }
  
  // Check if a position collides with any power-up
  checkPowerUpCollision(position, powerUps) {
    return powerUps.some(pu => pu.x === position.x && pu.y === position.y);
  }
  
  // Check if a position collides with food
  checkFoodCollision(position, foodPos) {
    return foodPos && position.x === foodPos.x && position.y === foodPos.y;
  }
  
  // Check if a position is outside game bounds
  checkBoundsCollision(position) {
    return position.x < 0 || position.x >= this.config.GRID_COLS ||
           position.y < 0 || position.y >= this.config.GRID_ROWS;
  }
  
  // Check all collisions at once
  checkAllCollisions(position, game) {
    return {
      snake: this.checkSnakeCollision(position, game.snake),
      obstacle: game.obstacles ? this.checkObstacleCollision(position, game.obstacles) : false,
      powerUp: game.powerUpManager ? this.checkPowerUpCollision(position, game.powerUpManager.powerUps) : false,
      food: this.checkFoodCollision(position, game.foodPos),
      bounds: this.checkBoundsCollision(position)
    };
  }
  
  // Check if a position is valid (no collisions)
  isValidPosition(position, game, options = {}) {
    const { excludeFood = false, excludePowerUps = false } = options;
    
    if (this.checkSnakeCollision(position, game.snake)) return false;
    if (this.checkBoundsCollision(position)) return false;
    if (game.obstacles && this.checkObstacleCollision(position, game.obstacles)) return false;
    if (!excludeFood && this.checkFoodCollision(position, game.foodPos)) return false;
    if (!excludePowerUps && game.powerUpManager && this.checkPowerUpCollision(position, game.powerUpManager.powerUps)) return false;
    
    return true;
  }
  
  // Find a valid random position (replaces getRandomPosition in game.js)
  findValidPosition(game, options = {}) {
    const maxAttempts = 100;
    
    for (let i = 0; i < maxAttempts; i++) {
      const position = {
        x: Math.floor(Math.random() * this.config.GRID_COLS),
        y: Math.floor(Math.random() * this.config.GRID_ROWS)
      };
      
      if (this.isValidPosition(position, game, options)) {
        return position;
      }
    }
    
    console.warn('Could not find valid position after', maxAttempts, 'attempts');
    return { x: 0, y: 0 }; // Fallback position
  }
}