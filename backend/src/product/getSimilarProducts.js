const { APIGatewayProxyHandler } = require("aws-lambda");
const { dynamoDBClient } = require("../shared/dynamodbClient");
const { DynamoDBClient, ScanCommand } = require("@aws-sdk/client-dynamodb");


exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const productId = event.pathParameters?.id;
    if (!productId) throw new Error("Product ID missing");

    // Get the base product
    const { Item: baseProduct } = await dynamoDBClient.send(
      new GetItemCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { id: { S: productId } },
      })
    );

    if (!baseProduct || !baseProduct.category) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          error: "Product not found or missing category",
        }),
      };
    }

    const category = baseProduct.category.S;

    // Find similar products
    const scan = await dynamoDBClient.send(
      new ScanCommand({
        TableName: process.env.PRODUCTS_TABLE,
      })
    );

    const similar =
      scan.Items?.filter(
        (p) =>
          p.category?.S === category &&
          p.id?.S !== productId &&
          p.isActive?.BOOL !== false
      ).slice(0, 5) || [];

    return {
      statusCode: 200,
      body: JSON.stringify(similar),
    };
  } catch (error) {
    console.error("Error fetching similar products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
