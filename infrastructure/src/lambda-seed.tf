resource "aws_iam_role" "seed-role" {
  name = "${local.prefix}-seed-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [{
      Effect = "Allow",
      Principal = { Service = "lambda.amazonaws.com" },
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "seed-policy" {
  name = "seed-policy"
  role = aws_iam_role.seed-role.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "dynamodb:PutItem"
        ],
        Resource = [
          aws_dynamodb_table.products.arn,
          aws_dynamodb_table.cart.arn,
          aws_dynamodb_table.orders.arn,
          aws_dynamodb_table.users.arn,
          aws_dynamodb_table.reviews.arn
        ]
      },
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

resource "aws_lambda_function" "seedAllTables" {
  function_name = "${local.prefix}-seedAllTables"
  filename         = "${path.module}/../../backend/dist-zip/seedAllTables.zip"
  source_code_hash = filebase64sha256("${path.module}/../../backend/dist-zip/seedAllTables.zip")
  handler          = "seedAllTables.handler"
  runtime          = "nodejs22.x"
  role             = aws_iam_role.seed-role.arn
  timeout = 60       # ⏱️ allow 60 seconds (you can go up to 900)
  memory_size = 512  # 💪 give it more power to process faster


  environment {
    variables = {
      PRODUCTS_TABLE = aws_dynamodb_table.products.name
      CART_TABLE     = aws_dynamodb_table.cart.name
      ORDERS_TABLE   = aws_dynamodb_table.orders.name
      USERS_TABLE    = aws_dynamodb_table.users.name
      REVIEWS_TABLE  = aws_dynamodb_table.reviews.name
      # AWS_REGION     = var.aws_region
    }
  }
}
