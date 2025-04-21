##########################################
# API Gateway: Full Setup with All Endpoints
##########################################

resource "aws_api_gateway_rest_api" "ecommerce_api" {
  name        = "${local.prefix}-api"
  description = "E-commerce API Gateway"
}

resource "aws_api_gateway_authorizer" "cognito_auth" {
  name                   = "${local.prefix}-auth"
  rest_api_id            = aws_api_gateway_rest_api.ecommerce_api.id
  identity_source        = "method.request.header.Authorization"
  type                   = "COGNITO_USER_POOLS"
  provider_arns          = [aws_cognito_user_pool.main.arn]
}

##########################################
# Public Endpoints
##########################################

# /products
resource "aws_api_gateway_resource" "products" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_rest_api.ecommerce_api.root_resource_id
  path_part   = "products"
}

resource "aws_api_gateway_method" "get_products" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.products.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_products_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.products.id
  http_method             = aws_api_gateway_method.get_products.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.getProducts.invoke_arn
}

# /products/{id}
resource "aws_api_gateway_resource" "product_by_id" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_resource.products.id
  path_part   = "{id}"
}

resource "aws_api_gateway_method" "get_product_by_id" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.product_by_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_product_by_id_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.product_by_id.id
  http_method             = aws_api_gateway_method.get_product_by_id.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.getProductById.invoke_arn
}

# /products/popular
resource "aws_api_gateway_resource" "products_popular" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_resource.products.id
  path_part   = "popular"
}

resource "aws_api_gateway_method" "get_popular_products" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.products_popular.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_popular_products_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.products_popular.id
  http_method             = aws_api_gateway_method.get_popular_products.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.getPopularProducts.invoke_arn
}

# /products/similar/{id}
resource "aws_api_gateway_resource" "products_similar" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_resource.products.id
  path_part   = "similar"
}

resource "aws_api_gateway_method" "get_similar_products" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.products_similar.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_similar_products_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.products_similar.id
  http_method             = aws_api_gateway_method.get_similar_products.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.getSimilarProducts.invoke_arn
}

# /reviews
resource "aws_api_gateway_resource" "reviews" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_rest_api.ecommerce_api.root_resource_id
  path_part   = "reviews"
}

resource "aws_api_gateway_method" "post_review" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.reviews.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "post_review_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.reviews.id
  http_method             = aws_api_gateway_method.post_review.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.submitReview.invoke_arn
}

# /reviews/{productId}
resource "aws_api_gateway_resource" "reviews_product_id" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_resource.reviews.id
  path_part   = "{productId}"
}

resource "aws_api_gateway_method" "get_reviews_product_id" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.reviews_product_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_reviews_product_id_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.reviews_product_id.id
  http_method             = aws_api_gateway_method.get_reviews_product_id.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.getProductReviews.invoke_arn
}

##########################################
# Output
##########################################

output "api_url" {
  value = "https://${aws_api_gateway_rest_api.ecommerce_api.id}.execute-api.${var.aws_region}.amazonaws.com/prod"
}


##########################################
# Protected Endpoints (Cognito Required)
##########################################

# /cart
resource "aws_api_gateway_resource" "cart" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_rest_api.ecommerce_api.root_resource_id
  path_part   = "cart"
}

resource "aws_api_gateway_method" "get_cart" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.cart.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

resource "aws_api_gateway_integration" "get_cart_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.cart.id
  http_method             = aws_api_gateway_method.get_cart.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.getCart.invoke_arn
}

resource "aws_api_gateway_method" "post_cart" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.cart.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

resource "aws_api_gateway_integration" "post_cart_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.cart.id
  http_method             = aws_api_gateway_method.post_cart.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.saveCart.invoke_arn
}

# /orders
resource "aws_api_gateway_resource" "orders" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_rest_api.ecommerce_api.root_resource_id
  path_part   = "orders"
}

resource "aws_api_gateway_method" "post_order" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.orders.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

resource "aws_api_gateway_integration" "post_order_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.orders.id
  http_method             = aws_api_gateway_method.post_order.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.placeOrder.invoke_arn
}

resource "aws_api_gateway_method" "get_orders" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.orders.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

resource "aws_api_gateway_integration" "get_orders_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.orders.id
  http_method             = aws_api_gateway_method.get_orders.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.getOrders.invoke_arn
}

# /orders/{id}
resource "aws_api_gateway_resource" "orders_id" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_resource.orders.id
  path_part   = "{id}"
}

resource "aws_api_gateway_method" "get_order_by_id" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.orders_id.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

resource "aws_api_gateway_integration" "get_order_by_id_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.orders_id.id
  http_method             = aws_api_gateway_method.get_order_by_id.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.getOrderById.invoke_arn
}

# /user
resource "aws_api_gateway_resource" "user" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_rest_api.ecommerce_api.root_resource_id
  path_part   = "user"
}

# /user/me
resource "aws_api_gateway_resource" "user_me" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_resource.user.id
  path_part   = "me"
}

resource "aws_api_gateway_method" "get_user_me" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.user_me.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

resource "aws_api_gateway_integration" "get_user_me_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.user_me.id
  http_method             = aws_api_gateway_method.get_user_me.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.getCurrentUser.invoke_arn
}

# /user/preferences
resource "aws_api_gateway_resource" "user_preferences" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_resource.user.id
  path_part   = "preferences"
}

resource "aws_api_gateway_method" "post_user_preferences" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.user_preferences.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

resource "aws_api_gateway_integration" "post_user_preferences_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.user_preferences.id
  http_method             = aws_api_gateway_method.post_user_preferences.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.updatePreferences.invoke_arn
}

##########################################
# Admin-Only Endpoints (Group check in Lambda)
##########################################

resource "aws_api_gateway_resource" "admin" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_rest_api.ecommerce_api.root_resource_id
  path_part   = "admin"
}

resource "aws_api_gateway_resource" "admin_products" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "products"
}

resource "aws_api_gateway_method" "post_admin_product" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.admin_products.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

resource "aws_api_gateway_integration" "post_admin_product_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.admin_products.id
  http_method             = aws_api_gateway_method.post_admin_product.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.add_product.invoke_arn

  request_parameters = {
    "integration.request.header.Content-Type" = "method.request.header.Content-Type"
  }
}

# /admin/products/{id}
resource "aws_api_gateway_resource" "admin_products_id" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_resource.admin_products.id
  path_part   = "{id}"
}

resource "aws_api_gateway_method" "put_admin_product" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.admin_products_id.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

resource "aws_api_gateway_integration" "put_admin_product_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.admin_products_id.id
  http_method             = aws_api_gateway_method.put_admin_product.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.edit_product.invoke_arn
}

resource "aws_api_gateway_method" "delete_admin_product" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.admin_products_id.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

resource "aws_api_gateway_integration" "delete_admin_product_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.admin_products_id.id
  http_method             = aws_api_gateway_method.delete_admin_product.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.delete_product.invoke_arn
}

# /admin/orders
resource "aws_api_gateway_resource" "admin_orders" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "orders"
}

resource "aws_api_gateway_method" "get_admin_orders" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.admin_orders.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

resource "aws_api_gateway_integration" "get_admin_orders_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.admin_orders.id
  http_method             = aws_api_gateway_method.get_admin_orders.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.getAllOrders.invoke_arn
}

# /admin/users
resource "aws_api_gateway_resource" "admin_users" {
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "users"
}

resource "aws_api_gateway_method" "get_admin_users" {
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = aws_api_gateway_resource.admin_users.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito_auth.id
}

resource "aws_api_gateway_integration" "get_admin_users_integration" {
  rest_api_id             = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id             = aws_api_gateway_resource.admin_users.id
  http_method             = aws_api_gateway_method.get_admin_users.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.getAllUsers.invoke_arn
}

# Update the api_resources list to remove auth resources
locals {
  cors_headers = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Credentials" = true
  }
  cors_integration_headers = {
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,PUT,DELETE,OPTIONS'"
    "method.response.header.Access-Control-Allow-Credentials" = "'true'"
  }
  api_resources = [
    aws_api_gateway_resource.products,
    aws_api_gateway_resource.product_by_id,
    aws_api_gateway_resource.products_popular,
    aws_api_gateway_resource.products_similar,
    aws_api_gateway_resource.reviews,
    aws_api_gateway_resource.reviews_product_id,
    aws_api_gateway_resource.cart,
    aws_api_gateway_resource.orders,
    aws_api_gateway_resource.orders_id,
    aws_api_gateway_resource.user,
    aws_api_gateway_resource.user_me,
    aws_api_gateway_resource.user_preferences,
    aws_api_gateway_resource.admin,
    aws_api_gateway_resource.admin_products,
    aws_api_gateway_resource.admin_products_id,
    aws_api_gateway_resource.admin_orders,
    aws_api_gateway_resource.admin_users
  ]
}

# Create OPTIONS method for each resource
resource "aws_api_gateway_method" "options" {
  for_each = {
    for resource in local.api_resources : resource.id => resource
  }
  rest_api_id   = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id   = each.value.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Add CORS method response
resource "aws_api_gateway_method_response" "cors_200" {
  for_each = {
    for resource in local.api_resources : resource.id => resource
  }
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id = each.value.id
  http_method = aws_api_gateway_method.options[each.value.id].http_method
  status_code = "200"
  response_models = {
    "application/json" = "Empty"
  }
  response_parameters = local.cors_headers
}

# Add CORS integration
resource "aws_api_gateway_integration" "cors_integration" {
  for_each = {
    for resource in local.api_resources : resource.id => resource
  }
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id = each.value.id
  http_method = aws_api_gateway_method.options[each.value.id].http_method
  type        = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# Add CORS integration response
resource "aws_api_gateway_integration_response" "cors_integration_response" {
  for_each = {
    for resource in local.api_resources : resource.id => resource
  }
  rest_api_id = aws_api_gateway_rest_api.ecommerce_api.id
  resource_id = each.value.id
  http_method = aws_api_gateway_method.options[each.value.id].http_method
  status_code = aws_api_gateway_method_response.cors_200[each.value.id].status_code
  response_parameters = local.cors_integration_headers
}
