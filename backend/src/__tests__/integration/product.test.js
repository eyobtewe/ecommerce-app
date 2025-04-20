import { ddbMock, testProduct } from './setup';
import { handler as getProductsHandler } from '../../handlers/product/getProducts';
import { handler as getProductHandler } from '../../handlers/product/getProduct';
import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';

describe('Product Integration Tests', () => {
  const mockEvent = {
    requestContext: {
      authorizer: {
        claims: {
          sub: 'test-user-123'
        }
      }
    }
  };

  describe('getProducts', () => {
    it('should return all products', async () => {
      const response = await getProductsHandler(mockEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(1);
      expect(body[0]).toEqual(testProduct);

      // Verify DynamoDB was called correctly
      const queryCommandCalls = ddbMock.commandCalls(QueryCommand);
      expect(queryCommandCalls).toHaveLength(1);
      expect(queryCommandCalls[0].args[0].input).toEqual({
        TableName: process.env.PRODUCTS_TABLE,
        Select: 'ALL_ATTRIBUTES'
      });
    });

    it('should handle empty product list', async () => {
      ddbMock
        .on(QueryCommand)
        .resolves({ Items: [], Count: 0, ScannedCount: 0 });

      const response = await getProductsHandler(mockEvent);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveLength(0);
    });

    it('should handle DynamoDB errors', async () => {
      ddbMock
        .on(QueryCommand)
        .rejects(new Error('DynamoDB error'));

      const response = await getProductsHandler(mockEvent);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Error fetching products');
    });
  });

  describe('getProduct', () => {
    it('should return a specific product', async () => {
      const event = {
        ...mockEvent,
        pathParameters: {
          id: testProduct.id
        }
      };

      const response = await getProductHandler(event);

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual(testProduct);

      // Verify DynamoDB was called correctly
      const getCommandCalls = ddbMock.commandCalls(GetCommand);
      expect(getCommandCalls).toHaveLength(1);
      expect(getCommandCalls[0].args[0].input).toEqual({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { id: testProduct.id }
      });
    });

    it('should return 404 for non-existent product', async () => {
      ddbMock
        .on(GetCommand)
        .resolves({ Item: null });

      const event = {
        ...mockEvent,
        pathParameters: {
          id: 'non-existent-id'
        }
      };

      const response = await getProductHandler(event);

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Product not found');
    });

    it('should handle DynamoDB errors', async () => {
      ddbMock
        .on(GetCommand)
        .rejects(new Error('DynamoDB error'));

      const event = {
        ...mockEvent,
        pathParameters: {
          id: testProduct.id
        }
      };

      const response = await getProductHandler(event);

      expect(response.statusCode).toBe(500);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Error fetching product');
    });

    it('should validate product ID parameter', async () => {
      const event = {
        ...mockEvent,
        pathParameters: {
          // missing id parameter
        }
      };

      const response = await getProductHandler(event);

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.message).toBe('Product ID is required');
    });
  });
}); 