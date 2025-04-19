import { APIGatewayProxyHandler } from "aws-lambda";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { UpdateItemCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const { id } = event.pathParameters || {};
    const body = JSON.parse(event.body || "{}");

    if (!id) throw new Error("Product ID required");

    const updateExpression = [];
    const expressionValues: Record<string, any> = {};
    const expressionNames: Record<string, string> = {};

    for (const key in body) {
      updateExpression.push(`#${key} = :${key}`);
      expressionNames[`#${key}`] = key;
      expressionValues[`:${key}`] = typeof body[key] === "number"
        ? { N: body[key].toString() }
        : { S: body[key].toString() };
    }

    await dynamoDBClient.send(new UpdateItemCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Key: { id: { S: id } },
      UpdateExpression: `SET ${updateExpression.join(", ")}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Product updated" }),
    };
  } catch (error) {
    console.error("Error editing product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
