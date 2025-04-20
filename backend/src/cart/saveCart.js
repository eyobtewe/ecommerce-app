const { APIGatewayProxyHandler } = require("aws-lambda");
const { docClient } = require("../shared/dynamodbClient");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) throw new Error("Unauthorized");

    const body = JSON.parse(event.body || "{}");
    const cartItems = body.cartItems || [];

    await docClient.send(new PutCommand({
      TableName: process.env.CART_TABLE,
      Item: {
        userId,
        cartItems,
        updatedAt: new Date().toISOString()
      }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Cart saved" }),
    };
  } catch (error) {
    console.error("Error saving cart:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
