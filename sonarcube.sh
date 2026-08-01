#!/usr/bin/env bash
# SonarQube Scanner + Quality Check (Combined)
# Usage: ./sonarcube.sh [--check-only]
#   --check-only : Skip scan, only run quality check against existing results
#
# Prerequisites:
#   1. Docker Desktop running (for scan)
#   2. SonarQube container running: docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
#   3. .env.sonar file with SONAR_TOKEN and SONAR_HOST_URL

set -euo pipefail

ENV_FILE="$(dirname "$0")/.env.sonar"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: $ENV_FILE not found."
  echo "Copy .env.sonar.example to .env.sonar and fill in your token."
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
PROJECT_KEY="bricams-addons-bg-mapping-service:project"
REPO_DIR="${SONAR_REPO_DIR:-$(cd "$(dirname "$0")" && pwd)}"
CHECK_ONLY=false

if [[ "${1:-}" == "--check-only" ]]; then
  CHECK_ONLY=true
fi

# ════════════════════════════════════════════════
# PHASE 1: SCAN (skip with --check-only)
# ════════════════════════════════════════════════

if [[ "$CHECK_ONLY" == false ]]; then
  # Untuk macOS Docker: localhost → host.docker.internal agar scanner container bisa reach host
  SONAR_HOST_DOCKER="${SONAR_HOST/localhost/host.docker.internal}"
  SONAR_HOST_DOCKER="${SONAR_HOST_DOCKER/sonarqube/host.docker.internal}"

  echo "════════════════════════════════════════════════"
  echo " SonarQube Scanner (Local Docker)"
  echo "════════════════════════════════════════════════"
  echo "  Project Dir  : $REPO_DIR"
  echo "  Host (local) : $SONAR_HOST"
  echo "  Host (docker): $SONAR_HOST_DOCKER"
  echo "  Token        : ${SONAR_TOKEN:0:8}****"
  echo ""

  # Generate coverage report if not exists or stale
  if [[ ! -f "$REPO_DIR/coverage.out" ]]; then
    echo ">> Generating coverage report first..."
    (cd "$REPO_DIR" && go test ./... -count=1 -coverprofile=coverage.out -covermode=atomic 2>/dev/null || true)
    echo ""
  fi

  # Run SonarQube Scanner
  docker run --rm --platform linux/amd64 \
      -e SONAR_HOST_URL="$SONAR_HOST_DOCKER" \
      -e SONAR_TOKEN="$SONAR_TOKEN" \
      -v "$REPO_DIR:/usr/src" \
      sonarsource/sonar-scanner-cli

  echo ""
  echo "════════════════════════════════════════════════"
  echo " Scan complete! Waiting for analysis to finish..."
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

# Quality targets
TARGET_COVERAGE=90
TARGET_BUGS=0
TARGET_VULNERABILITIES=0
TARGET_CODE_SMELLS=10
TARGET_DUPLICATION=2

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 SonarQube Quality Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Fetch metrics ──
echo ""
echo ">> Fetching project metrics..."
METRICS_JSON=$(curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_HOST/api/measures/component?component=$PROJECT_KEY&metricKeys=coverage,bugs,vulnerabilities,code_smells,duplicated_lines_density,cognitive_complexity,ncloc,sqale_index")

if ! echo "$METRICS_JSON" | python3 -c "import sys,json; json.load(sys.stdin)" 2>/dev/null; then
  echo "❌ Failed to fetch metrics from SonarQube API"
  echo "   Ensure SonarQube is running at $SONAR_HOST"
  exit 1
fi

# Parse all metrics
read -r COVERAGE BUGS VULNS SMELLS DUPLICATION NCLOC COGNITIVE DEBT < <(echo "$METRICS_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
measures = {m['metric']: m['value'] for m in data['component']['measures']}
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

# ── Fetch Quality Gate status ──
echo ">> Fetching quality gate status..."
QG_JSON=$(curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_HOST/api/qualitygates/project_status?projectKey=$PROJECT_KEY")

QG_STATUS=$(echo "$QG_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data['projectStatus']['status'])
")

QG_CONDITIONS=$(echo "$QG_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for c in data['projectStatus'].get('conditions', []):
    icon = '✅' if c['status'] == 'OK' else '❌'
    print(f\"   {icon} {c['metricKey']}: {c['actualValue']} (threshold: {c['comparator']} {c['errorThreshold']})\")
")

# ── Fetch critical/blocker issues ──
echo ">> Fetching critical/blocker issues..."
ISSUES_JSON=$(curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_HOST/api/issues/search?componentKeys=$PROJECT_KEY&severities=CRITICAL,BLOCKER&ps=50&statuses=OPEN,CONFIRMED,REOPENED")

CRITICAL_ISSUES=$(echo "$ISSUES_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('total', 0))
")

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
")

# ── Fetch cognitive complexity issues (S3776) ──
echo ">> Fetching cognitive complexity issues (go:S3776)..."
COGNITIVE_ISSUES_JSON=$(curl -s -u "$SONAR_TOKEN:" \
  "$SONAR_HOST/api/issues/search?componentKeys=$PROJECT_KEY&rules=go:S3776&ps=50&statuses=OPEN,CONFIRMED,REOPENED")

COGNITIVE_ISSUE_COUNT=$(echo "$COGNITIVE_ISSUES_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(data.get('total', 0))
")

COGNITIVE_ISSUES_DETAIL=$(echo "$COGNITIVE_ISSUES_JSON" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for issue in data.get('issues', [])[:20]:
    comp = issue.get('component','').split(':')[-1]
    msg = issue.get('message','')[:80]
    line = issue.get('line', '?')
    print(f'   - {comp}:{line} — {msg}')
if data.get('total', 0) == 0:
    print('   (none)')
")

# ── Display results ──
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
printf "│  Complexity Issues : %-22s │\n" "$COGNITIVE_ISSUE_COUNT (go:S3776)"
echo "└──────────────────────────────────────────────┘"

echo ""
echo "📋 Quality Gate Conditions:"
echo "$QG_CONDITIONS"

echo ""
echo "🚨 Critical/Blocker Issues:"
echo "$ISSUES_DETAIL"

echo ""
echo "🧠 Cognitive Complexity Issues (go:S3776):"
echo "$COGNITIVE_ISSUES_DETAIL"

# ── Evaluate against targets ──
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
if [[ "$COGNITIVE_ISSUE_COUNT" -gt 0 ]]; then
  FAILURES=$((FAILURES + 1))
  FAILURE_LIST="${FAILURE_LIST}\n   ❌ Cognitive Complexity Issues $COGNITIVE_ISSUE_COUNT > 0"
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

# ── Generate Kiro prompt for auto tasks.md generation ──
PROMPT_FILE="$(dirname "$0")/.kiro-prompt-quality-fix.md"

cat > "$PROMPT_FILE" << PROMPT_EOF
# Auto-Generated Kiro Prompt: Quality Improvement Tasks

> This file was auto-generated by \`sonarcube.sh\` based on SonarQube scan results.
> Copy-paste the content below into Kiro chat to auto-generate an updated \`tasks.md\`.

---

## Prompt for Kiro:

Berdasarkan hasil SonarQube scan terbaru untuk \`addons-bg-mapping-service\`, berikut metrics saat ini:

| Metric | Current | Target |
|--------|---------|--------|
| Coverage | ${COVERAGE}% | >${TARGET_COVERAGE}% |
| Bugs | ${BUGS} | ${TARGET_BUGS} |
| Vulnerabilities | ${VULNS} | ${TARGET_VULNERABILITIES} |
| Code Smells | ${SMELLS} | <${TARGET_CODE_SMELLS} |
| Duplication | ${DUPLICATION}% | <${TARGET_DUPLICATION}% |
| Critical Issues | ${CRITICAL_ISSUES} | 0 |
| Cognitive Complexity Issues | ${COGNITIVE_ISSUE_COUNT} | 0 |
| Tech Debt | ${DEBT} min | <120 min |

### Critical Issues Found:
${ISSUES_DETAIL}

### Cognitive Complexity Issues (go:S3776):
${COGNITIVE_ISSUES_DETAIL}

### Kegagalan Target:
$(echo -e "$FAILURE_LIST")

---

**Instruksi:** Update file \`tasks.md\` dengan task plan baru yang:
1. Fokus pada existing code saja (tidak ada fitur baru)
2. Prioritas: fix critical issues → reduce duplication → enhance unit testing → re-scan
3. Target akhir: Coverage >${TARGET_COVERAGE}%, Bugs 0, Vulnerabilities 0, Code Smells <${TARGET_CODE_SMELLS}, Duplication <${TARGET_DUPLICATION}%
4. Format harus mengikuti Kiro spec format
5. Setiap task harus actionable dan mereferensi file spesifik dari critical issues di atas
6. Jalankan \`make unit-test\` setelah setiap refactor untuk memastikan tidak ada regresi
PROMPT_EOF

echo ""
echo "📝 Kiro prompt generated at: $PROMPT_FILE"
echo "🚀 To auto-generate tasks.md, run: cat $PROMPT_FILE | pbcopy"
echo ""
echo "🔗 Dashboard: $SONAR_HOST/dashboard?id=$PROJECT_KEY"
echo ""

exit 1
