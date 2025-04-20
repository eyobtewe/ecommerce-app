##########################################
# variables.tf
# Input variables used in main.tf and other modules
##########################################

variable "aws_region" {
  description = "AWS region to deploy resources into"
  type        = string
  default     = "us-east-1"
}

variable "aws_profile" {
  description = "AWS named profile (used only for local development)" 
  type        = string
  default     = "eyob" #!TODO change this to your working profile
}

variable "environment" {
  description = "Deployment environment (e.g. dev, staging, prod)"
  type        = string
  default     = "prod" #! change this to your prod later
}

# variable "products_table_name" {
#   description = "Name of the DynamoDB table for products"
#   type        = string
#   default = "Products"
# }
