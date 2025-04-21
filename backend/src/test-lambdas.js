const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  cognitoClientId: process.env.COGNITO_CLIENT_ID,
  userPoolId: process.env.COGNITO_USER_POOL_ID,
  region: process.env.AWS_REGION || 'us-east-1',
  apiUrl: process.env.API_URL,
  testUser: {
    email: 'test@example.com',
    password: 'Test123!'
  },
  adminUser: {
    email: 'admin@example.com',
    password: 'Admin123!'
  }
};

// Utility functions
async function getCognitoToken(username, password) {
  try {
    const command = `aws cognito-idp initiate-auth \
      --client-id ${config.cognitoClientId} \
      --auth-flow USER_PASSWORD_AUTH \
      --auth-parameters USERNAME=${username},PASSWORD=${password} \
      --region ${config.region}`;

    const result = JSON.parse(execSync(command).toString());
    return result.AuthenticationResult.IdToken;
  } catch (error) {
    console.error('Error getting Cognito token:', error.message);
    return null;
  }
}

async function testEndpoint(method, path, token = null, body = null) {
  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined
  };

  try {
    const response = await fetch(`${config.apiUrl}${path}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error testing ${method} ${path}:`, error);
    return { status: 500, error: error.message };
  }
}

// Test sequence
async function runTests() {
  console.log('Starting end-to-end tests...\n');

  // 1. Test public endpoints
  console.log('Testing public endpoints...');

  // Get all products
  const products = await testEndpoint('GET', '/products');
  console.log('GET /products:', products.status === 200 ? '✅' : '❌');

  // Get product by ID (using first product from previous response)
  if (products.status === 200 && products.data.length > 0) {
    const productId = products.data[0].id;
    const product = await testEndpoint('GET', `/products/${productId}`);
    console.log(`GET /products/${productId}:`, product.status === 200 ? '✅' : '❌');
  }

  // 2. Test customer endpoints
  console.log('\nTesting customer endpoints...');

  // Get customer token
  const customerToken = await getCognitoToken(config.testUser.email, config.testUser.password);
  if (!customerToken) {
    console.error('Failed to get customer token');
    return;
  }

  // Get cart
  const cart = await testEndpoint('GET', '/cart', customerToken);
  console.log('GET /cart:', cart.status === 200 ? '✅' : '❌');

  // Add to cart
  const addToCart = await testEndpoint('POST', '/cart', customerToken, {
    productId: products.data[0].id,
    quantity: 1
  });
  console.log('POST /cart:', addToCart.status === 200 ? '✅' : '❌');

  // Get user profile
  const userProfile = await testEndpoint('GET', '/user/me', customerToken);
  console.log('GET /user/me:', userProfile.status === 200 ? '✅' : '❌');

  // Update preferences
  const updatePrefs = await testEndpoint('POST', '/user/preferences', customerToken, {
    preferredCategories: ['Electronics']
  });
  console.log('POST /user/preferences:', updatePrefs.status === 200 ? '✅' : '❌');

  // 3. Test admin endpoints
  console.log('\nTesting admin endpoints...');

  // Get admin token
  const adminToken = await getCognitoToken(config.adminUser.email, config.adminUser.password);
  if (!adminToken) {
    console.error('Failed to get admin token');
    return;
  }

  // Add product
  const newProduct = await testEndpoint('POST', '/admin/products', adminToken, {
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    stock: 100,
    category: 'Test',
    brand: 'Test Brand',
    tags: ['test']
  });
  console.log('POST /admin/products:', newProduct.status === 200 ? '✅' : '❌');

  // Get all users
  const allUsers = await testEndpoint('GET', '/admin/users', adminToken);
  console.log('GET /admin/users:', allUsers.status === 200 ? '✅' : '❌');

  // Get all orders
  const allOrders = await testEndpoint('GET', '/admin/orders', adminToken);
  console.log('GET /admin/orders:', allOrders.status === 200 ? '✅' : '❌');

  // 4. Test order flow
  console.log('\nTesting order flow...');

  // Place order
  const placeOrder = await testEndpoint('POST', '/orders', customerToken, {
    items: [{
      productId: products.data[0].id,
      quantity: 1
    }],
    shippingAddress: {
      street: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'Test Country'
    }
  });
  console.log('POST /orders:', placeOrder.status === 200 ? '✅' : '❌');

  // Get order by ID
  if (placeOrder.status === 200) {
    const orderId = placeOrder.data.id;
    const order = await testEndpoint('GET', `/orders/${orderId}`, customerToken);
    console.log(`GET /orders/${orderId}:`, order.status === 200 ? '✅' : '❌');
  }

  // 5. Test review functionality
  console.log('\nTesting review functionality...');

  // Submit review
  const review = await testEndpoint('POST', '/reviews', customerToken, {
    productId: products.data[0].id,
    rating: 5,
    comment: 'Great product!'
  });
  console.log('POST /reviews:', review.status === 200 ? '✅' : '❌');

  // Get reviews for product
  const getReviews = await testEndpoint('GET', `/reviews/${products.data[0].id}`);
  console.log(`GET /reviews/${products.data[0].id}:`, getReviews.status === 200 ? '✅' : '❌');
  if (getReviews.status === 200) {
    console.log('  - Reviews found:', getReviews.data.reviews.length);
    console.log('  - Average rating:', getReviews.data.averageRating);
  }

  console.log('\nEnd-to-end testing completed!');
}

// Run tests
runTests().catch(console.error); 