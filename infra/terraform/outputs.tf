output "eks_cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "ecr_repository_url" {
  description = "ECR repository URL for backend image"
  value       = aws_ecr_repository.backend.repository_url
}

output "s3_bucket_name" {
  description = "S3 bucket name for frontend assets"
  value       = aws_s3_bucket.frontend.id
}

output "cloudfront_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID for cache invalidation"
  value       = aws_cloudfront_distribution.frontend.id
}

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "github_actions_access_key_id" {
  description = "Access key ID for GitHub Actions (add as AWS_ACCESS_KEY_ID secret)"
  value       = aws_iam_access_key.github_actions.id
}

output "github_actions_access_key_secret" {
  description = "Secret access key for GitHub Actions (add as AWS_SECRET_ACCESS_KEY secret)"
  value       = aws_iam_access_key.github_actions.secret
  sensitive   = true
}
