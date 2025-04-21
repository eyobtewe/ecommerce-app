const { v4: uuidv4 } = require("uuid");
const { docClient } = require("../shared/dynamodbClient");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const Busboy = require('busboy');

const s3Client = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
const BUCKET_NAME = process.env.PRODUCT_IMAGES_BUCKET;

function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = {};

    const busboy = Busboy({
      headers: {
        'content-type': event.headers['content-type'] || event.headers['Content-Type']
      }
    });

    busboy.on('field', (fieldname, value) => {
      fields[fieldname] = value;
    });

    busboy.on('file', (fieldname, file, { filename, encoding, mimeType }) => {
      const chunks = [];

      file.on('data', (data) => {
        chunks.push(data);
      });

      file.on('end', () => {
        files[fieldname] = {
          filename,
          content: Buffer.concat(chunks),
          encoding,
          mimetype: mimeType
        };
      });
    });

    busboy.on('finish', () => {
      resolve({ fields, files });
    });

    busboy.on('error', (error) => {
      reject(error);
    });

    const body = event.isBase64Encoded
      ? Buffer.from(event.body, 'base64')
      : event.body;

    busboy.write(body);
    busboy.end();
  });
}

exports.handler = async (event) => {
  // const dynamoDBClient = new DynamoDBClient({
  //   region: process.env.AWS_REGION || "us-east-1",
  // });
  try {
    const { fields, files } = await parseMultipartForm(event);

    // Upload images to S3 and get signed URLs
    const imageUrls = [];
    for (const file of Object.values(files)) {
      const key = `products/${uuidv4()}-${file.filename}`;

      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.content,
        ContentType: file.mimetype
      }));

      // Generate a signed URL that expires in 1 week
      const signedUrl = await getSignedUrl(s3Client, new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key
      }), { expiresIn: 604800 }); // 7 days in seconds

      imageUrls.push(signedUrl);
    }

    // Create product object with parsed fields
    const product = {
      id: uuidv4(),
      name: fields.name,
      description: fields.description,
      price: parseFloat(fields.price),
      discountPrice: fields.discountPrice ? parseFloat(fields.discountPrice) : null,
      stock: parseInt(fields.stock, 10),
      category: fields.category,
      brand: fields.brand || 'Unknown',
      tags: JSON.parse(fields.tags || '[]'),
      imageUrls,
      timesOrdered: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    await docClient.send(
      new PutCommand({
        TableName: process.env.PRODUCTS_TABLE,
        Item: product
      })
    );

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Product created successfully',
        product
      })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        message: 'Error creating product',
        error: error.message
      })
    };
  }
};
