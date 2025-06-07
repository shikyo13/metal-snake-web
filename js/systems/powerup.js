// js/systems/powerup.js
import { PowerUpType, GameState, DEBUG } from '../config/constants.js';
import { FloatingText, ParticlePresets } from './effects.js';
import { errorManager } from './error.js';
import { MathUtils } from '../utils/math.js';

export class PowerUp {
    constructor(x, y, type, config) {
        this.x = x;
        this.y = y;  // Removed the +50 offset that was causing positioning issues
        this.type = type;
        this.config = config;
        this.duration = this.config.POWERUP_DURATION;
        this.remainingDuration = this.duration;
        this.collected = false;
        
        if (DEBUG) {
            console.log(`Created power-up: ${type} at (${x}, ${y})`);
        }
    }

    position() {
        return { x: this.x, y: this.y };
    }

    apply(game) {
        try {
            this.collected = true;
            if (DEBUG) {
                console.log(`Applying power-up: ${this.type}`);
            }

            // Apply the power-up effect
            switch (this.type) {
            case PowerUpType.SPEED_BOOST:
                game.config.GAME_SPEED += 3;
                break;
            case PowerUpType.INVINCIBILITY:
                game.snake.invincible = true;
                break;
            case PowerUpType.SCORE_MULTIPLIER:
                game.scoreMultiplier = 2;
                break;
            case PowerUpType.MAGNET:
                game.powerUpManager.magnetActive = true;
                break;
            case PowerUpType.SHRINK:
                game.snake.shrinkActive = true;
                break;
            case PowerUpType.TIME_SLOW:
                game.config.GAME_SPEED *= 0.25;
                break;
            default:
                throw new Error(`Unknown power-up type: ${this.type}`);
        }
        } catch (error) {
            errorManager.handleError(error, {
                type: 'powerup',
                strategy: 'powerup',
                powerUpType: this.type,
                position: { x: this.x, y: this.y },
                defaultValue: null
            }, 'warning');
            return;
        }

        // Set duration and play sound effect
        game.powerUpManager.activePowerUps[this.type] = this.duration;
        if (game.soundManager) {
            game.soundManager.playPowerUpSound(this.type);
        }
    }

    expire(game) {
        try {
            if (DEBUG) {
                console.log(`Power-up expired: ${this.type}`);
            }

            // Remove power-up effect
        switch (this.type) {
            case PowerUpType.SPEED_BOOST:
                game.config.GAME_SPEED = Math.max(
                    game.config.BASE_GAME_SPEED,
                    game.config.GAME_SPEED - 3
                );
                break;
            case PowerUpType.INVINCIBILITY:
                game.snake.invincible = false;
                break;
            case PowerUpType.SCORE_MULTIPLIER:
                game.scoreMultiplier = 1;
                break;
            case PowerUpType.MAGNET:
                game.powerUpManager.magnetActive = false;
                break;
            case PowerUpType.SHRINK:
                game.snake.shrinkActive = false;
                break;
            case PowerUpType.TIME_SLOW:
                game.config.GAME_SPEED = game.config.BASE_GAME_SPEED;
                break;
        }
        delete game.powerUpManager.activePowerUps[this.type];
        } catch (error) {
            errorManager.handleError(error, {
                type: 'powerup',
                strategy: 'powerup',
                operation: 'expire',
                powerUpType: this.type
            }, 'warning');
        }
    }
}

export class PowerUpManager {
    constructor(config) {
        if (!config) {
            console.error('PowerUpManager initialized without config!');
            return;
        }

        this.config = config;
        this.activePowerUps = {};
        this.powerUps = [];
        this.spawnTimer = 0;
        this.magnetActive = false;

        // Initialize debug display if enabled
        if (DEBUG) {
            this.createDebugDisplay();
            this.debugLog('PowerUpManager initialized');
        }
    }

    createDebugDisplay() {
        if (!document.getElementById('powerup-debug')) {
            const debugDiv = document.createElement('div');
            debugDiv.id = 'powerup-debug';
            debugDiv.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: #0f0;
                padding: 10px;
                font-family: monospace;
                font-size: 12px;
                z-index: 1000;
                border: 1px solid #0f0;
                max-height: 200px;
                overflow-y: auto;
                pointer-events: none;
            `;
            document.body.appendChild(debugDiv);
        }
    }

    debugLog(message) {
        if (!DEBUG) return;
        
        const debugDiv = document.getElementById('powerup-debug');
        if (debugDiv) {
            const timestamp = new Date().toISOString().substr(11, 8);
            debugDiv.innerHTML = `${timestamp}: ${message}<br>${debugDiv.innerHTML}`.split('<br>').slice(0, 10).join('<br>');
        }
        console.log(`[PowerUp] ${message}`);
    }

    update(game) {
        // Only process updates in PLAY state
        if (game.state !== GameState.PLAY) {
            if (DEBUG) this.debugLog(`State: ${game.state} (not updating)`);
            return;
        }

        // Increment spawn timer
        this.spawnTimer++;
        
        // Log spawn timer progress
        if (DEBUG && this.spawnTimer % 60 === 0) {
            this.debugLog(`Timer: ${this.spawnTimer}/${this.config.POWERUP_SPAWN_INTERVAL}`);
        }

        // Handle power-up spawning
        if (this.spawnTimer >= this.config.POWERUP_SPAWN_INTERVAL) {
            if (DEBUG) {
                this.debugLog(`Spawn check - Current: ${this.powerUps.length}, Max: ${this.config.POWERUP_COUNT}`);
            }
            
            if (this.powerUps.length < this.config.POWERUP_COUNT) {
                this.spawnPowerUp(game);
            }
            
            this.spawnTimer = 0;
        }

        // Update active power-ups
        for (let type in this.activePowerUps) {
            this.activePowerUps[type]--;
            if (this.activePowerUps[type] <= 0) {
                this.expirePowerUp(type, game);
            }
        }

        // Check for power-up collection
        const head = game.snake.headPosition();
        this.powerUps = this.powerUps.filter(pu => {
            if (pu.x === head.x && pu.y === head.y) {
                if (DEBUG) this.debugLog(`Collected: ${pu.type}`);
                pu.apply(game);
                game.achievementSystem.recordPowerUpCollection(pu.type);
                
                // Update game statistics
                game.gameStats.powerUpsCollected++;
                
                // Award bonus score
                const baseBonus = 5;
                const bonus = Math.round(baseBonus * game.scoreMultiplier);
                game.score += bonus;
                
                // Create visual effects
                const pos = game.renderer.gridToScreen(pu.x, pu.y);
                
                // Get power-up specific color
                const powerUpColors = {
                    speed_boost: game.config.COLORS.YELLOW,
                    invincibility: game.config.COLORS.CYAN,
                    score_multiplier: game.config.COLORS.MAGENTA,
                    magnet: game.config.COLORS.GREEN,
                    shrink: game.config.COLORS.ORANGE,
                    time_slow: game.config.COLORS.PURPLE
                };
                const powerUpColor = powerUpColors[pu.type] || game.config.COLORS.WHITE;
                
                // Create pulse effect that contracts inward (like absorption)
                game.effectsSystem.createPulse(
                    pos.x + game.renderer.cellSize / 2,
                    pos.y + game.renderer.cellSize / 2,
                    powerUpColor,
                    game.renderer.cellSize * 3
                );
                
                // Remove chromatic burst - it's causing the red flash
                
                // Use particle preset for power-up collection
                const preset = ParticlePresets.POWERUP_COLLECT;
                
                // Emit particles with multiple colors for magical effect
                const particlesPerColor = Math.floor(preset.count / preset.colors.length);
                preset.colors.forEach(color => {
                    game.particleSystem.emit(
                        pos.x + game.renderer.cellSize / 2,
                        pos.y + game.renderer.cellSize / 2,
                        particlesPerColor,
                        color
                    );
                });
                
                // Add floating text for power-up name
                const powerUpNames = {
                    speed_boost: "SPEED UP!",
                    invincibility: "INVINCIBLE!",
                    score_multiplier: "2X SCORE!",
                    magnet: "MAGNET!",
                    shrink: "SHRINK!",
                    time_slow: "SLOW TIME!"
                };
                
                game.floatingTexts.push(new FloatingText(
                    pos.x + game.renderer.cellSize / 2,
                    pos.y,
                    powerUpNames[pu.type] || pu.type,
                    game.config.COLORS.YELLOW,
                    20
                ));
                
                // Show score notification
                game.notifications.push({
                    text: `+${bonus}`,
                    duration: 60,
                    color: game.config.COLORS.YELLOW
                });
                
                // Update progression challenges
                game.progressionSystem.updateChallenge('collector', game.gameStats.powerUpsCollected);
                
                return false;  // Remove collected power-up
            }
            return true;  // Keep uncollected power-ups
        });
    }

    spawnPowerUp(game) {
        // Select random power-up type
        const types = Object.values(PowerUpType);
        const type = types[Math.floor(Math.random() * types.length)];
        
        // Get valid spawn position
        let pos = game.getRandomPosition(true);
        if (DEBUG) {
            this.debugLog(`Spawning ${type} at (${pos.x}, ${pos.y})`);
        }
        
        // Create and add new power-up
        const powerup = new PowerUp(pos.x, pos.y, type, this.config);
        this.powerUps.push(powerup);
        
        if (DEBUG) {
            this.debugLog(`Spawned. Total power-ups: ${this.powerUps.length}`);
        }
    }

    expirePowerUp(type, game) {
        if (DEBUG) this.debugLog(`Expiring: ${type}`);
        
        switch (type) {
            case PowerUpType.SPEED_BOOST:
                game.config.GAME_SPEED = Math.max(
                    game.config.BASE_GAME_SPEED,
                    game.config.GAME_SPEED - 3
                );
                break;
            case PowerUpType.INVINCIBILITY:
                game.snake.invincible = false;
                break;
            case PowerUpType.SCORE_MULTIPLIER:
                game.scoreMultiplier = 1;
                break;
            case PowerUpType.MAGNET:
                this.magnetActive = false;
                break;
            case PowerUpType.SHRINK:
                game.snake.shrinkActive = false;
                break;
            case PowerUpType.TIME_SLOW:
                game.config.GAME_SPEED = game.config.BASE_GAME_SPEED;
                break;
        }
        
        delete this.activePowerUps[type];
    }
}