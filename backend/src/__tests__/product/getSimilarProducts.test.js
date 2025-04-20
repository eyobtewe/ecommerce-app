const { handler } = require('../../product/getSimilarProducts');
const { AWS } = require('../helpers/aws-mock');

describe('getSimilarProducts Lambda Function', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    AWS.restore();
  });

  const mockProducts = [
    {
      id: 'prod1',
      name: 'Base Product',
      category: 'electronics',
      isActive: true,
      price: 100,
      timesOrdered: 50
    },
    {
      id: 'prod2',
      name: 'Similar Product 1',
      category: 'electronics',
      isActive: true,
      price: 150,
      timesOrdered: 100
    },
    {
      id: 'prod3',
      name: 'Similar Product 2',
      category: 'electronics',
      isActive: true,
      price: 80,
      timesOrdered: 30
    },
    {
      id: 'prod4',
      name: 'Different Category',
      category: 'books',
      isActive: true,
      price: 20,
      timesOrdered: 200
    },
    {
      id: 'prod5',
      name: 'Inactive Product',
      category: 'electronics',
      isActive: false,
      price: 90,
      timesOrdered: 150
    }
  ];

  test('should return similar products sorted by times ordered', async () => {
    const event = {
      pathParameters: {
        id: 'prod1'
      },
      queryStringParameters: null
    };

    // Mock get operation for base product
    AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      const product = mockProducts.find(p => p.id === params.Key.id);
      callback(null, { Item: product });
    });

    // Mock scan operation for similar products
    AWS.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, { Items: mockProducts });
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.items).toHaveLength(2); // Only similar active products in same category
    expect(body.items[0].id).toBe('prod2'); // Most ordered
    expect(body.items[1].id).toBe('prod3'); // Least ordered
  });

  test('should sort by price when specified', async () => {
    const event = {
      pathParameters: {
        id: 'prod1'
      },
      queryStringParameters: {
        sortBy: 'price',
        sortOrder: 'asc'
      }
    };

    AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      const product = mockProducts.find(p => p.id === params.Key.id);
      callback(null, { Item: product });
    });

    AWS.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, { Items: mockProducts });
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.items[0].id).toBe('prod3'); // Lowest price
    expect(body.items[1].id).toBe('prod2'); // Highest price
  });

  test('should handle product not found', async () => {
    const event = {
      pathParameters: {
        id: 'nonexistent'
      }
    };

    AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      callback(null, { Item: null });
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Product not found or missing category'
    });
  });

  test('should handle pagination', async () => {
    const lastEvaluatedKey = { id: 'lastKey' };
    const event = {
      pathParameters: {
        id: 'prod1'
      },
      queryStringParameters: {
        limit: '2',
        lastEvaluatedKey: encodeURIComponent(JSON.stringify(lastEvaluatedKey))
      }
    };

    AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      const product = mockProducts.find(p => p.id === params.Key.id);
      callback(null, { Item: product });
    });

    AWS.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      expect(params.Limit).toBe(4); // 2 * limit for filtering
      expect(params.ExclusiveStartKey).toEqual(lastEvaluatedKey);
      callback(null, {
        Items: mockProducts.slice(0, 3),
        LastEvaluatedKey: { id: 'nextKey' }
      });
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.hasMore).toBe(true);
    expect(body.lastEvaluatedKey).toBeTruthy();
  });

  test('should handle missing product ID', async () => {
    const event = {
      pathParameters: null
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Internal server error'
    });
  });

  test('should handle DynamoDB errors', async () => {
    const event = {
      pathParameters: {
        id: 'prod1'
      }
    };

    AWS.mock('DynamoDB.DocumentClient', 'get', (params, callback) => {
      callback(new Error('DynamoDB Error'));
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Internal server error'
    });
  });
}); 