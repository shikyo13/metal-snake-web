export default {
  testEnvironment: 'jest-environment-jsdom',
  setupFiles: ['jest-canvas-mock', 'jest-localstorage-mock'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {},
  transform: {},
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  collectCoverageFrom: [
    'js/**/*.js',
    '!js/ui/**',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 10,
      functions: 10,
      lines: 10,
      statements: 10
    }
  },
  coverageReporters: ['text', 'lcov'],
  moduleDirectories: ['node_modules', '<rootDir>'],
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  testPathIgnorePatterns: ['/node_modules/'],
  clearMocks: true
};