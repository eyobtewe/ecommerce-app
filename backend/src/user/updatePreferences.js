const { APIGatewayProxyHandler } = require("aws-lambda");
const { docClient } = require("../shared/dynamodbClient");
const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) throw new Error("Unauthorized");

    const body = JSON.parse(event.body || "{}");
    const categories = body.preferredCategories || [];

    await docClient.send(new UpdateCommand({
      TableName: process.env.USERS_TABLE,
      Key: { userId },
      UpdateExpression: "SET preferredCategories = :cats",
      ExpressionAttributeValues: {
        ":cats": categories
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
