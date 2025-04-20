module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/integration/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
    '!src/shared/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFiles: ['<rootDir>/src/__tests__/integration/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/integration/setupAfterEnv.js'],
  globals: {
    __TEST__: true
  },
  testEnvironmentVariables: {
    PRODUCTS_TABLE: 'ecommerce-prod-products',
    ORDERS_TABLE: 'ecommerce-prod-orders',
    USERS_TABLE: 'ecommerce-prod-users',
    CART_TABLE: 'ecommerce-prod-cart',
    REVIEWS_TABLE: 'ecommerce-prod-reviews',

    ORDER_TOPIC_ARN: 'arn:aws:sns:us-east-1:123456789012:order-topic'
  },
  testTimeout: 30000, // 30 seconds timeout for integration tests
}; 