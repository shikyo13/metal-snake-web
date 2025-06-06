// js/systems/achievement.js
import { PowerUpType } from '../config/constants.js';

export class AchievementSystem {
    constructor(config) {
        this.config = config;
        
        // Define achievements with proper tracking
        this.achievements = {
            speedster: {
                name: "Speedster",
                description: "Reach speed level 10",
                unlocked: false,
                progress: 0,
                maxProgress: 10,
                check: (game) => {
                    const speedLevel = game.config.GAME_SPEED - game.config.BASE_GAME_SPEED;
                    this.achievements.speedster.progress = speedLevel;
                    return speedLevel >= 10;
                }
            },
            
            snake_charmer: {
                name: "Snake Charmer",
                description: "Get a combo of 10",
                unlocked: false,
                progress: 0,
                maxProgress: 10,
                check: (game) => {
                    this.achievements.snake_charmer.progress = game.comboSystem.comboCount;
                    return game.comboSystem.comboCount >= 10;
                }
            },
            
            power_collector: {
                name: "Power Collector",
                description: "Collect all power-up types",
                unlocked: false,
                progress: 0,
                maxProgress: Object.keys(PowerUpType).length,
                check: (game) => {
                    this.achievements.power_collector.progress = this.collectedPowerups.size;
                    return this.collectedPowerups.size === Object.keys(PowerUpType).length;
                }
            },
            
            obstacle_master: {
                name: "Obstacle Master",
                description: "Score 100 points in obstacle mode",
                unlocked: false,
                progress: 0,
                maxProgress: 100,
                check: (game) => {
                    if (game.obstaclesEnabled) {
                        this.achievements.obstacle_master.progress = game.score;
                        return game.score >= 100;
                    }
                    return false;
                }
            }
        };

        // Track collected power-ups with persistence
        this.collectedPowerups = new Set();
        
        // Load saved progress
        this.loadProgress();
    }

    checkAchievements(game) {
        let newUnlock = false;
        
        Object.entries(this.achievements).forEach(([id, achievement]) => {
            if (!achievement.unlocked && achievement.check(game)) {
                this.unlockAchievement(id, game);
                newUnlock = true;
            }
        });

        // Save progress if any achievement was updated
        if (newUnlock) {
            this.saveProgress();
        }
    }

    unlockAchievement(id, game) {
        const achievement = this.achievements[id];
        if (!achievement.unlocked) {
            achievement.unlocked = true;
            achievement.unlockTime = Date.now();

            // Create achievement notification
            game.notifications.push({
                text: `Achievement Unlocked: ${achievement.name}!`,
                description: achievement.description,
                duration: game.config.ACHIEVEMENT_DISPLAY_TIME,
                color: game.config.COLORS.GOLD
            });

            // Play achievement sound
            if (game.soundManager) {
                game.soundManager.playSound('achievement', {
                    type: 'sine',
                    frequency: 880,
                    duration: 0.5,
                    volume: 0.3
                });
            }
        }
    }

    recordPowerUpCollection(type) {
        this.collectedPowerups.add(type);
        // Save progress whenever a new power-up type is collected
        if (this.collectedPowerups.size === Object.keys(PowerUpType).length) {
            this.saveProgress();
        }
    }

    loadProgress() {
        try {
            const savedData = localStorage.getItem('metalSnakeAchievements');
            if (savedData) {
                const data = JSON.parse(savedData);
                
                // Restore achievement states
                Object.entries(data.achievements).forEach(([id, status]) => {
                    if (this.achievements[id]) {
                        this.achievements[id].unlocked = status.unlocked;
                        this.achievements[id].progress = status.progress;
                    }
                });
                
                // Restore collected power-ups
                if (data.powerups) {
                    this.collectedPowerups = new Set(data.powerups);
                }
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    }

    saveProgress() {
        try {
            const data = {
                achievements: Object.fromEntries(
                    Object.entries(this.achievements).map(([id, achievement]) => [
                        id,
                        {
                            unlocked: achievement.unlocked,
                            progress: achievement.progress
                        }
                    ])
                ),
                powerups: Array.from(this.collectedPowerups)
            };
            localStorage.setItem('metalSnakeAchievements', JSON.stringify(data));
        } catch (error) {
            console.error('Error saving achievements:', error);
        }
    }

    // Get achievement progress for UI display
    getProgress(achievementId) {
        const achievement = this.achievements[achievementId];
        if (!achievement) return 0;
        return (achievement.progress / achievement.maxProgress) * 100;
    }

    // Reset all achievements (for testing)
    reset() {
        Object.values(this.achievements).forEach(achievement => {
            achievement.unlocked = false;
            achievement.progress = 0;
        });
        this.collectedPowerups.clear();
        this.saveProgress();
    }
}