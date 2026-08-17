#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "${ROOT_DIR}/scripts/aws-env.sh"

DEPLOY_DIR="${ROOT_DIR}/.deploy"
OUTPUTS_FILE="${DEPLOY_DIR}/terraform-outputs.json"
HELM_CHART="${ROOT_DIR}/deploy/helm/backend"
BACKEND_DIR="${ROOT_DIR}/apps/backend"

if [[ ! -f "${OUTPUTS_FILE}" ]]; then
  echo "Error: ${OUTPUTS_FILE} not found. Run deploy-infra.sh first."
  exit 1
fi

AWS_REGION=$(jq -r '.aws_region.value' "${OUTPUTS_FILE}")
CLUSTER_NAME=$(jq -r '.eks_cluster_name.value' "${OUTPUTS_FILE}")
ECR_URL=$(jq -r '.ecr_repository_url.value' "${OUTPUTS_FILE}")
CLOUDFRONT_URL=$(jq -r '.cloudfront_url.value' "${OUTPUTS_FILE}")
TODOS_TABLE_NAME=$(jq -r '.todos_table_name.value' "${OUTPUTS_FILE}")
BACKEND_IRSA_ROLE_ARN=$(jq -r '.backend_irsa_role_arn.value' "${OUTPUTS_FILE}")

if [[ -z "${AUTH0_DOMAIN:-}" || -z "${AUTH0_AUDIENCE:-}" ]]; then
  echo "Error: AUTH0_DOMAIN and AUTH0_AUDIENCE must be set."
  exit 1
fi

IMAGE_TAG="${IMAGE_TAG:-$(date +%Y%m%d%H%M%S)}"

echo "Configuring kubectl for cluster: ${CLUSTER_NAME}"
aws eks update-kubeconfig --region "${AWS_REGION}" --name "${CLUSTER_NAME}"

echo "Building and pushing Docker image: ${ECR_URL}:${IMAGE_TAG}"
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_URL%%/*}"

docker build --platform linux/amd64 -t "${ECR_URL}:${IMAGE_TAG}" "${BACKEND_DIR}"
docker push "${ECR_URL}:${IMAGE_TAG}"

echo "Deploying with Helm..."
helm upgrade --install backend "${HELM_CHART}" \
  --set "image.repository=${ECR_URL}" \
  --set "image.tag=${IMAGE_TAG}" \
  --set "cloudfrontUrl=${CLOUDFRONT_URL}" \
  --set "dynamodb.tableName=${TODOS_TABLE_NAME}" \
  --set "aws.region=${AWS_REGION}" \
  --set "auth0.domain=${AUTH0_DOMAIN}" \
  --set "auth0.audience=${AUTH0_AUDIENCE}" \
  --set "serviceAccount.annotations.eks\.amazonaws\.com/role-arn=${BACKEND_IRSA_ROLE_ARN}"

LB_HOSTNAME=$(kubectl get svc backend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)

if [[ -z "${LB_HOSTNAME}" ]]; then
  echo "Waiting for LoadBalancer hostname..."
  for i in $(seq 1 60); do
    LB_HOSTNAME=$(kubectl get svc backend -o jsonpath='{.status.loadBalancer.ingress[0].hostname}' 2>/dev/null || true)
    if [[ -n "${LB_HOSTNAME}" ]]; then
      break
    fi
    echo "  Waiting... (${i}/60)"
    sleep 10
  done
fi

if [[ -z "${LB_HOSTNAME}" ]]; then
  echo "Error: LoadBalancer hostname not assigned after 10 minutes."
  kubectl get svc backend
  exit 1
fi

ALB_URL="http://${LB_HOSTNAME}"
echo "${ALB_URL}" > "${DEPLOY_DIR}/alb-url"

echo "Configuring CloudFront API routing..."
cat > "${ROOT_DIR}/infra/terraform/api.auto.tfvars" <<EOF
api_origin_domain = "${LB_HOSTNAME}"
EOF

cd "${ROOT_DIR}/infra/terraform"
terraform init -input=false
terraform apply -auto-approve -target=aws_cloudfront_distribution.frontend

cd "${ROOT_DIR}"

echo ""
echo "Backend deployed successfully!"
echo "  ALB URL: ${ALB_URL}"
echo "  Image:   ${ECR_URL}:${IMAGE_TAG}"
echo ""
echo "Next: run deploy-frontend.sh to build and deploy the frontend."
