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
      description: 'Description 1',
      price: 99.99,
      stock: 10,
      category: 'electronics',
      brand: 'Test Brand',
      imageUrls: ['https://example.com/image1.jpg'],
      isActive: true,
      timesOrdered: 5,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'prod2',
      name: 'Test Product 2',
      description: 'Description 2',
      price: 19.99,
      stock: 20,
      category: 'books',
      brand: 'Another Brand',
      imageUrls: ['https://example.com/image2.jpg', 'https://example.com/image3.jpg'],
      isActive: true,
      timesOrdered: 10,
      createdAt: '2024-01-02T00:00:00Z'
    },
    {
      id: 'prod3',
      name: 'Inactive Product',
      category: 'electronics',
      isActive: false,
      price: 49.99
    },
    {
      id: 'prod4',
      name: 'Product with Missing Fields',
      price: 29.99,
      stock: 5,
      isActive: true
    }
  ];

  test('should return all active products with all fields', async () => {
    const event = {
      queryStringParameters: null
    };

    ddbMock.on(ScanCommand).resolves({
      Items: mockProducts
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    // Check response structure
    expect(body).toHaveProperty('items');
    expect(body).toHaveProperty('lastEvaluatedKey');
    expect(body).toHaveProperty('hasMore');

    // Check items length (should exclude inactive products)
    expect(body.items).toHaveLength(3);

    // Check first product has all fields
    const firstProduct = body.items[0];
    expect(firstProduct).toHaveProperty('id');
    expect(firstProduct).toHaveProperty('name');
    expect(firstProduct).toHaveProperty('description');
    expect(firstProduct).toHaveProperty('price');
    expect(firstProduct).toHaveProperty('stock');
    expect(firstProduct).toHaveProperty('category');
    expect(firstProduct).toHaveProperty('brand');
    expect(firstProduct).toHaveProperty('imageUrls');
    expect(firstProduct).toHaveProperty('timesOrdered');
    expect(firstProduct).toHaveProperty('createdAt');
  });

  test('should handle products with missing optional fields', async () => {
    const event = {
      queryStringParameters: null
    };

    ddbMock.on(ScanCommand).resolves({
      Items: [mockProducts[3]] // Product with missing fields
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    const product = body.items[0];
    expect(product.category).toBe('Uncategorized');
    expect(product.brand).toBe('Unknown');
    expect(product.imageUrls).toEqual([]);
    expect(product.timesOrdered).toBe(0);
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