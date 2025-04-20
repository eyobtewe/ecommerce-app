const { v4: uuidv4 } = require("uuid");
const { docClient } = require("../shared/dynamodbClient");
const { snsClient } = require("../shared/snsClient");
const { PutCommand, UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { PublishCommand } = require("@aws-sdk/client-sns");

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
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
      shippingAddress: body.shippingAddress,
    };

    // Save order
    await docClient.send(
      new PutCommand({
        TableName: process.env.ORDERS_TABLE,
        Item: order
      })
    );

    // Update product popularity
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

    // Send SNS email notification
    await snsClient.send(
      new PublishCommand({
        TopicArn: process.env.SNS_TOPIC_ARN,
        Subject: "Order Confirmation",
        Message: `Thank you for your order ${email}! Your order ID is ${orderId}.`,
      })
    );

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
