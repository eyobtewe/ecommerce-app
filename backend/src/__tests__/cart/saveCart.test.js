const { handler } = require('../../cart/saveCart');
const { ddbMock } = require('../helpers/aws-mock');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { createAuthorizedEvent } = require('../setup');

describe('saveCart', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it('should return 401 when no user ID is provided', async () => {
    const event = {
      body: JSON.stringify({ items: [] })
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).message).toBe('Unauthorized');
  });

  it('should return 400 when cartItems is missing', async () => {
    const event = createAuthorizedEvent('test-user-id', {
      body: JSON.stringify({})
    });

    ddbMock.on(PutCommand).resolves({});

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toBe('Cart saved');
  });

  it('should save cart successfully', async () => {
    const event = createAuthorizedEvent('test-user-id', {
      body: JSON.stringify({
        items: [
          { productId: '1', quantity: 2 },
          { productId: '2', quantity: 1 }
        ]
      })
    });

    ddbMock.on(PutCommand).resolves({});

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).message).toBe('Cart saved');
  });

  it('should return 500 when DynamoDB throws an error', async () => {
    const event = createAuthorizedEvent('test-user-id', {
      body: JSON.stringify({ items: [] })
    });

    ddbMock.on(PutCommand).rejects(new Error('DynamoDB Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe('Internal server error');
  });
}); 