const axios = require('axios');
require('dotenv').config({ path: '.env.test' });

// Base URL for the deployed API
const API_BASE_URL = process.env.API_BASE_URL;

describe('API Integration Tests', () => {
  let authToken;
  let userId;
  let productId;
  let cartId;

  // Helper function to make requests (with optional authentication)
  const makeRequest = async (method, path, data = null, requiresAuth = false) => {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Origin': 'http://localhost:3000'
    };

    if (requiresAuth && authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    if (process.env.API_KEY) {
      headers['x-api-key'] = process.env.API_KEY;
    }

    try {
      const response = await axios({
        method,
        url: `${API_BASE_URL}${path}`,
        headers,
        data,
        validateStatus: (status) => {
          // Consider 201 and 204 as valid status codes along with 200
          return [200, 201, 204].includes(status);
        }
      });
      return response;
    } catch (error) {
      console.error('Request failed:', {
        url: `${API_BASE_URL}${path}`,
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
  };

  describe('Public Endpoints', () => {
    it('should fetch all products', async () => {
      const response = await makeRequest('GET', '/products');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.items)).toBe(true);
      if (response.data.items.length > 0) {
        productId = response.data.items[0].id;
      }
    });

    it('should fetch a specific product', async () => {
      if (!productId) {
        console.log('No products available to test with');
        return;
      }
      const response = await makeRequest('GET', `/products/${productId}`);
      expect(response.status).toBe(200);
      expect(response.data.id).toBe(productId);
    });

    it('should fetch popular products', async () => {
      const response = await makeRequest('GET', '/products/popular');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.items)).toBe(true);
    });
  });

  describe('Authentication', () => {
    it('should register a new user', async () => {
      const response = await makeRequest('POST', '/auth/register', {
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123!',
        name: 'Test User'
      });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('email');
    });

    it('should login and get auth token', async () => {
      const response = await makeRequest('POST', '/auth/login', {
        email: `test${Date.now()}@example.com`,
        password: 'TestPassword123!'
      });
      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('token');
      expect(response.data).toHaveProperty('userId');
      authToken = response.data.token;
      userId = response.data.userId;
    });
  });

  describe('Protected Endpoints', () => {
    beforeAll(async () => {
      if (!authToken) {
        // Register and login if not already done
        const email = `test${Date.now()}@example.com`;
        const registerResponse = await makeRequest('POST', '/auth/register', {
          email,
          password: 'TestPassword123!',
          name: 'Test User'
        });

        const loginResponse = await makeRequest('POST', '/auth/login', {
          email,
          password: 'TestPassword123!'
        });

        authToken = loginResponse.data.token;
        userId = loginResponse.data.userId;
      }
    });

    it('should get user profile', async () => {
      const response = await makeRequest('GET', '/user', null, true);
      expect(response.status).toBe(200);
      expect(response.data.userId).toBe(userId);
    });

    it('should update user preferences', async () => {
      const response = await makeRequest('PUT', '/user/preferences', {
        emailNotifications: true,
        newsletterSubscription: true
      }, true);
      expect(response.status).toBe(200);
    });

    it('should add item to cart', async () => {
      if (!productId) {
        console.log('No products available to test with');
        return;
      }
      const response = await makeRequest('POST', '/cart', {
        items: [{
          productId,
          quantity: 1
        }]
      }, true);
      expect(response.status).toBe(200);
      cartId = response.data.id;
    });

    it('should get cart contents', async () => {
      const response = await makeRequest('GET', '/cart', null, true);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.items)).toBe(true);
    });

    it('should create an order', async () => {
      if (!productId) {
        console.log('No products available to test with');
        return;
      }
      const response = await makeRequest('POST', '/orders', {
        items: [{
          productId,
          quantity: 1,
          price: 29.99
        }],
        shippingAddress: {
          street: '123 Test St',
          city: 'Test City',
          state: 'TS',
          zipCode: '12345'
        }
      }, true);
      expect(response.status).toBe(201);
    });

    it('should fetch user orders', async () => {
      const response = await makeRequest('GET', '/orders', null, true);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.items)).toBe(true);
    });
  });
}); 