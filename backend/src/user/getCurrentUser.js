const { APIGatewayProxyHandler } = require("aws-lambda");
const { dynamoDBClient } = require("../shared/dynamodbClient");
const { GetItemCommand } = require("@aws-sdk/client-dynamodb");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
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
