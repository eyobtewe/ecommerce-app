const { APIGatewayProxyHandler } = require("aws-lambda");
const { docClient } = require("../shared/dynamodbClient");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const filterCategory = queryParams.category;
    const filterTerm = queryParams.q?.toLowerCase();
    const limit = parseInt(queryParams.limit) || 10;
    const lastEvaluatedKey = queryParams.lastEvaluatedKey ?
      JSON.parse(decodeURIComponent(queryParams.lastEvaluatedKey)) : undefined;

    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    const allProducts = scanResult.Items || [];
    const filtered = allProducts
      .filter((p) => p.isActive !== false)
      .filter(
        (p) =>
          (!filterCategory || p.category === filterCategory) &&
          (!filterTerm || p.name?.toLowerCase().includes(filterTerm))
      );

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: filtered,
        lastEvaluatedKey: scanResult.LastEvaluatedKey ?
          encodeURIComponent(JSON.stringify(scanResult.LastEvaluatedKey)) : null,
        hasMore: !!scanResult.LastEvaluatedKey
      }),
    };
  } catch (error) {
    console.error("Error fetching products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
