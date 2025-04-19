import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { ScanCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async () => {
  try {
    const result = await dynamoDBClient.send(new ScanCommand({
      TableName: process.env.ORDERS_TABLE
    }));

    const orders = result.Items?.map(item => ({
      orderId: item.orderId.S,
      userId: item.userId.S,
      items: item.items.L,
      total: parseFloat(item.total.N || "0"),
      status: item.status.S,
      createdAt: item.createdAt.S
    })) || [];

    return {
      statusCode: 200,
      body: JSON.stringify({ orders }),
    };
  } catch (error) {
    console.error("Error retrieving orders:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
