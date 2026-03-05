#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: run.sh --repo-url <url> [options]

Options:
  --repo-url <url>        Repository URL or local path (required)
  --ref <ref>             Branch, tag, or ref to clone (default: HEAD)
  --depth <n>             Clone depth (default: 1)
  --tmp-root <path>       Temporary root directory (default: /tmp)
  --output-dir <path>     Output directory for artifact bundle
  --max-files <n>         Max text files to include (default: 1500)
  --max-bytes <n>         Max total bytes to include (default: 8000000)
  --max-single-file-bytes <n>
                          Max bytes for any single indexed file (default: 1000000)
  --max-runtime-s <n>     Max bundle build runtime in seconds (default: 120)
  --keep-tmp              Keep temp workspace after completion
  --help                  Show this help

Example:
  run.sh \
    --repo-url https://github.com/owner/repo.git \
    --ref main \
    --output-dir /tmp/sharingan-output
EOF
}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

REPO_URL=""
REF="HEAD"
DEPTH="1"
TMP_ROOT="/tmp"
OUTPUT_DIR=""
MAX_FILES="1500"
MAX_BYTES="8000000"
MAX_SINGLE_FILE_BYTES="1000000"
MAX_RUNTIME_S="120"
KEEP_TMP="0"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-url)
      REPO_URL="$2"
      shift 2
      ;;
    --ref)
      REF="$2"
      shift 2
      ;;
    --depth)
      DEPTH="$2"
      shift 2
      ;;
    --tmp-root)
      TMP_ROOT="$2"
      shift 2
      ;;
    --output-dir)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    --max-files)
      MAX_FILES="$2"
      shift 2
      ;;
    --max-bytes)
      MAX_BYTES="$2"
      shift 2
      ;;
    --max-single-file-bytes)
      MAX_SINGLE_FILE_BYTES="$2"
      shift 2
      ;;
    --max-runtime-s)
      MAX_RUNTIME_S="$2"
      shift 2
      ;;
    --keep-tmp)
      KEEP_TMP="1"
      shift
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1"
      usage
      exit 2
      ;;
  esac
done

if [[ -z "$REPO_URL" ]]; then
  echo "Missing required argument: --repo-url"
  usage
  exit 2
fi

RUN_ID="$(date -u +%Y%m%dT%H%M%SZ)-$$"
RUN_DIR="$(mktemp -d "${TMP_ROOT%/}/sharingan.${RUN_ID}.XXXXXX")"

if [[ -z "$OUTPUT_DIR" ]]; then
  OUTPUT_DIR="${PWD}/sharingan-output-${RUN_ID}"
fi
mkdir -p "$OUTPUT_DIR"

cleanup() {
  if [[ "$KEEP_TMP" == "1" ]]; then
    echo "Kept temp workspace: $RUN_DIR"
    return
  fi
  rm -rf "$RUN_DIR"
}
trap cleanup EXIT

CLONE_METADATA_JSON="$RUN_DIR/clone_metadata.json"

"$SCRIPT_DIR/clone_repo.sh" \
  --repo-url "$REPO_URL" \
  --ref "$REF" \
  --depth "$DEPTH" \
  --tmp-root "$RUN_DIR" \
  --out-json "$CLONE_METADATA_JSON"

CLONE_PATH="$(python3 - "$CLONE_METADATA_JSON" <<'PY'
import json
import sys

with open(sys.argv[1], "r", encoding="utf-8") as handle:
    data = json.load(handle)
print(data["clone_path"])
PY
)"

python3 "$SCRIPT_DIR/build_context_bundle.py" \
  --repo-root "$CLONE_PATH" \
  --clone-metadata "$CLONE_METADATA_JSON" \
  --output-dir "$OUTPUT_DIR" \
  --run-id "$RUN_ID" \
  --max-files "$MAX_FILES" \
  --max-bytes "$MAX_BYTES" \
  --max-single-file-bytes "$MAX_SINGLE_FILE_BYTES" \
  --max-runtime-s "$MAX_RUNTIME_S"

python3 "$SCRIPT_DIR/validate_contract.py" "$OUTPUT_DIR/artifact.json"

echo "Generated sharingan artifact bundle:"
echo "  $OUTPUT_DIR/artifact.json"
