import { GameState } from '../config/constants.js';

export class InputManager {
  constructor() {
    this.handlers = new Map();
    this.keyMappings = {
      // Movement keys
      'ArrowUp': 'move_up',
      'ArrowDown': 'move_down',
      'ArrowLeft': 'move_left',
      'ArrowRight': 'move_right',
      'w': 'move_up',
      'W': 'move_up',
      's': 'move_down',
      'S': 'move_down',
      'a': 'move_left',
      'A': 'move_left',
      'd': 'move_right',
      'D': 'move_right',
      
      // Game control keys
      'Escape': 'pause',
      'p': 'pause',
      'P': 'pause',
      'm': 'toggle_music',
      'M': 'toggle_music',
      
      // Menu navigation
      'Enter': 'select',
      'p': 'play',
      'P': 'play',
      'h': 'highscores',
      'H': 'highscores',
      'o': 'toggle_obstacles',
      'O': 'toggle_obstacles',
      'b': 'back',
      'B': 'back',
      's': 'settings',
      'S': 'settings',
      '+': 'volume_up',
      '=': 'volume_up',
      '-': 'volume_down',
      '_': 'volume_down'
    };
    
    this.currentState = null;
    this.bindEvents();
  }
  
  bindEvents() {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    // Touch controls for mobile
    let touchStartX = 0;
    let touchStartY = 0;
    
    window.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    });
    
    window.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const deltaX = touchEndX - touchStartX;
      const deltaY = touchEndY - touchStartY;
      
      // Determine swipe direction
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > 50) {
          this.triggerAction('move_right');
        } else if (deltaX < -50) {
          this.triggerAction('move_left');
        }
      } else {
        if (deltaY > 50) {
          this.triggerAction('move_down');
        } else if (deltaY < -50) {
          this.triggerAction('move_up');
        }
      }
    });
  }
  
  setGameState(state) {
    this.currentState = state;
  }
  
  handleKeyDown(e) {
    // Don't process any inputs during game over name entry
    if (this.currentState === GameState.GAME_OVER) {
      return;
    }
    
    // Special handling for Escape key
    if (e.key === 'Escape') {
      // Check if we're in fullscreen
      const isFullscreen = document.fullscreenElement || document.webkitFullscreenElement;
      
      if (isFullscreen) {
        // In fullscreen: only exit fullscreen, don't trigger other actions
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
      } else {
        // Not in fullscreen: handle normal escape functions
        if (this.currentState === GameState.PLAY || this.currentState === GameState.PAUSE) {
          this.triggerAction('pause');
        } else if (this.currentState === GameState.HIGHSCORES || 
                   this.currentState === GameState.SETTINGS) {
          this.triggerAction('back');
        }
      }
      e.preventDefault();
      return;
    }
    
    // Handle context-specific keys
    const key = e.key.toLowerCase();
    
    // During gameplay, s/S should move down, not open settings
    if (this.currentState === GameState.PLAY) {
      if (key === 's') {
        this.triggerAction('move_down');
        e.preventDefault();
        return;
      }
    }
    
    // In menu, s/S should open settings
    if (this.currentState === GameState.MENU) {
      if (key === 's') {
        this.triggerAction('settings');
        e.preventDefault();
        return;
      }
    }
    
    // Get the base action from key mapping
    const action = this.keyMappings[e.key];
    if (!action) return;
    
    // Trigger the action
    if (this.handlers.has(action)) {
      e.preventDefault();
      this.triggerAction(action);
    }
  }
  
  triggerAction(action) {
    const handler = this.handlers.get(action);
    if (handler) {
      handler();
    }
  }
  
  on(action, handler) {
    this.handlers.set(action, handler);
  }
  
  off(action) {
    this.handlers.delete(action);
  }
  
  clear() {
    this.handlers.clear();
  }
}