export const response = (statusCode: number, data: any) => ({
  statusCode,
  body: JSON.stringify(data),
});

export const nowISO = () => new Date().toISOString();
