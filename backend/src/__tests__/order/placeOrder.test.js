const { handler } = require('../../order/placeOrder');
const { ddbMock } = require('../helpers/aws-mock');
const { PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { PublishCommand } = require('@aws-sdk/client-sns');
const { createAuthorizedEvent } = require('../setup');

describe('placeOrder', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it('should return 401 when user ID or email is missing', async () => {
    const event = {
      body: JSON.stringify({
        items: [],
        total: 0,
        shippingAddress: {}
      })
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).message).toBe('Unauthorized');
  });

  it('should place order successfully', async () => {
    const event = createAuthorizedEvent('test-user-id', {
      body: JSON.stringify({
        items: [
          {
            productId: 'product-1',
            quantity: 2,
            price: 10.99
          },
          {
            productId: 'product-2',
            quantity: 1,
            price: 15.99
          }
        ],
        total: 37.97,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      })
    });

    // Mock DynamoDB put command for order
    ddbMock.on(PutCommand).resolves({});

    // Mock DynamoDB update command for product popularity
    ddbMock.on(UpdateCommand).resolves({});

    // Mock SNS publish command
    ddbMock.on(PublishCommand).resolves({});

    const response = await handler(event);
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Order placed');
    expect(body.orderId).toBeDefined();
  });

  it('should return 500 when DynamoDB throws an error', async () => {
    const event = createAuthorizedEvent('test-user-id', {
      body: JSON.stringify({
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            price: 10.99
          }
        ],
        total: 10.99,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      })
    });

    ddbMock.on(PutCommand).rejects(new Error('DynamoDB Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe('Internal server error');
  });

  it('should return 500 when SNS throws an error', async () => {
    const event = createAuthorizedEvent('test-user-id', {
      body: JSON.stringify({
        items: [
          {
            productId: 'product-1',
            quantity: 1,
            price: 10.99
          }
        ],
        total: 10.99,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      })
    });

    // Mock successful DynamoDB operations
    ddbMock.on(PutCommand).resolves({});
    ddbMock.on(UpdateCommand).resolves({});

    // Mock SNS to throw error
    ddbMock.on(PublishCommand).rejects(new Error('SNS Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe('Internal server error');
  });
}); 