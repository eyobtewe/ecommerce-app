import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    const orderId = event.pathParameters?.id;
    if (!userId || !orderId) throw new Error("Missing parameters");

    const result = await dynamoDBClient.send(new GetItemCommand({
      TableName: process.env.ORDERS_TABLE,
      Key: {
        userId: { S: userId },
        orderId: { S: orderId }
      }
    }));

    if (!result.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: "Order not found" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error("Error fetching order:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
