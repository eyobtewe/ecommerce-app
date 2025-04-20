const { handler } = require('../../review/submitReview');
const { ddbMock } = require('../helpers/aws-mock');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { createAuthorizedEvent } = require('../setup');

describe('submitReview', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it('should return 401 when user ID is missing', async () => {
    const event = {
      pathParameters: {
        productId: 'test-product-id'
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Great product!'
      })
    };

    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).message).toBe('Unauthorized');
  });

  it('should return 400 when product ID is missing', async () => {
    const event = createAuthorizedEvent('test-user-id', {
      pathParameters: {},
      body: JSON.stringify({
        rating: 5,
        comment: 'Great product!'
      })
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe('Product ID is required');
  });

  it('should return 400 when rating is invalid', async () => {
    const event = createAuthorizedEvent('test-user-id', {
      pathParameters: {
        productId: 'test-product-id'
      },
      body: JSON.stringify({
        rating: 6,
        comment: 'Great product!'
      })
    });

    const response = await handler(event);
    expect(response.statusCode).toBe(400);
    expect(JSON.parse(response.body).message).toBe('Invalid rating (1–5)');
  });

  it('should submit review successfully', async () => {
    const event = createAuthorizedEvent('test-user-id', {
      pathParameters: {
        productId: 'test-product-id'
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Great product!'
      })
    });

    ddbMock.on(PutCommand).resolves({});

    const response = await handler(event);
    expect(response.statusCode).toBe(201);
    expect(JSON.parse(response.body).message).toBe('Review submitted');
  });

  it('should return 500 when DynamoDB throws an error', async () => {
    const event = createAuthorizedEvent('test-user-id', {
      pathParameters: {
        productId: 'test-product-id'
      },
      body: JSON.stringify({
        rating: 5,
        comment: 'Great product!'
      })
    });

    ddbMock.on(PutCommand).rejects(new Error('DynamoDB Error'));

    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe('Internal server error');
  });
}); 