const path = require('path');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({
  path: path.resolve(__dirname, '../../.env.test')
});

/**
 * Creates a test event with proper authorization context
 * @param {string} userId - The user ID to authorize
 * @param {Object} [overrides] - Additional event properties to override
 * @returns {Object} A properly authorized test event
 */
const createAuthorizedEvent = (userId, overrides = {}) => ({
  requestContext: {
    authorizer: {
      claims: {
        sub: userId
      }
    }
  },
  ...overrides
});

module.exports = {
  createAuthorizedEvent
}; 