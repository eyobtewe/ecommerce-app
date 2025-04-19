import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { QueryCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) throw new Error("Unauthorized");

    const result = await dynamoDBClient.send(new QueryCommand({
      TableName: process.env.ORDERS_TABLE,
      KeyConditionExpression: "userId = :uid",
      ExpressionAttributeValues: {
        ":uid": { S: userId }
      }
    }));

    const orders = result.Items || [];

    return {
      statusCode: 200,
      body: JSON.stringify({ orders }),
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
