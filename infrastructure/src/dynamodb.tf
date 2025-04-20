
##########################################
# DynamoDB Tables
##########################################

resource "aws_dynamodb_table" "products" {
  name           = "${local.prefix}-products"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "orders" {
  name           = "${local.prefix}-orders"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"
  range_key      = "orderId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "orderId"
    type = "S"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "users" {
  name           = "${local.prefix}-users"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "cart" {
  name           = "${local.prefix}-cart"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = {
    Environment = var.environment
  }
}

resource "aws_dynamodb_table" "reviews" {
  name           = "${local.prefix}-reviews"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "productId"
  range_key      = "userId"

  attribute {
    name = "productId"
    type = "S"
  }

  attribute {
    name = "userId"
    type = "S"
  }

  tags = {
    Environment = var.environment
  }
}

##########################################
# Outputs
##########################################

output "products_table" {
  value = aws_dynamodb_table.products.name
}

output "products_table_arn" {
  value = aws_dynamodb_table.products.arn
}

output "orders_table" {
  value = aws_dynamodb_table.orders.name
}

output "orders_table_arn" {
  value = aws_dynamodb_table.orders.arn
}

output "users_table" {
  value = aws_dynamodb_table.users.name
}

output "users_table_arn" {
  value = aws_dynamodb_table.users.arn
}

output "cart_table" {
  value = aws_dynamodb_table.cart.name
}

output "cart_table_arn" {
  value = aws_dynamodb_table.cart.arn
}

output "reviews_table" {
  value = aws_dynamodb_table.reviews.name
}

output "reviews_table_arn" {
  value = aws_dynamodb_table.reviews.arn
}
