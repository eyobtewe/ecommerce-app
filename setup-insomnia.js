const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration - Update these values
const config = {
  cognitoClientId: '7c3ghb7ib6gfvlibvp66mhccnq',
  userPoolId: 'us-east-1_pETkJfeFv',
  region: 'us-east-1',
  username: 'test@example.com',
  password: 'Test123!',
  adminUsername: 'admin@example.com',
  adminPassword: 'Admin123!'
};

async function setUserPassword(username, password) {
  try {
    const command = `aws cognito-idp admin-set-user-password \
      --user-pool-id ${config.userPoolId} \
      --username ${username} \
      --password ${password} \
      --permanent`;

    execSync(command);
    return true;
  } catch (error) {
    console.error(`Error setting password for ${username}:`, error.message);
    return false;
  }
}

async function getCognitoToken(username, password) {
  try {
    // First, ensure the password is set
    await setUserPassword(username, password);

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

async function getApiGatewayUrl() {
  try {
    const command = `aws apigateway get-rest-apis --region ${config.region}`;
    const result = JSON.parse(execSync(command).toString());

    // Assuming you have only one API, or you can modify this to select the correct one
    const apiId = result.items[0].id;
    return `https://${apiId}.execute-api.${config.region}.amazonaws.com/prod`;
  } catch (error) {
    console.error('Error getting API Gateway URL:', error.message);
    return null;
  }
}

async function getProductId(token, baseUrl) {
  try {
    const command = `curl -X GET "${baseUrl}/products" -H "Authorization: Bearer ${token}"`;
    const result = JSON.parse(execSync(command).toString());
    return result.products[0]?.id || null;
  } catch (error) {
    console.error('Error getting product ID:', error.message);
    return null;
  }
}

async function getOrderId(token, baseUrl) {
  try {
    const command = `curl -X GET "${baseUrl}/orders" -H "Authorization: Bearer ${token}"`;
    const result = JSON.parse(execSync(command).toString());
    return result.orders[0]?.id || null;
  } catch (error) {
    console.error('Error getting order ID:', error.message);
    return null;
  }
}

async function getUserId(token, baseUrl) {
  try {
    const command = `curl -X GET "${baseUrl}/user/me" -H "Authorization: Bearer ${token}"`;
    const result = JSON.parse(execSync(command).toString());
    return result.id || null;
  } catch (error) {
    console.error('Error getting user ID:', error.message);
    return null;
  }
}

async function main() {
  console.log('Fetching environment variables...');

  // Get tokens
  const token = await getCognitoToken(config.username, config.password);
  const adminToken = await getCognitoToken(config.adminUsername, config.adminPassword);

  if (!token || !adminToken) {
    console.error('Failed to get authentication tokens');
    return;
  }

  // Get API Gateway URL
  const baseUrl = await getApiGatewayUrl();
  if (!baseUrl) {
    console.error('Failed to get API Gateway URL');
    return;
  }

  // Get IDs
  const productId = await getProductId(token, baseUrl);
  const orderId = await getOrderId(token, baseUrl);
  const userId = await getUserId(token, baseUrl);

  // Create environment file
  const envData = {
    base_url: baseUrl,
    token: token,
    admin_token: adminToken,
    product_id: productId || 'YOUR_PRODUCT_ID',
    order_id: orderId || 'YOUR_ORDER_ID',
    user_id: userId || 'YOUR_USER_ID'
  };

  // Update Insomnia export file
  const insomniaExportPath = path.join(__dirname, 'insomnia-export.json');
  const insomniaExport = JSON.parse(fs.readFileSync(insomniaExportPath, 'utf8'));

  // Update environment variables
  insomniaExport.resources[0].data = envData;

  // Write updated file
  fs.writeFileSync(insomniaExportPath, JSON.stringify(insomniaExport, null, 2));

  console.log('Environment variables updated successfully!');
  console.log('Please check insomnia-export.json for the updated values.');
}

main().catch(console.error); 