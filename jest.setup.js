import { jest, beforeEach } from '@jest/globals';

// Mock localStorage with proper ES6 module support
const localStorageStore = {};
const localStorageMock = {
  getItem: jest.fn((key) => localStorageStore[key] || null),
  setItem: jest.fn((key, value) => {
    localStorageStore[key] = value.toString();
  }),
  removeItem: jest.fn((key) => {
    delete localStorageStore[key];
  }),
  clear: jest.fn(() => {
    Object.keys(localStorageStore).forEach(key => delete localStorageStore[key]);
  }),
  length: 0,
  key: jest.fn((index) => {
    const keys = Object.keys(localStorageStore);
    return keys[index] || null;
  })
};

// Override global localStorage
global.localStorage = localStorageMock;

// Reset localStorage before each test
beforeEach(() => {
  localStorageMock.clear();
  localStorageMock.getItem.mockClear();
  localStorageMock.setItem.mockClear();
  localStorageMock.removeItem.mockClear();
  localStorageMock.clear.mockClear();
});

// Mock AudioContext
global.AudioContext = jest.fn().mockImplementation(() => ({
  createOscillator: jest.fn().mockReturnValue({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { setValueAtTime: jest.fn() },
    type: 'sine'
  }),
  createGain: jest.fn().mockReturnValue({
    connect: jest.fn(),
    gain: { 
      setValueAtTime: jest.fn(),
      linearRampToValueAtTime: jest.fn(),
      exponentialRampToValueAtTime: jest.fn()
    }
  }),
  createBiquadFilter: jest.fn().mockReturnValue({
    connect: jest.fn(),
    frequency: { setValueAtTime: jest.fn() },
    Q: { setValueAtTime: jest.fn() },
    type: 'lowpass'
  }),
  destination: {},
  currentTime: 0,
  state: 'running',
  resume: jest.fn().mockResolvedValue(),
  suspend: jest.fn().mockResolvedValue()
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(id => clearTimeout(id));

// Mock Image
global.Image = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn((event, cb) => {
    if (event === 'load') setTimeout(cb, 0);
  }),
  removeEventListener: jest.fn(),
  src: '',
  width: 100,
  height: 100,
  complete: true,
  onload: null,
  onerror: null
}));

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Ensure performance.now is available
if (!global.performance) {
  global.performance = {
    now: jest.fn(() => Date.now())
  };
}

// Mock Sentry if it's being used
global.__SENTRY__ = {
  logger: {
    disable: jest.fn()
  }
};