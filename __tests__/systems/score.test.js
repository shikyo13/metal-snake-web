import { jest } from '@jest/globals';
import { ScoreManager } from '../../js/systems/score.js';
import { CONFIG } from '../../js/config/constants.js';

describe('ScoreManager', () => {
    let scoreManager;
    let mockConfig;
    const STORAGE_KEY = 'metalSnakeHighScores'; // Match actual implementation

    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.clear();
        jest.clearAllMocks();
        
        mockConfig = {
            ...CONFIG,
            MAX_SCORES: 5
        };
        
        scoreManager = new ScoreManager(mockConfig);
    });

    describe('constructor', () => {
        it('should initialize with empty high scores', () => {
            expect(scoreManager.config).toBe(mockConfig);
            expect(scoreManager.highScores).toEqual({
                classic: [],
                obstacles: []
            });
        });

        it('should load existing scores from localStorage', () => {
            const existingScores = {
                classic: [
                    { name: 'Player1', score: 100 },
                    { name: 'Player2', score: 50 }
                ],
                obstacles: [
                    { name: 'Player3', score: 200 }
                ]
            };
            
            // Set scores before creating manager
            localStorage.setItem(STORAGE_KEY, JSON.stringify(existingScores));
            
            // Create new manager - it should load the existing scores
            const newScoreManager = new ScoreManager(mockConfig);
            
            expect(newScoreManager.highScores).toEqual(existingScores);
        });
    });

    describe('loadScores', () => {
        it('should load valid scores from localStorage', () => {
            const scores = {
                classic: [{ name: 'Test', score: 100 }],
                obstacles: []
            };
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
            
            scoreManager.loadScores();
            
            expect(scoreManager.highScores).toEqual(scores);
        });

        it('should handle invalid JSON in localStorage', () => {
            localStorage.setItem(STORAGE_KEY, 'invalid json');
            
            scoreManager.loadScores();
            
            expect(scoreManager.highScores).toEqual({
                classic: [],
                obstacles: []
            });
        });

        it('should handle missing localStorage data', () => {
            localStorage.removeItem(STORAGE_KEY);
            
            scoreManager.loadScores();
            
            expect(scoreManager.highScores).toEqual({
                classic: [],
                obstacles: []
            });
        });

        it('should load partial data as-is (missing modes not auto-initialized)', () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                classic: [{ name: 'Test', score: 100 }]
                // obstacles mode missing
            }));

            scoreManager.loadScores();

            expect(scoreManager.highScores.classic).toHaveLength(1);
            expect(scoreManager.highScores.obstacles).toBeUndefined();
        });
    });

    describe('saveScores', () => {
        it('should save scores to localStorage', () => {
            scoreManager.highScores = {
                classic: [{ name: 'Test', score: 100 }],
                obstacles: []
            };
            
            scoreManager.saveScores();
            
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            expect(saved).toEqual(scoreManager.highScores);
        });

        it('should handle localStorage errors', () => {
            // Use spyOn to mock setItem throwing
            const setItemSpy = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('Storage full');
            });

            expect(() => scoreManager.saveScores()).not.toThrow();

            setItemSpy.mockRestore();
        });
    });

    describe('addScore', () => {
        it('should add score to classic mode', () => {
            scoreManager.addScore('Player1', 100, 'classic');
            
            expect(scoreManager.highScores.classic).toHaveLength(1);
            expect(scoreManager.highScores.classic[0]).toMatchObject({
                name: 'Player1',
                score: 100
            });
            expect(scoreManager.highScores.classic[0].date).toBeDefined();
        });

        it('should add score to obstacles mode', () => {
            scoreManager.addScore('Player1', 200, 'obstacles');
            
            expect(scoreManager.highScores.obstacles).toHaveLength(1);
            expect(scoreManager.highScores.obstacles[0]).toMatchObject({
                name: 'Player1',
                score: 200
            });
            expect(scoreManager.highScores.obstacles[0].date).toBeDefined();
        });

        it('should maintain scores in descending order', () => {
            scoreManager.addScore('Player1', 50, 'classic');
            scoreManager.addScore('Player2', 100, 'classic');
            scoreManager.addScore('Player3', 75, 'classic');
            
            expect(scoreManager.highScores.classic).toHaveLength(3);
            expect(scoreManager.highScores.classic[0]).toMatchObject({ name: 'Player2', score: 100 });
            expect(scoreManager.highScores.classic[1]).toMatchObject({ name: 'Player3', score: 75 });
            expect(scoreManager.highScores.classic[2]).toMatchObject({ name: 'Player1', score: 50 });
        });

        it('should limit scores to MAX_SCORES', () => {
            for (let i = 0; i < 10; i++) {
                scoreManager.addScore(`Player${i}`, i * 10, 'classic');
            }
            
            expect(scoreManager.highScores.classic).toHaveLength(mockConfig.MAX_SCORES);
            // Should keep the highest scores
            expect(scoreManager.highScores.classic[0].score).toBe(90);
            expect(scoreManager.highScores.classic[4].score).toBe(50);
        });

        it('should save after adding score', () => {
            const saveSpy = jest.spyOn(scoreManager, 'saveScores');
            
            scoreManager.addScore('Player1', 100, 'classic');
            
            expect(saveSpy).toHaveBeenCalled();
        });

        it('should handle invalid mode gracefully', () => {
            scoreManager.addScore('Player1', 100, 'invalid');
            
            expect(scoreManager.highScores.classic).toHaveLength(0);
            expect(scoreManager.highScores.obstacles).toHaveLength(0);
        });
    });

    describe('getHighScores', () => {
        beforeEach(() => {
            scoreManager.highScores = {
                classic: [
                    { name: 'Player1', score: 100 },
                    { name: 'Player2', score: 50 }
                ],
                obstacles: [
                    { name: 'Player3', score: 200 }
                ]
            };
        });

        it('should return scores for classic mode', () => {
            const scores = scoreManager.getHighScores('classic');
            
            expect(scores).toEqual([
                { name: 'Player1', score: 100 },
                { name: 'Player2', score: 50 }
            ]);
        });

        it('should return scores for obstacles mode', () => {
            const scores = scoreManager.getHighScores('obstacles');
            
            expect(scores).toEqual([
                { name: 'Player3', score: 200 }
            ]);
        });

        it('should return empty array for invalid mode', () => {
            const scores = scoreManager.getHighScores('invalid');
            
            expect(scores).toEqual([]);
        });

        it('should return a reference to the scores array', () => {
            const scores = scoreManager.getHighScores('classic');
            scores.push({ name: 'Hacker', score: 9999 });
            
            // The implementation returns a reference, not a copy
            expect(scoreManager.highScores.classic).toHaveLength(3);
        });
    });

    describe('isHighScore', () => {
        beforeEach(() => {
            scoreManager.highScores = {
                classic: [
                    { name: 'Player1', score: 100 },
                    { name: 'Player2', score: 80 },
                    { name: 'Player3', score: 60 },
                    { name: 'Player4', score: 40 },
                    { name: 'Player5', score: 20 }
                ],
                obstacles: []
            };
        });

        it('should return true for score higher than lowest', () => {
            expect(scoreManager.isHighScore(30, 'classic')).toBe(true);
        });

        it('should return false for score lower than lowest', () => {
            expect(scoreManager.isHighScore(10, 'classic')).toBe(false);
        });

        it('should return true when less than MAX_SCORES entries', () => {
            expect(scoreManager.isHighScore(10, 'obstacles')).toBe(true);
        });

        it('should return false for equal score (must beat lowest)', () => {
            expect(scoreManager.isHighScore(20, 'classic')).toBe(false);
        });

        it('should return true for unknown mode (less than MAX_SCORES entries)', () => {
            expect(scoreManager.isHighScore(100, 'invalid')).toBe(true);
        });
    });

    describe('clearScores', () => {
        it('should clear all scores', () => {
            scoreManager.highScores = {
                classic: [{ name: 'Player1', score: 100 }],
                obstacles: [{ name: 'Player2', score: 200 }]
            };
            
            scoreManager.clearScores();
            
            expect(scoreManager.highScores).toEqual({
                classic: [],
                obstacles: []
            });
        });

        it('should save after clearing', () => {
            const saveSpy = jest.spyOn(scoreManager, 'saveScores');
            
            scoreManager.clearScores();
            
            expect(saveSpy).toHaveBeenCalled();
        });

        it('should clear localStorage', () => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                classic: [{ name: 'Test', score: 100 }]
            }));
            
            scoreManager.clearScores();
            
            const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            expect(saved).toEqual({
                classic: [],
                obstacles: []
            });
        });
    });

    describe('edge cases and error handling', () => {
        it('should handle empty name', () => {
            scoreManager.addScore('', 100, 'classic');
            
            expect(scoreManager.highScores.classic[0]).toMatchObject({
                name: '',
                score: 100
            });
        });

        it('should handle negative scores', () => {
            scoreManager.addScore('Player1', -50, 'classic');
            
            expect(scoreManager.highScores.classic[0]).toMatchObject({
                name: 'Player1',
                score: -50
            });
        });

        it('should handle very large scores', () => {
            scoreManager.addScore('Player1', Number.MAX_SAFE_INTEGER, 'classic');
            
            expect(scoreManager.highScores.classic[0].score).toBe(Number.MAX_SAFE_INTEGER);
        });

        it('should handle concurrent modifications', () => {
            // Simulate another instance modifying localStorage
            scoreManager.highScores.classic = [{ name: 'Player1', score: 100 }];
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                classic: [{ name: 'Player2', score: 200 }],
                obstacles: []
            }));
            
            // Load should overwrite local changes
            scoreManager.loadScores();
            
            expect(scoreManager.highScores.classic[0].name).toBe('Player2');
        });
    });

    describe('combo multiplier calculations', () => {
        it('should correctly apply score with multiplier', () => {
            const baseScore = 10;
            const multiplier = 3;
            const totalScore = baseScore * multiplier;
            
            scoreManager.addScore('Player1', totalScore, 'classic');
            
            expect(scoreManager.highScores.classic[0].score).toBe(30);
        });

        it('should handle score calculations with obstacles bonus', () => {
            const baseScore = 10;
            const comboMultiplier = 2;
            const obstacleBonus = CONFIG.OBSTACLE_BONUS || 2;
            const totalScore = baseScore * comboMultiplier * obstacleBonus;
            
            scoreManager.addScore('Player1', totalScore, 'obstacles');
            
            expect(scoreManager.highScores.obstacles[0].score).toBe(40);
        });
    });
});