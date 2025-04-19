import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { ScanCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const result = await dynamoDBClient.send(new ScanCommand({
      TableName: process.env.PRODUCTS_TABLE
    }));

    const items = result.Items || [];
    const sorted = items
      .filter(p => p.isActive?.BOOL !== false)
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
