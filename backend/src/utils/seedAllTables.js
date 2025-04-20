// const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
// const { DynamoDBDocumentClient, PutCommand } = require("@aws-sdk/lib-dynamodb");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { faker } = require("@faker-js/faker");
const { v4: uuidv4 } = require("uuid");
const { dynamoDBClient } = require("../shared/dynamodbClient");

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || "ecommerce-prod-products";
const CART_TABLE = process.env.CART_TABLE || "ecommerce-prod-cart";
const ORDERS_TABLE = process.env.ORDERS_TABLE || "ecommerce-prod-orders";
const USERS_TABLE = process.env.USERS_TABLE || "ecommerce-prod-users";
const REVIEWS_TABLE = process.env.REVIEWS_TABLE || "ecommerce-prod-reviews";

exports.handler = async () => {
  console.log("🔁 Seeding started");

  const products = await seedProducts(50);
  const users = await seedUsers(10, products);
  await seedReviews(15, users, products);

  console.log("✅ Seeding complete");
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Seeded successfully" }),
  };
};

async function seedProducts(count) {
  const items = [];

  for (let i = 0; i < count; i++) {
    const item = {
      id: uuidv4(),
      name: faker.commerce.productName(),
      price: parseFloat(faker.commerce.price()),
      category: faker.commerce.department(),
      isActive: true,
      stock: faker.number.int({ min: 5, max: 100 }),
      createdAt: new Date().toISOString(),
    };
    await dynamoDBClient.send(
      new PutCommand({ TableName: PRODUCTS_TABLE, Item: item })
    );
    items.push(item);
    console.log(`✅ Product: ${item.name}`);
  }

  return items;
}

async function seedUsers(count, products) {
  const users = [];

  for (let i = 0; i < count; i++) {
    const userId = uuidv4();
    const user = {
      userId: userId,
      email: faker.internet.email(),
      preferredCategories: [
        faker.commerce.department(),
        faker.commerce.department(),
      ],
    };

    await dynamoDBClient.send(
      new PutCommand({ TableName: USERS_TABLE, Item: user })
    );
    await seedCart(userId, products);
    await seedOrders(userId, products);

    users.push(user);
    console.log(`👤 User: ${user.email}`);
  }

  return users;
}

function getRandomProduct(products) {
  return products[Math.floor(Math.random() * products.length)];
}

async function seedCart(userId, products) {
  const cartItems = Array.from({ length: 3 }).map(() => {
    const p = getRandomProduct(products);
    return {
      productId: p.id,
      name: p.name,
      price: p.price,
      quantity: faker.number.int({ min: 1, max: 5 }),
    };
  });

  const item = { userId, cartItems };
  await dynamoDBClient.send(
    new PutCommand({ TableName: CART_TABLE, Item: item })
  );
  console.log(`🛒 Cart for user: ${userId}`);
}

async function seedOrders(userId, products) {
  for (let i = 0; i < 2; i++) {
    const items = Array.from({ length: 2 }).map(() => {
      const p = getRandomProduct(products);
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: faker.number.int({ min: 1, max: 3 }),
      };
    });

    const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const order = {
      orderId: uuidv4(),
      userId,
      items,
      status: faker.helpers.arrayElement(["pending", "shipped", "delivered"]),
      totalPrice,
      createdAt: new Date().toISOString(),
    };

    await dynamoDBClient.send(
      new PutCommand({ TableName: ORDERS_TABLE, Item: order })
    );
    console.log(`📦 Order for user: ${userId}`);
  }
}

async function seedReviews(count, users, products) {
  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const product = products[Math.floor(Math.random() * products.length)];

    const review = {
      id: uuidv4(),
      userId: user.userId,
      productId: product.id,
      rating: faker.number.int({ min: 1, max: 5 }),
      comment: faker.lorem.sentences(2),
      createdAt: new Date().toISOString(),
    };

    await dynamoDBClient.send(
      new PutCommand({ TableName: REVIEWS_TABLE, Item: review })
    );

    console.log(`⭐ Review by ${user.email} for ${product.name}`);
  }
}

exports.handler();
