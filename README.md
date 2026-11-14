# Control Authority Protocol (CAP)

Protocol governing how an iFay or coFay safely acquires, exercises, and relinquishes control over hardware terminals and client software via verifiable capability tickets, Faying mandates (`G0–G4`), criticality floors (`routine` / `sensitive` / `high` / `critical`), and safe-state guarantees.

## Safety Governance Baseline (Accepted)

- **Authorization Binding (`D-1`)**: Default Model B (Faying Mandate reference + live status check); `high` and `critical` operations additionally require Model A derived sub-tickets; standalone Model C tickets are prohibited for `high` and `critical`.
- **Grade × Criticality Matrix (`D-2`)**: `critical` operations (including irreversible hardware erase/firmware bricking `D-7`) are restricted exclusively to `G1` real-time presence; financial fund transfers are out of scope of CAP.
- **Takeover Safe-State (`D-3`)**: `G0` Human Prime takeover immediately invokes the driver's registered `safe-state` (or terminates in-flight execution with alert without blocking takeover).
- **Authoritative Criticality Floor (`D-5`)**: Signed Driver/Terminal capability manifests set the non-downgradable criticality floor; unmapped resources/operations default to `critical + DENY`.
- **Confirmation Policy (`D-6`)**: Conservative floor (`G2` confirmation baseline + explicit confirmation for all `high` operations even under `G1`).

## Repository Layout

| Path | Description |
| --- | --- |
| `docs/{locale}/blueprint/` | Architectural blueprint across 9 locales (`zh-CN` canonical) |
| `schema/` | Capability ticket & driver manifest schemas |
| `vectors/` | Conformance test vector structure |
| `tests/` | Vitest blueprint & vector verification suite (62 tests) |

## Quick Start

```bash
pnpm install
pnpm test
```
