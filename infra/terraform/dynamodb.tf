resource "aws_dynamodb_table" "todos" {
  name         = "${local.name}-todos"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  attribute {
    name = "tenantId"
    type = "S"
  }

  attribute {
    name = "tenantDateKey"
    type = "S"
  }

  global_secondary_index {
    name            = "date-index"
    hash_key        = "date"
    range_key       = "id"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "tenant-date-index"
    hash_key        = "tenantId"
    range_key       = "tenantDateKey"
    projection_type = "ALL"
  }

  tags = {
    Project = local.name
  }
}
