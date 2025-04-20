const { ddbMock, snsMock, setupMockResponses } = require('./setup');

beforeEach(() => {
  ddbMock.reset();
  snsMock.reset();
  setupMockResponses();
});

// Make mocks available globally
global.ddbMock = ddbMock;
global.snsMock = snsMock; 