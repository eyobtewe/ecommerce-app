const { APIGatewayProxyHandler } = require("aws-lambda");
const { dynamoDBClient } = require("../shared/dynamodbClient");
const { PutItemCommand } = require("@aws-sdk/client-dynamodb");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    const productId = event.pathParameters?.productId;
    if (!userId || !productId) throw new Error("Missing required information");

    const body = JSON.parse(event.body || "{}");
    const rating = body.rating;
    const comment = body.comment;

    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid rating (1–5)" }),
      };
    }

    const review = {
      productId,
      userId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    await dynamoDBClient.send(
      new PutItemCommand({
        TableName: process.env.REVIEWS_TABLE,
        Item: {
          productId: { S: review.productId },
          userId: { S: review.userId },
          rating: { N: review.rating.toString() },
          comment: { S: review.comment },
          createdAt: { S: review.createdAt },
        },
      })
    );

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Review submitted" }),
    };
  } catch (error) {
    console.error("Error submitting review:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
