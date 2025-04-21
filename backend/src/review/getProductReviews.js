const { QueryCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../shared/dynamodbClient");

exports.handler = async (event) => {
  try {
    const productId = event.pathParameters?.productId;
    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Product ID is required" }),
      };
    }

    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 10;
    const lastEvaluatedKey = queryParams.lastEvaluatedKey ?
      JSON.parse(decodeURIComponent(queryParams.lastEvaluatedKey)) : undefined;

    const result = await docClient.send(
      new QueryCommand({
        TableName: process.env.REVIEWS_TABLE,
        IndexName: "ProductIdIndex",
        KeyConditionExpression: "productId = :productId",
        ExpressionAttributeValues: {
          ":productId": productId,
        },
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    // Calculate average rating
    const reviews = result.Items || [];
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
      : 0;

    return {
      statusCode: 200,
      body: JSON.stringify({
        reviews,
        averageRating: Number(averageRating.toFixed(1)),
        totalReviews: reviews.length,
        lastEvaluatedKey: result.LastEvaluatedKey ?
          encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
        hasMore: !!result.LastEvaluatedKey,
      }),
    };
  } catch (error) {
    console.error("Error getting product reviews:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
}; 