import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { GetItemCommand, ScanCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const productId = event.pathParameters?.id;
    if (!productId) throw new Error("Product ID missing");

    // Get the base product
    const { Item: baseProduct } = await dynamoDBClient.send(new GetItemCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id: { S: productId } }
    }));

    if (!baseProduct || !baseProduct.category) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Product not found or missing category" }),
      };
    }

    const category = baseProduct.category.S;

    // Find similar products
    const scan = await dynamoDBClient.send(new ScanCommand({
      TableName: process.env.PRODUCTS_TABLE
    }));

    const similar = scan.Items?.filter(
      p => p.category?.S === category && p.id?.S !== productId && p.isActive?.BOOL !== false
    ).slice(0, 5) || [];

    return {
      statusCode: 200,
      body: JSON.stringify(similar),
    };
  } catch (error) {
    console.error("Error fetching similar products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
