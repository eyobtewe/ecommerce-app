const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { mockClient } = require('aws-sdk-client-mock');
const ddbMock = mockClient(DynamoDBDocumentClient);
const { createAuthorizedEvent } = require('../setup');

// Import Lambda handlers
const getCurrentUser = require('../../user/getCurrentUser');
const getProductById = require('../../product/getProductById');
const getProducts = require('../../product/getProducts');
const getPopularProducts = require('../../product/getPopularProducts');
const getSimilarProducts = require('../../product/getSimilarProducts');

describe('End-to-End Workflow', () => {
  const testUser = {
    userId: 'test-user-id',
    email: 'test@example.com',
    password: 'password123',
    name: 'Test User'
  };

  const testProduct = {
    id: 'test-product-1',
    name: 'Test Product',
    description: 'Test Description',
    price: 29.99,
    category: 'Test Category',
    stock: 10,
    timesOrdered: 10
  };

  let userId;
  let token;

  beforeEach(() => {
    ddbMock.reset();
    // Mock DynamoDB responses
    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(GetCommand).resolves({ Item: null });
    ddbMock.on(QueryCommand).resolves({ Items: [] });
    ddbMock.on(ScanCommand).resolves({ Items: [] });
  });

  afterEach(() => {
    ddbMock.reset();
  });

  it('should complete full user journey from product browsing to viewing', async () => {
    // 1. Get current user
    const userEvent = createAuthorizedEvent('test-user-id');
    ddbMock.on(GetCommand, {
      TableName: process.env.USERS_TABLE,
      Key: { userId: 'test-user-id' }
    }).resolves({ Item: testUser });

    const userResponse = await getCurrentUser.handler(userEvent);
    expect(userResponse.statusCode).toBe(200);
    const user = JSON.parse(userResponse.body);
    expect(user.email).toBe(testUser.email);

    // 2. Get all products
    const products = [
      testProduct,
      { ...testProduct, id: 'test-product-2', name: 'Test Product 2' }
    ];
    ddbMock.on(ScanCommand, {
      TableName: process.env.PRODUCTS_TABLE
    }).resolves({ Items: products });

    const getProductsResponse = await getProducts.handler(userEvent);
    expect(getProductsResponse.statusCode).toBe(200);
    const productsList = JSON.parse(getProductsResponse.body);
    expect(productsList.items.length).toBe(2);

    // 3. Get product by ID
    ddbMock.on(GetCommand, {
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id: testProduct.id }
    }).resolves({ Item: testProduct });

    const getProductEvent = createAuthorizedEvent('test-user-id', {
      pathParameters: { id: testProduct.id }
    });

    const productResponse = await getProductById.handler(getProductEvent);
    expect(productResponse.statusCode).toBe(200);
    const product = JSON.parse(productResponse.body);
    expect(product.id).toBe(testProduct.id);

    // 4. Get popular products
    ddbMock.on(ScanCommand, {
      TableName: process.env.PRODUCTS_TABLE
    }).resolves({ Items: [testProduct] });

    const popularResponse = await getPopularProducts.handler(userEvent);
    expect(popularResponse.statusCode).toBe(200);
    const popularProducts = JSON.parse(popularResponse.body);
    expect(popularProducts.items.length).toBe(1);

    // 5. Get similar products
    ddbMock.on(GetCommand, {
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id: testProduct.id }
    }).resolves({ Item: testProduct });

    ddbMock.on(ScanCommand, {
      TableName: process.env.PRODUCTS_TABLE
    }).resolves({ Items: [products[1]] });

    const similarEvent = createAuthorizedEvent('test-user-id', {
      pathParameters: { id: testProduct.id }
    });

    const similarResponse = await getSimilarProducts.handler(similarEvent);
    expect(similarResponse.statusCode).toBe(200);
    const similarProducts = JSON.parse(similarResponse.body);
    expect(similarProducts.items.length).toBe(1);
    expect(similarProducts.items[0].id).toBe('test-product-2');
  });

  it('should handle errors gracefully during the workflow', async () => {
    // 1. Try to get non-existent user
    const userEvent = createAuthorizedEvent('non-existent-user');
    ddbMock.on(GetCommand, {
      TableName: process.env.USERS_TABLE,
      Key: { userId: 'non-existent-user' }
    }).resolves({ Item: null });

    const userResponse = await getCurrentUser.handler(userEvent);
    expect(userResponse.statusCode).toBe(404);

    // 2. Try to get non-existent product
    ddbMock.on(GetCommand, {
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id: 'non-existent-id' }
    }).resolves({ Item: null });

    const getProductEvent = createAuthorizedEvent('test-user-id', {
      pathParameters: { id: 'non-existent-id' }
    });

    const productResponse = await getProductById.handler(getProductEvent);
    expect(productResponse.statusCode).toBe(404);

    // 3. Try to get similar products for non-existent product
    const similarEvent = createAuthorizedEvent('test-user-id', {
      pathParameters: { id: 'non-existent-id' }
    });

    const similarResponse = await getSimilarProducts.handler(similarEvent);
    expect(similarResponse.statusCode).toBe(404);
  });
}); 