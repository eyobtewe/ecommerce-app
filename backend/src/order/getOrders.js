const { APIGatewayProxyHandler } = require("aws-lambda");
const { docClient } = require("../shared/dynamodbClient");
const { QueryCommand } = require("@aws-sdk/lib-dynamodb");

// Import necessary AWS SDK modules and shared utilities
exports.handler = async (event) => {
  // Define the Lambda handler function
  try {
    // Extract user information from the request context
    const userId = event.requestContext.authorizer?.claims?.sub;
    if (!userId) throw new Error("Unauthorized");

    // Parse query parameters for pagination
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 10;
    const lastEvaluatedKey = queryParams.lastEvaluatedKey ?
      JSON.parse(decodeURIComponent(queryParams.lastEvaluatedKey)) : undefined;

    // Perform a Query operation on the DynamoDB table to fetch user orders
    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.ORDERS_TABLE,
        KeyConditionExpression: "userId = :uid",
        ExpressionAttributeValues: {
          ":uid": userId,
        },
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    // Return the orders along with pagination information
    return {
      statusCode: 200,
      body: JSON.stringify({
        orders: result.Items || [],
        lastEvaluatedKey: result.LastEvaluatedKey ?
          encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
        hasMore: !!result.LastEvaluatedKey
      }),
    };
  } catch (error) {
    // Handle and log any errors that occur
    console.error("Error fetching orders:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
