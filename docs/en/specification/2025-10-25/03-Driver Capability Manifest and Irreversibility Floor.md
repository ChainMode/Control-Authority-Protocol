---
title: "Chapter 3: Driver Capability Manifest and Irreversibility Floor"
description: CAP 1.0 Ed25519 manifest signature verification, unknown-operation denial, irreversibility floor, and monotonic criticality escalation
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Chapter 3: Driver Capability Manifest and Irreversibility Floor

## 3.1 Signed `DriverCapabilityManifest` Verification

Baseline operation criticality **SHALL NOT** be determined by the calling `Fay` or unverified external metadata; it **MUST** originate from a Host-side `DriverCapabilityManifest` cryptographically signed by a trusted authority. Each manifest contains:

- `manifest_id`, `driver_id`, `version`, `issued_at`: Unique manifest identifier, driver identifier, version string, and issuance timestamp;
- `signer_key_id`: Key identifier referencing an entry in the Host's local `TrustAnchorMap`;
- `resources`: Non-empty array of `ResourceCapabilityDescriptor` entries declaring `resource_id`, optional `safe_states`, and a non-empty `operations` (`OperationDescriptor`) list;
- `signature_ed25519`: 64-byte (128-character hexadecimal) RFC 8032 Ed25519 signature.

### Canonical Signature Verification Procedure

The CAP Evaluator **MUST** verify manifest authenticity as follows:

1. Confirm `signature_ed25519` is a valid 128-character hexadecimal string and look up `signer_key_id` in `trust_anchors`. If the anchor is missing, `algorithm != "Ed25519"`, or `public_key_raw_hex` is not a valid 64-character hexadecimal string (32-byte raw Ed25519 public key), verification fails immediately.
2. Construct the unsigned manifest object by omitting `signature_ed25519` and serialize it using **RFC 8785-compatible deterministic canonical JSON** (lexicographically sorted object keys, omitted undefined optional properties, and zero extraneous whitespace) into UTF-8 bytes.
3. Verify the 64-byte Ed25519 signature over those UTF-8 bytes against the trust anchor's public key.

If verification fails, the Evaluator **MUST** immediately return `decision = "DENY"`, `effective_criticality = "critical"`, `error_code = "E_UNTRUSTED_MANIFEST"`, and `diagnostic_code = 2005`.

---

## 3.2 Default `critical` Denial for Unknown Resources and Operations

Within a signature-verified `DriverCapabilityManifest`:

- If no `ResourceCapabilityDescriptor` matches `req.resource_id`, or no `OperationDescriptor` within that resource matches `req.operation_id`, the CAP Evaluator **MUST** classify `effective_criticality` as `"critical"` and immediately return `decision = "DENY"`, `error_code = "E_UNKNOWN_OPERATION"`, and `diagnostic_code = 2004`.
- Implementations **SHALL NOT** provide wildcard fallback admission or default undeclared operations to `routine`.

---

## 3.3 Consequence Irreversibility Floor (`ConsequenceIrreversibility`)

To prevent misconfigured drivers from under-classifying physically or digitally destructive actions, every `OperationDescriptor` **MUST** declare both `criticality` and `consequence_irreversibility`. The Evaluator **MUST** first compute `floor_criticality` as follows:

| `consequence_irreversibility` Value | Representative Host Operation | Mandatory Floor Rule (`floor_criticality`) |
|-------------------------------------|-------------------------------|--------------------------------------------|
| `reversible` | Reading flight-controller telemetry or temperature sensors | Preserves `operation.criticality` |
| `bounded_compensation` | Updating PID gains with bounded automatic rollback | Preserves `operation.criticality` |
| `irreversible_consequence` | Unlocking a physical cargo latch or emitting external beacons | $\max(\texttt{operation.criticality}, \texttt{high})$ — floor is at least **`high`** |
| `irreversible_data_or_hardware` | Irrecoverable secure storage erase or bricking-risk ESC firmware flash | **Locked to `critical`** regardless of declared `operation.criticality` |

For example, even if `unlock_cargo_latch` declares base `criticality = "sensitive"`, declaring `consequence_irreversibility = "irreversible_consequence"` automatically elevates `floor_criticality` to `high`; likewise, `flash_esc_firmware` with `irreversible_data_or_hardware` is locked to `critical`.

---

## 3.4 Monotonic Criticality Escalation and Downgrade Clamping

Above `floor_criticality`, CAP permits upstream grants (`req.grant.criticality_override`) and callers (`req.caller_criticality_override`) to tighten policy monotonically while prohibiting downgrades:

1. Initialize `effective_criticality = floor_criticality` and `escalation_clamped = false`.
2. Inspect `req.grant.criticality_override` and `req.caller_criticality_override` (when present):
   - If an override is strictly lower than `floor_criticality` ($\text{rank}(\text{override}) < \text{rank}(\text{floor\_criticality})$), the Evaluator **MUST** ignore the downgrade attempt, preserve at least `floor_criticality`, and set **`escalation_clamped = true`** in `CapDecision` for audit visibility;
   - Otherwise, set `effective_criticality = max(effective_criticality, override)`.

Consequently, every CAP evaluation satisfies the invariant:

$$\text{rank}(\texttt{effective\_criticality}) \ge \text{rank}(\texttt{floor\_criticality})$$
