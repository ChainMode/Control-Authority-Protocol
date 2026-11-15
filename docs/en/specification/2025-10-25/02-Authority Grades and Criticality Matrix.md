---
title: "Chapter 2: Authority Grades and Criticality Matrix"
description: CAP 1.0 resource access modes, four-level criticality ordering, and the 3D FayingGrade x AccessMode x Criticality matrix
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Chapter 2: Authority Grades and Criticality Matrix

## 2.1 Non-Hierarchical Resource Access Modes (`AccessMode`)

CAP 1.0 defines four orthogonal `AccessMode` values for Host resource operations. Access modes are **non-hierarchical** (for example, holding `write` permission does not implicitly grant `read` or `configure`):

| Access Mode | Concurrency Lock Semantics | Normative Definition |
|-------------|----------------------------|----------------------|
| `read` | Shared read lock | Inspects telemetry, device status, or configuration snapshots without mutating Host state or external physical conditions |
| `write` | Exclusive mutex lock | Modifies Host storage, writes control registers, or flashes firmware images |
| `execute` | Exclusive mutex lock | Actuates physical mechanisms, transmits external communications, or invokes Host processes |
| `configure` | Exclusive mutex lock | Alters Host security policies, control-loop gains (such as flight-controller PID parameters), or permission boundaries |

During runtime session concurrency control, multiple concurrent `read` operations on the same Host resource are permissible, whereas any `write`, `execute`, or `configure` operation **MUST** acquire an exclusive lock mutually exclusive with all other operations on that resource.

---

## 2.2 Total Ordering of Operation Criticality (`Criticality`)

CAP 1.0 classifies every Host operation along a strict four-level total order:

$$\texttt{routine} (0) < \texttt{sensitive} (1) < \texttt{high} (2) < \texttt{critical} (3)$$

- **`routine`**: Fully reversible, low-impact read or bounded idempotent actions carrying no privacy leakage or physical hazard (e.g., reading ambient temperature or flight telemetry).
- **`sensitive`**: Controlled parameter tuning, sensitive state reads, or mutations backed by bounded automatic compensation (e.g., tuning controller PID gains).
- **`high`**: Operations producing irreversible real-world consequences, physical latch actuation, or external broadcasts (e.g., unlocking a physical cargo bay latch), requiring Model A+B binding and per-operation **Human Prime** confirmation.
- **`critical`**: Operations risking unrecoverable data destruction, hardware bricking, or severe physical harm (e.g., cryptographic secure erase or low-level ESC firmware flashing), gated exclusively under `G1`.

---

## 2.3 Faying Autonomy and Presence Grades (`FayingGrade`)

The CAP Evaluator consumes the five session grades defined by `Faying-Protocol` (see `Faying-Protocol`):

- **`G0`**: Direct **Human Prime** emergency takeover state (highest preemption priority; never an autonomous `Fay` execution state);
- **`G1`**: Real-time **Human Prime** strong presence binding (highest delegation strength; the **only** grade eligible for `critical` operations);
- **`G2`**: Supervised **Human Prime** companion presence;
- **`G3`**: Standard delegated autonomy;
- **`G4`**: Restricted background autonomy (lowest delegation strength).

For `CapGrant.min_grade` (`G1`–`G4`), authorization strength follows the strict ordering:

$$\text{Strength}(\texttt{G1}) = 4 > \text{Strength}(\texttt{G2}) = 3 > \text{Strength}(\texttt{G3}) = 2 > \text{Strength}(\texttt{G4}) = 1$$

If $\text{Strength}(\texttt{session\_grade}) < \text{Strength}(\texttt{grant.min\_grade})$, the Evaluator **MUST** reject the request with `E_GRADE_INSUFFICIENT` (`2002`).

---

## 2.4 Three-Dimensional Authorization Matrix (`FayingGrade × AccessMode × Criticality`)

When `session_grade` is in `G1`–`G4` and satisfies `grant.min_grade`, the CAP Evaluator **MUST** enforce the following conservative admission matrix over `(session_grade, requested_mode, effective_criticality)`:

| Effective Criticality (`effective_criticality`) | `G1` (Real-Time Presence) | `G2` (Supervised Presence) | `G3` (Standard Autonomy) | `G4` (Restricted Background) |
|-------------------------------------------------|---------------------------|----------------------------|--------------------------|------------------------------|
| **`critical`** | `read` / `write` / `execute` / `configure` allowed (**requires Chapter 4 confirmation gate**) | **`DENY`** | **`DENY`** | **`DENY`** |
| **`high`** | All granted modes allowed (**requires Chapter 4 confirmation gate**) | All granted modes allowed (**requires Chapter 4 confirmation gate**) | **`DENY`** | **`DENY`** |
| **`sensitive`** | All granted modes allowed | All granted modes allowed | `read` / `write` / `execute` only (**`configure` prohibited**) | **`DENY`** |
| **`routine`** | All granted modes allowed | All granted modes allowed | All granted modes allowed | `read` / `execute` only (**`write` & `configure` prohibited**) |

### Key Matrix Safety Invariants

1. **`G1`-Only Exclusivity for `critical`**: Every `critical` operation attempted under `G2`, `G3`, or `G4` **MUST** be denied with `E_GRADE_INSUFFICIENT` (`2002`), even if a valid `human_confirmation` proof is attached.
2. **`G3` Configuration Isolation**: Requesting `configure` mode on a `sensitive` operation under `G3` **MUST** be denied with `E_GRADE_INSUFFICIENT` (`2002`).
3. **`G4` Mutation Prohibition**: Under `G4`, only `read` and `execute` on `routine` operations are permitted; any `write`, `configure`, or above-`routine` operation **MUST** be denied with `E_GRADE_INSUFFICIENT` (`2002`).
