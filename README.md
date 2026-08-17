# Web App Backbone

Minimal full-stack web app with React frontend (S3 + CloudFront) and Express backend (EKS).

## Architecture

- **Frontend**: React (Vite) → S3 → CloudFront (default `*.cloudfront.net` URL)
- **Backend**: Express → Docker → ECR → Helm on EKS → AWS LoadBalancer
- **Infra**: Terraform (VPC, EKS, ECR, S3, CloudFront) in `ap-southeast-2`

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

Run backend and frontend locally without AWS:

```bash
# Terminal 1 — backend on http://localhost:3000
make local-backend

# Terminal 2 — frontend on http://localhost:5173
make local-frontend
```

The frontend dev server calls `http://localhost:3000/api/hello`.

To test the backend Docker image locally:

```bash
cd apps/backend
docker build -t backend-local .
docker run -p 3000:3000 backend-local
curl http://localhost:3000/api/hello
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
