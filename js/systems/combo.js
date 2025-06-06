export class ComboSystem {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  reset() {
    // Initialize or reset combo state
    this.comboCount = 0;               // Current number of consecutive pickups
    this.comboTimer = 0;               // Time remaining to maintain combo
    this.maxComboTimer = this.config.COMBO_DECAY_TIME;  // Time allowed between pickups
  }

  update() {
    // Update combo timer if active
    if (this.comboTimer > 0) {
      this.comboTimer--;
      
      // Reset combo if timer runs out
      if (this.comboTimer === 0) {
        this.reset();
      }
    }
  }

  incrementCombo() {
    // Increase combo count and reset timer
    this.comboCount++;
    this.comboTimer = this.maxComboTimer;
    
    // Return new multiplier for score calculation
    return this.getComboMultiplier();
  }

  getComboMultiplier() {
    // Calculate score multiplier based on combo count
    // Every 3 combos increases multiplier by 0.5
    // Example: combo 3 = 1.5x, combo 6 = 2x, combo 9 = 2.5x
    return 1 + Math.floor(this.comboCount / 3) * 0.5;
  }

  // Returns string representation of current combo status
  getComboStatus() {
    if (this.comboCount === 0) {
      return "No Combo";
    }
    return `${this.comboCount}x Combo (${this.getComboMultiplier().toFixed(1)}x Score)`;
  }

  // Returns percentage of time remaining in current combo
  getComboTimePercent() {
    if (this.comboTimer === 0) return 0;
    return (this.comboTimer / this.maxComboTimer) * 100;
  }
}