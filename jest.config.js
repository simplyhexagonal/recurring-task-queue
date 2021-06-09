module.exports = {
  'roots': [
    '<rootDir>/src',
    '<rootDir>/specs',
  ],
  'testMatch': [
    '**/specs/**/*.spec.ts',
  ],
  'transform': {
    '^.+\\.ts$': 'ts-jest',
  },
};
