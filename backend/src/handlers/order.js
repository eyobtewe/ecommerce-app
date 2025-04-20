const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { SNSClient, PublishCommand } = require('@aws-sdk/client-sns');
const { v4: uuidv4 } = require('uuid');

const ddbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);
const snsClient = new SNSClient({});

const validateOrder = (order) => {
  if (!order.items || !Array.isArray(order.items) || order.items.length === 0) {
    return false;
  }
  if (!order.totalAmount || typeof order.totalAmount !== 'number') {
    return false;
  }
  if (!order.shippingAddress || !order.shippingAddress.street || !order.shippingAddress.city ||
    !order.shippingAddress.state || !order.shippingAddress.zipCode) {
    return false;
  }
  return true;
};

const placeOrder = async (event) => {
  try {
    // Check authentication
    const userId = event.requestContext?.authorizer?.claims?.sub;
    if (!userId) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' })
      };
    }

    // Parse and validate request body
    let orderData;
    try {
      orderData = JSON.parse(event.body);
    } catch (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid request body' })
      };
    }

    if (!validateOrder(orderData)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid request body' })
      };
    }

    // Create order record
    const orderId = uuidv4();
    const timestamp = new Date().toISOString();

    const order = {
      orderId,
      userId,
      ...orderData,
      status: 'PENDING',
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // Save to DynamoDB
    await ddbDocClient.send(new PutCommand({
      TableName: process.env.ORDERS_TABLE,
      Item: order
    }));

    // Publish to SNS
    await snsClient.send(new PublishCommand({
      TopicArn: process.env.ORDER_TOPIC_ARN,
      Message: JSON.stringify({
        event: 'ORDER_PLACED',
        order
      })
    }));

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'Order placed successfully',
        orderId
      })
    };

  } catch (error) {
    console.error('Error processing order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error placing order' })
    };
  }
};

module.exports = {
  placeOrder
}; 