---
title: "Chapter 0: Overview and Normative Terminology"
description: CAP 1.0 scope, RFC 2119 and RFC 8174 normative keyword conventions, core terminology, and two-segment versioning rules
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Chapter 0: Overview and Normative Terminology

## 0.1 Protocol Mission and Scope

The **Control Authority Protocol (CAP)** is a default-deny authorization and safety gate situated between a digital avatar (`Fay`, encompassing both individual avatars `iFay` and common-role avatars `coFay`) and an inhabited **Host** (a physical terminal device, actuator subsystem, or client software application). CAP translates upstream delegation authority into deterministic per-operation admission decisions, ensuring that irreversible physical side effects and sensitive system mutations remain strictly bounded by signed driver capability floors and explicit **Human Prime** intent.

The normative scope of CAP 1.0 covers:

1. The wire and data model for control evaluation inputs (`CapEvaluationRequest`) and deterministic outcomes (`CapDecision`);
2. Cryptographic signature verification, baseline criticality derivation, and irreversibility floor calculation over `DriverCapabilityManifest`;
3. Online freshness and session-derived cryptographic proof verification for `Faying-Protocol` mandate evidence (`MandateEvidence`);
4. The three-dimensional `FayingGrade × AccessMode × Criticality` admission matrix;
5. Parameter-hash-bound explicit **Human Prime** confirmation (`HumanConfirmationProof`) for all `high` and `critical` operations;
6. Immediate **Human Prime** `G0` emergency takeover preemption and non-blocking safe-state directives (`G0SafeStateDirective`).

**Explicit Out-of-Scope Boundaries**: CAP 1.0 does not define identity issuance (see `FayID`), cognitive reasoning (see `Ego`), or social contribution accounting (non-monetary **MeriToken** accounting on **GMChain** is defined in `Global-Merit-Chain`). Furthermore, **financial fund transfers and payment settlements (`fund_transfer`) are strictly excluded from CAP 1.0**; every request or operation tagged with `domain_category == "fund_transfer"` is unconditionally rejected.

---

## 0.2 RFC 2119 and RFC 8174 Normative Keyword Declaration

The key words **MUST**, **MUST NOT**, **REQUIRED**, **SHALL**, **SHALL NOT**, **SHOULD**, **SHOULD NOT**, **RECOMMENDED**, **NOT RECOMMENDED**, **MAY**, and **OPTIONAL** in this specification are to be interpreted as described in BCP 14 (IETF RFC 2119 and RFC 8174) when, and only when, they appear in all capitals, as summarized below:

| Normative Keyword | Normative Interpretation |
|-------------------|--------------------------|
| **MUST** / **SHALL** / **REQUIRED** | Absolute requirement of the specification; any non-compliant implementation cannot claim CAP 1.0 conformance |
| **MUST NOT** / **SHALL NOT** | Absolute prohibition of the specification; any violation constitutes non-conformance and a safety defect |
| **SHOULD** / **RECOMMENDED** | Strong engineering recommendation; deviations require documented security justification and full risk analysis |
| **SHOULD NOT** / **NOT RECOMMENDED** | Strong recommendation against a behavior; any exception requires explicit security analysis |
| **MAY** / **OPTIONAL** | Truly optional capability; interoperable peers **MUST NOT** assume an optional feature is always present or absent |

Lowercase occurrences of these words carry only their ordinary English meaning and have no normative force.

---

## 0.3 Authoritative Terminology

All implementations, schemas, and documentation **MUST** adhere to the following terminology invariants:

- **Human Prime**: The natural person instantiated by an `iFay` who holds ultimate accountability and unconditional override authority (canonical identifier matching `^hid_[a-z2-7]{16,}$`). **Implementations and documentation MUST NOT refer to a human as "Host".**
- **Fay (`iFay` / `coFay`)**: The digital avatar requesting control over a Host resource.
- **Inhabit**: The runtime process of injecting a `Fay` into a target Host so the Host can be operated under CAP governance.
- **Host**: Strictly the **terminal hardware device, actuator peripheral, or software application** inhabited and controlled by a `Fay` (never a human being).
- **CAP Evaluator**: The normative policy enforcement component within the Host trust boundary that deterministically evaluates `CapEvaluationRequest → CapDecision`.

---

## 0.4 Three Orthogonal Version Axes and Two-Segment `"1.0"` Discipline

CAP separates versioning into three orthogonal axes that **MUST NOT** be conflated into a single string or three-segment SemVer identifier:

1. **Protocol Version**: The sole interoperability contract identifier transmitted on the wire, formatted strictly as two non-negative integer segments `MAJOR.MINOR` with **no `PATCH` segment**. Envelope headers express `"CAP/1.0"`, while `CapEvaluationRequest.protocol_version` and `protocol.version` carry the two-segment string **`"1.0"`** (matching `^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$`).
   - **MAJOR increment**: Reserved for breaking wire changes or modifications to default-deny safety invariants; cross-`MAJOR` compatibility is not guaranteed.
   - **MINOR increment**: Reserved for backward-compatible optional fields or additive enum extensions; higher-`MINOR` implementations within the same `MAJOR` **MUST** remain backward-compatible down to `MAJOR.0` and ignore unknown optional fields.
2. **Document Status**: Recorded exclusively in document front matter `status` (`Draft`, `Final`, `Deprecated`, or `Obsolete`, case-sensitive) and **SHALL NOT** appear on the wire or in directory paths.
3. **Editorial Edition**: Anchored by ISO 8601 publication date `YYYY-MM-DD` (**`2025-10-25`** for the initial frozen CAP 1.0 edition). Editorial editions carry strictly non-normative prose clarifications without altering wire semantics and **SHALL NOT** enter wire payloads.

Whenever a CAP 1.0 Evaluator receives a request whose `protocol_version` is not `"1.0"` (for example `"2.0"` or `"1.0.0"`), it **MUST** immediately reject the request with `decision = "DENY"`, `effective_criticality = "critical"`, `error_code = "E_PROTOCOL_VERSION_UNSUPPORTED"`, and `diagnostic_code = 2098`, without attempting best-effort downgrade.
