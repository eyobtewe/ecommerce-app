// This file contains the Lambda function handler for seeding all tables in the database.
// It includes helper functions to seed products, users, carts, orders, and reviews.
// Each helper function interacts with DynamoDB to populate the respective tables with mock data.
// The `handler` function is the entry point for the Lambda function.

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
  // Log a message indicating the seeding process has started.
  console.log("🔁 Seeding started");

  // Seed products, users, and reviews.
  const products = await seedProducts(50);
  const users = await seedUsers(10, products);
  await seedReviews(15, users, products);

  // Log a message indicating the seeding process is complete.
  console.log("✅ Seeding complete");

  // Return a success response with a message.
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Seeded successfully" }),
  };
};

// Function to seed products into the PRODUCTS_TABLE.
async function seedProducts(count) {
  const items = [];

  for (let i = 0; i < count; i++) {
    const item = {
      id: uuidv4(), // Generate a unique ID for the product.
      name: faker.commerce.productName(), // Generate a random product name.
      price: parseFloat(faker.commerce.price()), // Generate a random price.
      category: faker.commerce.department(), // Generate a random category.
      isActive: true, // Set the product as active.
      stock: faker.number.int({ min: 5, max: 100 }), // Generate a random stock quantity.
      createdAt: new Date().toISOString(), // Set the creation timestamp.
    };

    // Insert the product into the PRODUCTS_TABLE in DynamoDB.
    await dynamoDBClient.send(
      new PutCommand({ TableName: PRODUCTS_TABLE, Item: item })
    );

    items.push(item); // Add the product to the list of items.
    console.log(`✅ Product: ${item.name}`); // Log the product name.
  }

  return items; // Return the list of seeded products.
}

// Function to seed users into the USERS_TABLE and their associated carts and orders.
async function seedUsers(count, products) {
  const users = [];

  for (let i = 0; i < count; i++) {
    const userId = uuidv4(); // Generate a unique ID for the user.
    const user = {
      userId: userId,
      email: faker.internet.email(), // Generate a random email address.
      preferredCategories: [
        faker.commerce.department(),
        faker.commerce.department(),
      ], // Generate random preferred categories.
    };

    // Insert the user into the USERS_TABLE in DynamoDB.
    await dynamoDBClient.send(
      new PutCommand({ TableName: USERS_TABLE, Item: user })
    );

    // Seed the user's cart and orders.
    await seedCart(userId, products);
    await seedOrders(userId, products);

    users.push(user); // Add the user to the list of users.
    console.log(`👤 User: ${user.email}`); // Log the user's email.
  }

  return users; // Return the list of seeded users.
}

// Helper function to get a random product from a list of products.
function getRandomProduct(products) {
  return products[Math.floor(Math.random() * products.length)];
}

// Function to seed a cart for a user in the CART_TABLE.
async function seedCart(userId, products) {
  const cartItems = Array.from({ length: 3 }).map(() => {
    const p = getRandomProduct(products); // Get a random product.
    return {
      productId: p.id,
      name: p.name,
      price: p.price,
      quantity: faker.number.int({ min: 1, max: 5 }), // Generate a random quantity.
    };
  });

  const item = { userId, cartItems }; // Create the cart item object.

  // Insert the cart into the CART_TABLE in DynamoDB.
  await dynamoDBClient.send(
    new PutCommand({ TableName: CART_TABLE, Item: item })
  );

  console.log(`🛒 Cart for user: ${userId}`); // Log the user ID.
}

// Function to seed orders for a user in the ORDERS_TABLE.
async function seedOrders(userId, products) {
  for (let i = 0; i < 2; i++) {
    const items = Array.from({ length: 2 }).map(() => {
      const p = getRandomProduct(products); // Get a random product.
      return {
        productId: p.id,
        name: p.name,
        price: p.price,
        quantity: faker.number.int({ min: 1, max: 3 }), // Generate a random quantity.
      };
    });

    const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0); // Calculate the total price.
    const order = {
      orderId: uuidv4(), // Generate a unique ID for the order.
      userId,
      items,
      status: faker.helpers.arrayElement(["pending", "shipped", "delivered"]), // Randomly select a status.
      totalPrice,
      createdAt: new Date().toISOString(), // Set the creation timestamp.
    };

    // Insert the order into the ORDERS_TABLE in DynamoDB.
    await dynamoDBClient.send(
      new PutCommand({ TableName: ORDERS_TABLE, Item: order })
    );

    console.log(`📦 Order for user: ${userId}`); // Log the user ID.
  }
}

// Function to seed reviews for products in the REVIEWS_TABLE.
async function seedReviews(count, users, products) {
  for (let i = 0; i < count; i++) {
    const user = users[Math.floor(Math.random() * users.length)]; // Get a random user.
    const product = products[Math.floor(Math.random() * products.length)]; // Get a random product.

    const review = {
      id: uuidv4(), // Generate a unique ID for the review.
      userId: user.userId,
      productId: product.id,
      rating: faker.number.int({ min: 1, max: 5 }), // Generate a random rating.
      comment: faker.lorem.sentences(2), // Generate a random comment.
      createdAt: new Date().toISOString(), // Set the creation timestamp.
    };

    // Insert the review into the REVIEWS_TABLE in DynamoDB.
    await dynamoDBClient.send(
      new PutCommand({ TableName: REVIEWS_TABLE, Item: review })
    );

    console.log(`⭐ Review by ${user.email} for ${product.name}`); // Log the review details.
  }
}

// Invoke the handler function to start the seeding process.
exports.handler();
