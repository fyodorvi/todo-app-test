#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT_DIR}/scripts/aws-env.sh"

AWS_REGION="${AWS_REGION:-ap-southeast-2}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
BUCKET="rush-webapp-tfstate-${ACCOUNT_ID}"
TABLE="rush-webapp-tfstate-lock"

echo "Creating S3 bucket: ${BUCKET}"
if aws s3api head-bucket --bucket "${BUCKET}" 2>/dev/null; then
  echo "  Bucket already exists"
else
  aws s3api create-bucket \
    --bucket "${BUCKET}" \
    --region "${AWS_REGION}" \
    --create-bucket-configuration "LocationConstraint=${AWS_REGION}"
fi

aws s3api put-bucket-versioning \
  --bucket "${BUCKET}" \
  --versioning-configuration Status=Enabled

aws s3api put-bucket-encryption \
  --bucket "${BUCKET}" \
  --server-side-encryption-configuration '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'

aws s3api put-public-access-block \
  --bucket "${BUCKET}" \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true

echo "Creating DynamoDB table: ${TABLE}"
if aws dynamodb describe-table --table-name "${TABLE}" --region "${AWS_REGION}" 2>/dev/null; then
  echo "  Table already exists"
else
  aws dynamodb create-table \
    --table-name "${TABLE}" \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST \
    --region "${AWS_REGION}"
  aws dynamodb wait table-exists --table-name "${TABLE}" --region "${AWS_REGION}"
fi

echo ""
echo "Bootstrap complete."
echo "  S3 bucket:      ${BUCKET}"
echo "  DynamoDB table: ${TABLE}"
echo ""
echo "Next: cd infra/terraform && terraform init -migrate-state"
