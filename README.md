# Control Authority Protocol (CAP)

**Protocol Version**: `CAP/1.0` (`"1.0"`) · **Specification Status**: `Final` (`2025-10-25`)

The **Control Authority Protocol (CAP)** defines the default-deny authorization and safety gate governing how a digital avatar (`iFay` or `coFay`) safely acquires, exercises, and relinquishes control over an inhabited **Host** (strictly a physical terminal device, actuator peripheral, or client software application) under verifiable authority delegated by a **Human Prime**.

## Normative Safety Invariants (`CAP 1.0`)

- **Relying-Party Mandate Binding (`D-1`)**: Default online baseline uses `model_b_online_ref` (live `Faying-Protocol` `Mandate` reference + real-time revocation/freshness check); `high` and `critical` operations strictly require `model_a_plus_b` (live Mandate freshness + cryptographic session-derived proof); offline cached credentials (`model_c_offline_cache`) are restricted to `routine` operations only.
- **3D Grade × AccessMode × Criticality Matrix (`D-2`)**: Enforces non-hierarchical access modes (`read`, `write`, `execute`, `configure`) across `G1`–`G4` and four criticality tiers (`routine < sensitive < high < critical`). `critical` operations are restricted exclusively to `G1` real-time **Human Prime** presence; `G3` prohibits `configure` on `sensitive` operations; `G4` permits only `read` and `execute` on `routine` operations. Financial fund transfers (`fund_transfer`) are out of scope of CAP 1.0 (`E_OUT_OF_SCOPE_FUND_TRANSFER` / `2007`).
- **Zero-Blocking `G0` Takeover Safe-State (`D-3`)**: `G0` **Human Prime** emergency takeover immediately preempts `Fay` execution (`E_G0_EMERGENCY_OVERRIDE` / `2003`) and emits a deterministic `G0SafeStateDirective` (`enter_safe_state` or `terminate_and_alert`) with `blocks_human_takeover = false`.
- **Canonical Error & Diagnostic Codes (`D-4`)**: Stable wire `CapErrorCode` strings paired 1-to-1 with numeric diagnostic codes (`2001`–`2099`), plus strict two-segment `"1.0"` version enforcement (`E_PROTOCOL_VERSION_UNSUPPORTED` / `2098`).
- **Signed Driver Criticality Floor (`D-5`)**: Ed25519-signed `DriverCapabilityManifest` descriptors verified over RFC 8785 canonical JSON establish the non-downgradable criticality floor (`escalation_clamped = true` on downgrade attempts); undeclared resources or operations default to `critical` + `DENY` (`E_UNKNOWN_OPERATION` / `2004`).
- **Parameter-Bound Explicit Confirmation (`D-6`)**: Every `high` and `critical` operation—even inside a `G1` real-time presence session—requires an unexpired, Host-attested `HumanConfirmationProof` bound to the canonical SHA-256 digest of `params` (`E_CONFIRMATION_REQUIRED` / `2006`).
- **Consequence Irreversibility Floor (`D-7`)**: `irreversible_consequence` enforces at least `high` criticality, while `irreversible_data_or_hardware` locks `effective_criticality` to `critical`.

## Repository Layout

| Path | Description |
| --- | --- |
| `docs/{locale}/specification/2025-10-25/` | Normative CAP 1.0 `Final` specification across 9 locales (`zh-CN` canonical source + `zh-TW`, `ja`, `ko`, `en`, `de`, `es`, `fr`, `ru`) |
| `docs/{locale}/blueprint/` | Architectural blueprint across 9 locales (`zh-CN` canonical) |
| `schemas/cap-1.0.cddl` | Normative CAP 1.0 CDDL wire and data definition |
| `schemas/cap-1.0.json` | Normative CAP 1.0 JSON Schema (Draft 2020-12), mirrored at `schema/2025-10-25/schema.json` |
| `vectors/semantic/d1-d7-conformance.json` | Normative CAP 1.0 semantic conformance suite (14 positive and negative vectors `V01`–`V14`) |
| `src/` | TypeScript CAP 1.0 reference implementation (`evaluateCapRequest`, Ed25519 manifest verification, canonical JSON SHA-256) |
| `reference-impls/rust/` | Rust CAP 1.0 reference implementation (`cap-reference-rust` crate, pure-Rust RFC 8032 Ed25519 + RFC 8785 canonical JSON + `D-1..D-7` evaluator) |
| `tests/` | TypeScript conformance, schema parity, and blueprint verification suite |

## Quick Start

### TypeScript Reference Implementation & Verification

```bash
npm test
npx tsc --noEmit
```

### Rust Reference Implementation & Conformance Vectors

```bash
cd reference-impls/rust
cargo test
```

## License

**MIT (Reference Implementations, Schemas & Test Vectors) / CC BY 4.0 (Specifications & Blueprints)** — Copyright (c) 2025-2026 ChainMode contributors. See [`LICENSE`](./LICENSE) and [`LICENSE-DOCS`](./LICENSE-DOCS).
