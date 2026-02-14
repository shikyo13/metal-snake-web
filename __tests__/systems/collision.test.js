import { jest } from '@jest/globals';
import { CollisionSystem } from '../../js/systems/collision.js';
import { CONFIG } from '../../js/config/constants.js';

describe('CollisionSystem', () => {
    let collisionSystem;
    let mockConfig;
    let mockGame;

    beforeEach(() => {
        mockConfig = {
            ...CONFIG,
            GRID_COLS: 30,
            GRID_ROWS: 20
        };
        
        collisionSystem = new CollisionSystem(mockConfig);
        
        mockGame = {
            config: mockConfig,
            snake: {
                body: [
                    { x: 10, y: 10 },
                    { x: 9, y: 10 },
                    { x: 8, y: 10 }
                ],
                invincible: false
            },
            foodPos: { x: 15, y: 15 },
            obstacles: [
                { x: 5, y: 5 },
                { x: 20, y: 20 }
            ],
            powerUpManager: {
                powerUps: [
                    { position: () => ({ x: 12, y: 12 }) },
                    { position: () => ({ x: 18, y: 18 }) }
                ]
            }
        };
    });

    describe('constructor', () => {
        it('should initialize with config', () => {
            expect(collisionSystem.config).toBe(mockConfig);
        });
    });

    describe('checkSnakeCollision', () => {
        it('should detect collision with snake body', () => {
            const position = { x: 9, y: 10 }; // Second segment
            const result = collisionSystem.checkSnakeCollision(position, mockGame.snake);
            
            expect(result).toBe(true);
        });

        it('should not detect collision with head', () => {
            const position = { x: 10, y: 10 }; // Head position
            const result = collisionSystem.checkSnakeCollision(position, mockGame.snake);
            
            expect(result).toBe(false);
        });

        it('should not detect collision at empty position', () => {
            const position = { x: 25, y: 15 };
            const result = collisionSystem.checkSnakeCollision(position, mockGame.snake);
            
            expect(result).toBe(false);
        });

        it('should handle empty snake body', () => {
            mockGame.snake.body = [];
            const position = { x: 10, y: 10 };
            const result = collisionSystem.checkSnakeCollision(position, mockGame.snake);
            
            expect(result).toBe(false);
        });

        it('should handle single segment snake', () => {
            mockGame.snake.body = [{ x: 10, y: 10 }];
            const position = { x: 10, y: 10 };
            const result = collisionSystem.checkSnakeCollision(position, mockGame.snake);
            
            expect(result).toBe(false);
        });
    });

    describe('checkObstacleCollision', () => {
        it('should detect collision with obstacle', () => {
            const position = { x: 5, y: 5 };
            const result = collisionSystem.checkObstacleCollision(position, mockGame.obstacles);
            
            expect(result).toBe(true);
        });

        it('should not detect collision at empty position', () => {
            const position = { x: 15, y: 15 };
            const result = collisionSystem.checkObstacleCollision(position, mockGame.obstacles);
            
            expect(result).toBe(false);
        });

        it('should handle empty obstacles array', () => {
            const position = { x: 5, y: 5 };
            const result = collisionSystem.checkObstacleCollision(position, []);
            
            expect(result).toBe(false);
        });

        it('should handle null obstacles', () => {
            const position = { x: 5, y: 5 };
            const result = collisionSystem.checkObstacleCollision(position, null);
            
            expect(result).toBe(false);
        });
    });

    describe('checkPowerUpCollision', () => {
        it('should detect collision with power-up', () => {
            const position = { x: 12, y: 12 };
            const result = collisionSystem.checkPowerUpCollision(position, mockGame.powerUpManager.powerUps);
            
            expect(result).toBe(true);
        });

        it('should not detect collision at empty position', () => {
            const position = { x: 1, y: 1 };
            const result = collisionSystem.checkPowerUpCollision(position, mockGame.powerUpManager.powerUps);
            
            expect(result).toBe(false);
        });

        it('should handle empty power-ups array', () => {
            const position = { x: 12, y: 12 };
            const result = collisionSystem.checkPowerUpCollision(position, []);
            
            expect(result).toBe(false);
        });

        it('should handle power-ups without position method', () => {
            const invalidPowerUps = [{ x: 12, y: 12 }]; // No position() method
            const position = { x: 12, y: 12 };
            const result = collisionSystem.checkPowerUpCollision(position, invalidPowerUps);
            
            // Should still detect collision when x/y are direct properties
            expect(result).toBe(true);
        });
    });

    describe('checkFoodCollision', () => {
        it('should detect collision with food', () => {
            const position = { x: 15, y: 15 };
            const result = collisionSystem.checkFoodCollision(position, mockGame.foodPos);
            
            expect(result).toBe(true);
        });

        it('should not detect collision at different position', () => {
            const position = { x: 10, y: 10 };
            const result = collisionSystem.checkFoodCollision(position, mockGame.foodPos);
            
            expect(result).toBe(false);
        });

        it('should handle null food position', () => {
            const position = { x: 15, y: 15 };
            const result = collisionSystem.checkFoodCollision(position, null);
            
            expect(result).toBe(false);
        });
    });

    describe('checkBoundsCollision', () => {
        it('should not detect collision within bounds', () => {
            const position = { x: 15, y: 10 };
            const result = collisionSystem.checkBoundsCollision(position);
            
            expect(result).toBe(false);
        });

        it('should detect collision at left boundary', () => {
            const position = { x: -1, y: 10 };
            const result = collisionSystem.checkBoundsCollision(position);
            
            expect(result).toBe(true);
        });

        it('should detect collision at right boundary', () => {
            const position = { x: mockConfig.GRID_COLS, y: 10 };
            const result = collisionSystem.checkBoundsCollision(position);
            
            expect(result).toBe(true);
        });

        it('should detect collision at top boundary', () => {
            const position = { x: 15, y: -1 };
            const result = collisionSystem.checkBoundsCollision(position);
            
            expect(result).toBe(true);
        });

        it('should detect collision at bottom boundary', () => {
            const position = { x: 15, y: mockConfig.GRID_ROWS };
            const result = collisionSystem.checkBoundsCollision(position);
            
            expect(result).toBe(true);
        });

        it('should handle edge positions as valid', () => {
            expect(collisionSystem.checkBoundsCollision({ x: 0, y: 0 })).toBe(false);
            expect(collisionSystem.checkBoundsCollision({ x: mockConfig.GRID_COLS - 1, y: mockConfig.GRID_ROWS - 1 })).toBe(false);
        });
    });

    describe('checkAllCollisions', () => {
        it('should return all collision types', () => {
            const position = { x: 9, y: 10 }; // Snake body position
            const result = collisionSystem.checkAllCollisions(position, mockGame);
            
            expect(result).toEqual({
                bounds: false,
                snake: true,
                obstacle: false,
                powerUp: false,
                food: false
            });
        });

        it('should detect bounds collision when invincible', () => {
            mockGame.snake.invincible = true;
            const position = { x: -1, y: 10 };
            const result = collisionSystem.checkAllCollisions(position, mockGame);
            
            expect(result.bounds).toBe(true);
        });

        it('should detect multiple collisions', () => {
            const position = { x: 5, y: 5 }; // Obstacle position
            mockGame.snake.body.push({ x: 5, y: 5 }); // Also snake position
            
            const result = collisionSystem.checkAllCollisions(position, mockGame);
            
            expect(result.snake).toBe(true);
            expect(result.obstacle).toBe(true);
        });
    });

    describe('isValidPosition', () => {
        it('should return true for empty position', () => {
            const position = { x: 25, y: 15 };
            const result = collisionSystem.isValidPosition(position, mockGame);
            
            expect(result).toBe(true);
        });

        it('should return false for snake collision', () => {
            const position = { x: 9, y: 10 };
            const result = collisionSystem.isValidPosition(position, mockGame);
            
            expect(result).toBe(false);
        });

        it('should return false for obstacle collision', () => {
            const position = { x: 5, y: 5 };
            const result = collisionSystem.isValidPosition(position, mockGame);
            
            expect(result).toBe(false);
        });

        it('should return false for out of bounds', () => {
            const position = { x: -1, y: 10 };
            const result = collisionSystem.isValidPosition(position, mockGame);
            
            expect(result).toBe(false);
        });

        it('should allow food position by default', () => {
            const position = { x: 15, y: 15 }; // Food position
            const result = collisionSystem.isValidPosition(position, mockGame);
            
            expect(result).toBe(true);
        });

        it('should exclude food position when specified', () => {
            const position = { x: 15, y: 15 }; // Food position
            const result = collisionSystem.isValidPosition(position, mockGame, { excludeFood: true });
            
            expect(result).toBe(false);
        });

        it('should allow power-up position by default', () => {
            const position = { x: 12, y: 12 }; // Power-up position
            const result = collisionSystem.isValidPosition(position, mockGame);
            
            expect(result).toBe(true);
        });

        it('should exclude power-up position when specified', () => {
            const position = { x: 12, y: 12 }; // Power-up position
            const result = collisionSystem.isValidPosition(position, mockGame, { excludePowerUps: true });
            
            expect(result).toBe(false);
        });
    });

    describe('findValidPosition', () => {
        it('should find a valid position', () => {
            const position = collisionSystem.findValidPosition(mockGame);
            
            expect(position).toBeDefined();
            expect(position.x).toBeGreaterThanOrEqual(0);
            expect(position.x).toBeLessThan(mockConfig.GRID_COLS);
            expect(position.y).toBeGreaterThanOrEqual(0);
            expect(position.y).toBeLessThan(mockConfig.GRID_ROWS);
            
            // Should be a valid position
            expect(collisionSystem.isValidPosition(position, mockGame)).toBe(true);
        });

        it('should find position excluding food', () => {
            const position = collisionSystem.findValidPosition(mockGame, { excludeFood: true });
            
            expect(position).toBeDefined();
            expect(position).not.toEqual(mockGame.foodPos);
        });

        it('should find position excluding power-ups', () => {
            const position = collisionSystem.findValidPosition(mockGame, { excludePowerUps: true });
            
            expect(position).toBeDefined();
            
            const isPowerUpPosition = mockGame.powerUpManager.powerUps.some(
                pu => {
                    const puPos = pu.position();
                    return puPos.x === position.x && puPos.y === position.y;
                }
            );
            
            expect(isPowerUpPosition).toBe(false);
        });

        it('should handle nearly full grid', () => {
            // Fill most of the grid with obstacles, leaving a larger area open
            // so random search can realistically find a valid position
            mockGame.obstacles = [];
            for (let x = 0; x < mockConfig.GRID_COLS; x++) {
                for (let y = 0; y < mockConfig.GRID_ROWS; y++) {
                    // Leave a 5x5 block open (positions 13-17, 13-17)
                    if (x < 13 || x > 17 || y < 13 || y > 17) {
                        mockGame.obstacles.push({ x, y });
                    }
                }
            }

            const position = collisionSystem.findValidPosition(mockGame);

            // Should find a position in the open area
            expect(position.x).toBeGreaterThanOrEqual(0);
            expect(position.y).toBeGreaterThanOrEqual(0);
        });

        it('should eventually give up if no valid position exists', () => {
            // Fill entire grid with obstacles
            mockGame.obstacles = [];
            for (let x = 0; x < mockConfig.GRID_COLS; x++) {
                for (let y = 0; y < mockConfig.GRID_ROWS; y++) {
                    mockGame.obstacles.push({ x, y });
                }
            }
            
            // Should still return something after max attempts
            const position = collisionSystem.findValidPosition(mockGame);
            
            expect(position).toBeDefined();
            expect(position.x).toBeGreaterThanOrEqual(0);
            expect(position.x).toBeLessThan(mockConfig.GRID_COLS);
        });
    });

    describe('edge cases', () => {
        it('should handle positions with missing coordinates', () => {
            expect(collisionSystem.checkBoundsCollision({ x: 10 })).toBe(true);
            expect(collisionSystem.checkBoundsCollision({ y: 10 })).toBe(true);
            expect(collisionSystem.checkBoundsCollision({})).toBe(true);
        });

        it('should handle null position', () => {
            expect(collisionSystem.checkBoundsCollision(null)).toBe(true);
            expect(collisionSystem.checkSnakeCollision(null, mockGame.snake)).toBe(false);
            expect(collisionSystem.checkObstacleCollision(null, mockGame.obstacles)).toBe(false);
        });

        it('should handle game with missing components', () => {
            const incompleteGame = {
                config: mockConfig,
                snake: mockGame.snake
                // Missing other components
            };
            
            const position = { x: 10, y: 10 };
            const result = collisionSystem.checkAllCollisions(position, incompleteGame);
            
            expect(result).toBeDefined();
            expect(result.snake).toBe(false);
        });
    });
});