const nextJest = require('next/jest')

// Providing the path to your Next.js app to load next.config.js and .env files in your test environment
const createJestConfig = nextJest({
  dir: './',
})

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Uncomment if you have a setup file

  // testEnvironment: 'jest-environment-jsdom', // Use jsdom for simulating browser environment if needed
  testEnvironment: 'node', // Use node environment for testing backend/API code primarily

  // If using TypeScript with a baseUrl set to the root directory then you need the below for alias' to work
  moduleDirectories: ['node_modules', '<rootDir>/'],

  // Example: Ignore node_modules except for specific ones if needed
  // transformIgnorePatterns: [
  //   '/node_modules/(?!your-module-to-transform)/',
  // ],

  // Automatically clear mock calls, instances, contexts and results before every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,

  // The directory where Jest should output its coverage files
  coverageDirectory: "coverage",

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: [
    'app/api/**/*.ts', // Collect coverage from API routes
    'lib/**/*.ts',     // Collect coverage from lib utilities
    '!lib/types.ts',   // Exclude type definitions
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!jest.config.js',
    '!next.config.js',
    // Add any other files/patterns to exclude
  ],

  // A list of reporter names that Jest uses when writing coverage reports
  coverageReporters: ["json", "lcov", "text", "clover", "html"],

  // Setup specific environment variables for tests
  // setupFiles: ['dotenv/config'], // Example if using dotenv
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)