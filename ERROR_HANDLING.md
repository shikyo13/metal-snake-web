# Error Handling and Monitoring Guide

## Overview

The Metal Snake game now includes comprehensive error handling and monitoring capabilities to ensure a smooth gaming experience and facilitate debugging in production.

## Features

### 1. Centralized Error Management
- **ErrorManager** class handles all errors consistently
- Error categorization (critical, warning, info)
- Recovery strategies for different error types
- User-friendly notifications

### 2. Error Recovery Strategies

#### Asset Loading Failures
- Game continues without missing assets
- Fallback to canvas-drawn graphics if images fail
- Silent audio fallback if sounds fail to load

#### Game Loop Errors
- Automatic recovery attempts
- Game stops after 10 consecutive errors
- Clear error messaging to users

#### Storage Errors
- Falls back to in-memory storage
- Warns users about unsaved progress
- Attempts to restore on next successful save

#### Input Errors
- Silently catches and logs
- Game continues normally

### 3. Sentry Integration

To enable Sentry monitoring in production:

1. Sign up for a Sentry account at https://sentry.io
2. Create a new project for your game
3. Replace `YOUR_SENTRY_DSN_HERE` in index.html with your actual DSN
4. Sentry will automatically track:
   - JavaScript errors
   - Performance metrics
   - User sessions
   - Custom error contexts

### 4. Performance Monitoring

The game includes built-in performance monitoring:

- **FPS tracking** - Alerts when FPS drops below 30
- **Frame time analysis** - Tracks update and render times
- **Memory monitoring** - Detects potential memory leaks
- **Long task detection** - Identifies operations blocking the main thread

In debug mode, a performance overlay shows:
- Current and average FPS
- Frame, update, and render times
- Memory usage
- Error count

### 5. User Notifications

Three types of notifications:
- **Info** (blue) - General information
- **Warning** (yellow) - Non-critical issues
- **Critical** (red) - Serious errors

Notifications appear in the top-right corner and auto-dismiss.

## Error Types and Handling

### Critical Errors
- Canvas context creation failure
- Game system initialization failure
- Repeated game loop errors

**Recovery**: Show error modal, suggest page refresh

### Warning Errors
- Asset loading failures
- Storage access issues
- Power-up errors
- Audio initialization failures

**Recovery**: Continue with degraded functionality

### Info Errors
- Performance warnings
- Long task detection
- Context restoration

**Recovery**: Log for monitoring, no user impact

## Development vs Production

### Development (DEBUG = true)
- Verbose console logging
- Performance overlay visible
- All errors logged to console
- Sentry disabled on localhost

### Production
- Minimal console output
- Errors sent to Sentry
- Performance metrics aggregated
- User-friendly error messages

## Safe Math Operations

The `MathUtils` module provides safe mathematical operations:
- `safeDivide()` - Prevents division by zero
- `clamp()` - Ensures values stay within bounds
- `validateNumber()` - Handles NaN and Infinity
- `validatePosition()` - Ensures valid coordinates

## Testing Error Handling

To test error handling:

1. **Asset Loading**: Rename asset files to trigger load failures
2. **Storage**: Use private browsing to test storage failures
3. **Performance**: Use Chrome DevTools CPU throttling
4. **Memory**: Use Chrome DevTools memory profiler

## Monitoring Dashboard

When Sentry is configured, you can:
- View error trends and patterns
- Analyze performance metrics
- Track user sessions
- Set up alerts for critical issues

## Best Practices

1. Always use error boundaries for user input handlers
2. Validate all external data (storage, assets)
3. Provide meaningful error context
4. Test error scenarios regularly
5. Monitor production metrics

## Configuration

Key configuration in `CONFIG`:
- `DEBUG` - Enable/disable debug features
- `FPS` - Target frame rate
- Error thresholds in ErrorManager

## Future Enhancements

- Offline error queuing
- Error replay functionality
- A/B testing for error recovery strategies
- Custom error reporting UI