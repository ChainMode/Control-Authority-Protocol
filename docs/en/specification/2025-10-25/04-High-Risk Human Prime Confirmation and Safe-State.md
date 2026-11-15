---
title: "Chapter 4: High-Risk Human Prime Confirmation and Safe-State"
description: CAP 1.0 parameter-bound Human Prime confirmation gate, G0 emergency takeover safe-state directives, error code catalog, and conformance criteria
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Chapter 4: High-Risk Human Prime Confirmation and Safe-State

## 4.1 Parameter-Bound Explicit `Human Prime` Confirmation Gate (`HumanConfirmationProof`)

For every operation whose `effective_criticality` is **`high`** or **`critical`** (**including operations executed inside a `G1` real-time presence session**), the CAP Evaluator **MUST** validate `req.human_confirmation` (`HumanConfirmationProof`). Implementations **SHALL NOT** waive per-operation confirmation for automation convenience or historical agent reliability:

1. **Canonical Identity Syntax**: `human_confirmation.human_prime_id` **MUST** match the canonical **Human Prime** identifier pattern `^hid_[a-z2-7]{16,}$`.
2. **Temporal Freshness**: `human_confirmation.expires_at_epoch_ms` **MUST** be strictly greater than `req.now_epoch_ms`.
3. **Host-Attested Disclosure**: `human_confirmation.terminal_attested_disclosure` **MUST** equal `true`, proving that a trusted Host UI—rather than self-reported `Fay` text—disclosed the target resource, operation, and irreversible consequences to the **Human Prime**.
4. **Canonical Parameter SHA-256 Binding**: Compute the lowercase hexadecimal SHA-256 digest (64 characters) over the UTF-8 canonical JSON serialization (see §3.1) of `req.params`; `human_confirmation.confirmed_params_sha256` **MUST** match that digest character-for-character.

If `human_confirmation` is absent or fails any check above (such as post-confirmation parameter tampering), the Evaluator **MUST** immediately return `decision = "DENY"`, `error_code = "E_CONFIRMATION_REQUIRED"`, and `diagnostic_code = 2006`.

---

## 4.2 `G0` Emergency Takeover and Non-Blocking Safe-State Directives

The **Human Prime** retains unconditional priority to reclaim Host control at any instant. Whenever `req.g0_override == true` or `req.grant.mandate_binding.session_grade == "G0"`:

1. **Immediate Preemptive Denial**: Prior to mandate expiration or grade matrix checks, the CAP Evaluator **MUST** deny the `Fay` request with `decision = "DENY"`, `error_code = "E_G0_EMERGENCY_OVERRIDE"`, and `diagnostic_code = 2003`.
2. **Deterministic Safe-State Directive (`G0SafeStateDirective`)**:
   - If the target `ResourceCapabilityDescriptor.safe_states` list is non-empty, the Evaluator **MUST** select `safe_states[0].safe_state_id` and emit:
     `{ "action": "enter_safe_state", "safe_state_id": "<safe_states[0].safe_state_id>", "blocks_human_takeover": false }`;
   - If the target resource declares no `safe_states` (or an empty list), the Evaluator **MUST** emit:
     `{ "action": "terminate_and_alert", "blocks_human_takeover": false }`, instructing the Host to abort in-flight agent actions immediately and alert the **Human Prime**.
3. **Zero-Blocking Invariant**: `safe_state_directive.blocks_human_takeover` **MUST** always be `false`. Host safe-state transitions or cleanup routines **SHALL NOT** block, lock out, or delay direct physical or interactive takeover by the **Human Prime**.

---

## 4.3 Canonical Error Codes and Numeric Diagnostic Companion Codes

CAP 1.0 wire responses use stable uppercase snake-case error codes (`CapErrorCode`) paired 1-to-1 with numeric diagnostic codes (`2001`–`2099`):

| Canonical Error Code (`error_code`) | Diagnostic Code (`diagnostic_code`) | Trigger Condition and Normative Semantics |
|-------------------------------------|-------------------------------------|-------------------------------------------|
| `E_WEAK_MANDATE_BINDING` | `2001` | `high`/`critical` request lacks `model_a_plus_b` (or valid derived proof / online freshness), or `sensitive` request uses `model_c_offline_cache` |
| `E_GRADE_INSUFFICIENT` | `2002` | Session grade is weaker than `grant.min_grade` or violates the `FayingGrade × AccessMode × Criticality` matrix |
| `E_G0_EMERGENCY_OVERRIDE` | `2003` | **Human Prime** `G0` takeover active; denies `Fay` control and emits non-blocking `safe_state_directive` |
| `E_UNKNOWN_OPERATION` | `2004` | Requested `resource_id` or `operation_id` is undeclared in the verified `DriverCapabilityManifest` |
| `E_UNTRUSTED_MANIFEST` | `2005` | `DriverCapabilityManifest` lacks a valid signature, trust anchor is missing, or Ed25519 verification fails |
| `E_CONFIRMATION_REQUIRED` | `2006` | `high`/`critical` operation lacks an unexpired, terminal-attested, parameter-SHA-256-matched `HumanConfirmationProof` |
| `E_OUT_OF_SCOPE_FUND_TRANSFER` | `2007` | Request or manifest operation declares `domain_category == "fund_transfer"`, outside CAP 1.0 scope |
| `E_MANDATE_INVALID` | `2008` | Mandate is revoked, expired, non-fresh in an online binding model, or mismatched in subject/resource/mode |
| `E_PROTOCOL_VERSION_UNSUPPORTED` | `2098` | `protocol_version` does not equal the supported two-segment version `"1.0"` |
| `E_PROTOCOL` | `2099` | Malformed envelope or protocol fallback error; legacy alias `E_INVALID_MESSAGE` **MUST** normalize to `E_PROTOCOL` on input |

---

## 4.4 Implementation Conformance Criteria

An implementation claiming conformance to **CAP 1.0 (Edition `2025-10-25`)** **MUST** satisfy all of the following verifiable requirements:

1. Implement the complete 8-step default-deny evaluation pipeline, monotonic criticality floor, 3D grade matrix, parameter-SHA-256 **Human Prime** confirmation gate, and non-blocking `G0` safe-state directive specified in Chapters 0–4;
2. Conform strictly to the wire and data definitions in `schemas/cap-1.0.cddl` and `schemas/cap-1.0.json`;
3. Execute all 14 normative conformance vectors (`V01`–`V14`) in `vectors/semantic/d1-d7-conformance.json` with **100% exact parity** across `decision`, `effective_criticality`, `effective_grade`, `escalation_clamped`, `error_code`, `diagnostic_code`, and `safe_state_directive`.
