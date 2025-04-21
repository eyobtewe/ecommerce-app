// Import necessary AWS SDK modules and shared utilities
const { v4: uuidv4 } = require("uuid");
const { docClient } = require("../shared/dynamodbClient");
const { snsClient } = require("../shared/snsClient");
const { PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { PublishCommand } = require("@aws-sdk/client-sns");

// Define the Lambda handler function
exports.handler = async (event) => {
  try {
    // Extract user information from the request context
    const userId = event.requestContext.authorizer?.claims?.sub;
    const email = event.requestContext.authorizer?.claims?.email;
    if (!userId || !email) throw new Error("Unauthorized");

    // Parse the request body to get order details
    const body = JSON.parse(event.body || "{}");

    // Generate a unique order ID and prepare the order object
    const orderId = uuidv4();
    const order = {
      userId,
      orderId,
      items: body.items,
      total: body.total,
      status: "Pending",
      createdAt: new Date().toISOString(),
      shippingAddress: body.shippingAddress,
    };

    // Save the order to the DynamoDB table
    await docClient.send(
      new PutCommand({
        TableName: process.env.ORDERS_TABLE,
        Item: order
      })
    );

    // Update product popularity in the DynamoDB table
    for (const item of order.items) {
      await docClient.send(
        new UpdateCommand({
          TableName: process.env.PRODUCTS_TABLE,
          Key: { id: item.productId },
          UpdateExpression:
            "SET timesOrdered = if_not_exists(timesOrdered, :zero) + :inc",
          ExpressionAttributeValues: {
            ":inc": item.quantity,
            ":zero": 0,
          },
        })
      );
    }

    // Send an email notification using SNS
    await snsClient.send(
      new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: "Order Confirmation",
        Message: `Thank you for your order ${email}! Your order ID is ${orderId}.`,
      })
    );

    // Return a success response with the order ID
    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Order placed", orderId }),
    };
  } catch (error) {
    // Handle and log any errors that occur
    console.error("Error placing order:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
