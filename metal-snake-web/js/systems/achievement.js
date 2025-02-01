import { PowerUpType } from '../config/constants.js';

export class AchievementSystem {
  constructor(config) {
    this.config = config;
    
    // Define achievements
    this.achievements = {
      speedster: {
        name: "Speedster",
        description: "Reach speed level 10",
        unlocked: false,
        check: (game) => game.config.GAME_SPEED >= game.config.BASE_GAME_SPEED + 10
      },
      
      snake_charmer: {
        name: "Snake Charmer",
        description: "Get a combo of 10",
        unlocked: false,
        check: (game) => game.comboSystem.comboCount >= 10
      },
      
      power_collector: {
        name: "Power Collector",
        description: "Collect all power-up types",
        unlocked: false,
        check: (game) => this.collectedPowerups.size === Object.keys(PowerUpType).length
      },
      
      obstacle_master: {
        name: "Obstacle Master",
        description: "Score 100 points in obstacle mode",
        unlocked: false,
        check: (game) => game.obstaclesEnabled && game.score >= 100
      }
    };

    // Track collected power-ups
    this.collectedPowerups = new Set();
  }

  checkAchievements(game) {
    Object.entries(this.achievements).forEach(([id, achievement]) => {
      if (!achievement.unlocked && achievement.check(game)) {
        this.unlockAchievement(id, game);
      }
    });
  }

  unlockAchievement(id, game) {
    const achievement = this.achievements[id];
    if (!achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockTime = Date.now();

      game.notifications.push({
        text: `Achievement Unlocked: ${achievement.name}!`,
        duration: game.config.ACHIEVEMENT_DISPLAY_TIME,
        color: game.config.COLORS.GOLD
      });
    }
  }

  recordPowerUpCollection(type) {
    this.collectedPowerups.add(type);
  }

  loadProgress() {
    const savedData = localStorage.getItem('metalSnakeAchievements');
    if (savedData) {
      const data = JSON.parse(savedData);
      Object.entries(data).forEach(([id, status]) => {
        if (this.achievements[id]) {
          this.achievements[id].unlocked = status;
        }
      });
    }
  }

  saveProgress() {
    const data = Object.fromEntries(
      Object.entries(this.achievements).map(([id, achievement]) => [
        id,
        achievement.unlocked
      ])
    );
    localStorage.setItem('metalSnakeAchievements', JSON.stringify(data));
  }
}