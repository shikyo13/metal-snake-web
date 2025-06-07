# Error Handling Test Plan

## What We've Implemented

1. **ErrorManager** (`js/systems/error.js`)
   - Centralized error handling with categorization
   - User notifications (toasts and modals)
   - Recovery strategies for different error types
   - Sentry integration for production monitoring

2. **PerformanceMonitor** (`js/systems/performance.js`)
   - FPS tracking and low FPS warnings
   - Frame time analysis (update/render)
   - Memory leak detection
   - Performance overlay in debug mode

3. **Safe Math Utilities** (`js/utils/math.js`)
   - Prevention of NaN/Infinity errors
   - Safe division, parsing, and clamping
   - Position validation

4. **Error Handling Integration**
   - Game.js: Protected game loop, initialization, and input
   - Renderer.js: Canvas context validation and resize protection
   - Assets.js: Graceful asset loading failures
   - Sound.js: Audio fallback handling
   - Score.js: Storage error recovery
   - PowerUp.js: Safe power-up application/expiration
   - Particle.js: Protected update loop

## Manual Testing Steps

### 1. Basic Game Functionality
- Open http://localhost:8000
- Start the game and verify it loads correctly
- Play for a few minutes to ensure stability
- Check browser console for any errors

### 2. Error Notifications
- Open http://localhost:8000/test-errors.html
- Click each test button and verify:
  - Notifications appear in top-right
  - Different severity levels have different colors
  - Notifications auto-dismiss

### 3. Asset Loading Failures
- Rename `assets/audio/midnightcarnage.mp3` to `.mp3.bak`
- Reload the game
- Verify:
  - Warning notification appears
  - Game continues without music
  - No crash occurs

### 4. Performance Monitoring (Debug Mode)
- Set `DEBUG: true` in `js/config/constants.js`
- Reload the game
- Look for performance overlay in top-left showing:
  - FPS counter
  - Frame times
  - Memory usage
  - Error count

### 5. Storage Errors
- Open game in private/incognito mode
- Play and get a high score
- Enter name at game over
- Verify score saving handles any storage restrictions

### 6. Low FPS Warning
- Open Chrome DevTools
- Go to Performance tab
- Set CPU throttling to 6x slowdown
- Play the game
- Check for FPS warnings in console

### 7. Error Recovery
- While playing, open console and run:
  ```javascript
  game.foodPos = null; // Force an error
  ```
- Verify game recovers and continues

### 8. Power-up Errors
- Play until you collect power-ups
- Verify smooth collection and expiration
- Check console for any power-up errors

## Production Testing

### Sentry Integration
1. Replace `YOUR_SENTRY_DSN_HERE` in index.html with actual DSN
2. Deploy to production server
3. Trigger some errors
4. Verify errors appear in Sentry dashboard with:
   - Error details and stack traces
   - Game state context
   - Performance metrics

### Performance Monitoring
1. Let game run for extended period
2. Check Sentry for performance data
3. Verify memory leak detection works
4. Check FPS degradation alerts

## Expected Results

- ✅ Game remains playable even with errors
- ✅ Users see friendly error messages
- ✅ No data loss from storage errors
- ✅ Assets fail gracefully
- ✅ Performance issues are detected and reported
- ✅ All errors are logged for debugging
- ✅ Production monitoring captures issues

## Console Commands for Testing

```javascript
// Force various errors
errorManager.showNotification('Test notification', 'warning');
errorManager.createErrorModal('Test Error', 'This is a test error modal');
performanceMonitor.getPerformanceStats();
errorManager.getErrorStats();

// Simulate errors
game.snake = null; // Force null reference
game.config.GAME_SPEED = NaN; // Force calculation error
```