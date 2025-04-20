const { APIGatewayProxyHandler } = require("aws-lambda");
const { docClient } = require("../shared/dynamodbClient");
const { GetCommand, ScanCommand } = require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
  try {
    const productId = event.pathParameters?.id;
    if (!productId) throw new Error("Product ID missing");

    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 5;
    const lastEvaluatedKey = queryParams.lastEvaluatedKey ?
      JSON.parse(decodeURIComponent(queryParams.lastEvaluatedKey)) : undefined;
    const sortBy = queryParams.sortBy || 'timesOrdered'; // timesOrdered, price, createdAt
    const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;

    // Get the base product
    const { Item: baseProduct } = await docClient.send(
      new GetCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { id: productId },
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

    const category = baseProduct.category;

    // Find similar products
    const scan = await docClient.send(
      new ScanCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Limit: limit * 2, // Fetch more to account for filtering
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    const similar = scan.Items
      ?.filter(
        (p) =>
          p.category === category &&
          p.id !== productId &&
          p.isActive !== false
      )
      .sort((a, b) => {
        const aValue = a[sortBy] || 0;
        const bValue = b[sortBy] || 0;
        return (aValue - bValue) * sortOrder;
      })
      .slice(0, limit) || [];

    return {
      statusCode: 200,
      body: JSON.stringify({
        items: similar,
        lastEvaluatedKey: scan.LastEvaluatedKey ?
          encodeURIComponent(JSON.stringify(scan.LastEvaluatedKey)) : null,
        hasMore: !!scan.LastEvaluatedKey
      }),
    };
  } catch (error) {
    console.error("Error fetching similar products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
