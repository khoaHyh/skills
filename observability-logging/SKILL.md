---
name: observability-logging
description: Add or review production logs, OpenTelemetry spans/events, metrics, request middleware, and error telemetry. Use for structured logging, trace correlation, cardinality, redaction, and operational diagnostics in TypeScript, Node, or Effect code.
---

# Observability Logging

Add the least telemetry that answers a defined operational question. Prefer a small stable schema over scattered logs. This skill governs production observability; use `motel-debug` for temporary hypothesis probes and remove those probes after diagnosis.

## 1. State the question

Before adding telemetry, name the query or incident question it must answer, such as:

- Which dependency and typed failure ended this checkout?
- Did this job finish, retry, cancel, or exhaust retries?
- Which lifecycle transition produced the invalid state?

If existing telemetry already answers it, add nothing.

## 2. Choose the signal

| Need | Signal |
| --- | --- |
| Duration and causal operation boundary | Span |
| Meaningful occurrence or state transition | Named event or structured log record |
| Aggregate rate, count, or distribution | Metric |
| Temporary evidence for one hypothesis | Bounded debug probe via `motel-debug` |

A wide completion event is useful when one context-rich summary answers known queries. It is not a blanket replacement for spans or meaningful point-in-time events.

## 3. Keep names stable

Use static names such as `checkout.completed`, `payment.retry_exhausted`, or the framework's low-cardinality HTTP route template. Put dynamic values in attributes.

- Never put IDs, raw URLs, messages, or user values in span, event, or metric names.
- Never use high-cardinality values as metric dimensions or resource attributes.
- Use trace and span correlation supplied by the telemetry SDK. An application request ID complements but does not replace `TraceId` and `SpanId`.

## 4. Put data in the right scope

- **Resource:** service name/version, deployment environment, region, instance identity. Configure once at bootstrap.
- **Span:** operation identity, outcome, and attributes shared across the operation.
- **Event/log:** occurrence-specific details.
- **Metric:** bounded dimensions suitable for aggregation.

Prefer approved attributes: operation, route template, state tag, typed error tag, dependency/provider, retries performed, bounded numeric summary, and an opaque non-PII domain ID only when an established telemetry allowlist permits it and incident lookup requires it.

## 5. Allowlist data

Telemetry fields are denied by default. Never record secrets, credentials, bearer tokens, cookies, session values, raw PII, payment data, request/response bodies, SQL parameters, prompts/completions, arbitrary objects, or raw signed URLs. Record a sanitized URL component only when an explicit allowlist permits it.

- Capture headers only through an explicit allowlist.
- Bound and sanitize untrusted strings.
- Preserve `Redacted` values through adapters; safe formatting is not permission to record them.
- Prefer counts, tags, and safe IDs over payload snapshots.

## 6. Record errors once

Record a terminal failure once at the outermost owning boundary that classifies the final operational outcome, associated with the active span. Lower adapters translate dependency failures but do not log them when a caller will classify the terminal outcome. Include a stable typed error tag and safe structured context.

- Do not log the same error at every catch and rethrow.
- Do not mark a successful enclosing operation as failed because a handled fallback or retry occurred.
- Use `WARN` only when a handled or exhausted condition needs operational attention.
- Intentional cancellation is an outcome, not an error.
- Reserve fatal severity for process-ending failures.

## 7. Keep ownership local

Inbound middleware or adapters own common request lifecycle fields. Application modules add business-safe state and outcome context. Outbound adapters classify dependency failures. The composition root configures exporters, resource attributes, sampling, and the structured logger.

For Effect codebases:

- use `Effect.withSpan` for duration-bearing operations;
- use `Effect.annotateCurrentSpan` for operation-wide span attributes;
- use `Effect.annotateLogs` for scoped safe log context;
- configure structured logging and OpenTelemetry layers at the composition root;
- keep `console.log` and ad hoc global loggers outside Effect programs.

Confirm APIs against the repository's installed Effect and OpenTelemetry versions before editing.

## Verification

Exercise the real boundary and inspect emitted telemetry. Confirm:

- stable names and expected trace correlation;
- one terminal error record, not duplicates;
- handled outcomes do not inflate errors;
- no prohibited data appears;
- metric dimensions remain bounded;
- the original operational question is answerable.

If telemetry cannot be observed in tests, name the runtime query or local collector check used instead.

## References

- Boris Tane's wide-event skill: <https://github.com/boristane/agent-skills/tree/main/skills/logging-best-practices>
- OpenTelemetry logs data model: <https://opentelemetry.io/docs/specs/otel/logs/data-model/>
- OpenTelemetry events: <https://opentelemetry.io/docs/specs/semconv/general/events/>
- OpenTelemetry error recording: <https://opentelemetry.io/docs/specs/semconv/general/recording-errors/>
- OpenTelemetry sensitive data: <https://opentelemetry.io/docs/security/handling-sensitive-data/>
- OWASP logging guidance: <https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html>
