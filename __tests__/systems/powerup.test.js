import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { PowerUpManager, PowerUp } from '../../js/systems/powerup.js';
import { PowerUpType, CONFIG } from '../../js/config/constants.js';

describe('PowerUpManager', () => {
    let powerUpManager;
    let mockConfig;
    let mockGame;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockConfig = {
            ...CONFIG,
            POWERUP_SPAWN_INTERVAL: 100,
            POWERUP_COUNT: 3,
            POWERUP_DURATION: 200,
            GAME_SPEED: 8,
            BASE_GAME_SPEED: 8
        };
        
        mockGame = {
            config: mockConfig,
            snake: {
                invincible: false,
                shrinkActive: false,
                updateSize: jest.fn()
            },
            scoreMultiplier: 1,
            collisionSystem: {
                findValidPosition: jest.fn().mockReturnValue({ x: 10, y: 10 })
            },
            getRandomPosition: jest.fn().mockReturnValue({ x: 10, y: 10 }),
            effectsManager: {
                addFloatingText: jest.fn()
            },
            foodPos: { x: 5, y: 5 }
        };
        
        powerUpManager = new PowerUpManager(mockConfig);
    });

    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(powerUpManager.config).toBe(mockConfig);
            expect(powerUpManager.powerUps).toEqual([]);
            expect(powerUpManager.activePowerUps).toEqual({});
            expect(powerUpManager.spawnTimer).toBe(0);
            expect(powerUpManager.magnetActive).toBe(false);
        });
    });

    describe('update', () => {
        it('should increment spawn timer', () => {
            powerUpManager.update(mockGame);
            expect(powerUpManager.spawnTimer).toBe(1);
        });

        it('should spawn power-up when timer reaches interval', () => {
            powerUpManager.spawnTimer = mockConfig.POWERUP_SPAWN_INTERVAL - 1;
            powerUpManager.update(mockGame);
            
            expect(powerUpManager.powerUps).toHaveLength(1);
            expect(powerUpManager.spawnTimer).toBe(0);
        });

        it('should not spawn more than POWERUP_COUNT power-ups', () => {
            // Add maximum power-ups
            for (let i = 0; i < mockConfig.POWERUP_COUNT; i++) {
                powerUpManager.powerUps.push(new PowerUp(i, i, PowerUpType.SPEED_BOOST, mockConfig));
            }
            
            powerUpManager.spawnTimer = mockConfig.POWERUP_SPAWN_INTERVAL;
            powerUpManager.update(mockGame);
            
            expect(powerUpManager.powerUps).toHaveLength(mockConfig.POWERUP_COUNT);
        });

        it('should update active power-ups duration', () => {
            powerUpManager.activePowerUps[PowerUpType.SPEED_BOOST] = 100;
            
            powerUpManager.update(mockGame);
            
            expect(powerUpManager.activePowerUps[PowerUpType.SPEED_BOOST]).toBe(99);
        });

        it('should expire power-ups when duration reaches 0', () => {
            powerUpManager.activePowerUps[PowerUpType.SPEED_BOOST] = 1;
            powerUpManager.expirePowerUp = jest.fn();
            
            powerUpManager.update(mockGame);
            
            expect(powerUpManager.expirePowerUp).toHaveBeenCalledWith(PowerUpType.SPEED_BOOST, mockGame);
            expect(powerUpManager.activePowerUps[PowerUpType.SPEED_BOOST]).toBeUndefined();
        });
    });

    describe('spawnPowerUp', () => {
        it('should create a new power-up at valid position', () => {
            powerUpManager.spawnPowerUp(mockGame);
            
            expect(powerUpManager.powerUps).toHaveLength(1);
            expect(powerUpManager.powerUps[0]).toBeInstanceOf(PowerUp);
            expect(mockGame.collisionSystem.findValidPosition).toHaveBeenCalled();
        });

        it('should spawn different types of power-ups', () => {
            const types = new Set();
            
            // Spawn multiple power-ups to get different types
            for (let i = 0; i < 20; i++) {
                powerUpManager.spawnPowerUp(mockGame);
                const lastPowerUp = powerUpManager.powerUps[powerUpManager.powerUps.length - 1];
                types.add(lastPowerUp.type);
                powerUpManager.powerUps = []; // Clear for next spawn
            }
            
            // Should have spawned at least 2 different types
            expect(types.size).toBeGreaterThan(1);
        });
    });

    describe('expirePowerUp', () => {
        beforeEach(() => {
            // Set up initial state
            mockGame.config.GAME_SPEED = 8;
            mockGame.snake.invincible = false;
            mockGame.scoreMultiplier = 1;
            powerUpManager.magnetActive = false;
            mockGame.snake.shrinkActive = false;
        });

        it('should expire SPEED_BOOST correctly', () => {
            mockGame.config.GAME_SPEED = 11; // Modified by power-up
            powerUpManager.expirePowerUp(PowerUpType.SPEED_BOOST, mockGame);
            
            expect(mockGame.config.GAME_SPEED).toBe(8);
        });

        it('should expire INVINCIBILITY correctly', () => {
            mockGame.snake.invincible = true;
            powerUpManager.expirePowerUp(PowerUpType.INVINCIBILITY, mockGame);
            
            expect(mockGame.snake.invincible).toBe(false);
        });

        it('should expire SCORE_MULTIPLIER correctly', () => {
            mockGame.scoreMultiplier = 2;
            powerUpManager.expirePowerUp(PowerUpType.SCORE_MULTIPLIER, mockGame);
            
            expect(mockGame.scoreMultiplier).toBe(1);
        });

        it('should expire MAGNET correctly', () => {
            powerUpManager.magnetActive = true;
            powerUpManager.expirePowerUp(PowerUpType.MAGNET, mockGame);
            
            expect(powerUpManager.magnetActive).toBe(false);
        });

        it('should expire SHRINK correctly', () => {
            mockGame.snake.shrinkActive = true;
            powerUpManager.expirePowerUp(PowerUpType.SHRINK, mockGame);
            
            expect(mockGame.snake.shrinkActive).toBe(false);
            expect(mockGame.snake.updateSize).toHaveBeenCalledWith(1);
        });

        it('should expire TIME_SLOW correctly', () => {
            mockGame.config.GAME_SPEED = 2; // Slowed down
            powerUpManager.expirePowerUp(PowerUpType.TIME_SLOW, mockGame);
            
            expect(mockGame.config.GAME_SPEED).toBe(8);
        });
    });
});

describe('PowerUp', () => {
    let powerUp;
    let mockConfig;
    let mockGame;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockConfig = {
            POWERUP_DURATION: 300,
            GAME_SPEED: 8,
            BASE_GAME_SPEED: 8
        };
        
        mockGame = {
            config: mockConfig,
            snake: {
                invincible: false,
                shrinkActive: false
            },
            scoreMultiplier: 1,
            powerUpManager: {
                magnetActive: false,
                activePowerUps: {}
            },
            effectsManager: {
                addFloatingText: jest.fn()
            }
        };
        
        powerUp = new PowerUp(10, 15, PowerUpType.SPEED_BOOST, mockConfig);
    });

    describe('constructor', () => {
        it('should initialize with correct values', () => {
            expect(powerUp.x).toBe(10);
            expect(powerUp.y).toBe(15);
            expect(powerUp.type).toBe(PowerUpType.SPEED_BOOST);
            expect(powerUp.duration).toBe(300);
            expect(powerUp.remainingDuration).toBe(300);
            expect(powerUp.collected).toBe(false);
        });
    });

    describe('position', () => {
        it('should return correct position', () => {
            expect(powerUp.position()).toEqual({ x: 10, y: 15 });
        });
    });

    describe('apply', () => {
        it('should mark as collected', () => {
            powerUp.apply(mockGame);
            expect(powerUp.collected).toBe(true);
        });

        it('should apply SPEED_BOOST effect', () => {
            powerUp = new PowerUp(10, 15, PowerUpType.SPEED_BOOST, mockConfig);
            powerUp.apply(mockGame);
            
            expect(mockGame.config.GAME_SPEED).toBe(11);
        });

        it('should apply INVINCIBILITY effect', () => {
            powerUp = new PowerUp(10, 15, PowerUpType.INVINCIBILITY, mockConfig);
            powerUp.apply(mockGame);
            
            expect(mockGame.snake.invincible).toBe(true);
        });

        it('should apply SCORE_MULTIPLIER effect', () => {
            powerUp = new PowerUp(10, 15, PowerUpType.SCORE_MULTIPLIER, mockConfig);
            powerUp.apply(mockGame);
            
            expect(mockGame.scoreMultiplier).toBe(2);
        });

        it('should apply MAGNET effect', () => {
            powerUp = new PowerUp(10, 15, PowerUpType.MAGNET, mockConfig);
            powerUp.apply(mockGame);
            
            expect(mockGame.powerUpManager.magnetActive).toBe(true);
        });

        it('should apply SHRINK effect', () => {
            powerUp = new PowerUp(10, 15, PowerUpType.SHRINK, mockConfig);
            powerUp.apply(mockGame);
            
            expect(mockGame.snake.shrinkActive).toBe(true);
        });

        it('should apply TIME_SLOW effect', () => {
            powerUp = new PowerUp(10, 15, PowerUpType.TIME_SLOW, mockConfig);
            powerUp.apply(mockGame);
            
            expect(mockGame.config.GAME_SPEED).toBe(2);
        });

        it('should add power-up to active list', () => {
            powerUp.apply(mockGame);
            
            expect(mockGame.powerUpManager.activePowerUps[PowerUpType.SPEED_BOOST]).toBe(300);
        });
    });

    describe('expire', () => {
        it('should remove power-up effects', () => {
            // Apply power-up first
            powerUp.apply(mockGame);
            expect(mockGame.config.GAME_SPEED).toBe(11);
            
            // Then expire it
            powerUp.expire(mockGame);
            
            // Check that effect was removed
            expect(mockGame.config.GAME_SPEED).toBe(8); // Back to base speed
            expect(mockGame.powerUpManager.activePowerUps[PowerUpType.SPEED_BOOST]).toBeUndefined();
        });
    });
});

describe('PowerUp stacking and edge cases', () => {
    let powerUpManager;
    let mockGame;
    let mockConfig;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockConfig = {
            ...CONFIG,
            POWERUP_DURATION: 200,
            GAME_SPEED: 8,
            BASE_GAME_SPEED: 8
        };
        
        mockGame = {
            config: mockConfig,
            snake: {
                invincible: false,
                shrinkActive: false,
                updateSize: jest.fn()
            },
            scoreMultiplier: 1,
            powerUpManager: null,
            collisionSystem: {
                findValidPosition: jest.fn().mockReturnValue({ x: 10, y: 10 })
            },
            getRandomPosition: jest.fn().mockReturnValue({ x: 10, y: 10 }),
            effectsManager: {
                addFloatingText: jest.fn()
            }
        };
        
        powerUpManager = new PowerUpManager(mockConfig);
        mockGame.powerUpManager = powerUpManager;
    });

    it('should handle multiple active power-ups of different types', () => {
        const speedBoost = new PowerUp(10, 10, PowerUpType.SPEED_BOOST, mockConfig);
        const scoreMultiplier = new PowerUp(15, 15, PowerUpType.SCORE_MULTIPLIER, mockConfig);
        
        speedBoost.apply(mockGame);
        scoreMultiplier.apply(mockGame);
        
        expect(mockGame.config.GAME_SPEED).toBe(11);
        expect(mockGame.scoreMultiplier).toBe(2);
        expect(Object.keys(powerUpManager.activePowerUps)).toHaveLength(2);
    });

    it('should not stack same type power-ups', () => {
        const speedBoost1 = new PowerUp(10, 10, PowerUpType.SPEED_BOOST, mockConfig);
        const speedBoost2 = new PowerUp(15, 15, PowerUpType.SPEED_BOOST, mockConfig);
        
        speedBoost1.apply(mockGame);
        const initialSpeed = mockGame.config.GAME_SPEED;
        
        speedBoost2.apply(mockGame);
        
        // Speed should not stack
        expect(mockGame.config.GAME_SPEED).toBe(initialSpeed);
    });

    it('should handle TIME_SLOW and SPEED_BOOST interaction', () => {
        const timeSlow = new PowerUp(10, 10, PowerUpType.TIME_SLOW, mockConfig);
        const speedBoost = new PowerUp(15, 15, PowerUpType.SPEED_BOOST, mockConfig);
        
        timeSlow.apply(mockGame);
        expect(mockGame.config.GAME_SPEED).toBe(2); // 8 * 0.25
        
        speedBoost.apply(mockGame);
        expect(mockGame.config.GAME_SPEED).toBe(5); // 2 + 3
    });
});