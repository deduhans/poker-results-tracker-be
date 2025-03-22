module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest'
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/', '<rootDir>/test/'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/$1',
    '^@test/(.*)$': '<rootDir>/test/$1',
    '^@entities/(.*)$': '<rootDir>/src/typeorm/$1',
    '^@common/(.*)$': '<rootDir>/src/common/$1'
  },
  globalSetup: '<rootDir>/test/jest-global-setup.ts',
  globalTeardown: '<rootDir>/test/jest-global-teardown.ts'
};