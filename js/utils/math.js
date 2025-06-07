export const MathUtils = {
  safeDivide(a, b, defaultValue = 0) {
    if (b === 0 || isNaN(b) || isNaN(a)) {
      return defaultValue;
    }
    const result = a / b;
    return isNaN(result) || !isFinite(result) ? defaultValue : result;
  },

  clamp(value, min, max) {
    if (isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
  },

  safeParseInt(value, defaultValue = 0) {
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseInt(value);
    return isNaN(parsed) ? defaultValue : parsed;
  },

  safeParseFloat(value, defaultValue = 0) {
    if (value === null || value === undefined) return defaultValue;
    const parsed = parseFloat(value);
    return isNaN(parsed) || !isFinite(parsed) ? defaultValue : parsed;
  },

  randomInRange(min, max) {
    return Math.random() * (max - min) + min;
  },

  randomIntInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  distance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  },

  normalize(value, min, max) {
    if (max - min === 0) return 0;
    return this.clamp((value - min) / (max - min), 0, 1);
  },

  lerp(start, end, t) {
    return start + (end - start) * this.clamp(t, 0, 1);
  },

  validateNumber(value, defaultValue = 0) {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
      return defaultValue;
    }
    return value;
  },

  validatePosition(pos, bounds = null) {
    if (!pos || typeof pos.x !== 'number' || typeof pos.y !== 'number') {
      return null;
    }
    
    const validPos = {
      x: this.validateNumber(pos.x, 0),
      y: this.validateNumber(pos.y, 0)
    };

    if (bounds) {
      validPos.x = this.clamp(validPos.x, bounds.minX || 0, bounds.maxX || Infinity);
      validPos.y = this.clamp(validPos.y, bounds.minY || 0, bounds.maxY || Infinity);
    }

    return validPos;
  }
};