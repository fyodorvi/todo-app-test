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
}

resource "aws_eks_access_entry" "github_actions" {
  cluster_name  = module.eks.cluster_name
  principal_arn = aws_iam_user.github_actions.arn
  type          = "STANDARD"
}

resource "aws_eks_access_policy_association" "github_actions_admin" {
  cluster_name  = module.eks.cluster_name
  principal_arn = aws_iam_user.github_actions.arn
  policy_arn    = "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy"

  access_scope {
    type = "cluster"
  }
}
