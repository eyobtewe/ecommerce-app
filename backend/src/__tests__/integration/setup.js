const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');

// Set up environment variables for tests
// process.env.ORDERS_TABLE = 'Orders';
// process.env.PRODUCTS_TABLE = 'Products';
// process.env.CART_TABLE = 'Cart';
// process.env.ORDER_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:order-topic';

// Create mock clients
const ddbMock = mockClient(DynamoDBDocumentClient);
const snsMock = mockClient(SNSClient);

// Sample test data
const testProduct = {
  id: 'test-product-1',
  name: 'Test Product',
  price: 99.99,
  description: 'A test product',
  category: 'Electronics',
  stock: 10,
  createdAt: '2024-03-20T10:00:00Z',
  updatedAt: '2024-03-20T10:00:00Z'
};

const testCart = {
  userId: 'test-user-123',
  items: [
    {
      productId: 'test-product-1',
      quantity: 2,
      name: 'Test Product',
      price: 99.99
    }
  ],
  updatedAt: '2024-03-20T10:00:00Z'
};

const testOrder = {
  orderId: 'order-123',
  userId: 'test-user-123',
  items: [
    {
      productId: 'test-product-1',
      quantity: 2,
      name: 'Test Product',
      price: 99.99
    }
  ],
  totalAmount: 199.98,
  status: 'PENDING',
  shippingAddress: {
    street: '123 Test St',
    city: 'Test City',
    state: 'TS',
    zipCode: '12345',
    country: 'US'
  },
  createdAt: '2024-03-20T10:00:00Z',
  updatedAt: '2024-03-20T10:00:00Z'
};

// Setup default mock responses
const setupMockResponses = () => {
  // Reset all mocks
  ddbMock.reset();
  snsMock.reset();

  // Mock Products table responses
  ddbMock
    .on(GetCommand, {
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id: testProduct.id }
    })
    .resolves({ Item: testProduct });

  ddbMock
    .on(QueryCommand, {
      TableName: process.env.PRODUCTS_TABLE
    })
    .resolves({ Items: [testProduct], Count: 1, ScannedCount: 1 });

  // Mock Cart table responses
  ddbMock
    .on(GetCommand, {
      TableName: process.env.CART_TABLE,
      Key: { userId: testCart.userId }
    })
    .resolves({ Item: testCart });

  ddbMock
    .on(PutCommand, {
      TableName: process.env.CART_TABLE
    })
    .resolves({});

  ddbMock
    .on(UpdateCommand, {
      TableName: process.env.CART_TABLE
    })
    .resolves({});

  ddbMock
    .on(DeleteCommand, {
      TableName: process.env.CART_TABLE
    })
    .resolves({});

  // Mock Orders table responses
  ddbMock
    .on(PutCommand, {
      TableName: process.env.ORDERS_TABLE
    })
    .resolves({});

  ddbMock
    .on(QueryCommand, {
      TableName: process.env.ORDERS_TABLE
    })
    .resolves({ Items: [testOrder], Count: 1, ScannedCount: 1 });

  // Mock SNS responses
  snsMock
    .on(PublishCommand)
    .resolves({ MessageId: 'test-message-id' });
};

// Setup before each test
beforeEach(() => {
  setupMockResponses();
});

// Export setup function and mocks
module.exports = {
  ddbMock,
  snsMock,
  testProduct,
  testCart,
  testOrder,
  setupMockResponses
}; 