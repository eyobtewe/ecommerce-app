import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) throw new Error("Unauthorized");

    const result = await dynamoDBClient.send(new GetItemCommand({
      TableName: process.env.CART_TABLE,
      Key: { userId: { S: userId } }
    }));

    const cart = result.Item?.cartItems?.L?.map(i => ({
      productId: i.M.productId.S,
      name: i.M.name.S,
      price: parseFloat(i.M.price.N),
      quantity: parseInt(i.M.quantity.N)
    })) || [];

    return {
      statusCode: 200,
      body: JSON.stringify({ cart }),
    };
  } catch (error) {
    console.error("Error retrieving cart:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
