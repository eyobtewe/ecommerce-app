const { APIGatewayProxyHandler } = require("aws-lambda");
const { dynamoDBClient } = require("../shared/dynamodbClient");
const { UpdateItemCommand } = require("@aws-sdk/client-dynamodb");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const { id } = event.pathParameters || {};
    const body = JSON.parse(event.body || "{}");

    if (!id) throw new Error("Product ID required");

    const updateExpression = [];
    
    const expressionValues= {};
    const expressionNames= {};

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
