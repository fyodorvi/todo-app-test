#!/usr/bin/env bash
# Export AWS credentials for tools that don't support `aws login` sessions (e.g. Terraform).
# Only exports when not already set — avoids stale env vars overriding a fresh `aws login` session.
if [[ -z "${AWS_ACCESS_KEY_ID:-}" ]]; then
  if aws configure export-credentials --format env &>/dev/null; then
    eval "$(aws configure export-credentials --format env)"
  fi
fi
