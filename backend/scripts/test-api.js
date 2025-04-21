const axios = require('axios');
require('dotenv').config();

const API_URL = process.env.API_URL || 'https://ry3ixdtv5j.execute-api.us-east-1.amazonaws.com/prod';
const CUSTOMER_USERNAME = process.env.CUSTOMER_USERNAME || 'test@example.com';
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD || 'Test123!';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin123!';
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error('API_KEY environment variable is required');
  process.exit(1);
}

console.log('Testing API with URL:', API_URL);
console.log('Using API Key:', API_KEY);

// Helper function to make authenticated requests
async function makeRequest(method, path, data = null, requiresAuth = false) {
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // Only add API key for non-login endpoints
  if (path !== '/auth/login') {
    headers['x-api-key'] = API_KEY;
  }

  if (requiresAuth) {
    headers['Authorization'] = `Bearer ${process.env.USER_TOKEN}`;
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

let customerToken = '';
let adminToken = '';

async function authenticateUser(username, password) {
  try {
    console.log(`Attempting to authenticate user: ${username}`);
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password
    });
    console.log('Authentication successful:', response.data);
    return response.data;
  } catch (error) {
    console.error('Authentication failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    throw error;
  }
}

async function testPublicEndpoints() {
  console.log('\nTesting Public Endpoints...');

  try {
    // Test get products
    console.log('Testing GET /products...');
    const productsResponse = await makeRequest('get', '/products');
    console.log('GET /products response:', productsResponse.status, productsResponse.data);
    console.log('✓ GET /products:', productsResponse.status === 200 ? 'Success' : 'Failed');

    // Test get product by ID
    if (productsResponse.data.length > 0) {
      const productId = productsResponse.data[0].id;
      console.log(`Testing GET /products/${productId}...`);
      const productResponse = await makeRequest('get', `/products/${productId}`);
      console.log('GET /products/{id} response:', productResponse.status, productResponse.data);
      console.log('✓ GET /products/{id}:', productResponse.status === 200 ? 'Success' : 'Failed');
    }

    // Test search products
    console.log('Testing GET /products/search...');
    const searchResponse = await makeRequest('get', '/products/search?q=test');
    console.log('GET /products/search response:', searchResponse.status, searchResponse.data);
    console.log('✓ GET /products/search:', searchResponse.status === 200 ? 'Success' : 'Failed');

    // Test get categories
    console.log('Testing GET /categories...');
    const categoriesResponse = await makeRequest('get', '/categories');
    console.log('GET /categories response:', categoriesResponse.status, categoriesResponse.data);
    console.log('✓ GET /categories:', categoriesResponse.status === 200 ? 'Success' : 'Failed');

    return true;
  } catch (error) {
    console.error('Public endpoints test failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    return false;
  }
}

async function testCustomerEndpoints() {
  console.log('\nTesting Customer Endpoints...');

  try {
    // Test get cart
    console.log('Testing GET /cart...');
    const cartResponse = await makeRequest('get', '/cart', null, true);
    console.log('GET /cart response:', cartResponse.status, cartResponse.data);
    console.log('✓ GET /cart:', cartResponse.status === 200 ? 'Success' : 'Failed');

    // Test add to cart
    console.log('Testing POST /cart...');
    const addToCartResponse = await makeRequest('post', '/cart', {
      productId: 'test-product-id',
      quantity: 1
    }, true);
    console.log('POST /cart response:', addToCartResponse.status, addToCartResponse.data);
    console.log('✓ POST /cart:', addToCartResponse.status === 200 ? 'Success' : 'Failed');

    // Test get orders
    console.log('Testing GET /orders...');
    const ordersResponse = await makeRequest('get', '/orders', null, true);
    console.log('GET /orders response:', ordersResponse.status, ordersResponse.data);
    console.log('✓ GET /orders:', ordersResponse.status === 200 ? 'Success' : 'Failed');

    // Test get profile
    console.log('Testing GET /profile...');
    const profileResponse = await makeRequest('get', '/profile', null, true);
    console.log('GET /profile response:', profileResponse.status, profileResponse.data);
    console.log('✓ GET /profile:', profileResponse.status === 200 ? 'Success' : 'Failed');

    return true;
  } catch (error) {
    console.error('Customer endpoints test failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    return false;
  }
}

async function testAdminEndpoints() {
  console.log('\nTesting Admin Endpoints...');

  try {
    // Test create product
    console.log('Testing POST /admin/products...');
    const createProductResponse = await makeRequest('post', '/admin/products', {
      name: 'Test Product',
      description: 'Test Description',
      price: 99.99,
      category: 'test'
    }, true);
    console.log('POST /admin/products response:', createProductResponse.status, createProductResponse.data);
    console.log('✓ POST /admin/products:', createProductResponse.status === 200 ? 'Success' : 'Failed');

    // Test get all orders
    console.log('Testing GET /admin/orders...');
    const ordersResponse = await makeRequest('get', '/admin/orders', null, true);
    console.log('GET /admin/orders response:', ordersResponse.status, ordersResponse.data);
    console.log('✓ GET /admin/orders:', ordersResponse.status === 200 ? 'Success' : 'Failed');

    // Test get all users
    console.log('Testing GET /admin/users...');
    const usersResponse = await makeRequest('get', '/admin/users', null, true);
    console.log('GET /admin/users response:', usersResponse.status, usersResponse.data);
    console.log('✓ GET /admin/users:', usersResponse.status === 200 ? 'Success' : 'Failed');

    return true;
  } catch (error) {
    console.error('Admin endpoints test failed:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      headers: error.response?.headers
    });
    return false;
  }
}

async function runTests() {
  console.log('Starting API Tests...\n');

  try {
    console.log('Authenticating users...');
    customerToken = await authenticateUser(CUSTOMER_USERNAME, CUSTOMER_PASSWORD);
    adminToken = await authenticateUser(ADMIN_USERNAME, ADMIN_PASSWORD);
    console.log('Authentication successful!\n');

    const publicSuccess = await testPublicEndpoints();
    const customerSuccess = await testCustomerEndpoints();
    const adminSuccess = await testAdminEndpoints();

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