const { handler } = require('../../product/getProductById');
const { ddbMock } = require('../helpers/aws-mock');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');

describe('getProductById', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it('should return 400 when product ID is missing', async () => {
    const event = {
      pathParameters: {}
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe('Product ID is required');
  });

  it('should return 404 when product is not found', async () => {
    const event = {
      pathParameters: {
        id: 'non-existent-id'
      }
    };

    ddbMock.on(GetCommand).resolves({});

    const response = await handler(event);
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).message).toBe('Product not found');
  });

  it('should return 404 when product is inactive', async () => {
    const event = {
      pathParameters: {
        id: 'inactive-product-id'
      }
    };

    ddbMock.on(GetCommand).resolves({
      Item: { id: 'inactive-product-id', isActive: false }
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).message).toBe('Product not found');
  });

  it('should return product when found and active', async () => {
    const event = {
      pathParameters: {
        id: 'test-product-id'
      }
    };

    const mockProduct = {
      id: 'test-product-id',
      name: 'Test Product',
      price: 29.99,
      description: 'Test Description',
      isActive: true
    };

    ddbMock.on(GetCommand).resolves({
      Item: mockProduct
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body)).toEqual(mockProduct);
  });

  it('should return 500 when DynamoDB throws an error', async () => {
    const event = {
      pathParameters: {
        id: 'test-product-id'
      }
    };

    ddbMock.on(GetCommand).rejects(new Error('DynamoDB Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe('Internal server error');
  });
}); 