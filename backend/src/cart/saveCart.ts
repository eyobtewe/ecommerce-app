import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) throw new Error("Unauthorized");

    const body = JSON.parse(event.body || "{}");
    const cartItems = body.cartItems || [];

    const dynamoCartItems = {
      L: cartItems.map((item: any) => ({
        M: {
          productId: { S: item.productId },
          name: { S: item.name },
          price: { N: item.price.toString() },
          quantity: { N: item.quantity.toString() }
        }
      }))
    };

    await dynamoDBClient.send(new PutItemCommand({
      TableName: process.env.CART_TABLE,
      Item: {
        userId: { S: userId },
        cartItems: dynamoCartItems,
        updatedAt: { S: new Date().toISOString() }
      }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Cart saved" }),
    };
  } catch (error) {
    console.error("Error saving cart:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
