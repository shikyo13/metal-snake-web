import { jest } from '@jest/globals';
import { Snake } from '../../js/core/snake.js';
import { Direction, CONFIG, SNAKE_CONFIG } from '../../js/config/constants.js';

describe('Snake', () => {
    let snake;
    let mockConfig;

    beforeEach(() => {
        mockConfig = {
            ...CONFIG,
            GRID_COLS: 30,
            GRID_ROWS: 20
        };
        snake = new Snake(mockConfig);
    });

    describe('constructor', () => {
        it('should initialize with correct default values', () => {
            expect(snake.config).toBe(mockConfig);
            expect(snake.invincible).toBe(false);
            expect(snake.size).toBe(1);
            expect(snake.shrinkActive).toBe(false);
            expect(snake.body).toHaveLength(3); // Start length
            expect(snake.direction).toBe(Direction.RIGHT);
            expect(snake.nextDirection).toBe(Direction.RIGHT);
            expect(snake.actualDirection).toBe(Direction.RIGHT);
        });

        it('should start at the correct position', () => {
            const expectedStartX = Math.floor(mockConfig.GRID_COLS / 2);
            const expectedStartY = Math.floor(mockConfig.GRID_ROWS / 2);
            
            expect(snake.body[0]).toEqual({ x: expectedStartX, y: expectedStartY });
            expect(snake.body[1]).toEqual({ x: expectedStartX - 1, y: expectedStartY });
            expect(snake.body[2]).toEqual({ x: expectedStartX - 2, y: expectedStartY });
        });
    });

    describe('reset', () => {
        it('should reset snake to initial state', () => {
            // Modify snake state
            snake.direction = Direction.UP;
            snake.invincible = true;
            snake.size = 2;
            snake.body.push({ x: 10, y: 10 });

            // Reset
            snake.reset();

            // Check reset values
            expect(snake.invincible).toBe(false);
            expect(snake.size).toBe(1);
            expect(snake.shrinkActive).toBe(false);
            expect(snake.body).toHaveLength(3);
            expect(snake.direction).toBe(Direction.RIGHT);
            expect(snake.nextDirection).toBe(Direction.RIGHT);
            expect(snake.actualDirection).toBe(Direction.RIGHT);
        });
    });

    describe('setDirection', () => {
        it('should set direction for valid direction change', () => {
            snake.setDirection(Direction.UP);
            expect(snake.nextDirection).toBe(Direction.UP);
        });

        it('should prevent 180-degree turn (opposite direction)', () => {
            snake.direction = Direction.RIGHT;
            snake.actualDirection = Direction.RIGHT;
            snake.setDirection(Direction.LEFT);
            expect(snake.nextDirection).toBe(Direction.RIGHT);
        });

        it('should allow direction change when current direction is perpendicular', () => {
            snake.direction = Direction.RIGHT;
            snake.actualDirection = Direction.RIGHT;
            snake.setDirection(Direction.UP);
            expect(snake.nextDirection).toBe(Direction.UP);
        });

        it('should queue direction changes', () => {
            snake.direction = Direction.RIGHT;
            snake.actualDirection = Direction.RIGHT;
            snake.setDirection(Direction.UP);
            expect(snake.nextDirection).toBe(Direction.UP);
            
            // Before move, actualDirection is still RIGHT, so LEFT is blocked
            snake.setDirection(Direction.LEFT);
            expect(snake.nextDirection).toBe(Direction.UP); // Should remain UP
            
            // But we can change to DOWN since actualDirection is still RIGHT
            snake.setDirection(Direction.DOWN);
            expect(snake.nextDirection).toBe(Direction.DOWN);
        });
    });

    describe('move', () => {
        it('should move in the current direction', () => {
            const initialHead = { ...snake.body[0] };
            snake.move(null, []);
            
            expect(snake.body[0].x).toBe(initialHead.x + 1);
            expect(snake.body[0].y).toBe(initialHead.y);
        });

        it('should update actualDirection after move', () => {
            snake.setDirection(Direction.UP);
            snake.move(null, []);
            
            expect(snake.actualDirection).toBe(Direction.UP);
            expect(snake.direction).toBe(Direction.UP);
        });

        describe('movement in all directions', () => {
            it('should move up correctly', () => {
                snake.setDirection(Direction.UP);
                const initialHead = { ...snake.body[0] };
                snake.move(null, []);
                
                expect(snake.body[0].x).toBe(initialHead.x);
                expect(snake.body[0].y).toBe(initialHead.y - 1);
            });

            it('should move down correctly', () => {
                snake.setDirection(Direction.DOWN);
                const initialHead = { ...snake.body[0] };
                snake.move(null, []);
                
                expect(snake.body[0].x).toBe(initialHead.x);
                expect(snake.body[0].y).toBe(initialHead.y + 1);
            });

            it('should move left correctly', () => {
                // First move up to avoid 180-degree turn from right to left
                snake.setDirection(Direction.UP);
                snake.move(null, []);
                snake.setDirection(Direction.LEFT);
                const initialHead = { ...snake.body[0] };
                snake.move(null, []);
                
                expect(snake.body[0].x).toBe(initialHead.x - 1);
                expect(snake.body[0].y).toBe(initialHead.y);
            });

            it('should move right correctly', () => {
                snake.direction = Direction.RIGHT;
                const initialHead = { ...snake.body[0] };
                snake.move(null, []);
                
                expect(snake.body[0].x).toBe(initialHead.x + 1);
                expect(snake.body[0].y).toBe(initialHead.y);
            });
        });

        describe('collision detection', () => {
            it('should detect wall collision (not invincible)', () => {
                snake.body[0] = { x: 0, y: 10 };
                // Need to move up first then left to avoid 180-degree prevention
                snake.setDirection(Direction.UP);
                snake.move(null, []);
                snake.body[0] = { x: 0, y: 10 }; // Reset position
                snake.setDirection(Direction.LEFT);
                const result = snake.move(null, []);
                
                expect(result).toBe(false);
            });

            it('should wrap around when invincible and hitting wall', () => {
                snake.invincible = true;
                snake.body[0] = { x: 0, y: 10 };
                // Need to move up first then left to avoid 180-degree prevention
                snake.setDirection(Direction.UP);
                snake.move(null, []);
                snake.body[0] = { x: 0, y: 10 }; // Reset position
                snake.setDirection(Direction.LEFT);
                const result = snake.move(null, []);
                
                expect(result).toBe(true);
                expect(snake.body[0].x).toBe(mockConfig.GRID_COLS - 1);
            });

            it('should detect self-collision', () => {
                // Create a snake that will collide with itself
                snake.body = [
                    { x: 10, y: 10 },
                    { x: 9, y: 10 },
                    { x: 9, y: 11 },
                    { x: 10, y: 11 }
                ];
                snake.setDirection(Direction.DOWN);
                snake.actualDirection = Direction.RIGHT; // Set actual direction
                const result = snake.move(null, []);
                
                expect(result).toBe(false);
            });

            it('should detect obstacle collision', () => {
                const obstacles = [{ x: 16, y: 10 }];
                snake.body[0] = { x: 15, y: 10 };
                snake.direction = Direction.RIGHT;
                const result = snake.move(null, obstacles);
                
                expect(result).toBe(false);
            });
        });

        describe('food collection', () => {
            it('should grow when eating food', () => {
                const foodPos = { x: 16, y: 10 };
                const initialLength = snake.body.length;
                
                snake.body[0] = { x: 15, y: 10 };
                snake.direction = Direction.RIGHT;
                const result = snake.move(foodPos);
                
                expect(result).toBe(true);
                expect(snake.body.length).toBe(initialLength + 1);
            });

            it('should maintain size when not eating food', () => {
                const initialLength = snake.body.length;
                snake.move(null, []);
                
                expect(snake.body.length).toBe(initialLength);
            });
        });
    });

    describe('headPosition', () => {
        it('should return the current head position', () => {
            const head = snake.headPosition();
            expect(head).toEqual(snake.body[0]);
        });

        it('should return a copy of the head (not a mutable reference)', () => {
            const head = snake.headPosition();
            const originalX = snake.body[0].x;
            head.x = 999;
            expect(snake.body[0].x).toBe(originalX);
        });
    });

    describe('updateSize', () => {
        it('should update snake size gradually', () => {
            const initialSize = snake.size;
            snake.updateSize(0.5);
            // It updates by 10% of the difference
            expect(snake.size).toBeCloseTo(initialSize + (0.5 - initialSize) * 0.1, 2);
        });

        it('should handle size changes', () => {
            snake.size = 1;
            snake.updateSize(2);
            expect(snake.size).toBeCloseTo(1.1, 2);
            
            snake.updateSize(-1);
            expect(snake.size).toBeCloseTo(0.89, 2);
        });
    });

    describe('shrink behavior', () => {
        it('should handle shrinkActive state', () => {
            snake.shrinkActive = true;
            const initialSize = snake.size;
            snake.updateSize(0.5);
            
            // Should update size gradually when shrink is active
            expect(snake.size).toBeCloseTo(initialSize + (0.5 - initialSize) * 0.1, 2);
        });

        it('should gradually update size', () => {
            snake.size = 1;
            const targetSize = 0.5;
            
            // Simulate gradual size update
            for (let i = 0; i < 10; i++) {
                snake.updateSize(targetSize);
            }
            
            expect(snake.size).toBeCloseTo(0.65, 1); // After 10 iterations at 10% each
        });
    });

    describe('edge cases', () => {
        it('should handle empty obstacles array', () => {
            const result = snake.move(null, []);
            expect(result).toBe(true);
        });

        it('should handle null food position', () => {
            const initialLength = snake.body.length;
            const result = snake.move(null);
            
            expect(result).toBe(true);
            expect(snake.body.length).toBe(initialLength);
        });

        it('should handle undefined obstacles', () => {
            const result = snake.move(null, undefined);
            expect(result).toBe(true);
        });
    });
});