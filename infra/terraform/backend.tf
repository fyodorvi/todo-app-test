terraform {
  backend "s3" {
    bucket         = "rush-webapp-tfstate-851148335474"
    key            = "rush-webapp/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "rush-webapp-tfstate-lock"
    encrypt        = true
  }
}
