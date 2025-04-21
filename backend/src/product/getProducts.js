// Import necessary AWS SDK modules and shared utilities
const { APIGatewayProxyHandler } = require("aws-lambda");
const { docClient } = require("../shared/dynamodbClient");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");

// Define the Lambda handler function
exports.handler = async (event) => {
  try {
    // Parse query parameters from the event
    const queryParams = event.queryStringParameters || {};
    const filterCategory = queryParams.category;
    const filterTerm = queryParams.q?.toLowerCase();
    const limit = parseInt(queryParams.limit) || 10;

    // Decode and parse the last evaluated key if provided
    const lastEvaluatedKey = queryParams.lastEvaluatedKey ?
      JSON.parse(decodeURIComponent(queryParams.lastEvaluatedKey)) : undefined;

    // Perform a scan operation on the DynamoDB table
    const scanResult = await docClient.send(
      new ScanCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Limit: limit,
        ExclusiveStartKey: lastEvaluatedKey,
        ProjectionExpression: "id, #name, description, price, stock, category, brand, imageUrls, isActive, timesOrdered, createdAt",
        ExpressionAttributeNames: {
          "#name": "name"
        }
      })
    );

    // Filter the results based on active status, category, and search term
    const allProducts = scanResult.Items || [];
    const filtered = allProducts
      .filter((p) => p.isActive !== false)
      .filter(
        (p) =>
          (!filterCategory || p.category === filterCategory) &&
          (!filterTerm || p.name?.toLowerCase().includes(filterTerm))
      )
      .map(product => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price: product.price,
        stock: product.stock,
        category: product.category || 'Uncategorized',
        brand: product.brand || 'Unknown',
        imageUrls: product.imageUrls || [],
        timesOrdered: product.timesOrdered || 0,
        createdAt: product.createdAt
      }));

    // Return the filtered results along with pagination information
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        items: filtered,
        lastEvaluatedKey: scanResult.LastEvaluatedKey ?
          encodeURIComponent(JSON.stringify(scanResult.LastEvaluatedKey)) : null,
        hasMore: !!scanResult.LastEvaluatedKey
      }),
    };
  } catch (error) {
    // Handle and log any errors that occur
    console.error("Error fetching products:", error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
