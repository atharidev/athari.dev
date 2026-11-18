#!/bin/sh
# Call the Porkbun API using keys from ../.env (never printed).
# Usage: scripts/porkbun.sh <endpoint> [extra JSON fields]
#   scripts/porkbun.sh ping
#   scripts/porkbun.sh dns/retrieve/athari.dev
set -eu
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE" >&2; exit 1; }
PORKBUN_API_KEY=$(grep '^PORKBUN_API_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '[:space:]"')
PORKBUN_SECRET_KEY=$(grep '^PORKBUN_SECRET_KEY=' "$ENV_FILE" | cut -d= -f2- | tr -d '[:space:]"')
[ -n "$PORKBUN_API_KEY" ] && [ -n "$PORKBUN_SECRET_KEY" ] || { echo "keys missing in .env" >&2; exit 1; }
EXTRA="${2:-}"
[ -n "$EXTRA" ] && EXTRA=",${EXTRA#\{}" && EXTRA="${EXTRA%\}}"
curl -sS -X POST "https://api.porkbun.com/api/json/v3/$1" \
  -H 'Content-Type: application/json' \
  --data-binary @- <<EOF
{"apikey":"$PORKBUN_API_KEY","secretapikey":"$PORKBUN_SECRET_KEY"$EXTRA}
EOF
echo
