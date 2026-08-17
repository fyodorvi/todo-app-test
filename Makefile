.PHONY: infra backend frontend all test local-dynamo local-backend local-frontend

infra:
	./scripts/deploy-infra.sh

backend:
	./scripts/deploy-backend.sh

frontend:
	./scripts/deploy-frontend.sh

all: infra backend frontend

test:
	cd apps/frontend && npm ci && npm test

local-dynamo:
	docker compose up -d dynamodb-local
	chmod +x ./scripts/init-dynamodb-local.sh
	AWS_ACCESS_KEY_ID=local AWS_SECRET_ACCESS_KEY=local AWS_EC2_METADATA_DISABLED=true ./scripts/init-dynamodb-local.sh

local-backend: local-dynamo
	cd apps/backend && npm install && npm run dev

local-frontend:
	cd apps/frontend && npm install && npm run dev
