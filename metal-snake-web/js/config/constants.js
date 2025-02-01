// js/config/constants.js
export const CONFIG = {
  GRID_COLS: 30,
  GRID_ROWS: 20,
  BASE_CELL_SIZE: 20,
  FPS: 60,
  BASE_GAME_SPEED: 8,
  GAME_SPEED: 8,
  OBSTACLE_COUNT: 20,
  OBSTACLE_BONUS: 2,
  PARTICLE_COUNT: 12,
  PARTICLE_SPEED: 3.0,
  PARTICLE_LIFETIME: 30,
  MAX_SCORES: 5,
  SCORE_THRESHOLD: 50,
  SPEED_INCREMENT: 2,
  // Increased power-up duration and spawn interval:
  POWERUP_SPAWN_INTERVAL: 700,   // Adjusted to spawn less frequently so that up to 3 power-ups can be active
  POWERUP_DURATION: 800,         // Increased duration (in milliseconds) so power-up effects last longer
  POWERUP_COUNT: 3,
  COMBO_DECAY_TIME: 120,          // Frames before combo resets
  ACHIEVEMENT_DISPLAY_TIME: 180, // Frames to show achievement notification
  ACTIVE_POWERUP_OFFSET_X: 10,  // Distance from the right edge
  ACTIVE_POWERUP_OFFSET_Y: 80,  // Distance from the top edge (adjust this value as needed)
  COLORS: {
    WHITE: "#FFFFFF",
    BLACK: "#000000",
    RED: "#FF0000",
    GRAY: "#646464",
    BLUE: "#0000FF",
    GREEN: "#00FF00",
    YELLOW: "#FFFF00",
    CYAN: "#00FFFF",
    MAGENTA: "#FF00FF",
    ORANGE: "#FFA500",
    GOLD: "#FFD700",
    PURPLE: "#800080",
    NEON_GREEN: "#39FF14",
    NEON_BLUE: "#4D4DFF",
    BACKGROUND_DARK: "#1a002a",
    BACKGROUND_MID: "#0d192b",
    BACKGROUND_LIGHT: "#001a1a"
  }
};

export const GameState = {
  MENU: 'menu',
  PLAY: 'play',
  PAUSE: 'pause',
  GAME_OVER: 'game_over',
  HIGHSCORES: 'highscores',
  SETTINGS: 'settings'
};

export const Direction = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  opposite(dir) {
    switch (dir) {
      case Direction.UP: return Direction.DOWN;
      case Direction.DOWN: return Direction.UP;
      case Direction.LEFT: return Direction.RIGHT;
      case Direction.RIGHT: return Direction.LEFT;
    }
  }
};

export const PowerUpType = {
  SPEED_BOOST: 'speed_boost',
  INVINCIBILITY: 'invincibility',
  SCORE_MULTIPLIER: 'score_multiplier',
  MAGNET: 'magnet',
  SHRINK: 'shrink',
  TIME_SLOW: 'time_slow'
};
