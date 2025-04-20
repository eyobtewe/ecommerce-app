const { handler } = require('../../user/postConfirmationTrigger');
const { ddbMock } = require('../helpers/aws-mock');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

describe('postConfirmationTrigger Lambda Function', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  test('should create a user record successfully', async () => {
    const event = {
      request: {
        userAttributes: {
          sub: 'test-user-id',
          email: 'test@example.com'
        }
      }
    };

    // Mock DynamoDB put operation
    ddbMock.on(PutCommand).resolves({});

    const result = await handler(event);
    expect(result).toEqual(event);
  });

  test('should throw error when DynamoDB operation fails', async () => {
    const event = {
      request: {
        userAttributes: {
          sub: 'test-user-id',
          email: 'test@example.com'
        }
      }
    };

    // Mock DynamoDB to throw an error
    ddbMock.on(PutCommand).rejects(new Error('DynamoDB Error'));

    await expect(handler(event)).rejects.toThrow('DynamoDB Error');
  });

  test('should throw error when required user attributes are missing', async () => {
    const event = {
      request: {
        userAttributes: {}
      }
    };

    await expect(handler(event)).rejects.toThrow();
  });
}); 