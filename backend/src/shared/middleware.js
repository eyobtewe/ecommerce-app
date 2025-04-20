const {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  Context
} = require('aws-lambda');

/**
 * @typedef {function(APIGatewayProxyHandler): APIGatewayProxyHandler} Middleware
 */

/**
 * @typedef {Object} StandardResponse
 * @property {number} statusCode
 * @property {string} body
 * @property {Object.<string, string>} [headers]
 */

class AppError extends Error {
  /**
   * @type {string}
   */
  code;

  /**
   * @type {number}
   */
  statusCode;

  /**
   * @param {string} code
   * @param {string} message
   * @param {number} statusCode
   */
  constructor(code, message, statusCode) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * @type {Middleware}
 */
const withAuth = (handler) => async (event, context) => {
  try {
    /** @type {string | undefined} */
    const userId = event.requestContext && event.requestContext.authorizer && event.requestContext.authorizer.claims && event.requestContext.authorizer.claims.sub;

    if (!userId) {
      return formatResponse(401, {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    const enhancedEvent = {
      ...event,
      userId
    };

    return await handler(enhancedEvent, context, () => { });
  } catch (error) {
    return formatResponse(500, {
      code: 'AUTH_ERROR',
      message: 'Authentication failed'
    });
  }
};

/**
 * @type {Middleware}
 */
const withErrorHandling = (handler) => async (event, context) => {
  try {
    return await handler(event, context, () => { });
  } catch (error) {
    console.error('Error in handler:', error);

    if (error instanceof AppError) {
      return formatResponse(error.statusCode, {
        code: error.code,
        message: error.message
      });
    }

    return formatResponse(500, {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred'
    });
  }
};

/**
 * @param {number} statusCode
 * @param {any} data
 * @returns {APIGatewayProxyResult}
 */
const formatResponse = (statusCode, data) => {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
    },
    body: JSON.stringify(data)
  };
};

module.exports = {
  withAuth,
  withErrorHandling,
  formatResponse,
  AppError
};