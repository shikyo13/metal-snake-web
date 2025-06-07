export const MathUtils = {
    randomInt: jest.fn((min, max) => Math.floor(Math.random() * (max - min + 1)) + min),
    randomFloat: jest.fn((min, max) => Math.random() * (max - min) + min),
    clamp: jest.fn((value, min, max) => Math.max(min, Math.min(max, value))),
    lerp: jest.fn((a, b, t) => a + (b - a) * t),
    distance: jest.fn((x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)),
    angle: jest.fn((x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1))
};