import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) throw new Error("Unauthorized");

    const body = JSON.parse(event.body || "{}");
    const categories: string[] = body.preferredCategories || [];

    await dynamoDBClient.send(new UpdateItemCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId: { S: userId } },
      UpdateExpression: "SET preferredCategories = :cats",
      ExpressionAttributeValues: {
        ":cats": { L: categories.map(c => ({ S: c })) }
      }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Preferences updated" }),
    };
  } catch (error) {
    console.error("Error updating preferences:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
