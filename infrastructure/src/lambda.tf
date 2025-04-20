###

#? Product Lambdas & IAM Role

### 

resource "aws_iam_role" "product-role" {
  name = "${local.prefix}-product-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "product-read-policy" {
  name = "product-read-policy"
  role = aws_iam_role.product-role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = ["dynamodb:GetItem", "dynamodb:Scan", "dynamodb:Query"],
        Resource = aws_dynamodb_table.products.arn
      },
      {
        Effect = "Allow",
        Action = ["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "getProducts" {
  function_name    = "${local.prefix}-getProducts"
  filename         = "${path.module}/../../backend/dist-zip/getProducts.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/getProducts.zip")
  handler          = "getProducts.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.product-role.arn

  environment {
    variables = {
      PRODUCTS_TABLE = aws_dynamodb_table.products.name
      # AWS_REGION     = var.aws_region
    }
  }
}

resource "aws_lambda_function" "getProductById" {
  function_name    = "${local.prefix}-getProductById"
  filename         = "${path.module}/../../backend/dist-zip/getProductById.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/getProductById.zip")
  handler          = "getProductById.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.product-role.arn

  environment {
    variables = {
      PRODUCTS_TABLE = aws_dynamodb_table.products.name
      # AWS_REGION     = var.aws_region
    }
  }
}

resource "aws_lambda_function" "getPopularProducts" {
  function_name    = "${local.prefix}-getPopularProducts"
  filename         = "${path.module}/../../backend/dist-zip/getPopularProducts.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/getPopularProducts.zip")
  handler          = "getPopularProducts.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.product-role.arn

  environment {
    variables = {
      PRODUCTS_TABLE = aws_dynamodb_table.products.name
      # AWS_REGION     = var.aws_region
    }
  }
}

resource "aws_lambda_function" "getSimilarProducts" {
  function_name    = "${local.prefix}-getSimilarProducts"
  filename         = "${path.module}/../../backend/dist-zip/getSimilarProducts.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/getSimilarProducts.zip")
  handler          = "getSimilarProducts.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.product-role.arn

  environment {
    variables = {
      PRODUCTS_TABLE = aws_dynamodb_table.products.name
      # AWS_REGION     = var.aws_region
    }
  }
}


####

#? Cart Lambda Functions & IAM Role 

####

resource "aws_iam_role" "cart-role" {
  name = "${local.prefix}-cart-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "cart-rw-policy" {
  name = "cart-rw-policy"
  role = aws_iam_role.cart-role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = ["dynamodb:GetItem", "dynamodb:PutItem"],
        Resource = aws_dynamodb_table.cart.arn
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "getCart" {
  function_name    = "${local.prefix}-getCart"
  filename         = "${path.module}/../../backend/dist-zip/getCart.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/getCart.zip")
  handler          = "getCart.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.cart-role.arn

  environment {
    variables = {
      CART_TABLE = aws_dynamodb_table.cart.name
      # AWS_REGION = var.aws_region
    }
  }
}

resource "aws_lambda_function" "saveCart" {
  function_name    = "${local.prefix}-saveCart"
  filename         = "${path.module}/../../backend/dist-zip/saveCart.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/saveCart.zip")
  handler          = "saveCart.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.cart-role.arn

  environment {
    variables = {
      CART_TABLE = aws_dynamodb_table.cart.name
      # AWS_REGION = var.aws_region
    }
  }
}

####

#? Order Lambdas + SNS Integration + IAM Role.

####
resource "aws_iam_role" "order-role" {
  name = "${local.prefix}-order-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "order-rw-policy" {
  name = "order-rw-policy"
  role = aws_iam_role.order-role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      # SNS Publish — correct usage
      {
        Effect   = "Allow",
        Action   = ["sns:Publish"],
        Resource = aws_sns_topic.order_updates.arn
      },
      # DynamoDB access
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query"
        ],
        Resource = [
          aws_dynamodb_table.orders.arn,
          aws_dynamodb_table.products.arn
        ]
      },
      # Logging
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

# Order Lambda: placeOrder

resource "aws_lambda_function" "placeOrder" {
  function_name    = "${local.prefix}-placeOrder"
  filename         = "${path.module}/../../backend/dist-zip/placeOrder.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/placeOrder.zip")
  handler          = "placeOrder.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.order-role.arn

  environment {
    variables = {
      ORDERS_TABLE    = aws_dynamodb_table.orders.name
      PRODUCTS_TABLE  = aws_dynamodb_table.products.name
      SNS_TOPIC_ARN   = aws_sns_topic.order_updates.arn
      # AWS_REGION      = var.aws_region
    }
  }
}
# 📦 Order Lambda: getOrders

resource "aws_lambda_function" "getOrders" {
  function_name    = "${local.prefix}-getOrders"
  filename         = "${path.module}/../../backend/dist-zip/getOrders.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/getOrders.zip")
  handler          = "getOrders.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.order-role.arn

  environment {
    variables = {
      ORDERS_TABLE    = aws_dynamodb_table.orders.name
      PRODUCTS_TABLE  = aws_dynamodb_table.products.name
      SNS_TOPIC_ARN   = aws_sns_topic.order_updates.arn
      # AWS_REGION      = var.aws_region
    }
  }
}

# 🔍 Order Lambda: getOrderById
resource "aws_lambda_function" "getOrderById" {
  function_name    = "${local.prefix}-getOrderById"
  filename         = "${path.module}/../../backend/dist-zip/getOrderById.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/getOrderById.zip")
  handler          = "getOrderById.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.order-role.arn

  environment {
    variables = {
      ORDERS_TABLE    = aws_dynamodb_table.orders.name
      PRODUCTS_TABLE  = aws_dynamodb_table.products.name
      SNS_TOPIC_ARN   = aws_sns_topic.order_updates.arn
      # AWS_REGION      = var.aws_region
    }
  }
}

####

#? User Lambdas, Preferences Update, and Cognito PostConfirmation Trigger:

####
resource "aws_iam_role" "user-role" {
  name = "${local.prefix}-user-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "user-rw-policy" {
  name = "user-rw-policy"
  role = aws_iam_role.user-role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["dynamodb:GetItem", "dynamodb:UpdateItem"],
        Resource = aws_dynamodb_table.users.arn
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}
# 👤 Lambda: getCurrentUser

resource "aws_lambda_function" "getCurrentUser" {
  function_name    = "${local.prefix}-getCurrentUser"
  filename         = "${path.module}/../../backend/dist-zip/getCurrentUser.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/getCurrentUser.zip")
  handler          = "getCurrentUser.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.user-role.arn

  environment {
    variables = {
      USERS_TABLE = aws_dynamodb_table.users.name
      # AWS_REGION  = var.aws_region
    }
  }
}
# 📌 Lambda: updatePreferences

resource "aws_lambda_function" "updatePreferences" {
  function_name    = "${local.prefix}-updatePreferences"
  filename         = "${path.module}/../../backend/dist-zip/updatePreferences.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/updatePreferences.zip")
  handler          = "updatePreferences.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.user-role.arn

  environment {
    variables = {
      USERS_TABLE = aws_dynamodb_table.users.name
      # AWS_REGION  = var.aws_region
    }
  }
}
# ✅ PostConfirmation Lambda + IAM

resource "aws_iam_role" "postconfirm-role" {
  name = "${local.prefix}-postconfirm-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "user-write-policy" {
  name = "user-write-policy"
  role = aws_iam_role.postconfirm-role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["dynamodb:PutItem"],
        Resource = aws_dynamodb_table.users.arn
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "postConfirmationTrigger" {
  function_name    = "${local.prefix}-postConfirmationTrigger"
  filename         = "${path.module}/../../backend/dist-zip/postConfirmationTrigger.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/postConfirmationTrigger.zip")
  handler          = "postConfirmationTrigger.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.postconfirm-role.arn

  environment {
    variables = {
      USERS_TABLE = aws_dynamodb_table.users.name
      # AWS_REGION  = var.aws_region
    }
  }
}

####

#? Review Lambda and Admin Panel Lambdas + IAM Role.

####

# ✅ Batch 5.1: Review Lambda + IAM Role

resource "aws_iam_role" "review-role" {
  name = "${local.prefix}-review-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "review-write-policy" {
  name = "review-write-policy"
  role = aws_iam_role.review-role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect   = "Allow",
        Action   = ["dynamodb:PutItem"],
        Resource = aws_dynamodb_table.reviews.arn
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "submitReview" {
  function_name    = "${local.prefix}-submitReview"
  filename         = "${path.module}/../../backend/dist-zip/submitReview.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/submitReview.zip")
  handler          = "submitReview.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.review-role.arn

  environment {
    variables = {
      REVIEWS_TABLE = aws_dynamodb_table.reviews.name
      # AWS_REGION    = var.aws_region
    }
  }
}
# ✅ Batch 5.2: Admin Lambdas + IAM Role

resource "aws_iam_role" "admin-role" {
  name = "${local.prefix}-admin-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect    = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "admin-rw-policy" {
  name = "admin-rw-policy"
  role = aws_iam_role.admin-role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Scan",
          "dynamodb:Query"
        ],
        Resource = [
          aws_dynamodb_table.products.arn,
          aws_dynamodb_table.orders.arn,
          aws_dynamodb_table.users.arn
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"
        ],
        Resource = "*"
      }
    ]
  })
}
# 🛠️ Admin Lambdas

resource "aws_lambda_function" "add_product" {
  function_name    = "${local.prefix}-addProduct"
  filename         = "${path.module}/../../backend/dist-zip/addProduct.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/addProduct.zip")
  handler          = "addProduct.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.admin-role.arn

  environment {
    variables = {
      PRODUCTS_TABLE = aws_dynamodb_table.products.name
      # AWS_REGION     = var.aws_region
    }
  }
}

resource "aws_lambda_function" "edit_product" {
  function_name    = "${local.prefix}-editProduct"
  filename         = "${path.module}/../../backend/dist-zip/editProduct.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/editProduct.zip")
  handler          = "editProduct.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.admin-role.arn

  environment {
    variables = {
      PRODUCTS_TABLE = aws_dynamodb_table.products.name
      # AWS_REGION     = var.aws_region
    }
  }
}

resource "aws_lambda_function" "delete_product" {
  function_name    = "${local.prefix}-deleteProduct"
  filename         = "${path.module}/../../backend/dist-zip/deleteProduct.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/deleteProduct.zip")
  handler          = "deleteProduct.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.admin-role.arn

  environment {
    variables = {
      PRODUCTS_TABLE = aws_dynamodb_table.products.name
      # AWS_REGION     = var.aws_region
    }
  }
}
# 👤 Admin Lambdas: getAllUsers & getAllOrders

resource "aws_lambda_function" "getAllUsers" {
  function_name    = "${local.prefix}-getAllUsers"
  filename         = "${path.module}/../../backend/dist-zip/getAllUsers.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/getAllUsers.zip")
  handler          = "getAllUsers.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.admin-role.arn

  environment {
    variables = {
      USERS_TABLE = aws_dynamodb_table.users.name
      # AWS_REGION  = var.aws_region
    }
  }
}

resource "aws_lambda_function" "getAllOrders" {
  function_name    = "${local.prefix}-getAllOrders"
  filename         = "${path.module}/../../backend/dist-zip/getAllOrders.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/getAllOrders.zip")
  handler          = "getAllOrders.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.admin-role.arn

  environment {
    variables = {
      ORDERS_TABLE = aws_dynamodb_table.orders.name
      # AWS_REGION   = var.aws_region
    }
  }
}