#!/usr/bin/env python3
"""Run a bounded, role-based local review against one immutable Git target."""

from __future__ import annotations

import argparse
import json
import os
import shutil
import signal
import stat
import subprocess
import sys
import tempfile
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any

from security import SecurityOutputError, normalize_findings as normalize_security_findings


SEVERITY_ORDER = {"P0": 0, "P1": 1, "P2": 2}
GENERAL_ADAPTERS = ("codex", "cursor", "opencode")
READ_ONLY_ADAPTERS = frozenset(("codex", "cursor"))
EXECUTABLE_NAMES = {
    "codex": "codex",
    "cursor": "cursor-agent",
    "opencode": "opencode",
    "codex-security": "codex-security",
}
_ABSOLUTE_DEADLINE: float | None = None


class GauntletError(RuntimeError):
    pass


@dataclass(frozen=True)
class Adapter:
    name: str
    executable: str


@dataclass
class Lane:
    role: str
    adapter: Adapter
    checkout: Path
    command: list[str]
    stdout_path: Path
    stderr_path: Path
    response_path: Path | None = None
    process: subprocess.Popen[bytes] | None = None
    timed_out: bool = False
    duration_seconds: float = 0.0


@dataclass(frozen=True)
class LaneResult:
    role: str
    adapter: str
    status: str
    duration_seconds: float
    findings: tuple[dict[str, Any], ...]
    blocker: str | None = None
    artifact: Any = None


def remaining_time(*, reserve_seconds: float = 0.0) -> float | None:
    if _ABSOLUTE_DEADLINE is None:
        return None
    remaining = _ABSOLUTE_DEADLINE - time.monotonic() - reserve_seconds
    if remaining <= 0:
        raise GauntletError("supervisor deadline exhausted")
    return remaining


def process_group_exists(process_group: int) -> bool:
    try:
        os.killpg(process_group, 0)
        return True
    except ProcessLookupError:
        return False
    except PermissionError:
        return True


def terminate_process_group(process_group: int, *, force: bool) -> None:
    try:
        os.killpg(process_group, signal.SIGKILL if force else signal.SIGTERM)
    except (ProcessLookupError, PermissionError):
        pass


def run_git(repo: Path, *args: str) -> str:
    timeout = remaining_time()
    git = os.environ.get("GAUNTLET_GIT_BIN") or shutil.which("git")
    if not git:
        raise GauntletError("git executable is unavailable")
    command = [
        git,
        "-c",
        "core.hooksPath=/dev/null",
        "-c",
        "core.fsmonitor=false",
        "-C",
        str(repo),
        *args,
    ]
    process = subprocess.Popen(
        command,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        start_new_session=True,
    )
    try:
        stdout, stderr = process.communicate(timeout=timeout)
    except subprocess.TimeoutExpired as error:
        terminate_process_group(process.pid, force=False)
        try:
            process.wait(timeout=0.5)
        except subprocess.TimeoutExpired:
            terminate_process_group(process.pid, force=True)
            process.wait()
        process.communicate()
        raise GauntletError(f"git {' '.join(args)} exceeded the supervisor deadline") from error
    if process.returncode != 0:
        detail = stderr.decode(errors="replace").strip() or stdout.decode(errors="replace").strip()
        raise GauntletError(f"git {' '.join(args)} failed: {detail}")
    return stdout.decode(errors="replace").strip()


def resolve_commit(repo: Path, ref: str) -> str:
    return run_git(repo, "rev-parse", "--verify", f"{ref}^{{commit}}")


def resolve_tree(repo: Path, commit: str) -> str:
    return run_git(repo, "rev-parse", "--verify", f"{commit}^{{tree}}")


def validate_proof(path: Path, target: str, tree: str) -> dict[str, Any]:
    try:
        proof = json.loads(path.read_text())
    except (OSError, json.JSONDecodeError) as error:
        raise GauntletError(f"cannot read Proof attestation: {error}") from error

    if not isinstance(proof, dict):
        raise GauntletError("Proof attestation must be a JSON object")
    if proof.get("target") != target or proof.get("tree") != tree:
        raise GauntletError("Proof stale: target commit or tree does not match the review target")

    checks = proof.get("checks", [])
    omissions = proof.get("omissions", [])
    if not isinstance(checks, list) or not isinstance(omissions, list):
        raise GauntletError("Proof checks and omissions must be arrays")
    if not checks:
        raise GauntletError("Proof must record at least one passing deterministic check")

    for check in checks:
        if not isinstance(check, dict) or not isinstance(check.get("command"), str):
            raise GauntletError("each Proof check needs a command")
        if check.get("exit_code") != 0 or check.get("status") != "passed":
            raise GauntletError(f"Proof check did not pass: {check.get('command', '<unknown>')}")
    for omission in omissions:
        if not isinstance(omission, dict) or not omission.get("check") or not omission.get("reason"):
            raise GauntletError("each Proof omission needs a check and reason")
    return proof


def find_executable(name: str) -> str | None:
    override = os.environ.get(f"GAUNTLET_{name.upper().replace('-', '_')}_BIN")
    if override:
        path = Path(override).expanduser().resolve()
        return str(path) if path.is_file() and os.access(path, os.X_OK) else None
    return shutil.which(EXECUTABLE_NAMES[name])


def available_adapters() -> dict[str, Adapter]:
    return {
        name: Adapter(name, executable)
        for name in (*GENERAL_ADAPTERS, "codex-security")
        if (executable := find_executable(name)) is not None
    }


def validate_private_file(path: Path) -> None:
    metadata = path.stat()
    if metadata.st_uid != os.getuid() or stat.S_IMODE(metadata.st_mode) & 0o077:
        raise GauntletError(f"file must be owned by the current user with mode 0600: {path}")


def write_private(path: Path, content: str) -> None:
    flags = os.O_WRONLY | os.O_CREAT | os.O_TRUNC
    if hasattr(os, "O_NOFOLLOW"):
        flags |= os.O_NOFOLLOW
    descriptor = os.open(path, flags, 0o600)
    os.fchmod(descriptor, 0o600)
    with os.fdopen(descriptor, "w") as handle:
        handle.write(content)


def write_incomplete_report(
    output: Path,
    report_json: Path,
    blocker: str,
    residues: list[str],
) -> None:
    residue_lines = "".join(f"- `{path}`\n" for path in residues)
    residue_section = f"\n## Cleanup Residue\n\n{residue_lines}" if residues else ""
    write_private(
        output,
        "# Local Adversarial Review\n\n"
        f"- Status: `incomplete`\n- Blocker: {blocker}\n"
        f"{residue_section}",
    )
    write_private(
        report_json,
        json.dumps(
            {"status": "incomplete", "blocker": blocker, "cleanup_residue": residues},
            indent=2,
        )
        + "\n",
    )


def choose_adapter(
    requested: str,
    available: dict[str, Adapter],
    *,
    excluded: frozenset[str] = frozenset(),
) -> Adapter:
    if requested != "auto":
        if requested not in available:
            raise GauntletError(f"requested adapter is unavailable: {requested}")
        return available[requested]

    for name in GENERAL_ADAPTERS:
        if name in available and name not in excluded:
            return available[name]
    for name in GENERAL_ADAPTERS:
        if name in available:
            return available[name]
    raise GauntletError("no supported reviewer CLI is available")


def review_schema() -> dict[str, Any]:
    finding = {
        "type": "object",
        "additionalProperties": False,
        "required": [
            "title",
            "severity",
            "confidence",
            "path",
            "line",
            "failure_mode",
            "evidence",
            "fix_direction",
            "test_need",
        ],
        "properties": {
            "title": {"type": "string", "minLength": 1},
            "severity": {"enum": ["P0", "P1", "P2"]},
            "confidence": {"enum": ["high", "medium", "low"]},
            "path": {"type": "string", "minLength": 1},
            "line": {"type": ["integer", "null"], "minimum": 1},
            "failure_mode": {"type": "string", "minLength": 1},
            "evidence": {"type": "string", "minLength": 1},
            "fix_direction": {"type": "string", "minLength": 1},
            "test_need": {"type": "string", "minLength": 1},
        },
    }
    return {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "type": "object",
        "additionalProperties": False,
        "required": ["status", "summary", "findings"],
        "properties": {
            "status": {"enum": ["clean", "findings"]},
            "summary": {"type": "string"},
            "findings": {"type": "array", "maxItems": 3, "items": finding},
        },
    }


def build_prompt(
    role: str,
    repo: Path,
    base: str,
    target: str,
    intent: str,
    lens: str,
    proof: dict[str, Any],
    spec: str | None,
) -> str:
    if role == "behavior":
        assignment = (
            "Falsify the change's behavioral and specification claims. Search for concrete "
            "counterexamples, missing requirements, broken invariants, incorrect state transitions, "
            "error-path regressions, and tests that pass without proving the changed behavior."
        )
    else:
        assignment = {
            "architecture": "Challenge ownership, boundaries, coupling, and structural maintainability.",
            "compatibility": "Challenge data, protocol, API, rollout, rollback, and mixed-version compatibility.",
            "reliability": "Challenge lifecycle, concurrency, retries, partial failure, recovery, and operability.",
            "security": "Challenge trust boundaries, authorization, validation, sensitive data, and unsafe execution.",
        }[lens]

    proof_summary = json.dumps(
        {"checks": proof.get("checks", []), "omissions": proof.get("omissions", [])},
        separators=(",", ":"),
    )
    spec_text = spec or "No separate spec is available; use the stated intent and repository contracts."
    return f"""Perform the {role} lane of a bounded local adversarial review.

Assignment: {assignment}

Review only the immutable target {target} against merge-base {base} in {repo}.
Perform this review yourself without Task jobs, subagents, review panels, or reviewer skills that delegate the work. Use read-only inspection. Return at most three P0-P2 findings and omit style-only, speculative, or unrelated comments. Every finding must identify a changed path, concrete failure mode, evidence, smallest safe fix direction, and test need. Return only one JSON object matching the supplied schema; use status \"clean\" with an empty findings array when no supported finding remains.

Intent:
{intent}

Specification or contract:
{spec_text}

Already-observed Proof; do not spend review time recommending these checks again:
{proof_summary}
"""


def adapter_command(
    adapter: Adapter,
    checkout: Path,
    prompt: str,
    schema_path: Path,
    response_path: Path,
    output_dir: Path,
    base: str,
    target: str,
    security_auth: str,
) -> list[str]:
    if adapter.name == "codex":
        return [
            adapter.executable,
            "--ask-for-approval",
            "never",
            "--sandbox",
            "read-only",
            "--cd",
            str(checkout),
            "--disable",
            "multi_agent",
            "exec",
            "--ephemeral",
            "--ignore-rules",
            "--output-schema",
            str(schema_path),
            "--output-last-message",
            str(response_path),
            prompt,
        ]
    if adapter.name == "opencode":
        return [
            adapter.executable,
            "run",
            "--pure",
            "--dir",
            str(checkout),
            "--format",
            "default",
            prompt,
        ]
    if adapter.name == "cursor":
        return [
            adapter.executable,
            "--print",
            "--output-format",
            "text",
            "--mode",
            "ask",
            "--trust",
            "--workspace",
            str(checkout),
            prompt,
        ]
    if adapter.name == "codex-security":
        return [
            adapter.executable,
            "scan",
            ".",
            "--diff",
            base,
            "--head",
            target,
            "--output-dir",
            str(output_dir),
            "--auth",
            security_auth,
            "--json",
        ]
    raise GauntletError(f"unsupported adapter: {adapter.name}")


def parse_json_output(text: str) -> dict[str, Any]:
    candidate = text.strip()
    if candidate.startswith("```") and candidate.endswith("```"):
        lines = candidate.splitlines()
        candidate = "\n".join(lines[1:-1]).strip()
    try:
        value = json.loads(candidate)
    except json.JSONDecodeError as error:
        raise GauntletError(f"reviewer did not return valid JSON: {error}") from error
    if not isinstance(value, dict):
        raise GauntletError("reviewer response must be a JSON object")
    return value


def validate_review(value: dict[str, Any]) -> tuple[dict[str, Any], ...]:
    if value.get("status") not in ("clean", "findings") or not isinstance(value.get("summary"), str):
        raise GauntletError("reviewer response has an invalid status or summary")
    findings = value.get("findings")
    if not isinstance(findings, list) or len(findings) > 3:
        raise GauntletError("reviewer response must contain at most three findings")
    required = {
        "title",
        "severity",
        "confidence",
        "path",
        "line",
        "failure_mode",
        "evidence",
        "fix_direction",
        "test_need",
    }
    for finding in findings:
        if not isinstance(finding, dict) or set(finding) != required:
            raise GauntletError("reviewer finding does not match the required fields")
        if finding["severity"] not in SEVERITY_ORDER:
            raise GauntletError("reviewer finding has an invalid severity")
        if finding["confidence"] not in ("high", "medium", "low"):
            raise GauntletError("reviewer finding has an invalid confidence")
        if not all(isinstance(finding[key], str) and finding[key] for key in required - {"line"}):
            raise GauntletError("reviewer finding has an empty field")
        if finding["line"] is not None and (
            not isinstance(finding["line"], int) or finding["line"] < 1
        ):
            raise GauntletError("reviewer finding has an invalid line")
    expected = "findings" if findings else "clean"
    if value["status"] != expected:
        raise GauntletError("reviewer status does not match its findings")
    return tuple(findings)


def run_lanes(lanes: list[Lane], deadline_seconds: float, grace_seconds: float = 2.0) -> None:
    started = time.monotonic()
    handles: list[Any] = []
    try:
        try:
            for lane in lanes:
                stdout = lane.stdout_path.open("wb")
                stderr = lane.stderr_path.open("wb")
                handles.extend((stdout, stderr))
                lane.process = subprocess.Popen(
                    lane.command,
                    cwd=lane.checkout,
                    stdin=subprocess.DEVNULL,
                    stdout=stdout,
                    stderr=stderr,
                    start_new_session=True,
                )
        except BaseException:
            for lane in lanes:
                if lane.process:
                    terminate_process_group(lane.process.pid, force=True)
                    lane.process.wait()
            raise

        deadline = started + deadline_seconds
        while any(lane.process and lane.process.poll() is None for lane in lanes):
            now = time.monotonic()
            for lane in lanes:
                if lane.process and lane.process.poll() is not None:
                    if lane.duration_seconds == 0.0:
                        lane.duration_seconds = now - started
                    if process_group_exists(lane.process.pid):
                        terminate_process_group(lane.process.pid, force=False)
            if now >= deadline:
                for lane in lanes:
                    if lane.process and lane.process.poll() is None:
                        lane.timed_out = True
                        lane.duration_seconds = now - started
                        terminate_process_group(lane.process.pid, force=False)
                break
            time.sleep(0.05)

        for lane in lanes:
            if lane.process and lane.process.poll() is not None and lane.duration_seconds == 0.0:
                lane.duration_seconds = time.monotonic() - started
            if (
                lane.process
                and not lane.timed_out
                and process_group_exists(lane.process.pid)
            ):
                terminate_process_group(lane.process.pid, force=False)
        grace_deadline = time.monotonic() + grace_seconds
        while any(lane.process and process_group_exists(lane.process.pid) for lane in lanes):
            if time.monotonic() >= grace_deadline:
                for lane in lanes:
                    if lane.process and process_group_exists(lane.process.pid):
                        terminate_process_group(lane.process.pid, force=True)
                break
            time.sleep(0.05)
        for lane in lanes:
            if lane.process:
                lane.process.wait()
            if lane.duration_seconds == 0.0:
                lane.duration_seconds = time.monotonic() - started
    finally:
        for handle in handles:
            handle.close()


def lane_result(lane: Lane) -> LaneResult:
    assert lane.process is not None
    if lane.timed_out:
        return LaneResult(lane.role, lane.adapter.name, "blocked", lane.duration_seconds, (), "deadline")

    if lane.adapter.name == "codex-security":
        stdout = lane.stdout_path.read_text(errors="replace")
        artifact: Any = None
        try:
            if stdout.strip():
                artifact = json.loads(stdout)
        except json.JSONDecodeError as error:
            return LaneResult(
                lane.role,
                lane.adapter.name,
                "blocked",
                lane.duration_seconds,
                (),
                f"security adapter returned malformed JSON: {error}",
            )
        if artifact is None:
            return LaneResult(
                lane.role,
                lane.adapter.name,
                "blocked",
                lane.duration_seconds,
                (),
                "security adapter returned no JSON artifact",
            )
        try:
            findings = normalize_security_findings(artifact)
        except SecurityOutputError as error:
            return LaneResult(
                lane.role,
                lane.adapter.name,
                "blocked",
                lane.duration_seconds,
                (),
                str(error),
                artifact,
            )
        if lane.process.returncode == 2:
            return LaneResult(
                lane.role,
                lane.adapter.name,
                "blocked",
                lane.duration_seconds,
                (),
                "partial or unknown security coverage",
                artifact,
            )
        if lane.process.returncode not in (0, 1):
            return LaneResult(
                lane.role,
                lane.adapter.name,
                "blocked",
                lane.duration_seconds,
                (),
                f"security adapter exited {lane.process.returncode}",
                artifact,
            )
        if lane.process.returncode == 1 and not findings:
            return LaneResult(
                lane.role,
                lane.adapter.name,
                "blocked",
                lane.duration_seconds,
                (),
                "security policy failed without actionable findings",
                artifact,
            )
        return LaneResult(
            lane.role,
            lane.adapter.name,
            "complete",
            lane.duration_seconds,
            findings,
            artifact=artifact,
        )

    if lane.process.returncode != 0:
        return LaneResult(
            lane.role,
            lane.adapter.name,
            "blocked",
            lane.duration_seconds,
            (),
            f"adapter exited {lane.process.returncode}",
        )
    try:
        source = lane.response_path if lane.response_path and lane.response_path.exists() else lane.stdout_path
        findings = validate_review(parse_json_output(source.read_text(errors="replace")))
    except (OSError, GauntletError) as error:
        return LaneResult(lane.role, lane.adapter.name, "blocked", lane.duration_seconds, (), str(error))
    return LaneResult(lane.role, lane.adapter.name, "complete", lane.duration_seconds, findings)


def deduplicate_findings(results: list[LaneResult]) -> list[dict[str, Any]]:
    merged: dict[tuple[str, Any, str], dict[str, Any]] = {}
    for result in results:
        for finding in result.findings:
            key = (
                finding["path"],
                finding["line"],
                " ".join(finding["failure_mode"].lower().split()),
            )
            if key not in merged:
                merged[key] = {**finding, "sources": [result.role]}
            else:
                sources = merged[key]["sources"]
                if SEVERITY_ORDER[finding["severity"]] < SEVERITY_ORDER[merged[key]["severity"]]:
                    merged[key] = {**finding, "sources": sources}
                if result.role not in sources:
                    sources.append(result.role)
    return sorted(
        merged.values(),
        key=lambda finding: (SEVERITY_ORDER[finding["severity"]], finding["path"], finding["line"] or 0),
    )


def render_report(
    status: str,
    base: str,
    target: str,
    tree: str,
    lens: str,
    proof: dict[str, Any],
    results: list[LaneResult],
    findings: list[dict[str, Any]],
    residues: list[str],
) -> str:
    lines = [
        "# Local Adversarial Review",
        "",
        f"- Status: `{status}`",
        f"- Base: `{base}`",
        f"- Target: `{target}`",
        f"- Tree: `{tree}`",
        f"- Specialist lens: `{lens}`",
        "",
        "## Proof",
        "",
    ]
    for check in proof.get("checks", []):
        lines.append(f"- Passed: `{check['command']}`")
    for omission in proof.get("omissions", []):
        lines.append(f"- Omitted `{omission['check']}`: {omission['reason']}")

    lines.extend(("", "## Lanes", ""))
    for result in results:
        detail = f"; blocker: {result.blocker}" if result.blocker else ""
        artifact = "; artifact recorded in the machine report" if result.artifact is not None else ""
        lines.append(
            f"- `{result.role}` via `{result.adapter}`: {result.status} "
            f"({result.duration_seconds:.1f}s){detail}{artifact}"
        )

    lines.extend(("", "## Findings", ""))
    if not findings:
        lines.append("No structured general-review findings were reported.")
    for finding in findings:
        location = f"{finding['path']}:{finding['line']}" if finding["line"] else finding["path"]
        lines.extend(
            (
                f"### {finding['severity']} {finding['title']}",
                "",
                f"- Location: `{location}`",
                f"- Confidence: {finding['confidence']}",
                f"- Failure mode: {finding['failure_mode']}",
                f"- Evidence: {finding['evidence']}",
                f"- Fix direction: {finding['fix_direction']}",
                f"- Test need: {finding['test_need']}",
                f"- Sources: {', '.join(finding['sources'])}",
                "",
            )
        )
    if residues:
        lines.extend(("## Cleanup Residue", ""))
        lines.extend(f"- `{residue}`" for residue in residues)
    return "\n".join(lines).rstrip() + "\n"


def create_checkout(repo: Path, target: str, path: Path) -> None:
    run_git(repo, "worktree", "add", "--detach", str(path), target)


def checkout_is_clean(repo: Path, path: Path, target: str) -> bool:
    try:
        return run_git(path, "rev-parse", "HEAD") == target and not run_git(
            path, "status", "--porcelain", "--untracked-files=all"
        )
    except GauntletError:
        return False


def remove_checkout(repo: Path, path: Path) -> bool:
    try:
        run_git(repo, "worktree", "remove", str(path))
        return True
    except GauntletError:
        return False


def parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, required=True)
    parser.add_argument("--base", required=True)
    parser.add_argument("--target", required=True)
    parser.add_argument("--proof", type=Path, required=True)
    parser.add_argument("--intent", required=True)
    parser.add_argument("--spec", type=Path)
    parser.add_argument(
        "--lens",
        choices=("architecture", "compatibility", "reliability", "security"),
        required=True,
    )
    parser.add_argument("--behavior-adapter", choices=("auto", *GENERAL_ADAPTERS), default="auto")
    parser.add_argument(
        "--specialist-adapter",
        choices=("auto", *GENERAL_ADAPTERS, "codex-security"),
        default="auto",
    )
    parser.add_argument("--require-specialized-security", action="store_true")
    parser.add_argument("--security-auth", default="chatgpt")
    parser.add_argument("--deadline-seconds", type=float, default=570.0)
    parser.add_argument("--output", type=Path, required=True)
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    global _ABSOLUTE_DEADLINE

    args = parse_args(argv or sys.argv[1:])
    started = time.monotonic()
    output = args.output.expanduser().resolve()
    if output.suffix == ".json":
        raise SystemExit("--output must be a Markdown or extensionless report path, not .json")
    output.parent.mkdir(parents=True, exist_ok=True)
    report_json = output.with_suffix(".json")
    results: list[LaneResult] = []
    residues: list[str] = []
    temp_root: Path | None = None
    checkouts: list[Path] = []
    terminal_error: str | None = None
    previous_deadline = _ABSOLUTE_DEADLINE

    try:
        if not 5 <= args.deadline_seconds <= 570:
            raise GauntletError("internal deadline must be between 5 and 570 seconds")
        _ABSOLUTE_DEADLINE = started + args.deadline_seconds
        repo = args.repo.expanduser().resolve()
        target = resolve_commit(repo, args.target)
        base_ref = resolve_commit(repo, args.base)
        base = run_git(repo, "merge-base", base_ref, target)
        if not run_git(repo, "diff", "--name-only", f"{base}...{target}"):
            raise GauntletError("review target diff is empty")
        tree = resolve_tree(repo, target)
        proof_path = args.proof.expanduser().resolve()
        validate_private_file(proof_path)
        proof = validate_proof(proof_path, target, tree)
        available = available_adapters()
        behavior = choose_adapter(args.behavior_adapter, available)
        if args.require_specialized_security and args.lens != "security":
            raise GauntletError("specialized security can be required only with the security lens")
        if args.require_specialized_security:
            if args.specialist_adapter not in ("auto", "codex-security"):
                raise GauntletError("required specialized security must use codex-security")
            if "codex-security" not in available:
                raise GauntletError("specialized security coverage is required but unavailable")
            specialist = available["codex-security"]
        elif args.specialist_adapter == "auto":
            specialist = choose_adapter("auto", available, excluded=frozenset((behavior.name,)))
        else:
            specialist = choose_adapter(args.specialist_adapter, available)
        if specialist.name == "codex-security" and args.lens != "security":
            raise GauntletError("codex-security can fill only the security specialist lens")

        temp_root = Path(tempfile.mkdtemp(prefix="local-review-gauntlet-"))
        schema_path = temp_root / "review.schema.json"
        schema_path.write_text(json.dumps(review_schema(), indent=2) + "\n")

        primary_checkout = temp_root / "target"
        checkouts.append(primary_checkout)
        create_checkout(repo, target, primary_checkout)
        spec = None
        if args.spec:
            if args.spec.is_absolute():
                raise GauntletError("--spec must be a repository-relative path")
            spec_path = (primary_checkout / args.spec).resolve()
            if not spec_path.is_relative_to(primary_checkout):
                raise GauntletError("--spec must stay within the immutable target checkout")
            spec = spec_path.read_text()

        lane_specs = (("behavior", behavior), (args.lens, specialist))
        lanes: list[Lane] = []
        for role, adapter in lane_specs:
            checkout = primary_checkout
            if adapter.name not in READ_ONLY_ADAPTERS:
                checkout = temp_root / f"target-{role}"
                checkouts.append(checkout)
                create_checkout(repo, target, checkout)
            lane_dir = temp_root / role
            lane_dir.mkdir()
            stdout_path = lane_dir / "stdout"
            stderr_path = lane_dir / "stderr"
            response_path = lane_dir / "response.json" if adapter.name == "codex" else None
            prompt = build_prompt(role, checkout, base, target, args.intent, args.lens, proof, spec)
            command = adapter_command(
                adapter,
                checkout,
                prompt,
                schema_path,
                response_path or lane_dir / "response.json",
                lane_dir / "artifact",
                base,
                target,
                args.security_auth,
            )
            lanes.append(
                Lane(role, adapter, checkout, command, stdout_path, stderr_path, response_path)
            )

        run_lanes(lanes, remaining_time(reserve_seconds=5.0) or 0.0)
        results = [lane_result(lane) for lane in lanes]

        integrity_failed = False
        for checkout in checkouts:
            if not checkout_is_clean(repo, checkout, target):
                integrity_failed = True
                residues.append(str(checkout))
            elif not remove_checkout(repo, checkout):
                integrity_failed = True
                residues.append(str(checkout))
        checkouts = [Path(path) for path in residues]
        if not residues:
            shutil.rmtree(temp_root, ignore_errors=True)
            temp_root = None
        status = "complete"
        if integrity_failed or any(result.status != "complete" for result in results):
            status = "incomplete"
        findings = deduplicate_findings(results)

        machine_report = {
            "status": status,
            "base": base,
            "target": target,
            "tree": tree,
            "lens": args.lens,
            "proof": proof,
            "lanes": [result.__dict__ for result in results],
            "findings": findings,
            "cleanup_residue": residues,
        }
        write_private(
            output,
            render_report(status, base, target, tree, args.lens, proof, results, findings, residues),
        )
        write_private(report_json, json.dumps(machine_report, indent=2, default=list) + "\n")
        print(f"gauntlet {status}: {output}")
        return 0 if status == "complete" else 2
    except (GauntletError, OSError) as error:
        terminal_error = str(error)
        print(f"gauntlet incomplete: {error}", file=sys.stderr)
        return 2
    finally:
        try:
            if temp_root:
                for checkout in reversed(checkouts):
                    if checkout in map(Path, residues):
                        continue
                    if checkout.exists() and not remove_checkout(
                        args.repo.expanduser().resolve(), checkout
                    ):
                        residues.append(str(checkout))
                if not residues:
                    shutil.rmtree(temp_root, ignore_errors=True)
            if terminal_error:
                write_incomplete_report(output, report_json, terminal_error, residues)
        finally:
            _ABSOLUTE_DEADLINE = previous_deadline


if __name__ == "__main__":
    raise SystemExit(main())
