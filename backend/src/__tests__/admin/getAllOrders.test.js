const { handler } = require('../../admin/getAllOrders');
const { ddbMock } = require('../helpers/aws-mock');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');

describe('getAllOrders Lambda Function', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  test('should get all orders successfully', async () => {
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
          orderId: 'order1',
          userId: 'user1',
          items: [
            { productId: 'prod1', quantity: 2, price: 99.99 }
          ],
          total: 199.98,
          status: 'completed',
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
          orderId: 'order2',
          userId: 'user2',
          items: [
            { productId: 'prod2', quantity: 1, price: 49.99 }
          ],
          total: 49.99,
          status: 'pending',
          createdAt: '2024-01-02T00:00:00.000Z'
        }
      ],
      Count: 2,
      ScannedCount: 2
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.orders).toHaveLength(2);
    expect(body.orders[0]).toHaveProperty('status', 'completed');
    expect(body.orders[1]).toHaveProperty('total', 49.99);
  });

  test('should return 403 when non-admin tries to get orders', async () => {
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
        lastEvaluatedKey: encodeURIComponent(JSON.stringify({ orderId: 'order1' }))
      }
    };

    ddbMock.on(ScanCommand).resolves({
      Items: [
        {
          orderId: 'order2',
          userId: 'user2',
          items: [{ productId: 'prod2', quantity: 1, price: 49.99 }],
          total: 49.99,
          status: 'pending'
        }
      ],
      LastEvaluatedKey: { orderId: 'order2' }
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.orders).toHaveLength(1);
    expect(body.hasMore).toBe(true);
    expect(body.lastEvaluatedKey).toBeTruthy();
  });

  test('should filter orders by status', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'admin'
          }
        }
      },
      queryStringParameters: {
        status: 'pending'
      }
    };

    ddbMock.on(ScanCommand).resolves({
      Items: [
        {
          orderId: 'order2',
          userId: 'user2',
          items: [{ productId: 'prod2', quantity: 1, price: 49.99 }],
          total: 49.99,
          status: 'pending'
        }
      ]
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.orders).toHaveLength(1);
    expect(body.orders[0].status).toBe('pending');
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