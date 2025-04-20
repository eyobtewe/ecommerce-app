const { GetItemCommand } = require("@aws-sdk/client-dynamodb");
const { dynamoDBClient } = require("../shared/dynamodbClient");

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

    const result = await dynamoDBClient.send(
      new GetItemCommand({
        TableName: process.env.CART_TABLE,
        Key: { userId: { S: userId } },
      })
    );

    const cart =
      result.Item?.cartItems?.L?.map((i) => {
        if (
          !i.M ||
          !i.M.productId?.S ||
          !i.M.name?.S ||
          !i.M.price?.N ||
          !i.M.quantity?.N
        ) {
          return null;
        }
        return {
          productId: i.M.productId.S,
          name: i.M.name.S,
          price: parseFloat(i.M.price.N),
          quantity: parseInt(i.M.quantity.N),
        };
      }).filter((item) => item !== null) || [];

    return {
      statusCode: 200,
      body: JSON.stringify({ cart }),
    };
  } catch (error) {
    console.error("Error retrieving cart:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
