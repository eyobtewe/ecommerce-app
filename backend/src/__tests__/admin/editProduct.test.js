const { handler } = require('../../admin/editProduct');
const { ddbMock } = require('../helpers/aws-mock');
const { GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

describe('editProduct Lambda Function', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  test('should edit a product successfully', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'admin'
          }
        }
      },
      pathParameters: {
        id: 'test-product'
      },
      body: JSON.stringify({
        name: 'Updated Product',
        description: 'Updated Description',
        price: 149.99,
        category: 'electronics',
        imageUrl: 'https://example.com/updated.jpg'
      })
    };

    // Mock DynamoDB get operation to check if product exists
    ddbMock.on(GetCommand).resolves({
      Item: {
        productId: 'test-product',
        name: 'Original Product',
        price: 99.99
      }
    });

    // Mock DynamoDB update operation
    ddbMock.on(UpdateCommand).resolves({
      Attributes: {
        productId: 'test-product',
        name: 'Updated Product',
        price: 149.99,
        updatedAt: expect.any(String)
      }
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Product updated successfully');
    expect(body.product).toBeDefined();
    expect(body.product.name).toBe('Updated Product');
  });

  test('should return 403 when non-admin tries to edit product', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'customer'
          }
        }
      },
      pathParameters: {
        id: 'test-product'
      },
      body: JSON.stringify({
        name: 'Updated Product',
        price: 149.99
      })
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Unauthorized: Admin access required'
    });
  });

  test('should return 404 when product not found', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'admin'
          }
        }
      },
      pathParameters: {
        id: 'non-existent'
      },
      body: JSON.stringify({
        name: 'Updated Product',
        price: 149.99
      })
    };

    ddbMock.on(GetCommand).resolves({ Item: null });

    const response = await handler(event);
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Product not found'
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
      pathParameters: {
        id: 'test-product'
      },
      body: JSON.stringify({
        name: 'Updated Product',
        price: 149.99
      })
    };

    ddbMock.on(GetCommand).rejects(new Error('DynamoDB Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Internal server error'
    });
  });
}); 