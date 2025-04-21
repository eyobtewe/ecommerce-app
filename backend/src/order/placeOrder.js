// Import necessary AWS SDK modules and shared utilities
const { v4: uuidv4 } = require("uuid");
const { docClient } = require("../shared/dynamodbClient");
const { snsClient } = require("../shared/snsClient");
const { PutCommand, UpdateCommand, GetCommand } = require("@aws-sdk/lib-dynamodb");
const { PublishCommand } = require("@aws-sdk/client-sns");

// Rate limiting configuration
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 10;
const rateLimitMap = new Map();

// Define the Lambda handler function
exports.handler = async (event) => {
  try {
    // Rate limiting check
    const userId = event.requestContext.authorizer?.claims?.sub;
    const now = Date.now();
    const userRequests = rateLimitMap.get(userId) || [];
    const recentRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);

    if (recentRequests.length >= MAX_REQUESTS) {
      return {
        statusCode: 429,
        body: JSON.stringify({ error: "Too many requests. Please try again later." })
      };
    }

    recentRequests.push(now);
    rateLimitMap.set(userId, recentRequests);

    // Extract user information from the request context
    if (!userId || !event.requestContext.authorizer?.claims?.email) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: "Unauthorized" })
      };
    }

    const email = event.requestContext.authorizer.claims.email;

    // Parse and validate request body
    const body = JSON.parse(event.body || "{}");
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid order items" })
      };
    }

    if (!body.shippingAddress || typeof body.shippingAddress !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid shipping address" })
      };
    }

    if (!body.total || typeof body.total !== "number" || body.total <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid total amount" })
      };
    }

    // Validate products and check stock
    for (const item of body.items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid item quantity" })
        };
      }

      // Check if product exists and is active
      const product = await docClient.send(
        new GetCommand({
          TableName: process.env.PRODUCTS_TABLE,
          Key: { id: item.productId }
        })
      );

      if (!product.Item) {
        return {
          statusCode: 404,
          body: JSON.stringify({ error: `Product not found: ${item.productId}` })
        };
      }

      if (!product.Item.isActive) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Product is not active: ${item.productId}` })
        };
      }

      if (product.Item.stock < item.quantity) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Insufficient stock for product: ${item.productId}` })
        };
      }
    }

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

    // Update product stock and popularity
    for (const item of order.items) {
      await docClient.send(
        new UpdateCommand({
          TableName: process.env.PRODUCTS_TABLE,
          Key: { id: item.productId },
          UpdateExpression: "SET stock = stock - :quantity, timesOrdered = if_not_exists(timesOrdered, :zero) + :quantity",
          ExpressionAttributeValues: {
            ":quantity": item.quantity,
            ":zero": 0,
          },
          ConditionExpression: "stock >= :quantity"
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
    console.error("Error placing order:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};
