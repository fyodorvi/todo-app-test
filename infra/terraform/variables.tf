variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "ap-southeast-2"
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "rush-webapp"
}

variable "cluster_version" {
  description = "EKS Kubernetes version"
  type        = string
  default     = "1.31"
}

variable "api_origin_domain" {
  description = "Backend ALB hostname (set after backend deploy to route /api/* via CloudFront)"
  type        = string
  default     = ""
}
