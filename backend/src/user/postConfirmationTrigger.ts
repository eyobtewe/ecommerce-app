import { PostConfirmationTriggerHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";

export const handler: PostConfirmationTriggerHandler = async (event) => {
  try {
    const userId = event.request.userAttributes.sub;
    const email = event.request.userAttributes.email;

    await dynamoDBClient.send(new PutItemCommand({
      TableName: process.env.USERS_TABLE,
      Item: {
        userId: { S: userId },
        email: { S: email },
        role: { S: "customer" },
        joinedAt: { S: new Date().toISOString() },
        preferredCategories: { L: [] }
      }
    }));

    return event;
  } catch (error) {
    console.error("Error creating user record:", error);
    throw error;
  }
};
