const { APIGatewayProxyHandler } = require("aws-lambda");
const { docClient } = require("../shared/dynamodbClient");
const { GetCommand } = require("@aws-sdk/lib-dynamodb");

// Import necessary AWS SDK modules and shared utilities
exports.handler = async (event) => {
  // Define the Lambda handler function
  try {
    // Extract the product ID from the path parameters
    const id = event.pathParameters?.id;
    if (!id) throw new Error("Missing product ID");

    // Perform a Get operation on the DynamoDB table
    const result = await docClient.send(
      new GetCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { id },
      })
    );

    // Check if the product exists and is active
    if (!result.Item || result.Item.isActive === false) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Product not found" }),
      };
    }

    // Return the product details if found
    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    // Handle and log any errors that occur
    console.error("Error fetching product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
