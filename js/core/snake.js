import { Direction } from '../config/constants.js';

export class Snake {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  reset() {
    // Initialize snake with starting position and properties
    this.body = [
      { x: 15, y: 10 },
      { x: 14, y: 10 },
      { x: 13, y: 10 }
    ];
    this.direction = Direction.RIGHT;
    this.nextDirection = Direction.RIGHT;
    this.invincible = false;
    this.size = 1.0;
    this.moveBuffer = [];
    this.lastMoveTime = 0;
  }

  setDirection(newDir) {
    // Handle direction changes with input buffering
    if (newDir !== Direction.opposite(this.direction)) {
      const now = performance.now();
      if (now - this.lastMoveTime < 100) {
        this.moveBuffer.push(newDir);
      } else {
        this.nextDirection = newDir;
        this.lastMoveTime = now;
      }
    }
  }

  move(foodPos, obstacles) {
    // Process buffered moves
    if (this.moveBuffer.length > 0 && 
        performance.now() - this.lastMoveTime >= 100) {
      this.nextDirection = this.moveBuffer.shift();
      this.lastMoveTime = performance.now();
    }

    this.direction = this.nextDirection;
    let head = { ...this.body[0] };

    // Update head position based on direction
    switch (this.direction) {
      case Direction.UP: head.y--; break;
      case Direction.DOWN: head.y++; break;
      case Direction.LEFT: head.x--; break;
      case Direction.RIGHT: head.x++; break;
    }

    // Handle collisions or wrap-around
    if (!this.invincible) {
      if (head.x < 0 || head.x >= this.config.GRID_COLS || 
          head.y < 0 || head.y >= this.config.GRID_ROWS) {
        return false;
      }
    } else {
      head.x = (head.x + this.config.GRID_COLS) % this.config.GRID_COLS;
      head.y = (head.y + this.config.GRID_ROWS) % this.config.GRID_ROWS;
    }

    // Check self-collision and obstacles
    if (!this.invincible) {
      if (this.body.some(seg => seg.x === head.x && seg.y === head.y)) {
        return false;
      }
      if (obstacles.some(ob => ob.x === head.x && ob.y === head.y)) {
        return false;
      }
    }

    // Update snake body
    this.body.unshift(head);
    if (!(head.x === foodPos.x && head.y === foodPos.y)) {
      this.body.pop();
    }

    return true;
  }

  headPosition() {
    return this.body[0];
  }

  updateSize(targetSize) {
    const rate = 0.1;
    this.size += (targetSize - this.size) * rate;
  }
}