const { APIGatewayProxyHandler } = require("aws-lambda");
const { dynamoDBClient } = require("../shared/dynamodbClient");
const { ScanCommand } = require("@aws-sdk/client-dynamodb");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

exports.handler = async (event) => {
  const dynamoDBClient = new DynamoDBClient({
    region: process.env.AWS_REGION || "us-east-1",
  });
  try {
    const queryParams = event.queryStringParameters || {};
    const filterCategory = queryParams.category;
    const filterTerm = queryParams.q?.toLowerCase();

    const scanResult = await dynamoDBClient.send(
      new ScanCommand({
        TableName: process.env.PRODUCTS_TABLE,
      })
    );

    const allProducts = scanResult.Items || [];

    const filtered = allProducts
      .filter(
        (p) => p.isActive?.BOOL !== false
      )
      .filter(
        (p) =>
          (!filterCategory || p.category?.S === filterCategory) &&
          (!filterTerm || p.name?.S?.toLowerCase().includes(filterTerm))
      );

    return {
      statusCode: 200,
      body: JSON.stringify(filtered),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
