import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) throw new Error("Unauthorized");

    const result = await dynamoDBClient.send(new GetItemCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId: { S: userId } }
    }));

    if (!result.Item) {
      return { statusCode: 404, body: JSON.stringify({ error: "User not found" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error("Error fetching user:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
