resource "aws_lambda_permission" "allow_getProducts" {
  statement_id  = "AllowAPIGatewayInvokeGetProducts"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getProducts.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/products"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
  
}


resource "aws_lambda_permission" "allow_getProductById" {
  statement_id  = "AllowAPIGatewayInvokeGetProductById"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getProductById.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/products/*"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_getPopularProducts" {
  statement_id  = "AllowAPIGatewayInvokeGetPopularProducts"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getPopularProducts.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/products/popular"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_getSimilarProducts" {
  statement_id  = "AllowAPIGatewayInvokeGetSimilarProducts"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getSimilarProducts.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/products/similar/*"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_getCart" {
  statement_id  = "AllowAPIGatewayInvokeGetCart"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getCart.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/cart"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_saveCart" {
  statement_id  = "AllowAPIGatewayInvokeSaveCart"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.saveCart.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/cart"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_placeOrder" {
  statement_id  = "AllowAPIGatewayInvokePlaceOrder"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.placeOrder.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/orders"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_getOrders" {
  statement_id  = "AllowAPIGatewayInvokeGetOrders"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getOrders.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/orders"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_getOrderById" {
  statement_id  = "AllowAPIGatewayInvokeGetOrderById"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getOrderById.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/orders/*"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_getCurrentUser" {
  statement_id  = "AllowAPIGatewayInvokeGetCurrentUser"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getCurrentUser.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/user/me"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_updatePreferences" {
  statement_id  = "AllowAPIGatewayInvokeUpdatePreferences"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.updatePreferences.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/user/preferences"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_submitReview" {
  statement_id  = "AllowAPIGatewayInvokeSubmitReview"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.submitReview.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/reviews"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_addProduct" {
  statement_id  = "AllowAPIGatewayInvokeAddProduct"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.add_product.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/admin/products"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_editProduct" {
  statement_id  = "AllowAPIGatewayInvokeEditProduct"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.edit_product.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/admin/products/*"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_deleteProduct" {
  statement_id  = "AllowAPIGatewayInvokeDeleteProduct"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.delete_product.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/admin/products/*"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_getAllUsers" {
  statement_id  = "AllowAPIGatewayInvokeGetAllUsers"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getAllUsers.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/admin/users"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}

resource "aws_lambda_permission" "allow_getAllOrders" {
  statement_id  = "AllowAPIGatewayInvokeGetAllOrders"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.getAllOrders.function_name
  principal     = "apigateway.amazonaws.com"
  # source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*/*/admin/orders"
  source_arn    = "${aws_api_gateway_rest_api.ecommerce_api.execution_arn}/*"
}
