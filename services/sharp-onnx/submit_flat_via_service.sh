#!/usr/bin/env bash
# submit_flat_via_service.sh — Drive flat-laid CCTV JPGs through the
# running SHARP-ONNX service. Skips frames that already have a sibling
# _std.ply. Saves the converted PLY next to the source.
#
# Usage:
#   SHARP_ONNX_AUTH_TOKEN=... ./submit_flat_via_service.sh <staging-dir>
set -euo pipefail

STAGING="${1:-D:/.github/_3DPOV/scripts/cctv-staging}"
SERVICE_URL="${SHARP_ONNX_SERVICE_URL:-http://localhost:7845}"
TOKEN="${SHARP_ONNX_AUTH_TOKEN:?SHARP_ONNX_AUTH_TOKEN env required}"

# Only top-level loose .jpgs (the new TfL fetch dropped them flat).
# Existing per-location subdir JPGs already have _std.ply siblings.
mapfile -t JPGS < <(find "$STAGING" -maxdepth 1 -type f -name "*.jpg" | sort)
TOTAL=${#JPGS[@]}
echo "Found $TOTAL flat .jpgs under $STAGING"

ok=0
skip=0
fail=0
i=0
for JPG in "${JPGS[@]}"; do
  i=$((i+1))
  BASE="${JPG%.jpg}"
  OUT="${BASE}_std.ply"
  if [[ -f "$OUT" ]]; then
    skip=$((skip+1))
    continue
  fi
  echo "[$i/$TOTAL] $(basename "$JPG")"

  # 1. Submit
  RESP=$(curl -s -H "Authorization: Bearer $TOKEN" \
    -F "image=@$JPG" -F 'meta={}' "$SERVICE_URL/jobs")
  JOB=$(python -c "import sys,json; print(json.loads(sys.stdin.read()).get('jobId',''))" <<<"$RESP")
  if [[ -z "$JOB" ]]; then
    echo "  FAIL submit: $RESP"
    fail=$((fail+1))
    continue
  fi

  # 2. Poll until terminal
  while true; do
    sleep 2
    STAT=$(curl -s -H "Authorization: Bearer $TOKEN" "$SERVICE_URL/jobs/$JOB")
    STATE=$(python -c "import sys,json; print(json.loads(sys.stdin.read()).get('state',''))" <<<"$STAT")
    case "$STATE" in
      done) break ;;
      error|cancelled)
        echo "  FAIL $STATE: $STAT"
        fail=$((fail+1))
        continue 2
        ;;
    esac
  done

  # 3. Download std PLY
  if curl -sf -H "Authorization: Bearer $TOKEN" \
       "$SERVICE_URL/jobs/$JOB/result/std" -o "$OUT"; then
    SZ=$(stat -c%s "$OUT" 2>/dev/null || stat -f%z "$OUT")
    echo "  OK $(basename "$OUT")  $((SZ / 1024 / 1024)) MB"
    ok=$((ok+1))
  else
    echo "  FAIL download"
    fail=$((fail+1))
  fi
done

echo ""
echo "Done — $ok ok, $skip already done, $fail failed."
