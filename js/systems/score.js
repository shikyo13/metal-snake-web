import { errorManager } from './error.js';

export class ScoreManager {
  constructor(config) {
    this.config = config;
    this.storageKey = 'metalSnakeHighScores';
    this.highScores = {
      classic: [],     // Scores for classic mode
      obstacles: []    // Scores for obstacle mode
    };
    this.loadScores();
  }

  loadScores() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
        try {
          const parsed = JSON.parse(data);
          this.highScores = {
            classic: parsed.classic || [],
            obstacles: parsed.obstacles || []
          };
        } catch (error) {
          const result = errorManager.handleError(error, {
            type: 'storage',
            strategy: 'storage',
            operation: 'load_scores',
            defaultValue: { classic: [], obstacles: [] }
          }, 'warning');
          this.highScores = result || { classic: [], obstacles: [] };
          this.saveScores();
        }
      }
    } catch (error) {
      errorManager.handleError(error, {
        type: 'storage',
        strategy: 'storage',
        operation: 'localStorage_access'
      }, 'warning');
      this.highScores = { classic: [], obstacles: [] };
    }
  }

  saveScores() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.highScores));
    } catch (error) {
      errorManager.handleError(error, {
        type: 'storage',
        strategy: 'storage',
        operation: 'save_scores'
      }, 'warning');
    }
  }

  addScore(name, score, mode) {
    // Ensure the mode exists in our high scores
    if (!this.highScores[mode]) {
      this.highScores[mode] = [];
    }

    // Add new score
    this.highScores[mode].push({ 
      name, 
      score,
      date: new Date().toISOString()
    });

    // Sort scores in descending order
    this.highScores[mode].sort((a, b) => b.score - a.score);

    // Keep only the top scores
    this.highScores[mode] = this.highScores[mode]
      .slice(0, this.config.MAX_SCORES);

    // Save updated scores
    this.saveScores();
  }

  getHighScores(mode) {
    return this.highScores[mode] || [];
  }

  isHighScore(score, mode) {
    const scores = this.getHighScores(mode);
    if (scores.length < this.config.MAX_SCORES) {
      return true;
    }
    return score >= (scores[scores.length - 1]?.score || 0);
  }

  clearScores() {
    this.highScores = { classic: [], obstacles: [] };
    this.saveScores();
  }
}