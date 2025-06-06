import { PowerUpType } from '../config/constants.js';

// Centralized color management for power-ups
export function getPowerUpColor(type, config) {
  const colorMap = {
    [PowerUpType.SPEED_BOOST]: config.COLORS.YELLOW,
    [PowerUpType.INVINCIBILITY]: config.COLORS.CYAN,
    [PowerUpType.SCORE_MULTIPLIER]: config.COLORS.MAGENTA,
    [PowerUpType.MAGNET]: config.COLORS.GREEN,
    [PowerUpType.SHRINK]: config.COLORS.ORANGE,
    [PowerUpType.TIME_SLOW]: config.COLORS.PURPLE
  };
  
  return colorMap[type] || config.COLORS.WHITE;
}

// Get power-up display name
export function getPowerUpDisplayName(type) {
  const nameMap = {
    [PowerUpType.SPEED_BOOST]: 'Speed Boost',
    [PowerUpType.INVINCIBILITY]: 'Invincibility',
    [PowerUpType.SCORE_MULTIPLIER]: 'Score Multiplier',
    [PowerUpType.MAGNET]: 'Food Magnet',
    [PowerUpType.SHRINK]: 'Shrink Snake',
    [PowerUpType.TIME_SLOW]: 'Slow Time'
  };
  
  return nameMap[type] || 'Unknown Power-up';
}

// Create snake gradient with proper color management
export function createSnakeGradient(ctx, x, y, radius, invincible, config) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 1.5);
  const baseColor = invincible ? config.COLORS.CYAN : config.COLORS.GREEN;
  const darkColor = invincible ? '#30aaaa' : '#30aa30';
  
  gradient.addColorStop(0, baseColor);
  gradient.addColorStop(0.6, darkColor);
  gradient.addColorStop(1, 'transparent');
  
  return gradient;
}