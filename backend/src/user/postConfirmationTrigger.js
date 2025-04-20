const { PostConfirmationTriggerHandler } = require("aws-lambda");
const { docClient } = require("../shared/dynamodbClient");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");

const handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const userId = event.request.userAttributes.sub;
    const email = event.request.userAttributes.email;

    await docClient.send(
      new PutCommand({
        TableName: process.env.USERS_TABLE,
        Item: {
          userId,
          email,
          role: "customer",
          joinedAt: new Date().toISOString(),
          preferredCategories: [],
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
