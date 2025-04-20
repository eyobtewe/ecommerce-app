const { handler } = require('../../admin/addProduct');
const { ddbMock } = require('../helpers/aws-mock');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

describe('addProduct Lambda Function', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  test('should add a new product successfully', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'admin'
          }
        }
      },
      body: JSON.stringify({
        name: 'New Product',
        description: 'Test Description',
        price: 99.99,
        category: 'electronics',
        imageUrl: 'https://example.com/image.jpg'
      })
    };

    // Mock DynamoDB put operation
    ddbMock.on(PutCommand).resolves({});

    const response = await handler(event);
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Product created successfully');
    expect(body.product).toBeDefined();
    expect(body.product.productId).toBeDefined();
  });

  test('should return 403 when non-admin tries to add product', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'customer'
          }
        }
      },
      body: JSON.stringify({
        name: 'New Product',
        price: 99.99
      })
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Unauthorized: Admin access required'
    });
  });

  test('should return 400 when required fields are missing', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'admin'
          }
        }
      },
      body: JSON.stringify({
        name: 'New Product'
        // Missing required price field
      })
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Missing required fields'
    });
  });

  test('should handle DynamoDB errors', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'admin'
          }
        }
      },
      body: JSON.stringify({
        name: 'New Product',
        description: 'Test Description',
        price: 99.99,
        category: 'electronics',
        imageUrl: 'https://example.com/image.jpg'
      })
    };

    ddbMock.on(PutCommand).rejects(new Error('DynamoDB Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Internal server error'
    });
  });
}); 