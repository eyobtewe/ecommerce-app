
##########################################
# SNS: Order Notifications
##########################################

resource "aws_sns_topic" "order_updates" {
  name = "${local.prefix}-order-updates"
}

#! TODO: You can change this email to your own
resource "aws_sns_topic_subscription" "order_email_sub" {
  topic_arn = aws_sns_topic.order_updates.arn
  protocol  = "email"
  endpoint  = "eyobtewe@gmail.com"
}

##########################################
# Output
##########################################

output "sns_topic_arn" {
  value = aws_sns_topic.order_updates.arn
}
