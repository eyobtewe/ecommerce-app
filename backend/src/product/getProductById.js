const { APIGatewayProxyHandler } = require("aws-lambda");
const { dynamoDBClient } = require("../shared/dynamodbClient");
const { GetItemCommand } = require("@aws-sdk/client-dynamodb");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const id = event.pathParameters?.id;
    if (!id) throw new Error("Missing product ID");

    const result = await dynamoDBClient.send(
      new GetItemCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { id: { S: id } },
      })
    );

    if (!result.Item || result.Item.isActive?.BOOL === false) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Product not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
