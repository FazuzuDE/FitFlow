module.exports = {
  preset: 'jest-expo',
  modulePaths: ['<rootDir>/node_modules/expo/node_modules'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: ['lib/**/*.{ts,tsx}', '!lib/**/__tests__/**'],
};
