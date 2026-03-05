#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: clone_repo.sh --repo-url <url> --out-json <path> [options]

Options:
  --repo-url <url>      Repository URL or local path (required)
  --out-json <path>     Output clone metadata JSON path (required)
  --ref <ref>           Branch, tag, or ref to clone (default: HEAD)
  --depth <n>           Clone depth (default: 1)
  --tmp-root <path>     Temporary root directory (default: /tmp)
  --help                Show this help
EOF
}

REPO_URL=""
OUT_JSON=""
REF="HEAD"
DEPTH="1"
TMP_ROOT="/tmp"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo-url)
      REPO_URL="$2"
      shift 2
      ;;
    --out-json)
      OUT_JSON="$2"
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

if [[ -z "$REPO_URL" || -z "$OUT_JSON" ]]; then
  echo "Missing required arguments: --repo-url and --out-json"
  usage
  exit 2
fi

mkdir -p "$TMP_ROOT"
mkdir -p "$(dirname "$OUT_JSON")"

CLONE_DIR="$(mktemp -d "${TMP_ROOT%/}/clone.XXXXXX")"

CLONE_ARGS=(
  -c advice.detachedHead=false
  -c submodule.recurse=false
  clone
  --no-tags
  --single-branch
  --depth "$DEPTH"
)

if [[ "$REF" != "HEAD" ]]; then
  CLONE_ARGS+=(--branch "$REF")
fi

CLONE_ARGS+=("$REPO_URL" "$CLONE_DIR")

if ! git "${CLONE_ARGS[@]}"; then
  echo "Failed to clone repository: $REPO_URL"
  exit 4
fi

RESOLVED_COMMIT="$(git -C "$CLONE_DIR" rev-parse HEAD)"
RESOLVED_REF="$(git -C "$CLONE_DIR" rev-parse --abbrev-ref HEAD || true)"

python3 - "$OUT_JSON" "$REPO_URL" "$REF" "$RESOLVED_REF" "$RESOLVED_COMMIT" "$DEPTH" "$CLONE_DIR" <<'PY'
import json
import os
import sys
from datetime import datetime, timezone

out_json, repo_url, requested_ref, resolved_ref, resolved_commit, depth, clone_path = sys.argv[1:]

payload = {
    "generated_at_utc": datetime.now(timezone.utc).isoformat(),
    "repo_url": repo_url,
    "requested_ref": requested_ref,
    "resolved_ref": resolved_ref,
    "resolved_commit": resolved_commit,
    "clone_depth": int(depth),
    "clone_path": os.path.realpath(clone_path),
}

with open(out_json, "w", encoding="utf-8") as handle:
    json.dump(payload, handle, indent=2, sort_keys=True)
    handle.write("\n")
PY

echo "Repository cloned to: $CLONE_DIR"
