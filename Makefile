.PHONY: infra backend frontend all test local-backend local-frontend

infra:
	./scripts/deploy-infra.sh

backend:
	./scripts/deploy-backend.sh

frontend:
	./scripts/deploy-frontend.sh

all: infra backend frontend

test:
	cd apps/frontend && npm ci && npm test

local-backend:
	cd apps/backend && npm install && npm run dev

local-frontend:
	cd apps/frontend && npm install && VITE_API_URL=http://localhost:3000 npm run dev
