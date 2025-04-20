const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

const dynamoDBClient = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",

});

module.exports = { dynamoDBClient };
