// js/systems/progression.js - Player progression and unlockables
export class ProgressionSystem {
  constructor() {
    this.playerData = this.loadPlayerData();
    this.unlockables = this.initializeUnlockables();
    this.challenges = this.initializeDailyChallenges();
    this.initializeRewards();
  }

  initializeUnlockables() {
    return {
      skins: [
        { id: 'classic', name: 'Classic Green', unlocked: true, cost: 0 },
        { id: 'neon', name: 'Neon Glow', unlocked: false, cost: 100 },
        { id: 'pixel', name: 'Pixel Art', unlocked: false, cost: 250 },
        { id: 'rainbow', name: 'Rainbow', unlocked: false, cost: 500 },
        { id: 'ghost', name: 'Ghost', unlocked: false, cost: 750 },
        { id: 'fire', name: 'Fire Trail', unlocked: false, cost: 1000 },
        { id: 'ice', name: 'Ice Crystal', unlocked: false, cost: 1500 },
        { id: 'cosmic', name: 'Cosmic', unlocked: false, cost: 2000 },
        { id: 'matrix', name: 'Matrix', unlocked: false, cost: 3000 },
        { id: 'legendary', name: 'Legendary Gold', unlocked: false, cost: 5000 }
      ],
      
      powerUpUpgrades: {
        speed_boost: { level: 1, maxLevel: 5, cost: [100, 250, 500, 1000, 2000] },
        invincibility: { level: 1, maxLevel: 5, cost: [100, 250, 500, 1000, 2000] },
        score_multiplier: { level: 1, maxLevel: 5, cost: [150, 300, 600, 1200, 2500] },
        magnet: { level: 1, maxLevel: 3, cost: [200, 500, 1000] },
        shrink: { level: 1, maxLevel: 3, cost: [200, 500, 1000] },
        time_slow: { level: 1, maxLevel: 3, cost: [300, 750, 1500] }
      },
      
      gameModifiers: [
        { id: 'start_boost', name: 'Head Start', desc: 'Start with 3 segments', cost: 500 },
        { id: 'coin_magnet', name: 'Coin Magnet', desc: 'Attract coins from further', cost: 750 },
        { id: 'second_chance', name: 'Second Chance', desc: 'Revive once per game', cost: 1000 },
        { id: 'combo_keeper', name: 'Combo Shield', desc: 'Keep combo for 1 mistake', cost: 1500 }
      ],
      
      backgrounds: [
        { id: 'metal', name: 'Heavy Metal', unlocked: true },
        { id: 'cyber', name: 'Cyberpunk', unlocked: false, cost: 300 },
        { id: 'retro', name: 'Retro Arcade', unlocked: false, cost: 300 },
        { id: 'space', name: 'Deep Space', unlocked: false, cost: 500 },
        { id: 'underwater', name: 'Underwater', unlocked: false, cost: 500 }
      ]
    };
  }

  initializeDailyChallenges() {
    const challenges = [
      { 
        id: 'speed_demon',
        name: 'Speed Demon',
        desc: 'Reach speed level 15',
        reward: { coins: 100, xp: 50 },
        progress: 0,
        target: 15
      },
      {
        id: 'combo_master',
        name: 'Combo Master',
        desc: 'Get a 20x combo',
        reward: { coins: 150, xp: 75 },
        progress: 0,
        target: 20
      },
      {
        id: 'survivor',
        name: 'Survivor',
        desc: 'Survive for 5 minutes',
        reward: { coins: 200, xp: 100 },
        progress: 0,
        target: 300
      },
      {
        id: 'collector',
        name: 'Power Collector',
        desc: 'Collect 10 power-ups in one game',
        reward: { coins: 100, xp: 50 },
        progress: 0,
        target: 10
      }
    ];
    
    // Rotate challenges daily
    const today = new Date().toDateString();
    if (this.playerData.lastChallengeDate !== today) {
      this.playerData.lastChallengeDate = today;
      this.playerData.dailyChallenges = this.randomizeChallenges(challenges);
      this.savePlayerData();
    }
    
    return this.playerData.dailyChallenges || this.randomizeChallenges(challenges);
  }

  randomizeChallenges(allChallenges) {
    const shuffled = [...allChallenges].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3); // Pick 3 daily challenges
  }

  initializeRewards() {
    this.levelRewards = [
      { level: 1, coins: 50, unlock: null },
      { level: 5, coins: 100, unlock: 'skin:neon' },
      { level: 10, coins: 200, unlock: 'modifier:start_boost' },
      { level: 15, coins: 300, unlock: 'skin:pixel' },
      { level: 20, coins: 500, unlock: 'background:cyber' },
      { level: 25, coins: 750, unlock: 'skin:rainbow' },
      { level: 30, coins: 1000, unlock: 'modifier:second_chance' },
      { level: 40, coins: 1500, unlock: 'skin:fire' },
      { level: 50, coins: 2000, unlock: 'skin:legendary' }
    ];
  }

  loadPlayerData() {
    const defaultData = {
      coins: 0,
      totalCoins: 0,
      xp: 0,
      level: 1,
      gamesPlayed: 0,
      totalScore: 0,
      bestScore: 0,
      bestCombo: 0,
      totalPlayTime: 0,
      unlockedItems: ['skin:classic', 'background:metal'],
      equippedSkin: 'classic',
      equippedBackground: 'metal',
      statistics: {
        foodEaten: 0,
        powerUpsCollected: 0,
        achievementsUnlocked: 0,
        challengesCompleted: 0
      }
    };
    
    try {
      const saved = localStorage.getItem('metalSnakeProgress');
      return saved ? { ...defaultData, ...JSON.parse(saved) } : defaultData;
    } catch (e) {
      return defaultData;
    }
  }

  savePlayerData() {
    try {
      localStorage.setItem('metalSnakeProgress', JSON.stringify(this.playerData));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }

  addCoins(amount) {
    this.playerData.coins += amount;
    this.playerData.totalCoins += amount;
    this.savePlayerData();
  }

  addXP(amount) {
    this.playerData.xp += amount;
    
    // Check for level up
    const newLevel = this.calculateLevel(this.playerData.xp);
    if (newLevel > this.playerData.level) {
      this.playerData.level = newLevel;
      this.onLevelUp(newLevel);
    }
    
    this.savePlayerData();
  }

  calculateLevel(xp) {
    // XP required = 100 * level^1.5
    return Math.floor(Math.pow(xp / 100, 1 / 1.5)) + 1;
  }

  getXPForLevel(level) {
    return Math.floor(100 * Math.pow(level - 1, 1.5));
  }

  getXPProgress() {
    const currentLevelXP = this.getXPForLevel(this.playerData.level);
    const nextLevelXP = this.getXPForLevel(this.playerData.level + 1);
    const progress = this.playerData.xp - currentLevelXP;
    const required = nextLevelXP - currentLevelXP;
    return { progress, required, percentage: (progress / required) * 100 };
  }

  onLevelUp(newLevel) {
    // Find rewards for this level
    const reward = this.levelRewards.find(r => r.level === newLevel);
    if (reward) {
      this.addCoins(reward.coins);
      if (reward.unlock) {
        this.unlockItem(reward.unlock);
      }
    }
    
    // Trigger level up notification
    return {
      level: newLevel,
      reward: reward
    };
  }

  unlockItem(itemId) {
    if (!this.playerData.unlockedItems.includes(itemId)) {
      this.playerData.unlockedItems.push(itemId);
      this.savePlayerData();
      return true;
    }
    return false;
  }

  purchaseItem(category, itemId, cost) {
    if (this.playerData.coins >= cost) {
      this.playerData.coins -= cost;
      const fullId = `${category}:${itemId}`;
      this.unlockItem(fullId);
      return true;
    }
    return false;
  }

  equipItem(category, itemId) {
    const fullId = `${category}:${itemId}`;
    if (this.playerData.unlockedItems.includes(fullId)) {
      if (category === 'skin') {
        this.playerData.equippedSkin = itemId;
      } else if (category === 'background') {
        this.playerData.equippedBackground = itemId;
      }
      this.savePlayerData();
      return true;
    }
    return false;
  }

  updateChallenge(challengeId, progress) {
    const challenge = this.challenges.find(c => c.id === challengeId);
    if (challenge && challenge.progress < challenge.target) {
      challenge.progress = Math.min(progress, challenge.target);
      
      if (challenge.progress >= challenge.target && !challenge.completed) {
        challenge.completed = true;
        this.addCoins(challenge.reward.coins);
        this.addXP(challenge.reward.xp);
        this.playerData.statistics.challengesCompleted++;
        this.savePlayerData();
        return true; // Challenge completed
      }
    }
    return false;
  }

  getGameEndRewards(score, combo, timeAlive, powerUpsCollected) {
    const rewards = {
      coins: 0,
      xp: 0,
      bonuses: []
    };
    
    // Base rewards
    rewards.coins += Math.floor(score / 10);
    rewards.xp += Math.floor(score / 5);
    
    // Combo bonus
    if (combo >= 10) {
      const comboBonus = Math.floor(combo * 2);
      rewards.coins += comboBonus;
      rewards.bonuses.push({ name: 'Combo Master', coins: comboBonus });
    }
    
    // Survival bonus
    if (timeAlive >= 120) { // 2+ minutes
      const timeBonus = Math.floor(timeAlive / 30) * 10;
      rewards.coins += timeBonus;
      rewards.bonuses.push({ name: 'Survivor', coins: timeBonus });
    }
    
    // Power-up bonus
    if (powerUpsCollected >= 5) {
      const powerBonus = powerUpsCollected * 5;
      rewards.coins += powerBonus;
      rewards.bonuses.push({ name: 'Power Collector', coins: powerBonus });
    }
    
    // First game of the day bonus
    const today = new Date().toDateString();
    if (this.playerData.lastPlayDate !== today) {
      this.playerData.lastPlayDate = today;
      rewards.coins += 50;
      rewards.xp += 25;
      rewards.bonuses.push({ name: 'Daily Bonus', coins: 50 });
    }
    
    return rewards;
  }
}