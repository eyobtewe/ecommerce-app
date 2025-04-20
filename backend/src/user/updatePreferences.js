const { APIGatewayProxyHandler } = require("aws-lambda");
const { dynamoDBClient } = require("../shared/dynamodbClient");
const { UpdateItemCommand } = require("@aws-sdk/client-dynamodb");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) throw new Error("Unauthorized");

    const body = JSON.parse(event.body || "{}");
    const categories = body.preferredCategories || [];

    await dynamoDBClient.send(new UpdateItemCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId: { S: userId } },
      UpdateExpression: "SET preferredCategories = :cats",
      ExpressionAttributeValues: {
        ":cats": { L: categories.map((c) => ({ S: c })) }
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
