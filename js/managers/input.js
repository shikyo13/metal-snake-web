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
      'h': 'highscores',
      'H': 'highscores',
      'o': 'toggle_obstacles',
      'O': 'toggle_obstacles',
      'b': 'back',
      'B': 'back',
      
      // Settings
      'ArrowUp': 'menu_up',
      'ArrowDown': 'menu_down',
      'w': 'menu_up',
      'W': 'menu_up',
      's': 'menu_down',
      'S': 'menu_down',
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
    // Get the base action from key mapping
    const action = this.keyMappings[e.key];
    if (!action) return;
    
    // Context-aware action handling
    let contextAction = action;
    
    // In menu states, arrow keys are for menu navigation
    if (this.currentState === GameState.MENU || 
        this.currentState === GameState.HIGHSCORES ||
        this.currentState === GameState.SETTINGS) {
      if (action.startsWith('move_')) {
        contextAction = action.replace('move_', 'menu_');
      }
    }
    
    // Trigger the action
    if (this.handlers.has(contextAction)) {
      e.preventDefault();
      this.triggerAction(contextAction);
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