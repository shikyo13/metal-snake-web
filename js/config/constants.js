// js/config/constants.js

// Main game configuration object that controls all adjustable parameters
export const CONFIG = {
    // Core game grid settings
    GRID_COLS: 30,                    // Number of columns in game grid
    GRID_ROWS: 20,                    // Number of rows in game grid
    BASE_CELL_SIZE: 20,               // Base size of each grid cell in pixels
    
    // Game performance settings
    FPS: 60,                          // Target frames per second
    BASE_GAME_SPEED: 8,               // Initial movement speed
    GAME_SPEED: 8,                    // Current movement speed (can be modified during gameplay)
    
    // Obstacle settings
    OBSTACLE_COUNT: 20,               // Number of obstacles in obstacle mode
    OBSTACLE_BONUS: 2,                // Score multiplier for playing with obstacles
    
    // Particle effect settings
    PARTICLE_COUNT: 12,               // Number of particles per effect
    PARTICLE_SPEED: 3.0,              // Base speed of particles
    PARTICLE_LIFETIME: 30,            // How long particles last in frames
    
    // Scoring and progression
    MAX_SCORES: 5,                    // Number of high scores to keep
    SCORE_THRESHOLD: 50,              // Score needed for speed increase
    SPEED_INCREMENT: 2,               // How much speed increases at threshold
    
    // Power-up settings
    POWERUP_SPAWN_INTERVAL: 700,      // Frames between power-up spawns
    POWERUP_DURATION: 800,            // How long power-ups last in frames
    POWERUP_COUNT: 3,                 // Maximum number of power-ups on screen
    
    // Combo system settings
    COMBO_DECAY_TIME: 180,            // Frames before combo resets
    
    // Achievement system settings
    ACHIEVEMENT_DISPLAY_TIME: 180,    // How long to show achievement notifications
    ACHIEVEMENT_FADE_TIME: 30,        // Frames for achievement fade out
    ACHIEVEMENT_STACK_LIMIT: 3,       // Max visible achievements at once
    ACHIEVEMENT_SOUND_VOLUME: 0.3,    // Volume for achievement sounds
    
    // UI settings
    ACTIVE_POWERUP_OFFSET_X: 10,     // Distance from right edge for power-up display
    ACTIVE_POWERUP_OFFSET_Y: 80,     // Distance from top for power-up display
    
    // Audio settings
    MUSIC_DEFAULT_VOLUME: 0.5,        // Default music volume
    SFX_DEFAULT_VOLUME: 0.3,          // Default sound effects volume
    
    // Mobile-specific settings
    TOUCH_CONTROL_SIZE: 60,          // Size of touch control buttons
    TOUCH_CONTROL_SPACING: 20,       // Space between touch controls
    TOUCH_CONTROL_OPACITY: 0.5,      // Opacity of touch controls
    MIN_SWIPE_DISTANCE: 30,          // Minimum pixels for swipe detection
    
    // Color scheme
    COLORS: {
        // Basic colors
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
        
        // Special effect colors
        NEON_GREEN: "#39FF14",
        NEON_BLUE: "#4D4DFF",
        
        // Background gradient colors
        BACKGROUND_DARK: "#1a002a",
        BACKGROUND_MID: "#0d192b",
        BACKGROUND_LIGHT: "#001a1a",
        
        // Achievement-specific colors
        ACHIEVEMENT_GOLD: "#FFD700",
        ACHIEVEMENT_BG: "rgba(0, 0, 0, 0.9)",
        ACHIEVEMENT_TEXT: "#FFFFFF",
        
        // Power-up colors (matching PowerUpType)
        POWERUP_SPEED: "#FFFF00",     // Yellow for speed boost
        POWERUP_INVINCIBLE: "#00FFFF", // Cyan for invincibility
        POWERUP_MULTIPLIER: "#FF00FF", // Magenta for score multiplier
        POWERUP_MAGNET: "#00FF00",    // Green for magnet
        POWERUP_SHRINK: "#FFA500",    // Orange for shrink
        POWERUP_TIMESLOW: "#800080"   // Purple for time slow
    }
};

// Game state enumeration
export const GameState = {
    MENU: 'menu',
    PLAY: 'play',
    PAUSE: 'pause',
    GAME_OVER: 'game_over',
    HIGHSCORES: 'highscores',
    SETTINGS: 'settings'
};

// Direction enumeration with helper function
export const Direction = {
    UP: 'up',
    DOWN: 'down',
    LEFT: 'left',
    RIGHT: 'right',
    
    // Helper function to get opposite direction
    opposite(dir) {
        switch (dir) {
            case Direction.UP: return Direction.DOWN;
            case Direction.DOWN: return Direction.UP;
            case Direction.LEFT: return Direction.RIGHT;
            case Direction.RIGHT: return Direction.LEFT;
            default: return dir;
        }
    }
};

// Power-up type enumeration
export const PowerUpType = {
    SPEED_BOOST: 'speed_boost',
    INVINCIBILITY: 'invincibility',
    SCORE_MULTIPLIER: 'score_multiplier',
    MAGNET: 'magnet',
    SHRINK: 'shrink',
    TIME_SLOW: 'time_slow'
};

// Achievement definitions
export const Achievements = {
    SPEEDSTER: 'speedster',
    SNAKE_CHARMER: 'snake_charmer',
    POWER_COLLECTOR: 'power_collector',
    OBSTACLE_MASTER: 'obstacle_master'
};

// Debug flag - set to true to enable debug features
export const DEBUG = false;