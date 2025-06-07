export const FloatingText = jest.fn();
export const ParticlePresets = {};
export const EffectsManager = jest.fn().mockImplementation(() => ({
    update: jest.fn(),
    render: jest.fn(),
    addFloatingText: jest.fn(),
    addScreenFlash: jest.fn()
}));