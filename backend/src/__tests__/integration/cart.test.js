import { ddbMock, testProduct, testCart } from './setup';
import { handler as getCartHandler } from '../../handlers/cart/getCart';
import { handler as addToCartHandler } from '../../handlers/cart/addToCart';
import { handler as updateCartHandler } from '../../handlers/cart/updateCart';
import { handler as removeFromCartHandler } from '../../handlers/cart/removeFromCart';
import { GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';

describe('Cart Integration Tests', () => {
  const mockEvent = {
    requestContext: {
      authorizer: {
        claims: {
          sub: 'test-user-123'
        }
      }
    }
  };

  describe('getCart', () => {
    it('should return user cart', async () => {
      const response = await getCartHandler(mockEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual(testCart);

      // Verify DynamoDB was called correctly
      const getCommandCalls = ddbMock.commandCalls(GetCommand);
      expect(getCommandCalls).toHaveLength(1);
      expect(getCommandCalls[0].args[0].input).toEqual({
        TableName: process.env.CART_TABLE,
        Key: { userId: 'test-user-123' }
      });
    });

    it('should return empty cart for new user', async () => {
      ddbMock.on(GetCommand).resolves({ Item: null });

      const response = await getCartHandler(mockEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({ userId: 'test-user-123', items: [] });
    });
  });

  describe('addToCart', () => {
    it('should add item to cart', async () => {
      const event = {
        ...mockEvent,
        body: JSON.stringify({
          productId: testProduct.id,
          quantity: 1
        })
      };

      const response = await addToCartHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Item added to cart successfully');

      // Verify DynamoDB operations
      const putCommandCalls = ddbMock.commandCalls(PutCommand);
      expect(putCommandCalls).toHaveLength(1);
      const putParams = putCommandCalls[0].args[0].input;
      expect(putParams.TableName).toBe(process.env.CART_TABLE);
      expect(putParams.Item).toMatchObject({
        userId: 'test-user-123',
        items: expect.arrayContaining([
          expect.objectContaining({
            productId: testProduct.id,
            quantity: 1
          })
        ])
      });
    });

    it('should validate request body', async () => {
      const event = {
        ...mockEvent,
        body: JSON.stringify({
          productId: testProduct.id
          // missing quantity
        })
      };

      const response = await addToCartHandler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Invalid request body');
    });

    it('should handle non-existent product', async () => {
      ddbMock
        .on(GetCommand, {
          TableName: process.env.PRODUCTS_TABLE,
          Key: { id: 'non-existent' }
        })
        .resolves({ Item: null });

      const event = {
        ...mockEvent,
        body: JSON.stringify({
          productId: 'non-existent',
          quantity: 1
        })
      };

      const response = await addToCartHandler(event);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Product not found');
    });
  });

  describe('updateCart', () => {
    it('should update item quantity', async () => {
      const event = {
        ...mockEvent,
        body: JSON.stringify({
          productId: testProduct.id,
          quantity: 2
        })
      };

      const response = await updateCartHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Cart updated successfully');

      // Verify DynamoDB operations
      const updateCommandCalls = ddbMock.commandCalls(UpdateCommand);
      expect(updateCommandCalls).toHaveLength(1);
      const updateParams = updateCommandCalls[0].args[0].input;
      expect(updateParams.TableName).toBe(process.env.CART_TABLE);
      expect(updateParams.Key).toEqual({ userId: 'test-user-123' });
    });

    it('should handle updating non-existent item', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          userId: 'test-user-123',
          items: []
        }
      });

      const event = {
        ...mockEvent,
        body: JSON.stringify({
          productId: 'non-existent',
          quantity: 2
        })
      };

      const response = await updateCartHandler(event);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Item not found in cart');
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', async () => {
      const event = {
        ...mockEvent,
        pathParameters: {
          productId: testProduct.id
        }
      };

      const response = await removeFromCartHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Item removed from cart successfully');

      // Verify DynamoDB operations
      const updateCommandCalls = ddbMock.commandCalls(UpdateCommand);
      expect(updateCommandCalls).toHaveLength(1);
      const updateParams = updateCommandCalls[0].args[0].input;
      expect(updateParams.TableName).toBe(process.env.CART_TABLE);
      expect(updateParams.Key).toEqual({ userId: 'test-user-123' });
    });

    it('should handle removing non-existent item', async () => {
      ddbMock.on(GetCommand).resolves({
        Item: {
          userId: 'test-user-123',
          items: []
        }
      });

      const event = {
        ...mockEvent,
        pathParameters: {
          productId: 'non-existent'
        }
      };

      const response = await removeFromCartHandler(event);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Item not found in cart');
    });
  });
}); 