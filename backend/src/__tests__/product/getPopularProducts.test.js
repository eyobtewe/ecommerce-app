const { handler } = require('../../product/getPopularProducts');
const { AWS } = require('../helpers/aws-mock');

describe('getPopularProducts Lambda Function', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    AWS.restore();
  });

  const mockProducts = [
    {
      productId: 'prod1',
      name: 'Popular Product',
      isActive: true,
      timesOrdered: 100
    },
    {
      productId: 'prod2',
      name: 'Less Popular Product',
      isActive: true,
      timesOrdered: 50
    },
    {
      productId: 'prod3',
      name: 'Inactive Product',
      isActive: false,
      timesOrdered: 200
    },
    {
      productId: 'prod4',
      name: 'New Product',
      isActive: true,
      timesOrdered: 0
    }
  ];

  test('should return products sorted by popularity', async () => {
    const event = {
      queryStringParameters: null
    };

    AWS.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      expect(params.TableName).toBe(process.env.PRODUCTS_TABLE);
      expect(params.Limit).toBe(5); // Default limit
      callback(null, { Items: mockProducts });
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.items).toHaveLength(3); // Only active products
    expect(body.items[0].productId).toBe('prod1'); // Most ordered
    expect(body.items[1].productId).toBe('prod2');
    expect(body.items[2].productId).toBe('prod4'); // Least ordered
  });

  test('should handle custom limit', async () => {
    const event = {
      queryStringParameters: {
        limit: '2'
      }
    };

    AWS.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      expect(params.Limit).toBe(2);
      callback(null, { Items: mockProducts });
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.items).toHaveLength(3); // Still returns all active products, sorted
  });

  test('should handle pagination', async () => {
    const lastEvaluatedKey = { productId: 'lastKey' };
    const event = {
      queryStringParameters: {
        lastEvaluatedKey: encodeURIComponent(JSON.stringify(lastEvaluatedKey))
      }
    };

    AWS.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      expect(params.ExclusiveStartKey).toEqual(lastEvaluatedKey);
      callback(null, {
        Items: mockProducts.slice(0, 2),
        LastEvaluatedKey: { productId: 'nextKey' }
      });
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.hasMore).toBe(true);
    expect(body.lastEvaluatedKey).toBeTruthy();
  });

  test('should handle products with no timesOrdered field', async () => {
    const productsWithoutOrders = [
      {
        productId: 'prod1',
        name: 'Product 1',
        isActive: true
      },
      {
        productId: 'prod2',
        name: 'Product 2',
        isActive: true,
        timesOrdered: 10
      }
    ];

    const event = {
      queryStringParameters: null
    };

    AWS.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(null, { Items: productsWithoutOrders });
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.items[0].productId).toBe('prod2'); // Product with orders comes first
    expect(body.items[1].productId).toBe('prod1'); // Product without orders comes last
  });

  test('should handle DynamoDB errors', async () => {
    const event = {
      queryStringParameters: null
    };

    AWS.mock('DynamoDB.DocumentClient', 'scan', (params, callback) => {
      callback(new Error('DynamoDB Error'));
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body)).toEqual({
      error: 'Internal server error'
    });
  });
}); 