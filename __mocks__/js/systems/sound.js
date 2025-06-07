export const soundManager = {
    playPowerUpSound: jest.fn(),
    playPowerUpExpire: jest.fn(),
    resumeAudioContext: jest.fn().mockResolvedValue(true),
    playCollect: jest.fn(),
    playDeath: jest.fn(),
    playPause: jest.fn(),
    playSelect: jest.fn(),
    playToggle: jest.fn(),
    toggleMusic: jest.fn(),
    stopBackgroundMusic: jest.fn(),
    startBackgroundMusic: jest.fn()
};