#!/usr/bin/env bash
# Export fresh AWS credentials for tools that don't support `aws login` sessions (e.g. Terraform).
if [[ -z "${AWS_ACCESS_KEY_ID:-}" ]]; then
  if aws configure export-credentials --format env &>/dev/null; then
    eval "$(aws configure export-credentials --format env)"
  fi
fi
