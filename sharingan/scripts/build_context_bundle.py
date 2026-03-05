#!/usr/bin/env python3

"""Build a portable repository context bundle for the sharingan skill."""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
import time
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any

DEFAULT_EXCLUDE_DIRS = {
    ".git",
    ".jj",
    ".idea",
    ".vscode",
    ".next",
    ".turbo",
    "node_modules",
    "vendor",
    "dist",
    "build",
    "target",
    "coverage",
    "__pycache__",
    ".mypy_cache",
    ".pytest_cache",
}

TEXT_EXTENSIONS = {
    ".py",
    ".pyi",
    ".js",
    ".jsx",
    ".ts",
    ".tsx",
    ".go",
    ".rs",
    ".java",
    ".kt",
    ".c",
    ".cc",
    ".cpp",
    ".h",
    ".hpp",
    ".cs",
    ".rb",
    ".php",
    ".scala",
    ".swift",
    ".lua",
    ".sh",
    ".bash",
    ".zsh",
    ".sql",
    ".json",
    ".yaml",
    ".yml",
    ".toml",
    ".ini",
    ".md",
    ".txt",
    ".xml",
    ".html",
    ".css",
    ".scss",
    ".env",
}

LANGUAGE_BY_EXTENSION = {
    ".py": "python",
    ".pyi": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".go": "go",
    ".rs": "rust",
    ".java": "java",
    ".kt": "kotlin",
    ".c": "c",
    ".cc": "cpp",
    ".cpp": "cpp",
    ".h": "c",
    ".hpp": "cpp",
    ".cs": "csharp",
    ".rb": "ruby",
    ".php": "php",
    ".scala": "scala",
    ".swift": "swift",
    ".lua": "lua",
    ".sh": "bash",
    ".bash": "bash",
    ".zsh": "bash",
    ".sql": "sql",
    ".json": "json",
    ".yaml": "yaml",
    ".yml": "yaml",
    ".toml": "toml",
    ".ini": "ini",
    ".md": "markdown",
    ".txt": "text",
    ".xml": "xml",
    ".html": "html",
    ".css": "css",
    ".scss": "scss",
}

IMPORT_PATTERNS = [
    re.compile(r"^\s*import\s+([A-Za-z0-9_./:-]+)"),
    re.compile(r"^\s*from\s+([A-Za-z0-9_./:-]+)\s+import\b"),
    re.compile(r"^\s*#include\s*[<\"]([^\">]+)[\">]"),
    re.compile(r"^\s*use\s+([A-Za-z0-9_:]+)"),
    re.compile(r"^\s*require\(['\"]([^'\"]+)['\"]\)"),
]

SYMBOL_PATTERNS = [
    ("function", re.compile(r"^\s*def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(")),
    ("class", re.compile(r"^\s*class\s+([A-Za-z_][A-Za-z0-9_]*)\b")),
    (
        "function",
        re.compile(
            r"^\s*(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_][A-Za-z0-9_]*)\s*\("
        ),
    ),
    (
        "function",
        re.compile(
            r"^\s*(?:export\s+)?(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(?:async\s*)?\("  # noqa: E501
        ),
    ),
    ("class", re.compile(r"^\s*(?:export\s+)?class\s+([A-Za-z_][A-Za-z0-9_]*)\b")),
    ("function", re.compile(r"^\s*func\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(")),
    ("struct", re.compile(r"^\s*type\s+([A-Za-z_][A-Za-z0-9_]*)\s+struct\b")),
    ("trait", re.compile(r"^\s*(?:pub\s+)?trait\s+([A-Za-z_][A-Za-z0-9_]*)\b")),
    ("impl", re.compile(r"^\s*impl\s+([A-Za-z_][A-Za-z0-9_]*)\b")),
]

BOUNDARY_PATTERN = re.compile(
    r"^\s*(?:def|class|function|export\s+function|export\s+class|func|type\s+\w+\s+struct|impl\b|trait\b|interface\b|module\b|namespace\b)"
)


def now_utc() -> str:
    return datetime.now(timezone.utc).isoformat()


def sha256_bytes(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(65536), b""):
            digest.update(chunk)
    return digest.hexdigest()


def is_probably_text(path: Path) -> bool:
    suffix = path.suffix.lower()
    if suffix in TEXT_EXTENSIONS:
        return True
    try:
        with path.open("rb") as handle:
            sample = handle.read(2048)
    except OSError:
        return False
    return b"\0" not in sample


def detect_language(path: Path) -> str:
    return LANGUAGE_BY_EXTENSION.get(path.suffix.lower(), "unknown")


def should_skip(rel_path: Path) -> bool:
    return any(part in DEFAULT_EXCLUDE_DIRS for part in rel_path.parts)


def extract_imports(lines: list[str]) -> list[str]:
    imports: set[str] = set()
    for line in lines[:1200]:
        for pattern in IMPORT_PATTERNS:
            match = pattern.search(line)
            if match:
                imports.add(match.group(1).strip())
    return sorted(imports)


def extract_symbols(lines: list[str]) -> list[dict[str, Any]]:
    symbols: list[dict[str, Any]] = []
    for line_number, line in enumerate(lines, start=1):
        for kind, pattern in SYMBOL_PATTERNS:
            match = pattern.search(line)
            if match:
                symbol_name = match.group(1)
                symbols.append(
                    {
                        "name": symbol_name,
                        "kind": kind,
                        "line": line_number,
                        "signature": line.strip()[:200],
                    }
                )
                break
    return symbols


def _tail_overlap(lines: list[str], overlap_chars: int) -> list[str]:
    if overlap_chars <= 0:
        return []
    tail: list[str] = []
    char_count = 0
    for line in reversed(lines):
        tail.insert(0, line)
        char_count += len(line)
        if char_count >= overlap_chars:
            break
    return tail


def chunk_lines(
    lines: list[str], chunk_size: int, chunk_overlap: int
) -> list[dict[str, Any]]:
    if not lines:
        return []

    chunks: list[dict[str, Any]] = []
    buffer: list[str] = []
    start_line = 1
    buffer_chars = 0

    for line_number, line in enumerate(lines, start=1):
        buffer.append(line)
        buffer_chars += len(line)
        at_boundary = bool(BOUNDARY_PATTERN.match(line))

        if buffer_chars >= chunk_size and (
            at_boundary or buffer_chars >= (chunk_size + chunk_overlap)
        ):
            text = "".join(buffer)
            chunks.append(
                {
                    "start_line": start_line,
                    "end_line": line_number,
                    "char_count": len(text),
                    "text": text,
                }
            )
            overlap = _tail_overlap(buffer, chunk_overlap)
            buffer = overlap
            start_line = line_number - len(overlap) + 1
            buffer_chars = sum(len(item) for item in buffer)

    if buffer:
        text = "".join(buffer)
        end_line = start_line + len(buffer) - 1
        chunks.append(
            {
                "start_line": start_line,
                "end_line": end_line,
                "char_count": len(text),
                "text": text,
            }
        )
    return chunks


def sanitize_summary_text(text: str) -> str:
    token_pattern = re.compile(
        r"(?i)(api[_-]?key|token|secret|password)\s*[:=]\s*[^\s]+"
    )
    return token_pattern.sub("[REDACTED]", text)


def build_module_lookup(relative_paths: list[str]) -> dict[str, str]:
    lookup: dict[str, str] = {}
    for rel_path in relative_paths:
        normalized = rel_path.replace("\\", "/")
        path = PurePosixPath(normalized)
        without_suffix = str(path.with_suffix(""))
        dotted = without_suffix.replace("/", ".")
        slash = without_suffix
        lookup[dotted] = normalized
        lookup[slash] = normalized
        lookup[path.name] = normalized
    return lookup


def resolve_import_to_path(raw_import: str, lookup: dict[str, str]) -> str | None:
    candidate = raw_import.strip().replace("\\", "/")
    if candidate.startswith("."):
        candidate = candidate.lstrip(".")
    if candidate in lookup:
        return lookup[candidate]
    if "/" in candidate and candidate.replace("/", ".") in lookup:
        return lookup[candidate.replace("/", ".")]
    if "." in candidate and candidate.replace(".", "/") in lookup:
        return lookup[candidate.replace(".", "/")]
    return None


def build_chunk_lookup(
    chunk_rows: list[dict[str, Any]],
) -> dict[str, list[tuple[int, int, str]]]:
    lookup: dict[str, list[tuple[int, int, str]]] = defaultdict(list)
    for row in chunk_rows:
        path = row["path"]
        start_line = int(row["start_line"])
        end_line = int(row["end_line"])
        chunk_id = str(row["id"])
        lookup[path].append((start_line, end_line, chunk_id))
    return dict(lookup)


def citation_for_path(
    chunk_lookup: dict[str, list[tuple[int, int, str]]], path: str
) -> str | None:
    chunks = chunk_lookup.get(path)
    if not chunks:
        return None
    start_line, end_line, chunk_id = chunks[0]
    return f"{chunk_id} {path}:{start_line}-{end_line}"


def citation_for_line(
    chunk_lookup: dict[str, list[tuple[int, int, str]]], path: str, line: int
) -> str | None:
    for start_line, end_line, chunk_id in chunk_lookup.get(path, []):
        if start_line <= line <= end_line:
            return f"{chunk_id} {path}:{start_line}-{end_line}"
    return None


def score_file(
    path: str, symbol_count: int, outbound: int, inbound: int
) -> tuple[float, list[str]]:
    reasons: list[str] = []
    score = 0.0
    lower = path.lower()

    if any(
        keyword in lower
        for keyword in ("main", "app", "index", "server", "cli", "entry", "readme")
    ):
        score += 8.0
        reasons.append("path_prior")

    dependency_score = float(outbound + inbound) * 2.0
    if dependency_score > 0:
        score += dependency_score
        reasons.append("dependency_centrality")

    symbol_score = float(symbol_count)
    if symbol_score > 0:
        score += symbol_score
        reasons.append("symbol_density")

    return score, reasons


def write_json(path: Path, payload: Any) -> None:
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, sort_keys=True)
        handle.write("\n")


def write_ndjson(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", encoding="utf-8") as handle:
        for row in rows:
            handle.write(json.dumps(row, sort_keys=True))
            handle.write("\n")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Build sharingan repository context bundle"
    )
    parser.add_argument("--repo-root", required=True, help="Path to cloned repository")
    parser.add_argument(
        "--output-dir", required=True, help="Output directory for bundle artifacts"
    )
    parser.add_argument("--clone-metadata", help="Path to clone metadata JSON")
    parser.add_argument("--run-id", default="", help="Stable run identifier")
    parser.add_argument("--skill-version", default="0.1.0", help="Skill version")
    parser.add_argument(
        "--schema-version", default="1.0.0", help="Artifact schema version"
    )
    parser.add_argument("--max-files", type=int, default=1500)
    parser.add_argument("--max-bytes", type=int, default=8000000)
    parser.add_argument("--max-single-file-bytes", type=int, default=1000000)
    parser.add_argument("--max-runtime-s", type=int, default=120)
    parser.add_argument("--chunk-size", type=int, default=2000)
    parser.add_argument("--chunk-overlap", type=int, default=200)
    parser.add_argument("--top-files", type=int, default=25)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    start = time.monotonic()

    repo_root = Path(args.repo_root).resolve()
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    if not repo_root.exists() or not repo_root.is_dir():
        print(
            f"Repository root does not exist or is not a directory: {repo_root}",
            file=sys.stderr,
        )
        return 4

    clone_metadata: dict[str, Any] = {}
    if args.clone_metadata:
        with Path(args.clone_metadata).open("r", encoding="utf-8") as handle:
            clone_metadata = json.load(handle)

    file_records: list[dict[str, Any]] = []
    chunk_rows: list[dict[str, Any]] = []
    symbol_rows: list[dict[str, Any]] = []
    blocked_paths: list[dict[str, Any]] = []
    violations: list[dict[str, Any]] = []
    redactions: list[dict[str, Any]] = []

    total_bytes = 0
    chunk_index = 0

    all_paths = sorted(path for path in repo_root.rglob("*") if path.is_file())
    for path in all_paths:
        if time.monotonic() - start > args.max_runtime_s:
            violations.append(
                {
                    "type": "runtime_limit",
                    "message": f"Exceeded max-runtime-s ({args.max_runtime_s}) while scanning files.",
                }
            )
            break

        rel_path = path.relative_to(repo_root)
        relative_str = rel_path.as_posix()
        if should_skip(rel_path):
            continue
        if len(file_records) >= args.max_files:
            violations.append(
                {
                    "type": "max_files",
                    "message": f"Reached max-files limit ({args.max_files}).",
                }
            )
            break

        try:
            size_bytes = path.stat().st_size
        except OSError:
            blocked_paths.append(
                {
                    "path": relative_str,
                    "reason": "stat_error",
                }
            )
            continue

        if size_bytes > args.max_single_file_bytes:
            blocked_paths.append(
                {
                    "path": relative_str,
                    "reason": "file_too_large",
                    "size_bytes": size_bytes,
                }
            )
            continue

        if total_bytes + size_bytes > args.max_bytes:
            blocked_paths.append(
                {
                    "path": relative_str,
                    "reason": "max_bytes_limit",
                    "size_bytes": size_bytes,
                }
            )
            continue

        if not is_probably_text(path):
            blocked_paths.append(
                {
                    "path": relative_str,
                    "reason": "non_text_or_binary",
                }
            )
            continue

        try:
            text = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            blocked_paths.append(
                {
                    "path": relative_str,
                    "reason": "read_error",
                }
            )
            continue

        total_bytes += size_bytes
        lines = text.splitlines(keepends=True)
        imports = extract_imports(lines)
        symbols = extract_symbols(lines)
        chunks = chunk_lines(
            lines, chunk_size=args.chunk_size, chunk_overlap=args.chunk_overlap
        )

        language = detect_language(path)

        file_records.append(
            {
                "path": relative_str,
                "language": language,
                "size_bytes": size_bytes,
                "line_count": len(lines),
                "import_count": len(imports),
                "symbol_count": len(symbols),
                "imports": imports,
            }
        )

        for symbol in symbols:
            symbol_row = {
                "path": relative_str,
                **symbol,
            }
            symbol_rows.append(symbol_row)

        for chunk in chunks:
            chunk_index += 1
            chunk_text = chunk["text"]
            preview_raw = re.sub(r"\s+", " ", chunk_text.strip())[:280]
            preview = sanitize_summary_text(preview_raw)
            chunk_id = f"chunk-{chunk_index:06d}"
            if preview != preview_raw:
                redactions.append({"chunk_id": chunk_id, "type": "summary_preview"})
            chunk_rows.append(
                {
                    "id": chunk_id,
                    "path": relative_str,
                    "language": language,
                    "start_line": chunk["start_line"],
                    "end_line": chunk["end_line"],
                    "char_count": chunk["char_count"],
                    "text": chunk_text,
                    "text_preview": preview,
                }
            )

    relative_paths = [record["path"] for record in file_records]
    module_lookup = build_module_lookup(relative_paths)

    outbound_counts: Counter[str] = Counter()
    inbound_counts: Counter[str] = Counter()
    dependency_edges: list[dict[str, Any]] = []

    for record in file_records:
        source_path = record["path"]
        for raw_import in record["imports"]:
            target_path = resolve_import_to_path(raw_import, module_lookup)
            if not target_path or target_path == source_path:
                continue
            dependency_edges.append(
                {
                    "from": source_path,
                    "to": target_path,
                    "kind": "import",
                    "token": raw_import,
                }
            )
            outbound_counts[source_path] += 1
            inbound_counts[target_path] += 1

    ranked_files: list[dict[str, Any]] = []
    for record in file_records:
        path = record["path"]
        score, reasons = score_file(
            path=path,
            symbol_count=record["symbol_count"],
            outbound=outbound_counts[path],
            inbound=inbound_counts[path],
        )
        ranked = {
            **record,
            "score": round(score, 3),
            "inbound_count": inbound_counts[path],
            "outbound_count": outbound_counts[path],
            "ranking_reasons": reasons,
        }
        ranked_files.append(ranked)

    ranked_files.sort(key=lambda item: (-item["score"], item["path"]))
    key_files = ranked_files[: args.top_files]

    symbol_rows.sort(key=lambda item: (item["path"], item["line"], item["name"]))
    dependency_edges.sort(key=lambda item: (item["from"], item["to"], item["token"]))

    language_counts: Counter[str] = Counter(
        record["language"] for record in file_records
    )

    manifest = {
        "generated_at_utc": now_utc(),
        "repo_root": ".",
        "file_count": len(file_records),
        "chunk_count": len(chunk_rows),
        "symbol_count": len(symbol_rows),
        "files": [
            {
                "path": record["path"],
                "language": record["language"],
                "size_bytes": record["size_bytes"],
                "line_count": record["line_count"],
            }
            for record in sorted(file_records, key=lambda item: item["path"])
        ],
    }

    repo_map = {
        "generated_at_utc": now_utc(),
        "key_files": key_files,
        "dependency_edges": dependency_edges,
        "symbols": symbol_rows,
    }

    selection_trace = {
        "generated_at_utc": now_utc(),
        "strategy": "hybrid",
        "ranking_signals": [
            "path_prior",
            "dependency_centrality",
            "symbol_density",
        ],
        "selected_files": [
            {
                "path": record["path"],
                "score": record["score"],
                "reasons": record["ranking_reasons"],
                "symbol_count": record["symbol_count"],
                "inbound_count": record["inbound_count"],
                "outbound_count": record["outbound_count"],
            }
            for record in key_files
        ],
    }

    summary_lines: list[str] = []
    chunk_lookup = build_chunk_lookup(chunk_rows)
    summary_lines.append("# Sharingan Repository Summary")
    summary_lines.append("")
    summary_lines.append(f"Generated: {now_utc()}")
    summary_lines.append(
        f"Resolved commit: {clone_metadata.get('resolved_commit', 'unknown')}"
    )
    summary_lines.append(f"Indexed files: {len(file_records)}")
    summary_lines.append(f"Chunks: {len(chunk_rows)}")
    summary_lines.append(f"Symbols: {len(symbol_rows)}")
    summary_lines.append(
        "Citation format: `[cite: <chunk_id> <path>:<start_line>-<end_line>]`"
    )
    summary_lines.append("")
    summary_lines.append("## Languages")
    for language, count in sorted(
        language_counts.items(), key=lambda item: (-item[1], item[0])
    ):
        summary_lines.append(f"- {language}: {count}")
    summary_lines.append("")
    summary_lines.append("## Key Files")
    for record in key_files[:10]:
        reasons = (
            ", ".join(record["ranking_reasons"])
            if record["ranking_reasons"]
            else "none"
        )
        citation = citation_for_path(chunk_lookup, record["path"])
        citation_suffix = f" [cite: {citation}]" if citation else ""
        summary_lines.append(
            f"- `{record['path']}` (score={record['score']}, reasons={reasons}){citation_suffix}"
        )
    summary_lines.append("")
    summary_lines.append("## Representative Symbols")
    for symbol in symbol_rows[:20]:
        citation = citation_for_line(chunk_lookup, symbol["path"], int(symbol["line"]))
        citation_suffix = f" [cite: {citation}]" if citation else ""
        summary_lines.append(
            f"- `{symbol['path']}:{symbol['line']}` {symbol['kind']} `{symbol['name']}`{citation_suffix}"
        )

    manifest_path = output_dir / "manifest.json"
    repo_map_path = output_dir / "repo_map.json"
    chunks_path = output_dir / "chunks.ndjson"
    selection_trace_path = output_dir / "selection_trace.json"
    summary_path = output_dir / "summary.md"

    write_json(manifest_path, manifest)
    write_json(repo_map_path, repo_map)
    write_ndjson(chunks_path, chunk_rows)
    write_json(selection_trace_path, selection_trace)
    summary_path.write_text("\n".join(summary_lines) + "\n", encoding="utf-8")

    checksum_targets = [
        manifest_path,
        repo_map_path,
        chunks_path,
        selection_trace_path,
        summary_path,
    ]
    checksums_path = output_dir / "checksums.sha256"
    checksum_lines = [
        f"{sha256_file(target)}  {target.name}" for target in checksum_targets
    ]
    checksums_path.write_text("\n".join(checksum_lines) + "\n", encoding="utf-8")

    artifact_id = f"rcb-{args.run_id or int(time.time())}"
    duration_ms = int((time.monotonic() - start) * 1000)

    artifact = {
        "schema_version": args.schema_version,
        "artifact_type": "repo-context-bundle",
        "artifact_id": artifact_id,
        "generated_at_utc": now_utc(),
        "status": "partial" if (violations or blocked_paths) else "success",
        "provenance": {
            "skill_version": args.skill_version,
            "run_id": args.run_id or artifact_id,
            "config_hash": sha256_bytes(
                json.dumps(
                    {
                        "max_files": args.max_files,
                        "max_bytes": args.max_bytes,
                        "max_single_file_bytes": args.max_single_file_bytes,
                        "max_runtime_s": args.max_runtime_s,
                        "chunk_size": args.chunk_size,
                        "chunk_overlap": args.chunk_overlap,
                        "top_files": args.top_files,
                    },
                    sort_keys=True,
                ).encode("utf-8")
            ),
            "duration_ms": duration_ms,
        },
        "source": {
            "repo_url": clone_metadata.get("repo_url", "unknown"),
            "requested_ref": clone_metadata.get("requested_ref", "HEAD"),
            "resolved_commit": clone_metadata.get("resolved_commit", "unknown"),
            "clone_depth": clone_metadata.get("clone_depth", 1),
            "ephemeral_clone_path": clone_metadata.get("clone_path", str(repo_root)),
        },
        "bundle": {
            "manifest_uri": "manifest.json",
            "repo_map_uri": "repo_map.json",
            "chunks_uri": "chunks.ndjson",
            "selection_trace_uri": "selection_trace.json",
            "summary_uri": "summary.md",
            "checksums_uri": "checksums.sha256",
            "stats": {
                "file_count": len(file_records),
                "chunk_count": len(chunk_rows),
                "symbol_count": len(symbol_rows),
                "languages": dict(sorted(language_counts.items())),
            },
        },
        "retrieval": {
            "strategy": "hybrid",
            "ranking_signals": [
                "path_prior",
                "dependency_centrality",
                "symbol_density",
            ],
            "coverage": {
                "indexed_files": len(file_records),
                "skipped_files": len(blocked_paths),
            },
        },
        "safety": {
            "enforced_limits": {
                "max_files": args.max_files,
                "max_bytes": args.max_bytes,
                "max_single_file_bytes": args.max_single_file_bytes,
                "max_runtime_s": args.max_runtime_s,
            },
            "blocked_paths": blocked_paths,
            "violations": violations,
            "redactions": redactions,
        },
        "extensions": {},
    }

    artifact_path = output_dir / "artifact.json"
    write_json(artifact_path, artifact)

    print(f"Built sharingan context bundle in {output_dir}")
    print(f"Artifact: {artifact_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
