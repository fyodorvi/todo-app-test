# Web App Backbone

Minimal full-stack web app with React frontend (S3 + CloudFront) and Express backend (EKS).

## Architecture

- **Frontend**: React (Vite) → S3 → CloudFront (default `*.cloudfront.net` URL)
- **Backend**: Express → Docker → ECR → Helm on EKS → AWS LoadBalancer
- **Data**: DynamoDB (todos table; IRSA on EKS)
- **Infra**: Terraform (VPC, EKS, ECR, S3, CloudFront, DynamoDB) in `ap-southeast-2`

## Prerequisites

Install and configure locally:

- [AWS CLI](https://aws.amazon.com/cli/) — configured with credentials (`aws sts get-caller-identity` works)
- [Terraform](https://www.terraform.io/downloads) ≥ 1.5
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Helm](https://helm.sh/docs/intro/install/) ≥ 3
- [Docker](https://www.docker.com/)
- [Node.js](https://nodejs.org/) ≥ 20
- `jq` (for deploy scripts)

## Deploy (from local machine)

```bash
# 1. Provision AWS infrastructure (~10-15 min first run)
make infra

# 2. Build, push, and deploy backend to EKS
make backend

# 3. Build frontend and deploy to S3 + invalidate CloudFront
make frontend

# Or run all three in sequence:
make all
```

After deployment, open the CloudFront URL printed by `make frontend`. You should see "Hello from Express!" fetched from the backend API.

## Local development

Copy the example env files, then start the stack:

```bash
cp apps/backend/.env.local.example apps/backend/.env.local
cp apps/frontend/.env.local.example apps/frontend/.env.local
```

Run DynamoDB Local, backend, and frontend locally:

```bash
# Terminal 1 — DynamoDB Local + backend on http://localhost:3000
make local-backend

# Terminal 2 — frontend on http://localhost:5173
make local-frontend
```

`make local-backend` starts DynamoDB Local in Docker (data persisted in a Docker volume), creates the todos table if needed, then runs the Express API. Auth uses your Auth0 tenant — sign in at `http://localhost:5173` after adding that URL to your Auth0 SPA app's callback, logout, and web-origin settings.

To reset local DynamoDB data:

```bash
docker compose down -v
```

### Auth0 setup (one SPA app for local + prod)

| Setting | Values |
|---------|--------|
| Allowed Callback URLs | `http://localhost:5173`, `https://<cloudfront-domain>` |
| Allowed Logout URLs | same |
| Allowed Web Origins | same |

Custom API audience: `https://api.garden-schedule` (not the Auth0 Management API).

Local env files:

- [`apps/frontend/.env.local.example`](apps/frontend/.env.local.example) — `VITE_AUTH0_*`, `VITE_API_URL`
- [`apps/backend/.env.local.example`](apps/backend/.env.local.example) — `AUTH0_*`, DynamoDB vars

Each user only sees their own todos (`tenantId` = Auth0 `sub`).

To test the backend Docker image locally (requires a reachable DynamoDB table):

```bash
cd apps/backend
docker build -t backend-local .
docker run -p 3000:3000 \
  -e DYNAMODB_TABLE_NAME=rush-webapp-todos \
  -e DYNAMODB_ENDPOINT=http://host.docker.internal:8000 \
  -e AWS_REGION=ap-southeast-2 \
  backend-local
curl http://localhost:3000/health
```

## Project structure

```
apps/
  backend/     Express API (TypeScript)
  frontend/    React app (Vite + TypeScript)
infra/
  terraform/   AWS infrastructure
deploy/
  helm/backend Helm chart for backend
scripts/       Deploy scripts
```

## Cost note

This setup uses EKS, which has a fixed control plane cost (~USD 73/month) plus EC2 node, NAT gateway, and LoadBalancer charges. This is the trade-off for the simplest Kubernetes setup on AWS.

## Configuration

Terraform variables can be overridden in `infra/terraform/terraform.tfvars`:

```hcl
aws_region   = "ap-southeast-2"
project_name = "rush-webapp"
cluster_version = "1.31"
```

Deploy scripts read Terraform outputs from `.deploy/terraform-outputs.json` and write the ALB URL to `.deploy/alb-url` after backend deployment.

## CI/CD (GitHub Actions)

Pushes to `main` automatically run tests and deploy backend + frontend. Changes under `infra/**` also trigger `terraform apply`.

Repository: [https://github.com/fyodorvi/todo-app-test](https://github.com/fyodorvi/todo-app-test)

### One-time setup: GitHub secrets

After the IAM deploy user is created (via local `terraform apply`), add two repository secrets at **Settings → Secrets and variables → Actions**:

| Secret name | Value |
|-------------|-------|
| `AWS_ACCESS_KEY_ID` | `terraform output github_actions_access_key_id` |
| `AWS_SECRET_ACCESS_KEY` | `terraform output -raw github_actions_access_key_secret` |
| `AUTH0_DOMAIN` | Auth0 tenant domain |
| `AUTH0_AUDIENCE` | Custom API identifier (e.g. `https://api.garden-schedule`) |
| `VITE_AUTH0_DOMAIN` | Same as `AUTH0_DOMAIN` |
| `VITE_AUTH0_CLIENT_ID` | Auth0 SPA client ID |
| `VITE_AUTH0_AUDIENCE` | Same as `AUTH0_AUDIENCE` |

To retrieve keys locally:

```bash
cd infra/terraform
terraform output github_actions_access_key_id
terraform output -raw github_actions_access_key_secret
```

The secret is only shown once when first created. If lost, create a new access key in IAM and update the GitHub secret.

### Terraform remote state

State is stored in S3 (`rush-webapp-tfstate-<account-id>`) with DynamoDB locking. Bootstrap once locally:

```bash
./scripts/bootstrap-tfstate.sh
cd infra/terraform && terraform init -migrate-state
```

### Workflows

- **CI** (`.github/workflows/ci.yml`) — runs frontend tests on PRs and pushes
- **Deploy** (`.github/workflows/deploy.yml`) — on push to `main`: terraform apply (if `infra/**` changed), then backend + frontend deploy

### Rotating keys

1. Create a new access key for `rush-webapp-github-actions` in IAM (or `terraform taint` + `apply` to recreate)
2. Update both GitHub secrets
3. Delete the old access key
