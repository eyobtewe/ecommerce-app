import { ddbMock, snsMock, testProduct, testOrder } from './setup';
import { handler as placeOrderHandler } from '../../handlers/order/placeOrder';
import { handler as getOrdersHandler } from '../../handlers/order/getOrders';
import { handler as getOrderHandler } from '../../handlers/order/getOrder';
import { PutCommand, QueryCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { PublishCommand } from '@aws-sdk/client-sns';

describe('Order Integration Tests', () => {
  const mockEvent = {
    requestContext: {
      authorizer: {
        claims: {
          sub: 'test-user-123'
        }
      }
    }
  };

  describe('placeOrder', () => {
    it('should successfully place an order', async () => {
      const event = {
        ...mockEvent,
        body: JSON.stringify({
          items: [
            {
              productId: testProduct.id,
              quantity: 2
            }
          ],
          totalAmount: 199.98,
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'US'
          }
        })
      };

      const response = await placeOrderHandler(event);

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Order placed successfully');
      expect(body.orderId).toBeDefined();

      // Verify DynamoDB operations
      const putCommandCalls = ddbMock.commandCalls(PutCommand);
      expect(putCommandCalls).toHaveLength(1);
      const putParams = putCommandCalls[0].args[0].input;
      expect(putParams.TableName).toBe(process.env.ORDERS_TABLE);
      expect(putParams.Item).toMatchObject({
        userId: 'test-user-123',
        status: 'PENDING',
        totalAmount: 199.98,
        shippingAddress: expect.any(Object)
      });

      // Verify SNS operations
      const publishCommandCalls = snsMock.commandCalls(PublishCommand);
      expect(publishCommandCalls).toHaveLength(1);
      const snsParams = publishCommandCalls[0].args[0].input;
      expect(snsParams.TopicArn).toBe(process.env.ORDER_TOPIC_ARN);
      expect(JSON.parse(snsParams.Message)).toMatchObject({
        event: 'ORDER_PLACED',
        orderId: expect.any(String)
      });
    });

    it('should validate request body', async () => {
      const event = {
        ...mockEvent,
        body: JSON.stringify({
          // Missing required fields
          items: []
        })
      };

      const response = await placeOrderHandler(event);

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
              quantity: 2
            }
          ],
          totalAmount: 199.98,
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'US'
          }
        })
      };

      const response = await placeOrderHandler(event);

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
              quantity: 2
            }
          ],
          totalAmount: 199.98,
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zipCode: '12345',
            country: 'US'
          }
        })
      };

      const response = await placeOrderHandler(event);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Error placing order');
    });
  });

  describe('getOrders', () => {
    it('should return user orders', async () => {
      const response = await getOrdersHandler(mockEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual(testOrder);

      // Verify DynamoDB operations
      const queryCommandCalls = ddbMock.commandCalls(QueryCommand);
      expect(queryCommandCalls).toHaveLength(1);
      expect(queryCommandCalls[0].args[0].input).toEqual({
        TableName: process.env.ORDERS_TABLE,
        KeyConditionExpression: 'userId = :userId',
        ExpressionAttributeValues: {
          ':userId': 'test-user-123'
        }
      });
    });

    it('should handle empty order list', async () => {
      ddbMock
        .on(QueryCommand)
        .resolves({ Items: [], Count: 0, ScannedCount: 0 });

      const response = await getOrdersHandler(mockEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(0);
    });
  });

  describe('getOrder', () => {
    it('should return a specific order', async () => {
      const event = {
        ...mockEvent,
        pathParameters: {
          orderId: testOrder.orderId
        }
      };

      const response = await getOrderHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual(testOrder);

      // Verify DynamoDB operations
      const getCommandCalls = ddbMock.commandCalls(GetCommand);
      expect(getCommandCalls).toHaveLength(1);
      expect(getCommandCalls[0].args[0].input).toEqual({
        TableName: process.env.ORDERS_TABLE,
        Key: {
          orderId: testOrder.orderId,
          userId: 'test-user-123'
        }
      });
    });

    it('should return 404 for non-existent order', async () => {
      ddbMock
        .on(GetCommand)
        .resolves({ Item: null });

      const event = {
        ...mockEvent,
        pathParameters: {
          orderId: 'non-existent-order'
        }
      };

      const response = await getOrderHandler(event);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Order not found');
    });

    it('should validate order ID parameter', async () => {
      const event = {
        ...mockEvent,
        pathParameters: {
          // missing orderId parameter
        }
      };

      const response = await getOrderHandler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Order ID is required');
    });
  });
}); 