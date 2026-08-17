#!/usr/bin/env bash
set -euo pipefail

TABLE_NAME="${DYNAMODB_TABLE_NAME:-rush-webapp-todos}"
AWS_REGION="${AWS_REGION:-ap-southeast-2}"
ENDPOINT="${DYNAMODB_ENDPOINT:-http://localhost:8000}"

export AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID:-local}"
export AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY:-local}"
export AWS_EC2_METADATA_DISABLED=true

echo "Waiting for DynamoDB Local at ${ENDPOINT}..."
for _ in $(seq 1 30); do
  if aws dynamodb list-tables \
    --region "${AWS_REGION}" \
    --endpoint-url "${ENDPOINT}" >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

if ! aws dynamodb list-tables \
  --region "${AWS_REGION}" \
  --endpoint-url "${ENDPOINT}" >/dev/null 2>&1; then
  echo "Error: DynamoDB Local is not reachable at ${ENDPOINT}"
  exit 1
fi

if aws dynamodb describe-table \
  --table-name "${TABLE_NAME}" \
  --region "${AWS_REGION}" \
  --endpoint-url "${ENDPOINT}" >/dev/null 2>&1; then
  echo "Table already exists: ${TABLE_NAME}"
  exit 0
fi

echo "Creating table: ${TABLE_NAME}"
aws dynamodb create-table \
  --table-name "${TABLE_NAME}" \
  --attribute-definitions \
    AttributeName=id,AttributeType=S \
    AttributeName=date,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --global-secondary-indexes \
    "[{\"IndexName\":\"date-index\",\"KeySchema\":[{\"AttributeName\":\"date\",\"KeyType\":\"HASH\"},{\"AttributeName\":\"id\",\"KeyType\":\"RANGE\"}],\"Projection\":{\"ProjectionType\":\"ALL\"}}]" \
  --region "${AWS_REGION}" \
  --endpoint-url "${ENDPOINT}"

aws dynamodb wait table-exists \
  --table-name "${TABLE_NAME}" \
  --region "${AWS_REGION}" \
  --endpoint-url "${ENDPOINT}"

echo "Table ready: ${TABLE_NAME}"
