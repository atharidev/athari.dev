#!/bin/sh
# Call the Vercel REST API using VERCEL_TOKEN from ../.env (never printed).
# Usage: scripts/vercel.sh <path> [curl args...]
#   scripts/vercel.sh /v9/projects
#   scripts/vercel.sh /v6/deployments?limit=5
# VERCEL_TEAM_ID (env or .env) defaults to the athridevs-projects team.
set -eu
ENV_FILE="$(cd "$(dirname "$0")/.." && pwd)/.env"
[ -f "$ENV_FILE" ] || { echo "missing $ENV_FILE" >&2; exit 1; }
VERCEL_TOKEN=$(grep '^VERCEL_TOKEN=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '[:space:]"')
[ -n "$VERCEL_TOKEN" ] || { echo "VERCEL_TOKEN missing in .env" >&2; exit 1; }
TEAM="${VERCEL_TEAM_ID:-$(grep '^VERCEL_TEAM_ID=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d '[:space:]"')}"
TEAM="${TEAM:-team_mnG6oXYH1Mo2TLT0c4VEQefS}"
P="$1"; shift
case "$P" in *\?*) SEP='&' ;; *) SEP='?' ;; esac
curl -sS "https://api.vercel.com$P${SEP}teamId=$TEAM" \
  -H @- "$@" <<EOF
Authorization: Bearer $VERCEL_TOKEN
EOF
echo
