---
title: Control Authority Protocol (CAP) 1.0 Specification
description: Normative specification index, chapter guide, and conformance artifacts for Control Authority Protocol (CAP) 1.0
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
replaces: draft@5bbc1a5
---

# Control Authority Protocol (CAP) 1.0 Specification

This directory contains the frozen, normative **Control Authority Protocol (CAP) 1.0** specification (Edition `2025-10-25`, Status `Final`). CAP defines how a digital avatar (`iFay` or `coFay`) safely requests, exercises, and relinquishes hardware and software control over an inhabited **Host** (strictly a terminal device or client software application) under verifiable authority delegated by a **Human Prime**.

## Specification Chapters

| Chapter | File | Normative Scope Summary |
|---------|------|-------------------------|
| Chapter 0 | `00-Overview and Normative Terminology.md` | Protocol scope and non-goals, RFC 2119 / RFC 8174 normative keyword conventions, authoritative terminology, and three-axis / two-segment `"1.0"` versioning discipline |
| Chapter 1 | `01-Architecture and Binding Models.md` | Protocol roles and trust boundaries, CAP as a Faying Relying Party, deterministic 8-step evaluation pipeline, `Mandate` binding models (Model B / Model A+B / Model C prohibition), and `fund_transfer` exclusion |
| Chapter 2 | `02-Authority Grades and Criticality Matrix.md` | Non-hierarchical resource access modes (`read` / `write` / `execute` / `configure`), four-tier criticality ordering, and the conservative `FayingGrade × AccessMode × Criticality` decision matrix |
| Chapter 3 | `03-Driver Capability Manifest and Irreversibility Floor.md` | Ed25519-signed `DriverCapabilityManifest` verification, default `critical` denial for undeclared operations, `consequence_irreversibility` floor, and monotonic criticality escalation |
| Chapter 4 | `04-High-Risk Human Prime Confirmation and Safe-State.md` | Parameter SHA-256-bound explicit `Human Prime` confirmation gate, zero-blocking `G0` emergency takeover `G0SafeStateDirective`, canonical error and diagnostic codes, and conformance criteria |

## Companion Normative Deliverables

This specification forms a unified interoperability baseline together with the following machine-verifiable artifacts:

- **Normative CDDL Wire & Data Schema**: `schemas/cap-1.0.cddl`
- **Normative JSON Schema (Draft 2020-12)**: `schemas/cap-1.0.json` (mirrored at `schema/2025-10-25/schema.json`)
- **Semantic Conformance Vector Suite**: `vectors/semantic/d1-d7-conformance.json` (14 positive and negative test vectors)
- **Dual-Language Reference Implementations**: TypeScript evaluator (`src/`) and Rust evaluator (`reference-impls/rust/`)

## Cross-Protocol Boundaries

- **Human Prime** and avatar identifier syntax are authoritatively defined by **FayID** (see `FayID`).
- Delegation mandates (`Mandate`), autonomy grades (`G0`–`G4`), and presence freshness semantics are authoritatively defined by **Faying-Protocol** (see `Faying-Protocol`).
- Runtime host injection and driver manifest loading lifecycles are authoritatively defined by **FayGer** (see `FayGer`).
- The social contribution ledger **Global Merit Chain** (`GMChain`) and non-monetary contribution metric **MeriToken** are authoritatively defined by **Global-Merit-Chain** (see `Global-Merit-Chain`).
