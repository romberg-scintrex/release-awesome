#!/usr/bin/env bash
# SonarQube Scanner for Next.js/TypeScript project (Local Docker)
# Usage: ./sonarcube.sh [--check-only]
#   --check-only : Skip scan, only run quality check against existing results
#
# Prerequisites:
#   1. Docker Desktop running
#   2. SonarQube container running: docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
#   3. .env.sonar file with SONAR_TOKEN and SONAR_HOST_URL
#   4. Create project in SonarQube dashboard with key matching sonar-project.properties

set -euo pipefail

ENV_FILE="$(dirname "$0")/.env.sonar"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found."
  echo "Create .env.sonar with:"
  echo "  SONAR_TOKEN=sqp_your_token_here"
  echo "  SONAR_HOST_URL=http://localhost:9000"
  exit 1
fi

set -o allexport
source "$ENV_FILE"
set +o allexport

if [[ -z "${SONAR_TOKEN:-}" ]]; then
  echo "ERROR: SONAR_TOKEN is not set in $ENV_FILE"
  exit 1
fi

SONAR_HOST="${SONAR_HOST_URL:-http://localhost:9000}"
PROJECT_KEY=$(grep -m1 '^sonar.projectKey=' "$(dirname "$0")/sonar-project.properties" | cut -d'=' -f2)
REPO_DIR="$(cd "$(dirname "$0")" && pwd)"
CHECK_ONLY=false

if [[ "${1:-}" == "--check-only" ]]; then
  CHECK_ONLY=true
fi

echo ""
echo "════════════════════════════════════════════════"
echo " SonarQube Scanner — Next.js/TypeScript"
echo "════════════════════════════════════════════════"
echo "  Project Key  : $PROJECT_KEY"
echo "  Project Dir  : $REPO_DIR"
echo "  Host (local) : $SONAR_HOST"
echo "  Token        : ${SONAR_TOKEN:0:8}****"
echo ""

# ════════════════════════════════════════════════
# PHASE 1: SCAN (skip with --check-only)
# ════════════════════════════════════════════════

if [[ "$CHECK_ONLY" == false ]]; then
  # macOS Docker: localhost → host.docker.internal
  SONAR_HOST_DOCKER="${SONAR_HOST/localhost/host.docker.internal}"
  SONAR_HOST_DOCKER="${SONAR_HOST_DOCKER/127.0.0.1/host.docker.internal}"

  echo ">> Host (docker): $SONAR_HOST_DOCKER"
  echo ""

  # Wait for SonarQube to be ready before proceeding
  echo ">> Waiting for SonarQube to be ready..."
  SONAR_READY=false
  for i in $(seq 1 30); do
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$SONAR_HOST/api/server/version" 2>/dev/null || echo "000")
    if [[ "$HTTP_CODE" == "200" ]]; then
      SONAR_READY=true
      echo "   ✓ SonarQube is ready"
      break
    fi
    echo -n "."
    sleep 3
  done
  if [[ "$SONAR_READY" == false ]]; then
    echo ""
    echo "   ✗ SonarQube did not become ready within 90s"
    echo "   Ensure container is running: docker ps --filter name=sonarqube"
    exit 1
  fi
  echo ""

  # Ensure project exists in SonarQube (create if not)
  echo ">> Ensuring project exists in SonarQube..."
  CREATE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
    -u "$SONAR_TOKEN:" \
    "$SONAR_HOST/api/projects/create" \
    -d "project=$PROJECT_KEY&name=$(grep -m1 '^sonar.projectName=' "$REPO_DIR/sonar-project.properties" | cut -d'=' -f2)" 2>/dev/null || true)

  if [[ "$CREATE_RESPONSE" == "200" ]]; then
    echo "   ✓ Project created"
  elif [[ "$CREATE_RESPONSE" == "400" ]]; then
    echo "   ✓ Project already exists"
  else
    echo "   ⚠ Could not verify project (HTTP $CREATE_RESPONSE) — continuing anyway"
  fi
  echo ""

  # Run tests with coverage before scanning
  echo ">> Running tests with coverage..."
  (cd "$REPO_DIR" && npm run test:coverage 2>&1 || true)
  echo ""

  # Run SonarQube Scanner via Docker
  echo ">> Running SonarQube Scanner..."
  docker run --rm --platform linux/amd64 \
      -e SONAR_HOST_URL="$SONAR_HOST_DOCKER" \
      -e SONAR_TOKEN="$SONAR_TOKEN" \
      -v "$REPO_DIR:/usr/src" \
      sonarsource/sonar-scanner-cli

  echo ""
  echo "════════════════════════════════════════════════"
  echo " Scan complete! Waiting for analysis..."
  echo "════════════════════════════════════════════════"

  # Wait for SonarQube to process the report
  echo -n ">> Polling analysis status"
  for i in $(seq 1 30); do
    CE_STATUS=$(curl -s -u "$SONAR_TOKEN:" \
      "$SONAR_HOST/api/ce/component?component=$PROJECT_KEY" | \
      python3 -c "
import sys, json
data = json.load(sys.stdin)
current = data.get('current', {})
print(current.get('status', 'UNKNOWN'))
" 2>/dev/null || echo "UNKNOWN")

    if [[ "$CE_STATUS" == "SUCCESS" ]]; then
      echo " ✓ done"
      break
    elif [[ "$CE_STATUS" == "FAILED" ]]; then
      echo " ✗ analysis failed!"
      exit 1
    fi
    echo -n "."
    sleep 2
  done
  echo ""
fi

# ════════════════════════════════════════════════
# PHASE 2: QUALITY CHECK
# ════════════════════════════════════════════════

TARGET_COVERAGE=50
TARGET_BUGS=0
TARGET_VULNERABILITIES=0
TARGET_CODE_SMELLS=30
TARGET_DUPLICATION=3

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 SonarQube Quality Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo ""
echo ">> Fetching project metrics..."
METRICS_JSON=$(curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_HOST/api/measures/component?component=$PROJECT_KEY&metricKeys=coverage,bugs,vulnerabilities,code_smells,duplicated_lines_density,cognitive_complexity,ncloc,sqale_index")

if ! echo "$METRICS_JSON" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
  echo "❌ Failed to fetch metrics from SonarQube API"
  echo "   Ensure SonarQube is running at $SONAR_HOST"
  echo "   And project '$PROJECT_KEY' exists."
  exit 1
fi

read -r COVERAGE BUGS VULNS SMELLS DUPLICATION NCLOC COGNITIVE DEBT < <(echo "$METRICS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
measures = {m['metric']: m['value'] for m in data.get('component', {}).get('measures', [])}
print(
    measures.get('coverage', '0'),
    measures.get('bugs', '0'),
    measures.get('vulnerabilities', '0'),
    measures.get('code_smells', '0'),
    measures.get('duplicated_lines_density', '0'),
    measures.get('ncloc', '0'),
    measures.get('cognitive_complexity', '0'),
    measures.get('sqale_index', '0')
)
")

echo ">> Fetching quality gate status..."
QG_JSON=$(curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_HOST/api/qualitygates/project_status?projectKey=$PROJECT_KEY")

QG_STATUS=$(echo "$QG_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('projectStatus', {}).get('status', 'UNKNOWN'))
" 2>/dev/null || echo "UNKNOWN")

QG_CONDITIONS=$(echo "$QG_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data.get('projectStatus', {}).get('conditions', []):
    icon = '✅' if c['status'] == 'OK' else '❌'
    print(f\"   {icon} {c['metricKey']}: {c['actualValue']} (threshold: {c['comparator']} {c['errorThreshold']})\")
" 2>/dev/null || echo "   (no conditions available)")

echo ">> Fetching critical/blocker issues..."
ISSUES_JSON=$(curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_HOST/api/issues/search?componentKeys=$PROJECT_KEY&severities=CRITICAL,BLOCKER&ps=50&statuses=OPEN,CONFIRMED,REOPENED")

CRITICAL_ISSUES=$(echo "$ISSUES_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('total', 0))
" 2>/dev/null || echo "0")

ISSUES_DETAIL=$(echo "$ISSUES_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for issue in data.get('issues', [])[:20]:
    comp = issue.get('component','').split(':')[-1]
    msg = issue.get('message','')[:80]
    rule = issue.get('rule','')
    line = issue.get('line', '?')
    print(f'   - [{issue.get(\"severity\",\"\")}] {comp}:{line} — {msg} (rule: {rule})')
if data.get('total', 0) == 0:
    print('   (none)')
" 2>/dev/null || echo "   (fetch failed)")

echo ""
echo "┌──────────────────────────────────────────────┐"
echo "│           📊 METRICS SUMMARY                 │"
echo "├──────────────────────────────────────────────┤"
printf "│  Quality Gate      : %-22s │\n" "$QG_STATUS"
printf "│  Coverage          : %-22s │\n" "${COVERAGE}% (target: >${TARGET_COVERAGE}%)"
printf "│  Bugs              : %-22s │\n" "$BUGS (target: $TARGET_BUGS)"
printf "│  Vulnerabilities   : %-22s │\n" "$VULNS (target: $TARGET_VULNERABILITIES)"
printf "│  Code Smells       : %-22s │\n" "$SMELLS (target: <$TARGET_CODE_SMELLS)"
printf "│  Duplication       : %-22s │\n" "${DUPLICATION}% (target: <${TARGET_DUPLICATION}%)"
printf "│  Cognitive Complex : %-22s │\n" "$COGNITIVE"
printf "│  Lines of Code     : %-22s │\n" "$NCLOC"
printf "│  Tech Debt         : %-22s │\n" "${DEBT} min"
printf "│  Critical Issues   : %-22s │\n" "$CRITICAL_ISSUES"
echo "└──────────────────────────────────────────────┘"

echo ""
echo "📋 Quality Gate Conditions:"
echo "$QG_CONDITIONS"

echo ""
echo "🚨 Critical/Blocker Issues:"
echo "$ISSUES_DETAIL"

echo ""
FAILURES=0
FAILURE_LIST=""

if (( $(echo "$COVERAGE < $TARGET_COVERAGE" | bc -l) )); then
  FAILURES=$((FAILURES + 1))
  FAILURE_LIST="${FAILURE_LIST}\n   ❌ Coverage ${COVERAGE}% < ${TARGET_COVERAGE}%"
fi
if [[ "$BUGS" -gt "$TARGET_BUGS" ]]; then
  FAILURES=$((FAILURES + 1))
  FAILURE_LIST="${FAILURE_LIST}\n   ❌ Bugs $BUGS > $TARGET_BUGS"
fi
if [[ "$VULNS" -gt "$TARGET_VULNERABILITIES" ]]; then
  FAILURES=$((FAILURES + 1))
  FAILURE_LIST="${FAILURE_LIST}\n   ❌ Vulnerabilities $VULNS > $TARGET_VULNERABILITIES"
fi
if [[ "$SMELLS" -gt "$TARGET_CODE_SMELLS" ]]; then
  FAILURES=$((FAILURES + 1))
  FAILURE_LIST="${FAILURE_LIST}\n   ❌ Code Smells $SMELLS > $TARGET_CODE_SMELLS"
fi
if (( $(echo "$DUPLICATION > $TARGET_DUPLICATION" | bc -l) )); then
  FAILURES=$((FAILURES + 1))
  FAILURE_LIST="${FAILURE_LIST}\n   ❌ Duplication ${DUPLICATION}% > ${TARGET_DUPLICATION}%"
fi
if [[ "$CRITICAL_ISSUES" -gt 0 ]]; then
  FAILURES=$((FAILURES + 1))
  FAILURE_LIST="${FAILURE_LIST}\n   ❌ Critical Issues $CRITICAL_ISSUES > 0"
fi

if [[ "$FAILURES" -eq 0 ]]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "✅ ALL QUALITY TARGETS MET!"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo ""
  echo "🔗 Dashboard: $SONAR_HOST/dashboard?id=$PROJECT_KEY"
  echo ""
  exit 0
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "⚠️  $FAILURES quality target(s) NOT met:"
echo -e "$FAILURE_LIST"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔗 Dashboard: $SONAR_HOST/dashboard?id=$PROJECT_KEY"
echo ""

exit 1
