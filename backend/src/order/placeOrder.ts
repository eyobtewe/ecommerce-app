import { APIGatewayProxyHandler } from "aws-lambda";
import { v4 as uuidv4 } from "uuid";
import { dynamoDBClient } from "../shared/dynamodbClient";
import { snsClient } from "../shared/snsClient";
import { PutItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { PublishCommand } from "@aws-sdk/client-sns";

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    const userId = event.requestContext.authorizer?.claims?.sub;
    const email = event.requestContext.authorizer?.claims?.email;
    if (!userId || !email) throw new Error("Unauthorized");

    const body = JSON.parse(event.body || "{}");

    const orderId = uuidv4();
    const order = {
      userId,
      orderId,
      items: body.items,
      total: body.total,
      status: "Pending",
      createdAt: new Date().toISOString(),
      shippingAddress: body.shippingAddress
    };

    // Save order
    await dynamoDBClient.send(new PutItemCommand({
      TableName: process.env.ORDERS_TABLE,
      Item: {
        userId: { S: userId },
        orderId: { S: orderId },
        items: {
          L: order.items.map((item: any) => ({
            M: {
              productId: { S: item.productId },
              name: { S: item.name },
              price: { N: item.price.toString() },
              quantity: { N: item.quantity.toString() },
              subtotal: { N: item.subtotal.toString() }
            }
          }))
        },
        total: { N: order.total.toString() },
        status: { S: "Pending" },
        createdAt: { S: order.createdAt },
        shippingAddress: {
          M: {
            fullName: { S: order.shippingAddress.fullName },
            addressLine1: { S: order.shippingAddress.addressLine1 },
            city: { S: order.shippingAddress.city },
            postalCode: { S: order.shippingAddress.postalCode },
            country: { S: order.shippingAddress.country }
          }
        }
      }
    }));

    // Update product popularity
    for (const item of order.items) {
      await dynamoDBClient.send(new UpdateItemCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Key: { id: { S: item.productId } },
        UpdateExpression: "SET timesOrdered = if_not_exists(timesOrdered, :zero) + :inc",
        ExpressionAttributeValues: {
          ":inc": { N: item.quantity.toString() },
          ":zero": { N: "0" }
        }
      }));
    }

    // Send SNS email notification
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.SNS_TOPIC_ARN,
      Subject: "Order Confirmation",
      Message: `Thank you for your order ${email}! Your order ID is ${orderId}.`,
    }));

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Order placed", orderId }),
    };
  } catch (error) {
    console.error("Error placing order:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
