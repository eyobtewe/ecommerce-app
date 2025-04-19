import { APIGatewayProxyHandler } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { PutItemCommand } from "@aws-sdk/client-dynamodb";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const id = uuidv4();

    const product = {
      id,
      name: body.name,
      description: body.description,
      price: body.price,
      discountPrice: body.discountPrice || null,
      stock: body.stock,
      category: body.category,
      brand: body.brand,
      tags: body.tags || [],
      imageUrls: body.imageUrls || [],
      timesOrdered: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    await dynamoDBClient.send(new PutItemCommand({
      TableName: process.env.PRODUCTS_TABLE,
      Item: {
        id: { S: product.id },
        name: { S: product.name },
        description: { S: product.description },
        price: { N: product.price.toString() },
        discountPrice: product.discountPrice ? { N: product.discountPrice.toString() } : { NULL: true },
        stock: { N: product.stock.toString() },
        category: { S: product.category },
        brand: { S: product.brand },
        tags: { SS: product.tags },
        imageUrls: { SS: product.imageUrls },
        timesOrdered: { N: "0" },
        createdAt: { S: product.createdAt },
        updatedAt: { S: product.updatedAt },
        isActive: { BOOL: true }
      }
    }));

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Product added", product }),
    };
  } catch (error) {
    console.error("Error adding product:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
