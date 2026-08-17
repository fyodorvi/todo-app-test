resource "aws_iam_user" "github_actions" {
  name = "${local.name}-github-actions"

  tags = {
    Project = local.name
  }
}

resource "aws_iam_policy" "github_actions" {
  name = "${local.name}-github-actions-deploy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DeployAndTerraform"
        Effect = "Allow"
        Action = [
          "autoscaling:*",
          "cloudfront:*",
          "cloudwatch:*",
          "dynamodb:*",
          "ec2:*",
          "ecr:*",
          "eks:*",
          "elasticloadbalancing:*",
          "iam:*",
          "kms:*",
          "logs:*",
          "s3:*"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_user_policy_attachment" "github_actions" {
  user       = aws_iam_user.github_actions.name
  policy_arn = aws_iam_policy.github_actions.arn
}

resource "aws_iam_access_key" "github_actions" {
  user = aws_iam_user.github_actions.name

  lifecycle {
    ignore_changes = [status]
  }
}
