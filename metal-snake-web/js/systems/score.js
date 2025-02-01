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
    const data = localStorage.getItem(this.storageKey);
    if (data) {
      try {
        this.highScores = JSON.parse(data);
      } catch (error) {
        console.error('Error loading high scores:', error);
        this.highScores = { classic: [], obstacles: [] };
        this.saveScores();
      }
    } else {
      this.saveScores();
    }
  }

  saveScores() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.highScores));
    } catch (error) {
      console.error('Error saving high scores:', error);
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
    return score > (scores[scores.length - 1]?.score || 0);
  }

  clearScores() {
    this.highScores = { classic: [], obstacles: [] };
    this.saveScores();
  }
}