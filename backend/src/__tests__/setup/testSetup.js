const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const { SNSClient } = require('@aws-sdk/client-sns');

// Create mock clients
const ddbMock = mockClient(DynamoDBClient);
const snsMock = mockClient(SNSClient);

// Reset all mocks before each test
beforeEach(() => {
  ddbMock.reset();
  snsMock.reset();
});

// Export mocks for use in tests
module.exports = {
  ddbMock,
  snsMock
}; 