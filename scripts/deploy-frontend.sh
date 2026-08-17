#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT_DIR}/scripts/aws-env.sh"

DEPLOY_DIR="${ROOT_DIR}/.deploy"
OUTPUTS_FILE="${DEPLOY_DIR}/terraform-outputs.json"
ALB_URL_FILE="${DEPLOY_DIR}/alb-url"
FRONTEND_DIR="${ROOT_DIR}/apps/frontend"

if [[ ! -f "${OUTPUTS_FILE}" ]]; then
  echo "Error: ${OUTPUTS_FILE} not found. Run deploy-infra.sh first."
  exit 1
fi

AWS_REGION=$(jq -r '.aws_region.value' "${OUTPUTS_FILE}")
S3_BUCKET=$(jq -r '.s3_bucket_name.value' "${OUTPUTS_FILE}")
CF_DIST_ID=$(jq -r '.cloudfront_distribution_id.value' "${OUTPUTS_FILE}")
CF_URL=$(jq -r '.cloudfront_url.value' "${OUTPUTS_FILE}")

if [[ -n "${VITE_API_URL:-}" ]]; then
  API_URL="${VITE_API_URL}"
elif [[ -f "${ALB_URL_FILE}" ]]; then
  API_URL="${CF_URL}"
else
  echo "Error: ALB URL not found. Run deploy-backend.sh first or set VITE_API_URL."
  exit 1
fi

if [[ -z "${VITE_AUTH0_DOMAIN:-}" || -z "${VITE_AUTH0_CLIENT_ID:-}" || -z "${VITE_AUTH0_AUDIENCE:-}" ]]; then
  echo "Error: VITE_AUTH0_DOMAIN, VITE_AUTH0_CLIENT_ID, and VITE_AUTH0_AUDIENCE must be set."
  exit 1
fi

echo "Building frontend with VITE_API_URL=${API_URL}"
cd "${FRONTEND_DIR}"
npm install
VITE_API_URL="${API_URL}" \
VITE_AUTH0_DOMAIN="${VITE_AUTH0_DOMAIN}" \
VITE_AUTH0_CLIENT_ID="${VITE_AUTH0_CLIENT_ID}" \
VITE_AUTH0_AUDIENCE="${VITE_AUTH0_AUDIENCE}" \
npm run build

echo "Syncing to S3 bucket: ${S3_BUCKET}"
aws s3 sync dist/ "s3://${S3_BUCKET}" --delete --region "${AWS_REGION}"

echo "Creating CloudFront invalidation..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "${CF_DIST_ID}" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo ""
echo "Frontend deployed successfully!"
echo "  CloudFront URL: ${CF_URL}"
echo "  API URL:        ${API_URL}"
echo "  Invalidation:   ${INVALIDATION_ID}"
echo ""
echo "Open ${CF_URL} in your browser to verify."
