import {
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  Context
} from 'aws-lambda';

// Type for middleware functions
type Middleware = (handler: APIGatewayProxyHandler) => APIGatewayProxyHandler;

// Standard response interface
interface StandardResponse {
  statusCode: number;
  body: string;
  headers?: Record<string, string>;
}

// Custom error class
class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Authentication middleware
export const withAuth: Middleware = (handler) => async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    // Extract user ID from Cognito claims
    const userId = event.requestContext?.authorizer?.claims?.sub;

    if (!userId) {
      return formatResponse(401, {
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
    }

    // Add userId to event for use in handler
    const enhancedEvent = {
      ...event,
      userId
    };

    return await handler(enhancedEvent, context, () => { }) as APIGatewayProxyResult;
  } catch (error) {
    return formatResponse(500, {
      code: 'AUTH_ERROR',
      message: 'Authentication failed'
    });
  }
};

// Error handling middleware
export const withErrorHandling: Middleware = (handler) => async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  try {
    return await handler(event, context, () => { }) as APIGatewayProxyResult;
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

// Response formatting helper
export const formatResponse = (
  statusCode: number,
  data: any
): APIGatewayProxyResult => {
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

// Example usage in a Lambda function:
/*
import { withAuth, withErrorHandling, formatResponse, AppError } from '../shared/middleware';

export const handler: APIGatewayProxyHandler = withAuth(withErrorHandling(async (event) => {
  try {
    // Your handler logic here
    // event.userId is now available from the auth middleware
    
    return formatResponse(200, {
      message: 'Success',
      data: yourData
    });
  } catch (error) {
    throw new AppError('PRODUCT_NOT_FOUND', 'Product not found', 404);
  }
}));
*/ 