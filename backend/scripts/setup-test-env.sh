#!/bin/bash

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install it first."
    exit 1
fi

# Get Cognito User Pool ID and Client ID
echo "Getting Cognito User Pool information..."
USER_POOL_ID=$(aws cognito-idp list-user-pools --max-results 60 --query "UserPools[?Name=='ecommerce-app-user-pool'].Id" --output text)
CLIENT_ID=$(aws cognito-idp list-user-pool-clients --user-pool-id $USER_POOL_ID --query "UserPoolClients[0].ClientId" --output text)

# Get API Gateway URL
echo "Getting API Gateway URL..."
API_URL=$(aws apigateway get-rest-apis --query "items[?name=='ecommerce-api'].id" --output text)
API_URL="https://${API_URL}.execute-api.${AWS_REGION:-us-east-1}.amazonaws.com/prod"

# Create .env.test file
echo "Creating .env.test file..."
cat > .env.test << EOL
COGNITO_CLIENT_ID=$CLIENT_ID
COGNITO_USER_POOL_ID=$USER_POOL_ID
AWS_REGION=${AWS_REGION:-us-east-1}
API_URL=$API_URL
EOL

echo "Environment setup complete!"
echo "Please make sure you have created test users in Cognito with the following credentials:"
echo "Customer: test@example.com / Test123!"
echo "Admin: admin@example.com / Admin123!"
echo ""
echo "To run the tests, execute:"
echo "node scripts/test-api.js" 