const { APIGatewayProxyHandler } = require("aws-lambda");
const { docClient } = require("../shared/dynamodbClient");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const queryParams = event.queryStringParameters || {};
    const limit = parseInt(queryParams.limit) || 20;
    const lastEvaluatedKey = queryParams.lastEvaluatedKey ?
      JSON.parse(decodeURIComponent(queryParams.lastEvaluatedKey)) : undefined;
    const sortBy = queryParams.sortBy || 'joinedAt'; // joinedAt, email, role
    const sortOrder = queryParams.sortOrder === 'asc' ? 1 : -1;

    const result = await docClient.send(new ScanCommand({
      TableName: process.env.USERS_TABLE,
      Limit: limit,
      ExclusiveStartKey: lastEvaluatedKey
    }));

    const users = (result.Items || [])
      .sort((a, b) => {
        const aValue = a[sortBy] || '';
        const bValue = b[sortBy] || '';
        return aValue.localeCompare(bValue) * sortOrder;
      });

    return {
      statusCode: 200,
      body: JSON.stringify({
        users,
        lastEvaluatedKey: result.LastEvaluatedKey ?
          encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
        hasMore: !!result.LastEvaluatedKey
      }),
    };
  } catch (error) {
    console.error("Error fetching users:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
