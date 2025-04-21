const { GetCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../shared/dynamodbClient");

/**
 * @type {import("aws-lambda").APIGatewayProxyHandler}
 */
exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) throw new Error("Unauthorized");

    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.CART_TABLE,
        Key: { userId },
      })
    );

    const cart = {
      userId,
      items: result.Item?.cartItems?.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      })) || []
    };

    return {
      statusCode: 200,
      body: JSON.stringify(cart),
    };
  } catch (error) {
    console.error("Error retrieving cart:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
