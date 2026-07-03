#!/usr/bin/env bash
# One-time LiveAvatar setup (DEPLOY.md §3b), end to end:
#   1. generates the shim's shared bearer secret
#   2. stores it with LiveAvatar (so their servers can call our shim)
#   3. registers advocate-defense-llm as the practice person's ONLY brain
#   4. sets all Supabase secrets (sandbox mode ON by default for rehearsals)
#
# Run from the repo root in a normal terminal:  bash scripts/setup-liveavatar.sh
# Needs: your LiveAvatar API key (app.liveavatar.com → Developers) and a
# logged-in Supabase CLI. Re-running is safe — it just creates fresh ids.

set -euo pipefail

PROJECT_REF="suanbsyewsudlhrrzfks"
SHIM_URL="https://${PROJECT_REF}.supabase.co/functions/v1/advocate-defense-llm"
BUNX="${HOME}/.bun/bin/bunx"
command -v bunx >/dev/null 2>&1 && BUNX="bunx"

read -r -s -p "LiveAvatar API key (input hidden): " LA_KEY; echo
if [ -z "${LA_KEY}" ]; then echo "No key given — nothing done."; exit 1; fi

SHIM_KEY=$(openssl rand -hex 24)
echo "→ Generated shim secret."

json_field() { node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);const v=j?.data?.['$1'];if(!v){console.error('Missing $1 in:',s);process.exit(1)}console.log(v)})"; }

echo "→ Storing the shim secret with LiveAvatar…"
SECRET_ID=$(curl -sf -X POST https://api.liveavatar.com/v1/secrets \
  -H "X-API-KEY: ${LA_KEY}" -H "Content-Type: application/json" \
  -d "{\"secret_type\":\"LLM_API_KEY\",\"secret_value\":\"${SHIM_KEY}\",\"secret_name\":\"advocate-defense-shim\"}" \
  | json_field secret_id)
echo "   secret_id: ${SECRET_ID}"

echo "→ Registering the RAG-locked LLM configuration…"
CONFIG_ID=$(curl -sf -X POST https://api.liveavatar.com/v1/llm_configurations \
  -H "X-API-KEY: ${LA_KEY}" -H "Content-Type: application/json" \
  -d "{\"display_name\":\"advocate-defense\",\"model_name\":\"practice\",\"secret_id\":\"${SECRET_ID}\",\"base_url\":\"${SHIM_URL}\"}" \
  | json_field llm_configuration_id)
echo "   llm_configuration_id: ${CONFIG_ID}"

echo "→ Setting Supabase secrets (sandbox mode ON — free, watermarked rehearsals)…"
"${BUNX}" supabase secrets set --project-ref "${PROJECT_REF}" \
  "LIVEAVATAR_API_KEY=${LA_KEY}" \
  "LIVEAVATAR_SHIM_KEY=${SHIM_KEY}" \
  "LIVEAVATAR_LLM_CONFIG_ID=${CONFIG_ID}" \
  "LIVEAVATAR_SANDBOX=true"

echo
echo "✓ Done. The practice person is live (sandbox mode)."
echo "  Before the judged demo:  ${BUNX} supabase secrets set --project-ref ${PROJECT_REF} LIVEAVATAR_SANDBOX=false"
echo "  Optional avatar choice:  ${BUNX} supabase secrets set --project-ref ${PROJECT_REF} LIVEAVATAR_AVATAR_ID=<id from their gallery>"
