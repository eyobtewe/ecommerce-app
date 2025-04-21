const { APIGatewayProxyHandler } = require("aws-lambda");
const { docClient } = require("../shared/dynamodbClient");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    // Extract user information from the request context
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" })
      };
    }

    // Get user from DynamoDB
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.USERS_TABLE,
        Key: { userId }
      })
    );

    // Handle user not found
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" })
      };
    }

    // Handle inactive user
    if (!result.Item.isActive) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: "User account is inactive" })
      };
    }

    // Return user data (excluding sensitive information)
    const { userId: _, ...userData } = result.Item;
    return {
      statusCode: 200,
      body: JSON.stringify(userData)
    };
  } catch (error) {
    console.error("Error getting user:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" })
    };
  }
};
