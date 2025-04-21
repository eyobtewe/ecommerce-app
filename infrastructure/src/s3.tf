resource "aws_s3_bucket" "product_images" {
  bucket = "${local.prefix}-product-images"
  
  tags = {
    Environment = var.environment
  }
}

resource "aws_s3_bucket_cors_configuration" "product_images_cors" {
  bucket = aws_s3_bucket.product_images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST", "GET"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}

resource "aws_s3_bucket_public_access_block" "product_images" {
  bucket = aws_s3_bucket.product_images.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

output "product_images_bucket" {
  value = aws_s3_bucket.product_images.id
}

output "product_images_bucket_arn" {
  value = aws_s3_bucket.product_images.arn
} 