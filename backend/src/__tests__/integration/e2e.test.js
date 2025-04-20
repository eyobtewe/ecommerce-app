const { ddbMock, snsMock, testProduct } = require('./setup');
const { placeOrder } = require('../../handlers/order');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { PublishCommand } = require('@aws-sdk/client-sns');

describe('Order Service End-to-End Tests', () => {
  const mockEvent = {
    requestContext: {
      authorizer: {
        claims: {
          sub: 'test-user-123'
        }
      }
    }
  };

  beforeEach(() => {
    ddbMock.reset();
    snsMock.reset();
  });

  it('should successfully place an order', async () => {
    const placeOrderEvent = {
      ...mockEvent,
      body: JSON.stringify({
        items: [
          {
            productId: testProduct.id,
            quantity: 3
          }
        ],
        totalAmount: 299.97,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      })
    };

    const response = await placeOrder(placeOrderEvent);
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Order placed successfully');
    expect(body.orderId).toBeDefined();

    // Verify order was created in DynamoDB
    const putCommandCalls = ddbMock.commandCalls(PutCommand);
    expect(putCommandCalls).toHaveLength(1);
    const putParams = putCommandCalls[0].args[0].input;
    expect(putParams.TableName).toBe(process.env.ORDERS_TABLE);
    expect(putParams.Item).toMatchObject({
      userId: 'test-user-123',
      status: 'PENDING',
      totalAmount: 299.97,
      shippingAddress: expect.any(Object)
    });

    // Verify SNS notification was sent
    const publishCommandCalls = snsMock.commandCalls(PublishCommand);
    expect(publishCommandCalls).toHaveLength(1);
    const snsParams = publishCommandCalls[0].args[0].input;
    expect(snsParams.TopicArn).toBe(process.env.ORDER_TOPIC_ARN);
    expect(JSON.parse(snsParams.Message)).toMatchObject({
      event: 'ORDER_PLACED',
      order: expect.objectContaining({
        userId: 'test-user-123',
        status: 'PENDING',
        totalAmount: 299.97
      })
    });
  });

  it('should handle unauthorized access', async () => {
    const event = {
      body: JSON.stringify({
        items: [
          {
            productId: testProduct.id,
            quantity: 1
          }
        ],
        totalAmount: 99.99,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      })
      // Missing requestContext.authorizer.claims
    };

    const response = await placeOrder(event);
    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Unauthorized');
  });

  it('should validate order data', async () => {
    const event = {
      ...mockEvent,
      body: JSON.stringify({
        items: [], // Empty items array
        totalAmount: 0,
        shippingAddress: {} // Missing required fields
      })
    };

    const response = await placeOrder(event);
    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Invalid request body');
  });

  it('should handle DynamoDB errors', async () => {
    ddbMock
      .on(PutCommand)
      .rejects(new Error('DynamoDB error'));

    const event = {
      ...mockEvent,
      body: JSON.stringify({
        items: [
          {
            productId: testProduct.id,
            quantity: 1
          }
        ],
        totalAmount: 99.99,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      })
    };

    const response = await placeOrder(event);
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error placing order');
  });

  it('should handle SNS errors', async () => {
    snsMock
      .on(PublishCommand)
      .rejects(new Error('SNS error'));

    const event = {
      ...mockEvent,
      body: JSON.stringify({
        items: [
          {
            productId: testProduct.id,
            quantity: 1
          }
        ],
        totalAmount: 99.99,
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345',
          country: 'US'
        }
      })
    };

    const response = await placeOrder(event);
    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.message).toBe('Error placing order');
  });
}); 