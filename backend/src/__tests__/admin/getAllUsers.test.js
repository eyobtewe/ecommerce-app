const { handler } = require('../../admin/getAllUsers');
const { ddbMock } = require('../helpers/aws-mock');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');

describe('getAllUsers Lambda Function', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  test('should get all users successfully', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'admin'
          }
        }
      },
      queryStringParameters: null
    };

    // Mock DynamoDB scan operation
    ddbMock.on(ScanCommand).resolves({
      Items: [
        {
          userId: 'user1',
          email: 'user1@example.com',
          role: 'customer',
          joinedAt: '2024-01-01T00:00:00.000Z'
        },
        {
          userId: 'user2',
          email: 'user2@example.com',
          role: 'admin',
          joinedAt: '2024-01-02T00:00:00.000Z'
        }
      ],
      Count: 2,
      ScannedCount: 2
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.users).toHaveLength(2);
    expect(body.users[0]).toHaveProperty('email', 'user1@example.com');
    expect(body.users[1]).toHaveProperty('role', 'admin');
  });

  test('should return 403 when non-admin tries to get users', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'customer'
          }
        }
      }
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Unauthorized: Admin access required'
    });
  });

  test('should handle pagination', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'admin'
          }
        }
      },
      queryStringParameters: {
        limit: '1',
        lastEvaluatedKey: encodeURIComponent(JSON.stringify({ userId: 'user1' }))
      }
    };

    ddbMock.on(ScanCommand).resolves({
      Items: [
        {
          userId: 'user2',
          email: 'user2@example.com',
          role: 'customer'
        }
      ],
      LastEvaluatedKey: { userId: 'user2' }
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.users).toHaveLength(1);
    expect(body.hasMore).toBe(true);
    expect(body.lastEvaluatedKey).toBeTruthy();
  });

  test('should handle DynamoDB errors', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'admin'
          }
        }
      }
    };

    ddbMock.on(ScanCommand).rejects(new Error('DynamoDB Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Internal server error'
    });
  });
}); 