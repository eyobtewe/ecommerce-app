module.exports.response = (statusCode, data) => ({
  statusCode,
  body: JSON.stringify(data),
});

module.exports.nowISO = () => new Date().toISOString();
