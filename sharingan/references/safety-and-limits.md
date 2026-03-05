# Safety and Limits

## Core Safety Rules

- Clone into isolated temp directories only.
- Do not execute repository code by default.
- Do not run dependency installers in cloned repos.
- Do not mutate user repositories outside temp clone.

## Clone Defaults

- Use shallow clone by default (`--depth 1`).
- Disable recursive submodule behavior unless explicitly requested.
- Treat cloned path as ephemeral and non-portable.

## Resource Limits

Enforce:

- max files
- max bytes
- max runtime
- max per-file size

When limits are hit, record violations in `artifact.json` and continue with partial output when possible.

## Redaction Surface

Apply basic token redaction for summary previews and distilled reports.

## Cleanup

Delete temporary run directories on exit unless explicit keep-temp behavior is requested.
