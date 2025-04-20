const { handler } = require('../../user/getCurrentUser');
const { createAuthorizedEvent } = require('../setup');
const { ddbMock } = require('../helpers/aws-mock');

describe('getCurrentUser', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  it('should return 401 if not authorized', async () => {
    const event = {};
    const response = await handler(event);
    expect(response.statusCode).toBe(401);
    expect(JSON.parse(response.body).message).toBe('Unauthorized');
  });

  it('should return 404 if user not found', async () => {
    const event = createAuthorizedEvent('nonexistent-user');
    const response = await handler(event);
    expect(response.statusCode).toBe(404);
    expect(JSON.parse(response.body).message).toBe('User not found');
  });

  it('should return user data if found', async () => {
    const event = createAuthorizedEvent('test-user-id');
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.userId).toBe('test-user-id');
    expect(body.email).toBe('test@example.com');
  });

  it('should handle DynamoDB errors', async () => {
    ddbMock.on('GetCommand').rejects(new Error('DynamoDB error'));
    const event = createAuthorizedEvent('test-user-id');
    const response = await handler(event);
    expect(response.statusCode).toBe(500);
    expect(JSON.parse(response.body).message).toBe('Internal server error');
  });
}); 