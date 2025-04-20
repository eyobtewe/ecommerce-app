const { handler } = require('../../user/updatePreferences');
const { ddbMock } = require('../helpers/aws-mock');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');

describe('updatePreferences Lambda Function', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  test('should update user preferences successfully', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-id'
          }
        }
      },
      body: JSON.stringify({
        preferredCategories: ['electronics', 'books']
      })
    };

    // Mock DynamoDB update operation
    ddbMock.on(UpdateCommand).resolves({});

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Preferences updated'
    });
  });

  test('should return 401 when no user ID is provided', async () => {
    const event = {
      requestContext: {
        authorizer: {}
      },
      body: JSON.stringify({
        preferredCategories: ['electronics', 'books']
      })
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Internal server error'
    });
  });

  test('should handle empty categories array', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-id'
          }
        }
      },
      body: JSON.stringify({
        preferredCategories: []
      })
    };

    // Mock DynamoDB update operation
    ddbMock.on(UpdateCommand).resolves({});

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Preferences updated'
    });
  });

  test('should handle DynamoDB errors', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            sub: 'test-user-id'
          }
        }
      },
      body: JSON.stringify({
        preferredCategories: ['electronics']
      })
    };

    // Mock DynamoDB to throw an error
    ddbMock.on(UpdateCommand).rejects(new Error('DynamoDB Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Internal server error'
    });
  });
}); 