#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TF_DIR="${ROOT_DIR}/infra/terraform"
DEPLOY_DIR="${ROOT_DIR}/.deploy"

source "${ROOT_DIR}/scripts/aws-env.sh"

mkdir -p "${DEPLOY_DIR}"

cd "${TF_DIR}"

terraform init

if [[ "${TF_APPLY:-true}" == "true" ]]; then
  terraform apply -auto-approve
fi

terraform output -json > "${DEPLOY_DIR}/terraform-outputs.json"

echo ""
echo "Infrastructure deployed. Outputs saved to .deploy/terraform-outputs.json"
echo ""
terraform output
