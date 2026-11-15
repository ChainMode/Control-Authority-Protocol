# Contributing to Control Authority Protocol (CAP)

Thank you for contributing to **Control Authority Protocol (CAP)**! This guide explains how to verify changes across the TypeScript and Rust reference evaluators, maintain schema and vector integrity, sign off commits, and follow ecosystem terminology and dual-track licensing rules.

## Code of Conduct & Security

- All contributors are expected to follow our [Code of Conduct](./CODE_OF_CONDUCT.md) (contact: **jah.g@ifay.ai**).
- Please report security vulnerabilities privately in accordance with [SECURITY.md](./SECURITY.md) rather than opening public issues.

## Contribution Workflow

1. Fork `https://github.com/ChainMode/Control-Authority-Protocol` on GitHub.
2. Clone your fork and add `upstream`:
   ```bash
   git clone https://github.com/<your-username>/Control-Authority-Protocol.git
   cd Control-Authority-Protocol
   git remote add upstream https://github.com/ChainMode/Control-Authority-Protocol.git
   ```
3. Create a descriptive branch from `main` (e.g., `feat/d6-confirmation-test`, `fix/rust-jcs`, `docs/blueprint-en`).
4. Run both TypeScript and Rust verification suites before opening a Pull Request against `main`.

## Build, Test & Conformance Vector Verification

CAP `1.0` maintains dual normative-parity evaluators in TypeScript (`src/`) and Rust (`reference-impls/rust/`) verified against `vectors/semantic/d1-d7-conformance.json`:

```bash
# 1. TypeScript evaluator, schema parity & conformance tests
pnpm install --frozen-lockfile
pnpm test
npx tsc --noEmit

# 2. Pure-Rust reference evaluator & D-1..D-7 conformance suite
cd reference-impls/rust
cargo test
cd ../..
```

## Schema & Conformance Vector Discipline

- **Frozen `1.0` Artifacts**: `schemas/cap-1.0.cddl`, `schemas/cap-1.0.json`, `schema/2025-10-25/schema.json`, and released `CAP/1.0` conformance vectors (`vectors/semantic/d1-d7-conformance.json`) are **frozen**. Breaking changes require a new major protocol version.
- **Additive Minor Evolution**: Backward-compatible minor extensions MUST be published as new versioned schema and vector files (for example `schemas/cap-1.1.*`) and validated identically by both TypeScript and Rust evaluators.
- **Safety Invariants (`D-1..D-7`)**: Every evaluator change MUST preserve signed `DriverCapabilityManifest` criticality floors, `unknown -> critical + DENY`, parameter-bound confirmation (`D-6`), and zero-blocking `G0` safe-state directives (`blocks_human_takeover = false`).

## Ecosystem Terminology Rules

Use positive, unambiguous iFay terminology across all code, schemas, and documentation:

- **`Human Prime`** (`人类原型`): Exclusively refers to the natural person who delegates authority and retains `G0` takeover sovereignty.
- **`Host`** (`宿主`): Strictly refers to a runtime terminal hardware device, actuator peripheral, or client software application inhabited under CAP governance.
- **`Fay`** (`iFay` + `coFay`): Refers to an accountable digital avatar bound to a verifiable responsibility entity.
- **`GMChain`** (`公誉链`) & **`MeriToken`** (`美誉值` / `Merit Unit`): Refers to the ecosystem's strictly non-monetary social contribution reputation metric.

## Commit Convention & DCO 1.1 Sign-Off

Follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat`, `fix`, `docs`, `schema`, `refactor`, `test`, `chore`).

All commits MUST carry a **Developer Certificate of Origin v1.1 (DCO 1.1)** sign-off trailer (`git commit -s`), certifying contribution rights under https://developercertificate.org/ without requiring a CLA:

```text
test(vectors): add D-5 manifest downgrade clamp regression

Signed-off-by: Your Legal Name <you@example.com>
```

## Dual-Track Inbound = Outbound Licensing

Contributions are accepted under `Inbound = Outbound` dual-track licensing (`Copyright (c) 2025-2026 ChainMode contributors`):

- **MIT License** ([`LICENSE`](./LICENSE)) for reference implementations (`src/`, `tests/`, `reference-impls/`), machine-readable schemas (`schemas/`, `schema/`), and conformance test vectors (`vectors/`).
- **Creative Commons Attribution 4.0 International (`CC BY 4.0`)** ([`LICENSE-DOCS`](./LICENSE-DOCS)) for protocol specifications and architectural blueprint documents under `docs/`.
