# Security Policy — Control Authority Protocol (CAP)

## Supported Protocol & Artifact Versions

Security advisories and normative patches are maintained for the following released CAP baselines and reference evaluators:

| Protocol Version | Normative Artifacts | Security Support |
| --- | --- | --- |
| `1.0` (`CAP/1.0`) | `schemas/cap-1.0.cddl`, `schemas/cap-1.0.json`, `vectors/semantic/d1-d7-conformance.json`, `src/`, `reference-impls/rust/` | Supported |
| `< 1.0` (pre-release drafts) | Superseded snapshots | Unsupported |

> **Note on Test Fixtures**: Ed25519 keypairs and signatures under `vectors/` and `tests/` are deterministic public conformance fixtures and MUST NOT be used in production **Host** deployments.

## Security Scope

Reports are in scope when they demonstrate a bypass, ambiguity, or implementation flaw in any CAP 1.0 safety invariant:

1. **`D-1..D-7` Criticality Floor Non-Downgrade**: Bypasses of Ed25519-signed `DriverCapabilityManifest` verification over RFC 8785 canonical JSON (`D-5`), failure to clamp downgrade attempts (`escalation_clamped = true`), or circumvention of irreversibility criticality floors (`D-7`: `irreversible_consequence >= high`, `irreversible_data_or_hardware == critical`).
2. **Default-Deny Unknown Operation Handling (`unknown -> critical + DENY`)**: Any path where an undeclared resource, unrecognized capability, or unverified mandate fails to resolve to `critical` criticality with an immediate `DENY` (`E_UNKNOWN_OPERATION` / `2004`), or where offline cached mandates (`model_c_offline_cache`) are accepted above `routine` criticality (`D-1`).
3. **Zero-Blocking `G0` Safe-State Enforcement**: Any condition where a **Human Prime** `G0` emergency takeover fails to preempt `Fay` (`iFay` / `coFay`) execution (`E_G0_EMERGENCY_OVERRIDE` / `2003`), blocks **Human Prime** takeover (`blocks_human_takeover != false`), or fails to emit a deterministic `G0SafeStateDirective` (`D-3`).
4. **Parameter-Bound Confirmation & Hardware/Host Boundary Isolation**: Forgery, replay, or digest-mismatch bypasses of **Host**-attested `HumanConfirmationProof` (`D-6`) on `high` and `critical` actions, `3D Grade x AccessMode x Criticality` matrix escapes (`D-2`), or isolation breaches across the inhabited **Host** boundary (where **Host** strictly denotes a physical terminal device, actuator peripheral, or client runtime application).

## Reporting a Vulnerability Privately

**Please do NOT open public GitHub Issues, Discussions, or Pull Requests for undisclosed security vulnerabilities.**

### 1. Primary Channel — GitHub Private Vulnerability Reporting

Submit a private advisory via **GitHub Security Advisories**:

- **Report URL**: https://github.com/ChainMode/Control-Authority-Protocol/security/advisories/new

### 2. Fallback Channel — Security Email

If you cannot access GitHub Security Advisories, report directly by email:

- **Email**: **jah.g@ifay.ai**
- Include `[SECURITY][CAP]` in the subject line along with affected `D-1..D-7` invariant(s), TypeScript (`src/`) or Rust (`reference-impls/rust/`) reproduction input, and impact analysis.

## Response & Coordinated Disclosure Timeline

- **Initial Acknowledgment**: Within **72 hours** of report receipt.
- **Triage & Validation**: Within **7 calendar days**, including confirmation of affected artifacts and severity.
- **Coordinated Disclosure Window**: **90 days** from initial report to publish coordinated fixes, regression conformance vectors, and a public GitHub Security Advisory (with reporter credit unless anonymity is requested).
