const AWS = require('aws-sdk');
const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

// Mock DynamoDB Document Client
const ddbMock = mockClient(DynamoDBDocumentClient);

// Mock responses for DynamoDB operations
ddbMock.on(GetCommand).callsFake((params) => {
  if (!params.TableName) {
    throw new Error('ValidationException: The provided key element does not match the schema');
  }

  // Mock responses based on table name and key
  if (params.TableName === process.env.USERS_TABLE) {
    if (params.Key.userId === 'test-user-id') {
      return {
        Item: {
          userId: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      };
    }
    if (params.Key.userId === 'test-admin-id') {
      return {
        Item: {
          userId: 'test-admin-id',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin'
        }
      };
    }
    return {};
  }

  if (params.TableName === process.env.PRODUCTS_TABLE) {
    if (params.Key.id === 'test-product-id') {
      return {
        Item: {
          id: 'test-product-id',
          name: 'Test Product',
          price: 100,
          stock: 10
        }
      };
    }
    return {};
  }

  if (params.TableName === process.env.CART_TABLE) {
    if (params.Key.userId === 'test-user-id') {
      return {
        Item: {
          userId: 'test-user-id',
          items: [
            {
              productId: 'test-product-id',
              quantity: 1
            }
          ]
        }
      };
    }
    return {};
  }

  if (params.TableName === process.env.ORDERS_TABLE) {
    if (params.Key.id === 'test-order-id') {
      return {
        Item: {
          id: 'test-order-id',
          userId: 'test-user-id',
          items: [
            {
              productId: 'test-product-id',
              quantity: 1
            }
          ],
          status: 'PENDING'
        }
      };
    }
    return {};
  }

  if (params.TableName === process.env.REVIEWS_TABLE) {
    if (params.Key.id === 'test-review-id') {
      return {
        Item: {
          id: 'test-review-id',
          userId: 'test-user-id',
          productId: 'test-product-id',
          rating: 5,
          comment: 'Great product!'
        }
      };
    }
    return {};
  }

  throw new Error('ResourceNotFoundException: Requested resource not found');
});

ddbMock.on(PutCommand).callsFake((params) => {
  if (!params.TableName) {
    throw new Error('ValidationException: The provided key element does not match the schema');
  }
  return {};
});

ddbMock.on(UpdateCommand).callsFake((params) => {
  if (!params.TableName) {
    throw new Error('ValidationException: The provided key element does not match the schema');
  }
  return {};
});

ddbMock.on(DeleteCommand).callsFake((params) => {
  if (!params.TableName) {
    throw new Error('ValidationException: The provided key element does not match the schema');
  }
  return {};
});

ddbMock.on(QueryCommand).callsFake((params) => {
  if (!params.TableName) {
    throw new Error('ValidationException: The provided key element does not match the schema');
  }

  if (params.TableName === process.env.ORDERS_TABLE && params.KeyConditionExpression.includes('userId')) {
    return {
      Items: [
        {
          id: 'test-order-id',
          userId: 'test-user-id',
          items: [
            {
              productId: 'test-product-id',
              quantity: 1
            }
          ],
          status: 'PENDING'
        }
      ]
    };
  }

  return { Items: [] };
});

// Mock SNS
const snsMock = {
  publish: jest.fn().mockImplementation((params) => {
    return {
      promise: () => Promise.resolve({ MessageId: 'test-message-id' })
    };
  })
};

module.exports = {
  ddbMock,
  snsMock
}; 