#!/bin/bash

# Function to test Lambda
test_lambda() {
    local function_name=$1
    local payload=$2
    
    echo "Testing $function_name..."
    aws lambda invoke \
        --function-name $function_name \
        --payload "$payload" \
        --cli-binary-format raw-in-base64-out \
        response.json
    
    echo "Response:"
    cat response.json
    echo ""
}

# Test getProductById
test_lambda "ecommerce-getProductById" '{
    "pathParameters": {
        "id": "test-product-id"
    }
}'

# Test getCart
test_lambda "ecommerce-getCart" '{
    "requestContext": {
        "authorizer": {
            "claims": {
                "sub": "test-user-id"
            }
        }
    }
}'

# Test saveCart
test_lambda "ecommerce-saveCart" '{
    "requestContext": {
        "authorizer": {
            "claims": {
                "sub": "test-user-id"
            }
        }
    },
    "body": "{\"items\": [{\"productId\": \"1\", \"quantity\": 2}]}"
}'

# Test placeOrder
test_lambda "ecommerce-placeOrder" '{
    "requestContext": {
        "authorizer": {
            "claims": {
                "sub": "test-user-id",
                "email": "test@example.com"
            }
        }
    },
    "body": "{\"items\": [{\"productId\": \"1\", \"quantity\": 2, \"price\": 10.99}], \"total\": 21.98, \"shippingAddress\": {\"street\": \"123 Test St\", \"city\": \"Test City\", \"state\": \"TS\", \"zipCode\": \"12345\"}}"
}'

# Clean up
rm response.json 