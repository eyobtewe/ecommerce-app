const axios = require('axios');
const AmazonCognitoIdentity = require('amazon-cognito-identity-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.test') });

const API_URL = process.env.API_URL || 'https://ry3ixdtv5j.execute-api.us-east-1.amazonaws.com/prod';
const API_KEY = process.env.API_KEY;
const CUSTOMER_USERNAME = process.env.CUSTOMER_USERNAME || 'test@example.com';
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD || 'Test123!';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;

if (!API_KEY || !COGNITO_USER_POOL_ID || !COGNITO_CLIENT_ID) {
  console.error('Required environment variables are missing');
  process.exit(1);
}

let customerToken = '';
let adminToken = '';
let testProductId = '';
let testOrderId = '';

// Helper function to authenticate with Cognito
async function authenticateWithCognito(username, password) {
  const authenticationData = {
    Username: username,
    Password: password,
  };

  const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails(authenticationData);

  const poolData = {
    UserPoolId: COGNITO_USER_POOL_ID,
    ClientId: COGNITO_CLIENT_ID
  };

  const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);

  const userData = {
    Username: username,
    Pool: userPool
  };

  const cognitoUser = new AmazonCognitoIdentity.CognitoUser(userData);

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: (result) => {
        resolve(result.getIdToken().getJwtToken());
      },
      onFailure: (err) => {
        reject(err);
      }
    });
  });
}

// Helper function to make authenticated requests
async function makeRequest(method, path, data = null, requiresAuth = false, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // Only add API key for non-login endpoints
  if (path !== '/auth/login') {
    headers['x-api-key'] = API_KEY;
  }

  if (requiresAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await axios({
      method,
      url: `${API_URL}${path}`,
      headers,
      data
    });
    return response;
  } catch (error) {
    console.error('Request failed:', {
      url: `${API_URL}${path}`,
      method,
      headers: {
        ...headers,
        'x-api-key': headers['x-api-key'] ? '[REDACTED]' : undefined,
        'Authorization': headers['Authorization'] ? '[REDACTED]' : undefined
      },
      data,
      error: error.response?.data || error.message,
      status: error.response?.status
    });
    throw error;
  }
}

async function testPublicEndpoints() {
  console.log('\nTesting Public Endpoints...');
  let success = true;

  try {
    // Test get products
    console.log('Testing GET /products...');
    const productsResponse = await makeRequest('get', '/products');
    console.log('✓ GET /products:', productsResponse.status === 200 ? 'Success' : 'Failed');
    if (productsResponse.data.length > 0) {
      testProductId = productsResponse.data[0].id;
    }

    // Test get product by ID
    if (testProductId) {
      console.log(`Testing GET /products/${testProductId}...`);
      const productResponse = await makeRequest('get', `/products/${testProductId}`);
      console.log('✓ GET /products/{id}:', productResponse.status === 200 ? 'Success' : 'Failed');
    }

    // Test get popular products
    console.log('Testing GET /products/popular...');
    const popularResponse = await makeRequest('get', '/products/popular');
    console.log('✓ GET /products/popular:', popularResponse.status === 200 ? 'Success' : 'Failed');

    // Test get similar products
    if (testProductId) {
      console.log(`Testing GET /products/similar/${testProductId}...`);
      const similarResponse = await makeRequest('get', `/products/similar/${testProductId}`);
      console.log('✓ GET /products/similar/{id}:', similarResponse.status === 200 ? 'Success' : 'Failed');
    }

    // Test get product reviews
    if (testProductId) {
      console.log(`Testing GET /reviews/${testProductId}...`);
      const reviewsResponse = await makeRequest('get', `/reviews/${testProductId}`);
      console.log('✓ GET /reviews/{productId}:', reviewsResponse.status === 200 ? 'Success' : 'Failed');
    }

  } catch (error) {
    console.error('Public endpoints test failed:', error.message);
    success = false;
  }

  return success;
}

async function testCustomerEndpoints() {
  console.log('\nTesting Customer Endpoints...');
  let success = true;

  try {
    // Test get cart
    console.log('Testing GET /cart...');
    const cartResponse = await makeRequest('get', '/cart', null, true, customerToken);
    console.log('✓ GET /cart:', cartResponse.status === 200 ? 'Success' : 'Failed');

    // Test add to cart
    if (testProductId) {
      console.log('Testing POST /cart...');
      const addToCartResponse = await makeRequest('post', '/cart', {
        productId: testProductId,
        quantity: 1
      }, true, customerToken);
      console.log('✓ POST /cart:', addToCartResponse.status === 200 ? 'Success' : 'Failed');
    }

    // Test get orders
    console.log('Testing GET /orders...');
    const ordersResponse = await makeRequest('get', '/orders', null, true, customerToken);
    console.log('✓ GET /orders:', ordersResponse.status === 200 ? 'Success' : 'Failed');
    if (ordersResponse.data.length > 0) {
      testOrderId = ordersResponse.data[0].id;
    }

    // Test get order by ID
    if (testOrderId) {
      console.log(`Testing GET /orders/${testOrderId}...`);
      const orderResponse = await makeRequest('get', `/orders/${testOrderId}`, null, true, customerToken);
      console.log('✓ GET /orders/{id}:', orderResponse.status === 200 ? 'Success' : 'Failed');
    }

    // Test get user profile
    console.log('Testing GET /user/me...');
    const profileResponse = await makeRequest('get', '/user/me', null, true, customerToken);
    console.log('✓ GET /user/me:', profileResponse.status === 200 ? 'Success' : 'Failed');

    // Test update user preferences
    console.log('Testing POST /user/preferences...');
    const preferencesResponse = await makeRequest('post', '/user/preferences', {
      theme: 'dark',
      notifications: true
    }, true, customerToken);
    console.log('✓ POST /user/preferences:', preferencesResponse.status === 200 ? 'Success' : 'Failed');

  } catch (error) {
    console.error('Customer endpoints test failed:', error.message);
    success = false;
  }

  return success;
}

async function testAdminEndpoints() {
  console.log('\nTesting Admin Endpoints...');
  let success = true;

  try {
    // Test create product
    console.log('Testing POST /admin/products...');
    const createProductResponse = await makeRequest('post', '/admin/products', {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      category: 'test',
      brand: 'Test Brand',
      stock: 100
    }, true, adminToken);
    console.log('✓ POST /admin/products:', createProductResponse.status === 200 ? 'Success' : 'Failed');
    const newProductId = createProductResponse.data.id;

    // Test update product
    if (newProductId) {
      console.log(`Testing PUT /admin/products/${newProductId}...`);
      const updateProductResponse = await makeRequest('put', `/admin/products/${newProductId}`, {
        name: 'Updated Test Product',
        price: 89.99
      }, true, adminToken);
      console.log('✓ PUT /admin/products/{id}:', updateProductResponse.status === 200 ? 'Success' : 'Failed');
    }

    // Test get all orders
    console.log('Testing GET /admin/orders...');
    const ordersResponse = await makeRequest('get', '/admin/orders', null, true, adminToken);
    console.log('✓ GET /admin/orders:', ordersResponse.status === 200 ? 'Success' : 'Failed');

    // Test get all users
    console.log('Testing GET /admin/users...');
    const usersResponse = await makeRequest('get', '/admin/users', null, true, adminToken);
    console.log('✓ GET /admin/users:', usersResponse.status === 200 ? 'Success' : 'Failed');

  } catch (error) {
    console.error('Admin endpoints test failed:', error.message);
    success = false;
  }

  return success;
}

async function runTests() {
  console.log('Starting API Endpoint Tests...\n');

  try {
    // Authenticate users with Cognito
    console.log('Authenticating users with Cognito...');
    customerToken = await authenticateWithCognito(CUSTOMER_USERNAME, CUSTOMER_PASSWORD);
    adminToken = await authenticateWithCognito(ADMIN_USERNAME, ADMIN_PASSWORD);
    console.log('Authentication successful!\n');

    // Run tests
    const publicSuccess = await testPublicEndpoints();
    const customerSuccess = await testCustomerEndpoints();
    const adminSuccess = await testAdminEndpoints();

    // Print summary
    console.log('\nTest Summary:');
    console.log('Public Endpoints:', publicSuccess ? '✓ Passed' : '✗ Failed');
    console.log('Customer Endpoints:', customerSuccess ? '✓ Passed' : '✗ Failed');
    console.log('Admin Endpoints:', adminSuccess ? '✓ Passed' : '✗ Failed');

    process.exit(publicSuccess && customerSuccess && adminSuccess ? 0 : 1);
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

runTests(); 