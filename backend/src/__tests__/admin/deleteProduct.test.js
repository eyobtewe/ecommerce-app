const { handler } = require('../../admin/deleteProduct');
const { ddbMock } = require('../helpers/aws-mock');
const { GetCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

describe('deleteProduct Lambda Function', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  test('should delete a product successfully when never ordered', async () => {
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
      }
    };

    ddbMock.on(GetCommand).resolves({
      Item: {
        productId: 'test-product',
        name: 'Test Product',
        timesOrdered: 0
      }
    });

    ddbMock.on(DeleteCommand).resolves({});

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Product deleted successfully'
    });
  });

  test('should deactivate product when it has been ordered', async () => {
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
      }
    };

    ddbMock.on(GetCommand).resolves({
      Item: {
        productId: 'test-product',
        name: 'Test Product',
        timesOrdered: 1
      }
    });

    ddbMock.on(UpdateCommand).resolves({});

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual({
      message: 'Product deactivated successfully'
    });
  });

  test('should return 403 when non-admin tries to delete product', async () => {
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
      }
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Unauthorized: Admin access required'
    });
  });

  test('should return 403 when authorization context is missing', async () => {
    const event = {
      pathParameters: {
        id: 'test-product'
      }
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(403);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Unauthorized: Admin access required'
    });
  });

  test('should return 400 when product ID is missing', async () => {
    const event = {
      requestContext: {
        authorizer: {
          claims: {
            'custom:role': 'admin'
          }
        }
      },
      pathParameters: {}
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Product ID is required'
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
      }
    };

    ddbMock.on(GetCommand).resolves({ Item: null });

    const response = await handler(event);
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Product not found'
    });
  });

  test('should handle DynamoDB errors during get operation', async () => {
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
      }
    };

    ddbMock.on(GetCommand).rejects(new Error('DynamoDB Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Internal server error'
    });
  });

  test('should handle DynamoDB errors during delete operation', async () => {
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
      }
    };

    ddbMock.on(GetCommand).resolves({
      Item: {
        productId: 'test-product',
        name: 'Test Product',
        timesOrdered: 0
      }
    });

    ddbMock.on(DeleteCommand).rejects(new Error('DynamoDB Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Internal server error'
    });
  });
}); 