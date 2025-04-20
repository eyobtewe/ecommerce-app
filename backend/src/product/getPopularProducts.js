const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { docClient } = require("../shared/dynamodbClient");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 5;
    const lastEvaluatedKey = queryParams.lastEvaluatedKey ?
      JSON.parse(decodeURIComponent(queryParams.lastEvaluatedKey)) : undefined;

    const result = await docClient.send(new ScanCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey
    }));

    const items = result.Items || [];
    const sorted = items
      .filter((p) => p.isActive !== false)
      .sort((a, b) =>
        ((b.timesOrdered || 0) - (a.timesOrdered || 0))
      );

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: sorted,
        lastEvaluatedKey: result.LastEvaluatedKey ?
          encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
        hasMore: !!result.LastEvaluatedKey
      }),
    };
  } catch (error) {
    console.error("Error getting popular products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
