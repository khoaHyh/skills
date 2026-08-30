from __future__ import annotations

import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import time
import unittest
from unittest import mock
from pathlib import Path


MODULE_PATH = Path(__file__).parents[1] / "scripts" / "gauntlet.py"
sys.path.insert(0, str(MODULE_PATH.parent))
SPEC = importlib.util.spec_from_file_location("gauntlet", MODULE_PATH)
assert SPEC and SPEC.loader
gauntlet = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = gauntlet
SPEC.loader.exec_module(gauntlet)


class ProofTests(unittest.TestCase):
    def test_rejects_stale_tree(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            proof = Path(directory) / "proof.json"
            proof.write_text(
                json.dumps(
                    {
                        "target": "target",
                        "tree": "old-tree",
                        "checks": [{"command": "test", "exit_code": 0, "status": "passed"}],
                        "omissions": [],
                    }
                )
            )
            proof.chmod(0o600)

            with self.assertRaisesRegex(gauntlet.GauntletError, "Proof stale"):
                gauntlet.validate_proof(proof, "target", "new-tree")

    def test_accepts_passes_and_justified_omissions(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            proof = Path(directory) / "proof.json"
            expected = {
                "target": "target",
                "tree": "tree",
                "checks": [{"command": "test", "exit_code": 0, "status": "passed"}],
                "omissions": [{"check": "lint", "reason": "repository has no lint command"}],
            }
            proof.write_text(json.dumps(expected))
            proof.chmod(0o600)

            self.assertEqual(gauntlet.validate_proof(proof, "target", "tree"), expected)


class ReviewOutputTests(unittest.TestCase):
    def test_deduplicates_by_location_and_failure_mode(self) -> None:
        finding = {
            "title": "Broken retry",
            "severity": "P1",
            "confidence": "high",
            "path": "src/retry.ts",
            "line": 10,
            "failure_mode": "Retries duplicate the write",
            "evidence": "The write precedes the retry guard",
            "fix_direction": "Move the guard before the write",
            "test_need": "Add a retry integration test",
        }
        results = [
            gauntlet.LaneResult("behavior", "codex", "complete", 1, (finding,)),
            gauntlet.LaneResult("reliability", "opencode", "complete", 1, (finding,)),
        ]

        merged = gauntlet.deduplicate_findings(results)

        self.assertEqual(len(merged), 1)
        self.assertEqual(merged[0]["sources"], ["behavior", "reliability"])

    def test_deduplication_preserves_highest_severity(self) -> None:
        lower = {
            "title": "Broken retry",
            "severity": "P2",
            "confidence": "medium",
            "path": "src/retry.ts",
            "line": 10,
            "failure_mode": "Retries duplicate the write",
            "evidence": "Possible duplicate",
            "fix_direction": "Move the guard",
            "test_need": "Add a retry test",
        }
        higher = {**lower, "severity": "P0", "confidence": "high", "evidence": "Proven duplicate"}

        merged = gauntlet.deduplicate_findings(
            [
                gauntlet.LaneResult("behavior", "codex", "complete", 1, (lower,)),
                gauntlet.LaneResult("reliability", "opencode", "complete", 1, (higher,)),
            ]
        )

        self.assertEqual(merged[0]["severity"], "P0")
        self.assertEqual(merged[0]["evidence"], "Proven duplicate")
        self.assertEqual(merged[0]["sources"], ["behavior", "reliability"])

    def test_rejects_more_than_three_findings(self) -> None:
        finding = {
            "title": "Issue",
            "severity": "P2",
            "confidence": "medium",
            "path": "src/file.ts",
            "line": 1,
            "failure_mode": "Failure",
            "evidence": "Evidence",
            "fix_direction": "Fix",
            "test_need": "Test",
        }
        with self.assertRaisesRegex(gauntlet.GauntletError, "at most three"):
            gauntlet.validate_review(
                {"status": "findings", "summary": "four", "findings": [finding] * 4}
            )


class DeadlineTests(unittest.TestCase):
    def test_terminates_process_group_at_deadline(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            lane = gauntlet.Lane(
                role="behavior",
                adapter=gauntlet.Adapter("fake", sys.executable),
                checkout=root,
                command=[sys.executable, "-c", "import time; time.sleep(30)"],
                stdout_path=root / "stdout",
                stderr_path=root / "stderr",
            )
            started = time.monotonic()

            gauntlet.run_lanes([lane], deadline_seconds=0.1, grace_seconds=0.1)

            self.assertTrue(lane.timed_out)
            self.assertIsNotNone(lane.process)
            self.assertIsNotNone(lane.process.returncode)
            self.assertLess(time.monotonic() - started, 2)

    def test_terminates_descendants_after_reviewer_exits(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            marker = root / "descendant-ran"
            child = (
                "import pathlib,time;"
                "time.sleep(0.5);"
                f"pathlib.Path({str(marker)!r}).write_text('alive')"
            )
            parent = f"import subprocess,sys;subprocess.Popen([sys.executable,'-c',{child!r}])"
            lane = gauntlet.Lane(
                role="behavior",
                adapter=gauntlet.Adapter("fake", sys.executable),
                checkout=root,
                command=[sys.executable, "-c", parent],
                stdout_path=root / "stdout",
                stderr_path=root / "stderr",
            )

            gauntlet.run_lanes([lane], deadline_seconds=2, grace_seconds=0.1)
            time.sleep(0.6)

            self.assertTrue(lane.descendant_processes)
            self.assertFalse(marker.exists())
            self.assertEqual(gauntlet.lane_result(lane).status, "blocked")

    def test_git_command_obeys_absolute_deadline(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            fake_git = root / "git"
            fake_git.write_text("#!/usr/bin/env python3\nimport time\ntime.sleep(30)\n")
            fake_git.chmod(0o755)
            previous = gauntlet._ABSOLUTE_DEADLINE
            gauntlet._ABSOLUTE_DEADLINE = time.monotonic() + 0.1
            started = time.monotonic()
            try:
                with mock.patch.dict(os.environ, {"GAUNTLET_GIT_BIN": str(fake_git)}):
                    with self.assertRaisesRegex(gauntlet.GauntletError, "supervisor deadline"):
                        gauntlet.run_git(root, "status")
            finally:
                gauntlet._ABSOLUTE_DEADLINE = previous

            self.assertLess(time.monotonic() - started, 2)

    def test_expired_deadline_does_not_start_git(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            marker = root / "git-started"
            fake_git = root / "git"
            fake_git.write_text(
                "#!/usr/bin/env python3\n"
                "import pathlib,time\n"
                f"pathlib.Path({str(marker)!r}).write_text('started')\n"
                "time.sleep(30)\n"
            )
            fake_git.chmod(0o755)
            previous = gauntlet._ABSOLUTE_DEADLINE
            gauntlet._ABSOLUTE_DEADLINE = time.monotonic() - 1
            try:
                with mock.patch.dict(os.environ, {"GAUNTLET_GIT_BIN": str(fake_git)}):
                    with self.assertRaisesRegex(gauntlet.GauntletError, "deadline exhausted"):
                        gauntlet.run_git(root, "status")
            finally:
                gauntlet._ABSOLUTE_DEADLINE = previous

            self.assertFalse(marker.exists())


class AdapterTests(unittest.TestCase):
    def test_cursor_uses_cursor_agent_executable(self) -> None:
        self.assertEqual(gauntlet.EXECUTABLE_NAMES["cursor"], "cursor-agent")


class ReportTests(unittest.TestCase):
    def test_overwrite_forces_private_permissions(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "report.md"
            output.write_text("old")
            output.chmod(0o644)

            gauntlet.write_private(output, "new")

            self.assertEqual(output.stat().st_mode & 0o777, 0o600)

    def test_incomplete_report_records_cleanup_residue(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "report.md"
            machine = Path(directory) / "report.json"

            gauntlet.write_incomplete_report(output, machine, "setup failed", ["/tmp/residue"])

            self.assertIn("/tmp/residue", output.read_text())
            self.assertEqual(json.loads(machine.read_text())["cleanup_residue"], ["/tmp/residue"])


class SecurityOutputTests(unittest.TestCase):
    def lane_result(self, payload: object, exit_code: int) -> gauntlet.LaneResult:
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        root = Path(directory.name)
        stdout = root / "stdout"
        stderr = root / "stderr"
        stdout.write_text(json.dumps(payload))
        stderr.write_text("")
        process = subprocess.Popen([sys.executable, "-c", f"raise SystemExit({exit_code})"])
        process.wait()
        lane = gauntlet.Lane(
            role="security",
            adapter=gauntlet.Adapter("codex-security", "codex-security"),
            checkout=root,
            command=[],
            stdout_path=stdout,
            stderr_path=stderr,
            process=process,
        )
        return gauntlet.lane_result(lane)

    def test_accepts_successful_empty_security_scan(self) -> None:
        result = self.lane_result({"findings": {"schemaVersion": "findings/v1", "findings": []}}, 0)

        self.assertEqual(result.status, "complete")
        self.assertEqual(result.findings, ())

    def test_informational_security_finding_maps_to_p2(self) -> None:
        findings = gauntlet.normalize_security_findings(
            {
                "findings": {
                    "findings": [
                        {
                            "title": "Defense in depth",
                            "severity": {"level": "informational"},
                            "confidence": {"level": "low"},
                            "summary": "A secondary control could be added.",
                        }
                    ]
                }
            }
        )

        self.assertEqual(findings[0]["severity"], "P2")
        self.assertEqual(findings[0]["confidence"], "low")

    def test_normalizes_documented_security_finding_fields(self) -> None:
        artifact = {
            "findings": {
                "schemaVersion": "findings/v1",
                "findings": [
                    {
                        "title": "Missing authorization",
                        "severity": {"level": "high"},
                        "confidence": {"level": "high"},
                        "summary": "An untrusted caller can delete another user's record.",
                        "codeEvidence": [
                            {
                                "path": "src/delete.ts",
                                "startLine": 42,
                                "explanation": "The handler never checks ownership.",
                            }
                        ],
                        "rootCause": {"summary": "The ownership invariant is not enforced."},
                        "validation": {"summary": "Static source trace reaches the delete call."},
                        "recommendation": "Check ownership before deletion.",
                    }
                ],
            }
        }

        findings = gauntlet.normalize_security_findings(artifact)

        self.assertEqual(findings[0]["severity"], "P1")
        self.assertEqual(findings[0]["path"], "src/delete.ts")
        self.assertEqual(findings[0]["line"], 42)
        self.assertEqual(findings[0]["fix_direction"], "Check ownership before deletion.")

        result = self.lane_result(artifact, 1)
        self.assertEqual(result.status, "complete")
        self.assertEqual(result.findings[0]["path"], "src/delete.ts")

    def test_partial_security_coverage_is_blocked(self) -> None:
        result = self.lane_result({"findings": {"findings": []}}, 2)

        self.assertEqual(result.status, "blocked")
        self.assertIn("partial", result.blocker or "")


class SupervisorIntegrationTests(unittest.TestCase):
    def git(self, repo: Path, *args: str) -> str:
        return subprocess.run(
            ["git", "-C", str(repo), *args],
            check=True,
            capture_output=True,
            text=True,
        ).stdout.strip()

    def test_runs_two_roles_and_cleans_worktrees(self) -> None:
        response = json.dumps({"status": "clean", "summary": "clean", "findings": []})
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            repo = root / "repo"
            repo.mkdir()
            self.git(repo, "init")
            self.git(repo, "config", "user.email", "test@example.com")
            self.git(repo, "config", "user.name", "Test")
            source = repo / "file.txt"
            source.write_text("base\n")
            self.git(repo, "add", "file.txt")
            self.git(repo, "commit", "-m", "base")
            base = self.git(repo, "rev-parse", "HEAD")
            source.write_text("target\n")
            self.git(repo, "commit", "-am", "target")
            target = self.git(repo, "rev-parse", "HEAD")
            tree = self.git(repo, "rev-parse", "HEAD^{tree}")
            marker = root / "post-checkout-ran"
            hook = repo / ".git" / "hooks" / "post-checkout"
            hook.write_text(f"#!/bin/sh\ntouch {str(marker)!r}\n")
            hook.chmod(0o755)

            proof = root / "proof.json"
            proof.write_text(
                json.dumps(
                    {
                        "target": target,
                        "tree": tree,
                        "checks": [
                            {"command": "test", "exit_code": 0, "status": "passed"}
                        ],
                        "omissions": [],
                    }
                )
            )
            proof.chmod(0o600)
            codex = root / "codex"
            codex.write_text(
                "#!/usr/bin/env python3\n"
                "import pathlib, sys\n"
                f"response = {response!r}\n"
                "output = pathlib.Path(sys.argv[sys.argv.index('--output-last-message') + 1])\n"
                "output.write_text(response)\n"
            )
            opencode = root / "opencode"
            opencode.write_text(
                "#!/usr/bin/env python3\n"
                f"print({response!r})\n"
            )
            codex.chmod(0o755)
            opencode.chmod(0o755)
            output = root / "report.md"

            with mock.patch.dict(
                os.environ,
                {
                    "GAUNTLET_CODEX_BIN": str(codex),
                    "GAUNTLET_CURSOR_BIN": str(root / "missing-cursor"),
                    "GAUNTLET_OPENCODE_BIN": str(opencode),
                },
            ):
                result = gauntlet.main(
                    [
                        "--repo",
                        str(repo),
                        "--base",
                        base,
                        "--target",
                        target,
                        "--proof",
                        str(proof),
                        "--intent",
                        "review the change",
                        "--lens",
                        "reliability",
                        "--deadline-seconds",
                        "10",
                        "--output",
                        str(output),
                    ]
                )

            self.assertEqual(result, 0)
            self.assertIn("Status: `complete`", output.read_text())
            self.assertFalse(marker.exists())
            self.assertEqual(len(self.git(repo, "worktree", "list", "--porcelain").split("worktree ")), 2)


if __name__ == "__main__":
    unittest.main()
