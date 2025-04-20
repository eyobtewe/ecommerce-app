const { PostConfirmationTriggerHandler } = require("aws-lambda");
const { dynamoDBClient } = require("../shared/dynamodbClient");
const { PutItemCommand } = require("@aws-sdk/client-dynamodb");

const handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const userId = event.request.userAttributes.sub;
    const email = event.request.userAttributes.email;

    await dynamoDBClient.send(
      new PutItemCommand({
        TableName: process.env.USERS_TABLE,
        Item: {
          userId: { S: userId },
          email: { S: email },
          role: { S: "customer" },
          joinedAt: { S: new Date().toISOString() },
          preferredCategories: { L: [] },
        },
      })
    );

    return event;
  } catch (error) {
    console.error("Error creating user record:", error);
    throw error;
  }
};

module.exports = { handler };
