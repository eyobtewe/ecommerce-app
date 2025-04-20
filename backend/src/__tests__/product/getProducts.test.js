const { handler } = require('../../product/getProducts');
const { ddbMock } = require('../helpers/aws-mock');
const { ScanCommand } = require('@aws-sdk/lib-dynamodb');

describe('getProducts Lambda Function', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    ddbMock.reset();
  });

  const mockProducts = [
    {
      id: 'prod1',
      name: 'Test Product 1',
      category: 'electronics',
      isActive: true,
      price: 99.99
    },
    {
      id: 'prod2',
      name: 'Test Product 2',
      category: 'books',
      isActive: true,
      price: 19.99
    },
    {
      id: 'prod3',
      name: 'Inactive Product',
      category: 'electronics',
      isActive: false,
      price: 49.99
    }
  ];

  test('should return all active products without filters', async () => {
    const event = {
      queryStringParameters: null
    };

    ddbMock.on(ScanCommand).resolves({
      Items: mockProducts
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.items).toHaveLength(2); // Only active products
    expect(body.items.every(p => p.isActive !== false)).toBe(true);
  });

  test('should filter products by category', async () => {
    const event = {
      queryStringParameters: {
        category: 'electronics'
      }
    };

    ddbMock.on(ScanCommand).resolves({
      Items: mockProducts
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.items).toHaveLength(1);
    expect(body.items[0].category).toBe('electronics');
    expect(body.items[0].isActive).toBe(true);
  });

  test('should filter products by search term', async () => {
    const event = {
      queryStringParameters: {
        q: 'test'
      }
    };

    ddbMock.on(ScanCommand).resolves({
      Items: mockProducts
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.items).toHaveLength(2);
    expect(body.items.every(p => p.name.toLowerCase().includes('test'))).toBe(true);
  });

  test('should handle pagination', async () => {
    const lastEvaluatedKey = { id: 'lastKey' };
    const event = {
      queryStringParameters: {
        limit: '2',
        lastEvaluatedKey: encodeURIComponent(JSON.stringify(lastEvaluatedKey))
      }
    };

    ddbMock.on(ScanCommand).resolves({
      Items: mockProducts.slice(0, 2),
      LastEvaluatedKey: { id: 'nextKey' }
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.items).toHaveLength(2);
    expect(body.hasMore).toBe(true);
    expect(body.lastEvaluatedKey).toBeTruthy();
  });

  test('should handle DynamoDB errors', async () => {
    const event = {
      queryStringParameters: null
    };

    ddbMock.on(ScanCommand).rejects(new Error('DynamoDB Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Internal server error'
    });
  });
}); 