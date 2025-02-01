// js/systems/sound.js
export class SoundManager {
  constructor(assetLoader) {
    this.assetLoader = assetLoader;
    this.isInitialized = false;
    this.audioCtx = null;
    this.masterGain = null;
    this.compressor = null;
    this.reverbNode = null;
  }

  // Initialize audio context only after user interaction.
  // This updated version includes a fallback timeout.
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // Create the audio processing chain.
      this.masterGain = this.audioCtx.createGain();
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.reverbNode = await this.createReverb();

      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.reverbNode);
      this.reverbNode.connect(this.audioCtx.destination);

      // Configure compressor.
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = 12;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      // Create a promise that resolves when the AudioContext is no longer suspended.
      const waitForResume = new Promise(resolve => {
        const checkState = () => {
          if (this.audioCtx.state !== 'suspended') {
            resolve();
          } else {
            setTimeout(checkState, 100);
          }
        };
        checkState();
      });

      // Race the waiting promise against a timeout fallback of 3000ms.
      await Promise.race([waitForResume, new Promise(resolve => setTimeout(resolve, 3000))]);

      // Even if still suspended, we now allow the game to continue.
      this.isInitialized = true;
    } catch (err) {
      console.error("SoundManager initialization error:", err);
      // Fallback: mark as initialized to allow game start.
      this.isInitialized = true;
    }
  }

  async createReverb() {
    const convolver = this.audioCtx.createConvolver();
    const sampleRate = this.audioCtx.sampleRate;
    const length = sampleRate * 2;
    const buffer = this.audioCtx.createBuffer(2, length, sampleRate);
    
    // Create impulse response
    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.1));
      }
    }
    convolver.buffer = buffer;
    return convolver;
  }

  async playSound(type, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    
    osc.type = options.type || 'sine';
    osc.frequency.value = options.frequency || 440;
    gain.gain.value = options.volume || 0.2;
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start();
    osc.stop(this.audioCtx.currentTime + (options.duration || 0.1));
  }

  async playBackgroundMusic() {
    if (!this.isInitialized) {
      await this.initialize();
    }
    const bg = this.assetLoader.sounds['background'];
    if (bg) {
      try {
        bg.volume = 0.5;
        await bg.play();
      } catch (err) {
        console.log("Background music will play after user interaction");
      }
    }
  }

  playGameOverSound() {
    const duration = 1.0;
    this.playSound('gameover-bass', {
      type: 'sine',
      frequency: 110,
      duration: duration,
      volume: 0.3
    });
    setTimeout(() => {
      this.playSound('gameover-mid', {
        type: 'square',
        frequency: 220,
        duration: duration * 0.75,
        volume: 0.2
      });
    }, 100);
    setTimeout(() => {
      this.playSound('gameover-high', {
        type: 'triangle',
        frequency: 440,
        duration: duration * 0.5,
        volume: 0.1
      });
    }, 200);
  }

  playComboSound(comboCount) {
    this.playSound('combo', {
      type: 'sine',
      frequency: 440 + (comboCount * 50),
      duration: 0.1,
      volume: Math.min(0.4, 0.2 + (comboCount * 0.02))
    });
  }

  toggleMusic() {
    const bg = this.assetLoader.sounds['background'];
    if (bg.paused) {
      bg.play();
    } else {
      bg.pause();
    }
  }

  adjustVolume(amount) {
    const bg = this.assetLoader.sounds['background'];
    if (bg) {
      bg.volume = Math.max(0, Math.min(1, bg.volume + amount));
    }
  }

  // --- Power-up Sound Methods ---

  playFoodPickupSound() {
    this.playSound('food-pickup', {
      type: 'sine',
      frequency: 880,
      duration: 0.1,
      volume: 0.2
    });
  }

  playSpeedBoostSound() {
    this.playSound('speed-boost', {
      type: 'triangle',
      frequency: 600,
      duration: 0.15,
      volume: 0.3
    });
  }

  playInvincibilitySound() {
    this.playSound('invincibility', {
      type: 'square',
      frequency: 400,
      duration: 0.15,
      volume: 0.3
    });
  }

  playScoreMultiplierSound() {
    this.playSound('score-multiplier', {
      type: 'sawtooth',
      frequency: 500,
      duration: 0.15,
      volume: 0.3
    });
  }

  playMagnetSound() {
    this.playSound('magnet', {
      type: 'sine',
      frequency: 700,
      duration: 0.15,
      volume: 0.3
    });
  }

  playShrinkSound() {
    this.playSound('shrink', {
      type: 'sine',
      frequency: 300,
      duration: 0.15,
      volume: 0.3
    });
  }

  playTimeSlowSound() {
    this.playSound('time-slow', {
      type: 'sine',
      frequency: 200,
      duration: 0.15,
      volume: 0.3
    });
  }

  // Unified method for power-up sounds.
  playPowerUpSound(type) {
    switch(type) {
      case 'speed_boost':
        this.playSpeedBoostSound();
        break;
      case 'invincibility':
        this.playInvincibilitySound();
        break;
      case 'score_multiplier':
        this.playScoreMultiplierSound();
        break;
      case 'magnet':
        this.playMagnetSound();
        break;
      case 'shrink':
        this.playShrinkSound();
        break;
      case 'time_slow':
        this.playTimeSlowSound();
        break;
      default:
        console.warn("No sound defined for power-up type:", type);
    }
  }
}
