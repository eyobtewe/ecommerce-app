const { APIGatewayProxyHandler } = require("aws-lambda");
const { dynamoDBClient } = require("../shared/dynamodbClient");
const { PutItemCommand } = require("@aws-sdk/client-dynamodb");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) throw new Error("Unauthorized");

    const body = JSON.parse(event.body || "{}");
    const cartItems = body.cartItems || [];

    const dynamoCartItems = {
      L: cartItems.map((item) => ({
        M: {
          productId: { S: item.productId },
          name: { S: item.name },
          price: { N: item.price.toString() },
          quantity: { N: item.quantity.toString() }
        }
      }))
    };

    await dynamoDBClient.send(new PutItemCommand({
      TableName: process.env.CART_TABLE,
      Item: {
        userId: { S: userId },
        cartItems: dynamoCartItems,
        updatedAt: { S: new Date().toISOString() }
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
