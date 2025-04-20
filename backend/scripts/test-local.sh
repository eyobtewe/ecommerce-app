#!/bin/bash

# Start local API Gateway and DynamoDB
sam local start-api --docker-network ecommerce-network &

# Wait for services to start
sleep 5

# Test getProductById
echo "Testing getProductById..."
curl -X GET "http://localhost:3000/products/test-product-id"

# Test getCart
echo -e "\nTesting getCart..."
curl -X GET "http://localhost:3000/cart" \
  -H "Authorization: Bearer test-token" \
  -H "x-user-id: test-user-id"

# Test saveCart
echo -e "\nTesting saveCart..."
curl -X POST "http://localhost:3000/cart" \
  -H "Authorization: Bearer test-token" \
  -H "x-user-id: test-user-id" \
  -H "Content-Type: application/json" \
  -d '{"items": [{"productId": "1", "quantity": 2}]}'

# Test placeOrder
echo -e "\nTesting placeOrder..."
curl -X POST "http://localhost:3000/orders" \
  -H "Authorization: Bearer test-token" \
  -H "x-user-id: test-user-id" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {
        "productId": "1",
        "quantity": 2,
        "price": 10.99
      }
    ],
    "total": 21.98,
    "shippingAddress": {
      "street": "123 Test St",
      "city": "Test City",
      "state": "TS",
      "zipCode": "12345"
    }
  }'

# Stop local services
pkill -f "sam local start-api" 