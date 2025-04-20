##########################################
# main.tf
# Root Terraform configuration for AWS
##########################################

terraform {
  required_version = ">= 1.4.0"

  backend "s3" {
    bucket         = "eyob-terraform-state"     #! You must create this bucket manually in your AWS account
    key            = "ecommerce/infrastructure/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"                 #! You must create this to be Used for state locking
    encrypt        = true
  }
}

##########################################
# AWS Provider Configuration
##########################################
provider "aws" {
  region  = var.aws_region
  profile = var.aws_profile  # Optional: used only if running from local machine with named AWS profiles
}

##########################################
# Local Variables
##########################################
locals {
  project     = "ecommerce"
  environment = var.environment
  # region      = var.aws_region
  prefix      = "${local.project}-${local.environment}" # e.g. ecommerce-dev
}
