// Debug environment variables
console.log('Environment variables:', {
  COGNITO_CLIENT_ID: process.env.COGNITO_CLIENT_ID,
  COGNITO_USER_POOL_ID: process.env.COGNITO_USER_POOL_ID,
  AWS_REGION: process.env.AWS_REGION,
  API_URL: process.env.API_URL
});

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.test' });

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

// Debug configuration
console.log('Configuration:', config);

// Utility functions
async function getCognitoToken(username, password) {
  try {
    const command = `aws cognito-idp initiate-auth \
      --client-id ${config.cognitoClientId} \
      --auth-flow USER_PASSWORD_AUTH \
      --auth-parameters USERNAME=${username},PASSWORD=${password} \
      --region ${config.region}`;

    console.log('Running command:', command);
    const result = JSON.parse(execSync(command).toString());
    console.log('Cognito response:', JSON.stringify(result, null, 2));
    return result.AuthenticationResult.IdToken;
  } catch (error) {
    console.error('Error getting Cognito token:', error.message);
    console.error('Error details:', error);
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
    console.log(`Making ${method} request to ${path} with options:`, JSON.stringify(options, null, 2));
    const response = await fetch(`${config.apiUrl}${path}`, options);
    const data = await response.json();
    console.log(`Response from ${method} ${path}:`, JSON.stringify(data, null, 2));
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error testing ${method} ${path}:`, error);
    return { status: 500, error: error.message };
  }
}

// Test sequence
async function runTests() {
  console.log('Starting end-to-end tests...\n');

  // Get admin token first
  console.log('Getting admin token...');
  const adminToken = await getCognitoToken(config.adminUser.email, config.adminUser.password);
  if (!adminToken) {
    console.error('Failed to get admin token');
    return;
  }
  console.log('Got admin token');

  // Create a test product
  console.log('Creating test product...');
  const newProduct = await testEndpoint('POST', '/admin/products', adminToken, {
    name: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    stock: 100,
    category: 'Test',
    brand: 'Test Brand',
    tags: ['test']
  });

  if (newProduct.status !== 200 || !newProduct.data || !newProduct.data.id) {
    console.error('Failed to create test product');
    console.error('New product response:', JSON.stringify(newProduct, null, 2));
    return;
  }

  const productId = newProduct.data.id;
  console.log('Created test product with ID:', productId);

  // 1. Test public endpoints
  console.log('\nTesting public endpoints...');

  // Get all products
  const products = await testEndpoint('GET', '/products');
  console.log('Products response:', JSON.stringify(products, null, 2));
  console.log('GET /products:', products.status === 200 ? '✅' : '❌');

  // Get product by ID
  const product = await testEndpoint('GET', `/products/${productId}`);
  console.log(`GET /products/${productId}:`, product.status === 200 ? '✅' : '❌');

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
    productId: productId,
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
      productId: productId,
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
  if (placeOrder.status === 200 && placeOrder.data && placeOrder.data.id) {
    const orderId = placeOrder.data.id;
    const order = await testEndpoint('GET', `/orders/${orderId}`, customerToken);
    console.log(`GET /orders/${orderId}:`, order.status === 200 ? '✅' : '❌');
  }

  // 5. Test review functionality
  console.log('\nTesting review functionality...');

  // Submit review
  const review = await testEndpoint('POST', '/reviews', customerToken, {
    productId: productId,
    rating: 5,
    comment: 'Great product!'
  });
  console.log('POST /reviews:', review.status === 200 ? '✅' : '❌');

  console.log('\nEnd-to-end testing completed!');
}

// Run tests
runTests().catch(console.error); 