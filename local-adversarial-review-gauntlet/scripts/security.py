"""Normalize Codex Security JSON into the gauntlet finding contract."""

from __future__ import annotations

from typing import Any


class SecurityOutputError(ValueError):
    pass


def finding_items(artifact: Any) -> list[dict[str, Any]]:
    if isinstance(artifact, list):
        items = artifact
    elif isinstance(artifact, dict) and isinstance(artifact.get("findings"), list):
        items = artifact["findings"]
    elif (
        isinstance(artifact, dict)
        and isinstance(artifact.get("findings"), dict)
        and isinstance(artifact["findings"].get("findings"), list)
    ):
        items = artifact["findings"]["findings"]
    elif isinstance(artifact, dict):
        for key in ("result", "report", "data"):
            if key in artifact:
                try:
                    return finding_items(artifact[key])
                except SecurityOutputError:
                    pass
        raise SecurityOutputError("security JSON has no findings array")
    else:
        raise SecurityOutputError("security JSON must be an object or array")
    if not all(isinstance(item, dict) for item in items):
        raise SecurityOutputError("security findings must be JSON objects")
    return items


def first_mapping(value: Any) -> dict[str, Any]:
    if isinstance(value, dict):
        return value
    if isinstance(value, list):
        return next((item for item in value if isinstance(item, dict)), {})
    return {}


def text_value(value: Any) -> str | None:
    if isinstance(value, str) and value.strip():
        return value.strip()
    if isinstance(value, dict):
        for key in ("summary", "description", "text", "detail"):
            if text := text_value(value.get(key)):
                return text
    return None


def level_value(value: Any, default: str) -> str:
    if isinstance(value, dict):
        value = value.get("level")
    return str(value or default).strip().lower()


def normalize_findings(artifact: Any) -> tuple[dict[str, Any], ...]:
    normalized: list[dict[str, Any]] = []
    for index, item in enumerate(finding_items(artifact), start=1):
        evidence = first_mapping(
            item.get("codeEvidence") or item.get("code_evidence") or item.get("evidence")
        )
        location = first_mapping(
            item.get("location")
            or item.get("locations")
            or item.get("affected_locations")
            or item.get("affectedLocations")
        )
        location = location or evidence
        path = text_value(item.get("path")) or text_value(location.get("path")) or "<security-scan>"
        raw_line = (
            item.get("startLine")
            or item.get("start_line")
            or item.get("line")
            or location.get("startLine")
            or location.get("start_line")
            or location.get("line")
        )
        line: int | None = raw_line if isinstance(raw_line, int) and raw_line > 0 else None
        if line is None:
            lines = text_value(location.get("lines"))
            if lines and lines.split("-", 1)[0].isdigit():
                line = int(lines.split("-", 1)[0])

        severity = level_value(item.get("severity"), "informational")
        if severity == "critical":
            priority = "P0"
        elif severity in ("high", "important"):
            priority = "P1"
        elif severity in ("medium", "low", "informational", "info"):
            priority = "P2"
        else:
            priority = "P2"
        confidence = level_value(item.get("confidence"), "medium")
        if confidence not in ("high", "medium", "low"):
            confidence = "medium"
        summary = text_value(item.get("summary")) or text_value(item.get("description"))
        title = text_value(item.get("title")) or text_value(item.get("name"))
        if not title:
            title = (summary or f"Codex Security finding {index}").splitlines()[0][:160]
        root_cause = text_value(item.get("rootCause")) or text_value(item.get("root_cause"))
        validation = text_value(item.get("validation"))
        evidence_text = (
            validation
            or text_value(evidence.get("explanation"))
            or text_value(evidence.get("detail"))
            or summary
            or "See the raw Codex Security finding in the machine report."
        )
        fix_direction = (
            text_value(item.get("remediation"))
            or text_value(item.get("recommendation"))
            or text_value(item.get("recommended_next_step"))
            or "Use the raw finding to repair the violated control at its owning boundary."
        )
        normalized.append(
            {
                "title": title,
                "severity": priority,
                "confidence": confidence,
                "path": path,
                "line": line,
                "failure_mode": root_cause or summary or title,
                "evidence": evidence_text,
                "fix_direction": fix_direction,
                "test_need": "Reproduce the attack path and prove the corrected security control.",
            }
        )
    return tuple(normalized)
