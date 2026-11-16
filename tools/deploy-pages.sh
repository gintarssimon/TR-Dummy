#!/usr/bin/env bash
# Baut das Projekt und veröffentlicht dist/ als neues Deployment eines Cloudflare-Pages-Projekts.
#
#   CLOUDFLARE_ACCOUNT_ID=… CLOUDFLARE_API_TOKEN=… tools/deploy-pages.sh [projekt] [branch]
#
# Die Dateien werden in einen kleinen Pages-Worker eingebettet und direkt über die REST-API hochgeladen.
# Das braucht nur das API-Token (Recht „Cloudflare Pages: Edit“). Alternativ geht auch der übliche Weg:
#   npx wrangler pages deploy dist --project-name=<projekt>
set -euo pipefail
cd "$(dirname "$0")/.."

PROJECT="${1:-tr-dummy}"
BRANCH="${2:-main}"
: "${CLOUDFLARE_ACCOUNT_ID:?CLOUDFLARE_ACCOUNT_ID fehlt}"

node build.mjs
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
node tools/make-pages-worker.mjs dist > "$TMP/_worker.js"

AUTH=()
if [ -n "${CLOUDFLARE_API_TOKEN:-}" ]; then AUTH=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN"); fi

curl -fsS -X POST "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT/deployments" \
  ${AUTH[@]+"${AUTH[@]}"} \
  -F 'manifest={}' -F "branch=$BRANCH" -F "_worker.js=@$TMP/_worker.js;type=application/javascript+module" \
  | node -e 'let s="";process.stdin.on("data",(d)=>(s+=d)).on("end",()=>{const r=JSON.parse(s);if(!r.success){console.error(JSON.stringify(r.errors));process.exit(1)}console.log("Deployment:",r.result.url,"("+r.result.environment+")")})'
