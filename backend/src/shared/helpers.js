// Utility functions for common operations
// response: Formats the HTTP response with a status code and JSON body
// nowISO: Returns the current date and time in ISO format

module.exports.response = (statusCode, data) => ({
  statusCode,
  body: JSON.stringify(data),
});

module.exports.nowISO = () => new Date().toISOString();
