const { PostConfirmationTriggerHandler } = require("aws-lambda");
const { docClient } = require("../shared/dynamodbClient");
const { PutCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");

const handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    // Validate required attributes
    if (!event.request?.userAttributes?.sub) {
      throw new Error("Missing user ID in request");
    }
    if (!event.request?.userAttributes?.email) {
      throw new Error("Missing email in request");
    }

    const userId = event.request.userAttributes.sub;
    const email = event.request.userAttributes.email;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error("Invalid email format");
    }

    // Check if user already exists
    const existingUser = await docClient.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { userId }
      })
    );

    if (existingUser.Item) {
      console.log("User already exists:", userId);
      return event;
    }

    // Create new user
    await docClient.send(
      new PutCommand({
        TableName: process.env.USERS_TABLE,
        Item: {
          userId,
          email,
          role: "customer",
          joinedAt: new Date().toISOString(),
          preferredCategories: [],
          isActive: true
        },
        ConditionExpression: "attribute_not_exists(userId)"
      })
    );

    return event;
  } catch (error) {
    console.error("Error creating user record:", error);
    // Don't throw the error to prevent Cognito signup failure
    return event;
  }
};

module.exports = { handler };
