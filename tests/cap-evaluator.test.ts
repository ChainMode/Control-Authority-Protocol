import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import fc from 'fast-check';
import {
  canonicalJson,
  computeParamsSha256,
  evaluateCapRequest,
  normalizeProtocolErrorCode,
  type CapEvaluationRequest,
  type Criticality,
  type DriverCapabilityManifest,
  type FayingGrade,
  type TrustAnchorMap,
} from '../src/index';

const ROOT = resolve(import.meta.dirname, '..');

interface SemanticVectorSuite {
  suite: string;
  normative: boolean;
  trust_anchors: TrustAnchorMap;
  reference_manifest: DriverCapabilityManifest;
  vectors: Array<{
    id: string;
    rule_refs: string[];
    use_reference_manifest: boolean;
    manifest_tamper_signature?: string;
    request_overrides: Partial<CapEvaluationRequest> & Pick<
      CapEvaluationRequest,
      'request_id' | 'resource_id' | 'operation_id' | 'requested_mode' | 'params' | 'grant'
    >;
    expected: {
      decision: 'ALLOW' | 'DENY';
      effective_criticality: Criticality;
      effective_grade?: FayingGrade;
      escalation_clamped: boolean;
      error_code?: string;
      diagnostic_code?: number;
      safe_state_directive?: {
        action: 'enter_safe_state' | 'terminate_and_alert';
        safe_state_id?: string;
        blocks_human_takeover: false;
      };
    };
  }>;
}

const suite: SemanticVectorSuite = JSON.parse(
  readFileSync(resolve(ROOT, 'vectors/semantic/d1-d7-conformance.json'), 'utf8'),
);

describe('CAP 1.0 D-1..D-7 Semantic Conformance Vectors', () => {
  for (const vec of suite.vectors) {
    it(`${vec.id} (${vec.rule_refs.join(', ')})`, () => {
      const manifest: DriverCapabilityManifest = vec.use_reference_manifest
        ? structuredClone(suite.reference_manifest)
        : {
            ...structuredClone(suite.reference_manifest),
            signature_ed25519: vec.manifest_tamper_signature,
          };

      const req: CapEvaluationRequest = {
        protocol_version: '1.0',
        fay_id: 'ifay_aaaaaaaabbbbbbbbccccccccdddddddd',
        now_epoch_ms: 1800000000000,
        manifest,
        ...vec.request_overrides,
      };

      const actual = evaluateCapRequest(req, suite.trust_anchors);
      expect(actual.decision).toBe(vec.expected.decision);
      expect(actual.effective_criticality).toBe(vec.expected.effective_criticality);
      expect(actual.escalation_clamped).toBe(vec.expected.escalation_clamped);
      if (vec.expected.effective_grade !== undefined) {
        expect(actual.effective_grade).toBe(vec.expected.effective_grade);
      }
      if (vec.expected.error_code !== undefined) {
        expect(actual.error_code).toBe(vec.expected.error_code);
      }
      if (vec.expected.diagnostic_code !== undefined) {
        expect(actual.diagnostic_code).toBe(vec.expected.diagnostic_code);
      }
      if (vec.expected.safe_state_directive !== undefined) {
        expect(actual.safe_state_directive).toEqual(vec.expected.safe_state_directive);
      }
    });
  }
});

describe('CAP 1.0 Error Alias & Dual-Schema Parity (D-8, D-9, D-10)', () => {
  it('normalizes legacy E_INVALID_MESSAGE to canonical E_PROTOCOL while keeping E_PROTOCOL_VERSION_UNSUPPORTED distinct', () => {
    expect(normalizeProtocolErrorCode('E_INVALID_MESSAGE')).toBe('E_PROTOCOL');
    expect(normalizeProtocolErrorCode('E_PROTOCOL')).toBe('E_PROTOCOL');
    expect(normalizeProtocolErrorCode('E_PROTOCOL_VERSION_UNSUPPORTED')).toBe(
      'E_PROTOCOL_VERSION_UNSUPPORTED',
    );
  });

  it('rejects unsupported protocol versions with E_PROTOCOL_VERSION_UNSUPPORTED (2098)', () => {
    const first = suite.vectors[0]!;
    const res = evaluateCapRequest(
      {
        protocol_version: '9.9',
        fay_id: 'ifay_aaaaaaaabbbbbbbbccccccccdddddddd',
        now_epoch_ms: 1800000000000,
        manifest: structuredClone(suite.reference_manifest),
        ...first.request_overrides,
      },
      suite.trust_anchors,
    );
    expect(res.decision).toBe('DENY');
    expect(res.error_code).toBe('E_PROTOCOL_VERSION_UNSUPPORTED');
    expect(res.diagnostic_code).toBe(2098);
  });

  it('keeps schemas/cap-1.0.cddl, schemas/cap-1.0.json, and schema/2025-10-25/schema.json aligned on core types and error codes', () => {
    const cddl = readFileSync(resolve(ROOT, 'schemas/cap-1.0.cddl'), 'utf8');
    const frozenJsonSchema = JSON.parse(
      readFileSync(resolve(ROOT, 'schemas/cap-1.0.json'), 'utf8'),
    );
    const editionJsonSchema = JSON.parse(
      readFileSync(resolve(ROOT, 'schema/2025-10-25/schema.json'), 'utf8'),
    );
    expect(frozenJsonSchema.$defs.ProtocolVersion.const).toBe('1.0');
    expect(editionJsonSchema).toEqual(frozenJsonSchema);
    const errorEnum: string[] = frozenJsonSchema.$defs.CapErrorCode.enum;
    for (const code of errorEnum) {
      expect(cddl).toContain(`"${code}"`);
    }
    expect(cddl).toContain('cap-protocol-version = "1.0"');
    expect(cddl).toContain('driver-capability-manifest');
    expect(cddl).toContain('cap-evaluation-request');
    expect(cddl).toContain('g0-safe-state-directive');
  });
});

describe('CAP 1.0 Property-Based Safety Invariants', () => {
  const criticalities: Criticality[] = ['routine', 'sensitive', 'high', 'critical'];
  const rank = (c: Criticality) => criticalities.indexOf(c);

  it('Property 1 (D-5/D-7): caller/grant overrides NEVER downgrade effective criticality below manifest+irreversibility floor', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...criticalities),
        fc.constantFrom(...criticalities),
        fc.constantFrom(
          'read_telemetry',
          'tune_pid',
          'unlock_cargo_latch',
          'flash_esc_firmware',
        ),
        (callerOverride, grantOverride, opId) => {
          const op = suite.reference_manifest.resources[0]!.operations.find(
            (o) => o.operation_id === opId,
          )!;
          let expectedFloor = op.criticality;
          if (op.consequence_irreversibility === 'irreversible_data_or_hardware') {
            expectedFloor = 'critical';
          } else if (
            op.consequence_irreversibility === 'irreversible_consequence' &&
            rank(expectedFloor) < rank('high')
          ) {
            expectedFloor = 'high';
          }

          const params = { probe: opId };
          const res = evaluateCapRequest(
            {
              protocol_version: '1.0',
              request_id: 'req_pbt_1',
              fay_id: 'ifay_aaaaaaaabbbbbbbbccccccccdddddddd',
              resource_id: 'res_drone_fc',
              operation_id: opId,
              requested_mode: op.mode,
              caller_criticality_override: callerOverride,
              params,
              now_epoch_ms: 1800000000000,
              manifest: suite.reference_manifest,
              grant: {
                grant_id: 'grt_pbt',
                resource_id: 'res_drone_fc',
                allowed_modes: [op.mode],
                min_grade: 'G1',
                criticality_override: grantOverride,
                mandate_binding: {
                  mandate_id: 'mnd_pbt',
                  fay_id: 'ifay_aaaaaaaabbbbbbbbccccccccdddddddd',
                  resource_id: 'res_drone_fc',
                  allowed_modes: [op.mode],
                  session_grade: 'G1',
                  binding_model: 'model_a_plus_b',
                  online_fresh: true,
                  revoked: false,
                  expires_at_epoch_ms: 1800000060000,
                  model_a_derived_proof_valid: true,
                },
              },
              human_confirmation: {
                confirmation_id: 'cnf_pbt',
                human_prime_id: 'hid_aaaaaaaabbbbbbbbccccccccdddddddd',
                confirmed_params_sha256: computeParamsSha256(params),
                terminal_attested_disclosure: true,
                expires_at_epoch_ms: 1800000030000,
              },
            },
            suite.trust_anchors,
          );

          expect(rank(res.effective_criticality)).toBeGreaterThanOrEqual(
            rank(expectedFloor),
          );
        },
      ),
    );
  });

  it('Property 2 (D-3): G0 emergency override ALWAYS denies Fay control and NEVER blocks Human Prime takeover', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('res_drone_fc', 'res_legacy_sensor'),
        fc.boolean(),
        (resourceId, viaFlag) => {
          const opId = resourceId === 'res_drone_fc' ? 'read_telemetry' : 'read_temp';
          const res = evaluateCapRequest(
            {
              protocol_version: '1.0',
              request_id: 'req_pbt_g0',
              fay_id: 'ifay_aaaaaaaabbbbbbbbccccccccdddddddd',
              resource_id: resourceId,
              operation_id: opId,
              requested_mode: 'read',
              g0_override: viaFlag,
              params: {},
              now_epoch_ms: 1800000000000,
              manifest: suite.reference_manifest,
              grant: {
                grant_id: 'grt_pbt_g0',
                resource_id: resourceId,
                allowed_modes: ['read'],
                min_grade: 'G1',
                mandate_binding: {
                  mandate_id: 'mnd_pbt_g0',
                  fay_id: 'ifay_aaaaaaaabbbbbbbbccccccccdddddddd',
                  resource_id: resourceId,
                  allowed_modes: ['read'],
                  session_grade: viaFlag ? 'G1' : 'G0',
                  binding_model: 'model_a_plus_b',
                  online_fresh: true,
                  revoked: false,
                  expires_at_epoch_ms: 1800000060000,
                  model_a_derived_proof_valid: true,
                },
              },
            },
            suite.trust_anchors,
          );

          expect(res.decision).toBe('DENY');
          expect(res.error_code).toBe('E_G0_EMERGENCY_OVERRIDE');
          expect(res.safe_state_directive?.blocks_human_takeover).toBe(false);
          expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
        },
      ),
    );
  });
});
