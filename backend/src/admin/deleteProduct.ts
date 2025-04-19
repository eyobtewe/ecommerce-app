import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { UpdateItemCommand, GetItemCommand, DeleteItemCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { id } = event.pathParameters || {};
    if (!id) throw new Error("Product ID is required");

    // Get the product first
    const result = await dynamoDBClient.send(new GetItemCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id: { S: id } }
    }));

    const product = result.Item;
    if (!product) throw new Error("Product not found");

    const timesOrdered = parseInt(product.timesOrdered?.N || "0");

    if (timesOrdered > 0) {
      // Deactivate instead
      await dynamoDBClient.send(new UpdateItemCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { id: { S: id } },
        UpdateExpression: "SET isActive = :false",
        ExpressionAttributeValues: {
          ":false": { BOOL: false }
        }
      }));
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Product deactivated (was already sold)" }),
      };
    }

    // Delete if never sold
    await dynamoDBClient.send(new DeleteItemCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id: { S: id } }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Product deleted" }),
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
