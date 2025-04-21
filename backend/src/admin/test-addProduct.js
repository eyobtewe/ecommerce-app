const fs = require('fs');
const path = require('path');
const Busboy = require('busboy');

// Mock AWS services
const mockS3Client = {
  send: async (command) => {
    console.log('Mock S3 command:', command.input);
    return {};
  },
};

// Mock DynamoDB client
const mockDynamoDBClient = {
  send: async (command) => {
    console.log('Mock DynamoDB command:', command.input);
    return {};
  },
};

// Override require for mocking
const originalRequire = require;
require = function (modulePath) {
  if (modulePath === '@aws-sdk/client-s3') {
    return {
      S3Client: function () { return mockS3Client; },
      PutObjectCommand: function (params) { return { input: params }; },
    };
  }
  if (modulePath === '@aws-sdk/s3-request-presigner') {
    return {
      getSignedUrl: async () => 'https://mocked-s3-url.com/image.jpg',
    };
  }
  if (modulePath === '@aws-sdk/client-dynamodb') {
    return {
      DynamoDBClient: function () { return mockDynamoDBClient; },
    };
  }
  if (modulePath === '@aws-sdk/lib-dynamodb') {
    return {
      DynamoDBDocumentClient: {
        from: () => mockDynamoDBClient,
      },
      PutCommand: function (params) { return { input: params }; },
    };
  }
  if (modulePath === '../shared/dynamodbClient') {
    return {
      docClient: mockDynamoDBClient,
    };
  }
  return originalRequire.apply(this, arguments);
};

// Now require the handler
const { handler } = require('./addProduct');

// Mock environment variables
process.env.AWS_REGION = 'us-east-1';
process.env.PRODUCT_IMAGES_BUCKET = 'ecommerce-product-images';
process.env.PRODUCTS_TABLE = 'Products';

// Sample product data
const sampleProduct = {
  name: 'Test Product',
  description: 'This is a test product',
  price: '99.99',
  stock: '100',
  category: 'Electronics',
  brand: 'Test Brand',
  tags: '["test", "electronics"]',
};

// Create a small test image
const testImageData = Buffer.from([
  0xFF, 0xD8, 0xFF, 0xE0, // JPEG SOI marker
  0x00, 0x10, 'J', 'F', 'I', 'F', 0x00, // JFIF identifier
  0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, // JFIF header
  0xFF, 0xD9 // JPEG EOI marker
]);

// Create multipart form data
const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const formData = Buffer.concat([
  Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="name"\r\n\r\n` +
    `${sampleProduct.name}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="description"\r\n\r\n` +
    `${sampleProduct.description}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="price"\r\n\r\n` +
    `${sampleProduct.price}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="stock"\r\n\r\n` +
    `${sampleProduct.stock}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="category"\r\n\r\n` +
    `${sampleProduct.category}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="brand"\r\n\r\n` +
    `${sampleProduct.brand}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="tags"\r\n\r\n` +
    `${sampleProduct.tags}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="image1"; filename="test-image.jpg"\r\n` +
    `Content-Type: image/jpeg\r\n\r\n`
  ),
  testImageData,
  Buffer.from(`\r\n--${boundary}--\r\n`)
]);

// Test multipart form data parsing
async function testMultipartParsing() {
  return new Promise((resolve, reject) => {
    const result = {
      files: [],
      fields: {}
    };

    const busboy = Busboy({
      headers: {
        'content-type': `multipart/form-data; boundary=${boundary}`
      }
    });

    busboy.on('file', (fieldname, file, info) => {
      const { filename, mimeType } = info;
      const chunks = [];

      file.on('data', (chunk) => {
        console.log('Received file chunk:', chunk.length, 'bytes');
        chunks.push(chunk);
      });

      file.on('end', () => {
        const content = Buffer.concat(chunks);
        console.log('File complete:', content.length, 'bytes');
        result.files.push({
          fieldname,
          filename,
          contentType: mimeType,
          content
        });
      });
    });

    busboy.on('field', (fieldname, val) => {
      result.fields[fieldname] = val;
    });

    busboy.on('finish', () => {
      resolve(result);
    });

    busboy.on('error', (err) => {
      reject(err);
    });

    busboy.write(formData);
    busboy.end();
  });
}

// Run the test
async function runTest() {
  try {
    console.log('Testing multipart form data parsing...');
    const result = await testMultipartParsing();
    console.log('\nParsed Fields:', result.fields);
    console.log('\nParsed Files:', result.files.map(f => ({
      fieldname: f.fieldname,
      filename: f.filename,
      contentType: f.contentType,
      contentLength: f.content.length,
      contentMatch: Buffer.compare(f.content, testImageData) === 0 ? 'Matches original' : 'Different'
    })));

    // Save the parsed image to verify its contents
    if (result.files.length > 0) {
      const outputPath = path.join(__dirname, 'output-test-image.jpg');
      fs.writeFileSync(outputPath, result.files[0].content);
      console.log('\nSaved parsed image to:', outputPath);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

runTest(); 