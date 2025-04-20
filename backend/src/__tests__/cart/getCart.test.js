const { handler } = require('../../cart/getCart');
const { ddbMock } = require('../helpers/aws-mock');
const { GetCommand } = require('@aws-sdk/lib-dynamodb');
const { createAuthorizedEvent } = require('../setup');

describe('getCart', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it('should return 401 when no user ID is provided', async () => {
    const event = {};

    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).message).toBe('Unauthorized');
  });

  it('should return empty cart when no cart exists', async () => {
    const event = createAuthorizedEvent('test-user-id');

    ddbMock.on(GetCommand).resolves({});

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.body).cart).toEqual([]);
  });

  it('should return cart items when cart exists', async () => {
    const event = createAuthorizedEvent('test-user-id');

    const mockCart = {
      userId: 'test-user-id',
      items: [
        {
          productId: '1',
          name: 'Product 1',
          price: 10.99,
          quantity: 2
        },
        {
          productId: '2',
          name: 'Product 2',
          price: 15.99,
          quantity: 1
        }
      ]
    };

    ddbMock.on(GetCommand).resolves({
      Item: mockCart
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const cart = JSON.parse(response.body).cart;
    expect(cart).toHaveLength(2);
    expect(cart[0]).toEqual({
      productId: '1',
      name: 'Product 1',
      price: 10.99,
      quantity: 2
    });
  });

  it('should return 500 when DynamoDB throws an error', async () => {
    const event = createAuthorizedEvent('test-user-id');

    ddbMock.on(GetCommand).rejects(new Error('DynamoDB Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe('Internal server error');
  });
}); 