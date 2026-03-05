#!/usr/bin/env python3

"""Validate sharingan artifact contract files."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Any

SEMVER_PATTERN = re.compile(r"^\d+\.\d+\.\d+$")

REQUIRED_TOP_LEVEL = {
    "schema_version",
    "artifact_type",
    "artifact_id",
    "generated_at_utc",
    "status",
    "provenance",
    "source",
    "bundle",
    "retrieval",
    "safety",
    "extensions",
}

REQUIRED_SOURCE = {
    "repo_url",
    "requested_ref",
    "resolved_commit",
    "clone_depth",
}

REQUIRED_PROVENANCE = {
    "skill_version",
    "run_id",
    "config_hash",
    "duration_ms",
}

REQUIRED_BUNDLE_URIS = {
    "manifest_uri",
    "repo_map_uri",
    "chunks_uri",
    "selection_trace_uri",
    "summary_uri",
    "checksums_uri",
}

TMP_PATH_ALLOWLIST = {
    "source.ephemeral_clone_path",
    "source.repo_url",
}


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Validate sharingan artifact contract")
    parser.add_argument("artifact", help="Path to artifact.json")
    return parser.parse_args()


def load_json(path: Path) -> dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    if not isinstance(payload, dict):
        raise ValueError("artifact payload must be a JSON object")
    return payload


def is_relative_uri(uri: str) -> bool:
    if "://" in uri:
        return False
    return not Path(uri).is_absolute()


def parse_checksums(path: Path) -> dict[str, str]:
    checksums: dict[str, str] = {}
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        parts = line.split(maxsplit=1)
        if len(parts) != 2:
            continue
        digest = parts[0]
        rel_path = parts[1].strip()
        checksums[rel_path] = digest
    return checksums


def collect_strings(payload: Any, prefix: str = "") -> list[tuple[str, str]]:
    values: list[tuple[str, str]] = []
    if isinstance(payload, dict):
        for key, value in payload.items():
            child_prefix = f"{prefix}.{key}" if prefix else key
            values.extend(collect_strings(value, child_prefix))
    elif isinstance(payload, list):
        for index, value in enumerate(payload):
            child_prefix = f"{prefix}[{index}]"
            values.extend(collect_strings(value, child_prefix))
    elif isinstance(payload, str):
        values.append((prefix, payload))
    return values


def validate(payload: dict[str, Any], artifact_path: Path) -> list[str]:
    errors: list[str] = []

    missing_top_level = sorted(REQUIRED_TOP_LEVEL - set(payload.keys()))
    if missing_top_level:
        errors.append(
            "Missing required top-level keys: " + ", ".join(missing_top_level)
        )

    schema_version = payload.get("schema_version")
    if not isinstance(schema_version, str) or not SEMVER_PATTERN.match(schema_version):
        errors.append("schema_version must be semver format (for example 1.0.0)")

    if payload.get("artifact_type") != "repo-context-bundle":
        errors.append("artifact_type must be 'repo-context-bundle'")

    source = payload.get("source")
    if not isinstance(source, dict):
        errors.append("source must be an object")
    else:
        missing_source = sorted(REQUIRED_SOURCE - set(source.keys()))
        if missing_source:
            errors.append("Missing source keys: " + ", ".join(missing_source))

    provenance = payload.get("provenance")
    if not isinstance(provenance, dict):
        errors.append("provenance must be an object")
    else:
        missing_provenance = sorted(REQUIRED_PROVENANCE - set(provenance.keys()))
        if missing_provenance:
            errors.append("Missing provenance keys: " + ", ".join(missing_provenance))

    bundle = payload.get("bundle")
    if not isinstance(bundle, dict):
        errors.append("bundle must be an object")
    else:
        missing_bundle = sorted(REQUIRED_BUNDLE_URIS - set(bundle.keys()))
        if missing_bundle:
            errors.append("Missing bundle URI keys: " + ", ".join(missing_bundle))

    if not isinstance(bundle, dict):
        return errors

    artifact_dir = artifact_path.parent
    bundle_targets: dict[str, Path] = {}
    for key in sorted(REQUIRED_BUNDLE_URIS):
        value = bundle.get(key)
        if not isinstance(value, str):
            errors.append(f"{key} must be a string URI")
            continue
        if not is_relative_uri(value):
            errors.append(f"{key} must be a relative URI (got: {value})")
            continue
        target = (artifact_dir / value).resolve()
        bundle_targets[key] = target
        if not target.exists() or not target.is_file():
            errors.append(f"{key} points to missing file: {value}")

    checksums_target = bundle_targets.get("checksums_uri")
    if checksums_target and checksums_target.exists():
        checksums = parse_checksums(checksums_target)
        for key in REQUIRED_BUNDLE_URIS - {"checksums_uri"}:
            target = bundle_targets.get(key)
            if not target:
                continue
            name = target.name
            if name not in checksums:
                errors.append(f"checksums.sha256 missing entry for {name}")
                continue
            actual = sha256_file(target)
            if checksums[name] != actual:
                errors.append(f"Checksum mismatch for {name}")

    for field_path, value in collect_strings(payload):
        if value.startswith("/tmp/") and field_path not in TMP_PATH_ALLOWLIST:
            errors.append(
                "Only approved source fields may contain /tmp absolute paths "
                f"(found at {field_path})"
            )

    return errors


def main() -> int:
    args = parse_args()
    artifact_path = Path(args.artifact).resolve()
    if not artifact_path.exists() or not artifact_path.is_file():
        print(f"Artifact does not exist: {artifact_path}", file=sys.stderr)
        return 6

    try:
        payload = load_json(artifact_path)
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"Failed to read artifact JSON: {exc}", file=sys.stderr)
        return 6

    errors = validate(payload, artifact_path)
    if errors:
        print("Artifact validation failed:")
        for item in errors:
            print(f"- {item}")
        return 6

    print("Artifact contract is valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
