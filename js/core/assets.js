// Asset loader class for managing game resources
import { errorManager } from '../systems/error.js';

export class AssetLoader {
  constructor() {
    this.images = {};
    this.sounds = {};
    this.loadErrors = [];
  }

  loadImage(name, src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.images[name] = img;
        resolve(img);
      };
      img.onerror = (err) => {
        const error = new Error(`Failed to load image: ${name}`);
        errorManager.handleAssetError('image', name, error);
        this.loadErrors.push({ type: 'image', name, src, error: err });
        resolve(null); // Resolve to allow game to continue
      };
      img.src = src;
    });
  }

  loadAudio(name, src) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      
      audio.addEventListener('canplaythrough', () => {
        this.sounds[name] = audio;
        resolve(audio);
      }, { once: true });
      
      audio.onerror = (err) => {
        const error = new Error(`Failed to load audio: ${name}`);
        errorManager.handleAssetError('audio', name, error);
        this.loadErrors.push({ type: 'audio', name, src, error: err });
        resolve(null); // Resolve to allow game to continue
      };
      
      audio.loop = (name === 'background');
      audio.preload = 'auto';
      audio.src = src;
      
      // Add timeout for slow connections
      setTimeout(() => {
        if (!this.sounds[name]) {
          const error = new Error(`Audio load timeout: ${name}`);
          errorManager.handleAssetError('audio', name, error);
          this.loadErrors.push({ type: 'audio', name, src, error: 'timeout' });
          resolve(null);
        }
      }, 5000);
    });
  }

  async loadAssets() {
    const results = await Promise.allSettled([
      this.loadImage('background', 'assets/images/snake.png'),
      this.loadAudio('background', 'assets/audio/midnightcarnage.mp3')
    ]);
    
    if (this.loadErrors.length > 0) {
      console.warn('Some assets failed to load:', this.loadErrors);
    }
    
    return results;
  }
}