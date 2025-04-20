const { ScanCommand } = require("@aws-sdk/client-dynamodb");
const { dynamoDBClient } = require("../shared/dynamodbClient");

exports.handler = async () => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const result = await dynamoDBClient.send(new ScanCommand({
      TableName: process.env.PRODUCTS_TABLE
    }));

    const items = result.Items || [];
    const sorted = items
      .filter((p) => p.isActive?.BOOL !== false)
      .sort((a, b) =>
        (parseInt(b.timesOrdered?.N || "0") - parseInt(a.timesOrdered?.N || "0"))
      )
      .slice(0, 5);

    return {
      statusCode: 200,
      body: JSON.stringify(sorted),
    };
  } catch (error) {
    console.error("Error getting popular products:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
