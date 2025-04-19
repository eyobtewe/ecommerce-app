import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { GetItemCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const id = event.pathParameters?.id;
    if (!id) throw new Error("Missing product ID");

    const result = await dynamoDBClient.send(new GetItemCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id: { S: id } }
    }));

    if (!result.Item || result.Item.isActive?.BOOL === false) {
      return { statusCode: 404, body: JSON.stringify({ error: "Product not found" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item),
    };
  } catch (error) {
    console.error("Error fetching product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
