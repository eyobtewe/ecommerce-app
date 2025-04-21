const { APIGatewayProxyHandler } = require("aws-lambda");
const { docClient } = require("../shared/dynamodbClient");
const { DeleteCommand, GetCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const { id } = event.pathParameters || {};
    if (!id) throw new Error("Product ID is required");

    // Get the product first
    const result = await docClient.send(new GetCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id }
    }));

    const product = result.Item;
    if (!product) throw new Error("Product not found");

    const timesOrdered = product.timesOrdered || 0;

    if (timesOrdered > 0) {
      // Deactivate instead
      await docClient.send(new UpdateCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { id },
        UpdateExpression: "SET isActive = :false",
        ExpressionAttributeValues: {
          ":false": false
        }
      }));
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Product deactivated (was already sold)" }),
      };
    }

    // Delete if never sold
    await docClient.send(new DeleteCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id }
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Product deleted" }),
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};

// module.exports = { handler };
