# Error Contracts

Use this reference for changed public error semantics, transport mappings, or consumer recovery. A local failure-handling edit does not require a new application-wide error system.

## Ownership and contract

Reuse the established error owner and representation unless the task changes that architecture. Specify changed codes/statuses, meaning, safe details, and consumer behavior precisely. Keep identical semantics consistent across affected transports; do not unify unrelated services merely to create one namespace.

Trace the affected failure from producer through transport to its actual consumers. Record only relevant conversion, partial-result, recovery, cancellation, and compatibility behavior. Use a mapping table when several cases need comparison, not separate mandatory catalogs for each layer.

## Transport and consumers

- Thrift: preserve field IDs, optionality, and exception/result compatibility in the IDL and generated bindings.
- HTTP: define meaningful statuses, headers, content type, and empty or structured body behavior. Do not force binary/stream responses into a JSON error envelope.
- GraphQL: `errors[].extensions` is outside SDL/codegen typing. Validate fields at runtime before consumers rely on them; do not cast arbitrary payloads into a trusted application type.
- Frontend: use structured identity for branching and recovery, with safe fallback for unknown/malformed errors. Specify state reset, retry, field feedback, or navigation only when affected. Reuse the existing parser and presentation path where appropriate.

Do not classify failures by localized or debug message matching. Distinguish domain failures from network/protocol failures and cancellation when handling depends on that distinction.

## Safety and validation

Keep internal causes out of public responses and browser diagnostics. Define the allowed public fields; protect credentials, user content, query text, and internal debug information. Inspect affected logging paths rather than assuming they are safe.

For changed behavior, verify appropriate encoding, redaction, and consumer recovery with existing or focused coverage. One end-to-end check may cover several mappings. Compatibility detail is needed where old/new consumers can coexist; a new error case alone does not mandate a version matrix, trace system, or full UI redesign.
