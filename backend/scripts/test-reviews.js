const axios = require('axios');
require('dotenv').config({ path: '.env.test' });

const API_URL = process.env.API_URL;
const CUSTOMER_USERNAME = process.env.CUSTOMER_USERNAME;
const CUSTOMER_PASSWORD = process.env.CUSTOMER_PASSWORD;

let customerToken = '';
let testProductId = '';

async function getAuthToken(username, password) {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      username,
      password,
    });
    return response.data.token;
  } catch (error) {
    console.error('Authentication failed:', error.response?.data || error.message);
    throw error;
  }
}

async function getTestProduct() {
  try {
    const response = await axios.get(`${API_URL}/products`);
    if (response.data.items && response.data.items.length > 0) {
      return response.data.items[0].id;
    }
    throw new Error('No products found');
  } catch (error) {
    console.error('Error getting test product:', error.response?.data || error.message);
    throw error;
  }
}

async function testSubmitReview() {
  console.log('\nTesting Submit Review...');

  try {
    const reviewData = {
      rating: 5,
      comment: 'This is a test review from the automated test suite'
    };

    const response = await axios.post(
      `${API_URL}/reviews/${testProductId}`,
      reviewData,
      {
        headers: { Authorization: `Bearer ${customerToken}` }
      }
    );

    console.log('POST /reviews/{productId}:', response.status === 201 ? '✅ Success' : '❌ Failed');
    return response.status === 201;
  } catch (error) {
    console.error('Submit review failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetReviews() {
  console.log('\nTesting Get Reviews...');

  try {
    const response = await axios.get(
      `${API_URL}/reviews/${testProductId}`,
      {
        headers: { Authorization: `Bearer ${customerToken}` }
      }
    );

    console.log('GET /reviews/{productId}:', response.status === 200 ? '✅ Success' : '❌ Failed');

    if (response.data) {
      console.log('Review data:', {
        totalReviews: response.data.totalReviews,
        averageRating: response.data.averageRating,
        reviewsCount: response.data.reviews.length
      });
    }

    return response.status === 200;
  } catch (error) {
    console.error('Get reviews failed:', error.response?.data || error.message);
    return false;
  }
}

async function testReviewValidation() {
  console.log('\nTesting Review Validation...');

  try {
    // Test invalid rating
    const invalidRatingResponse = await axios.post(
      `${API_URL}/reviews/${testProductId}`,
      {
        rating: 6,
        comment: 'Invalid rating test'
      },
      {
        headers: { Authorization: `Bearer ${customerToken}` }
      }
    ).catch(error => error.response);

    console.log('Invalid rating validation:',
      invalidRatingResponse.status === 400 ? '✅ Success' : '❌ Failed');

    // Test missing rating
    const missingRatingResponse = await axios.post(
      `${API_URL}/reviews/${testProductId}`,
      {
        comment: 'Missing rating test'
      },
      {
        headers: { Authorization: `Bearer ${customerToken}` }
      }
    ).catch(error => error.response);

    console.log('Missing rating validation:',
      missingRatingResponse.status === 400 ? '✅ Success' : '❌ Failed');

    return invalidRatingResponse.status === 400 && missingRatingResponse.status === 400;
  } catch (error) {
    console.error('Review validation tests failed:', error.message);
    return false;
  }
}

async function testPagination() {
  console.log('\nTesting Review Pagination...');

  try {
    const response = await axios.get(
      `${API_URL}/reviews/${testProductId}?limit=1`,
      {
        headers: { Authorization: `Bearer ${customerToken}` }
      }
    );

    console.log('Pagination test:',
      response.data.hasMore !== undefined ? '✅ Success' : '❌ Failed');

    if (response.data.hasMore) {
      console.log('Pagination data:', {
        hasMore: response.data.hasMore,
        lastEvaluatedKey: response.data.lastEvaluatedKey
      });
    }

    return response.data.hasMore !== undefined;
  } catch (error) {
    console.error('Pagination test failed:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  try {
    console.log('Starting Review System Tests...');

    // Get authentication token
    customerToken = await getAuthToken(CUSTOMER_USERNAME, CUSTOMER_PASSWORD);
    console.log('Customer authentication: ✅ Success');

    // Get a test product ID
    testProductId = await getTestProduct();
    console.log('Test product ID:', testProductId);

    // Run test suites
    const submitReviewSuccess = await testSubmitReview();
    const getReviewsSuccess = await testGetReviews();
    const validationSuccess = await testReviewValidation();
    const paginationSuccess = await testPagination();

    // Summary
    console.log('\nTest Summary:');
    console.log('Submit Review:', submitReviewSuccess ? '✅ Passed' : '❌ Failed');
    console.log('Get Reviews:', getReviewsSuccess ? '✅ Passed' : '❌ Failed');
    console.log('Validation:', validationSuccess ? '✅ Passed' : '❌ Failed');
    console.log('Pagination:', paginationSuccess ? '✅ Passed' : '❌ Failed');

    const allPassed = submitReviewSuccess && getReviewsSuccess &&
      validationSuccess && paginationSuccess;

    console.log('\nOverall Status:', allPassed ? '✅ All tests passed!' : '❌ Some tests failed');

    process.exit(allPassed ? 0 : 1);
  } catch (error) {
    console.error('Test execution failed:', error.message);
    process.exit(1);
  }
}

runTests(); 