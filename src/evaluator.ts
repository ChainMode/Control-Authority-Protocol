import { computeParamsSha256, verifyManifestSignature } from './crypto';
import {
  DIAGNOSTIC_CODES,
  type AccessMode,
  type CapDecision,
  type CapErrorCode,
  type CapEvaluationRequest,
  type ConsequenceIrreversibility,
  type Criticality,
  type FayingGrade,
  type GrantMinGrade,
  type TrustAnchorMap,
} from './types';

const CRITICALITY_ORDER: Record<Criticality, number> = {
  routine: 0,
  sensitive: 1,
  high: 2,
  critical: 3,
};

const GRADE_STRENGTH: Record<GrantMinGrade, number> = {
  G1: 4,
  G2: 3,
  G3: 2,
  G4: 1,
};

const HID_CANONICAL_RE = /^hid_[a-z2-7]{16,}$/;

function maxCriticality(a: Criticality, b: Criticality): Criticality {
  return CRITICALITY_ORDER[a] >= CRITICALITY_ORDER[b] ? a : b;
}

function applyIrreversibilityFloor(
  base: Criticality,
  irreversibility: ConsequenceIrreversibility,
): Criticality {
  if (irreversibility === 'irreversible_data_or_hardware') {
    return 'critical';
  }
  if (irreversibility === 'irreversible_consequence') {
    return maxCriticality(base, 'high');
  }
  return base;
}

function deny(
  code: CapErrorCode,
  effectiveCriticality: Criticality,
  escalationClamped: boolean,
  reason: string,
  extra?: Partial<CapDecision>,
): CapDecision {
  return {
    decision: 'DENY',
    effective_criticality: effectiveCriticality,
    escalation_clamped: escalationClamped,
    error_code: code,
    diagnostic_code: DIAGNOSTIC_CODES[code],
    reason,
    ...extra,
  };
}

function isGradeMatrixAllowed(
  grade: GrantMinGrade,
  mode: AccessMode,
  criticality: Criticality,
): boolean {
  switch (criticality) {
    case 'critical':
      return grade === 'G1';
    case 'high':
      return grade === 'G1' || grade === 'G2';
    case 'sensitive':
      if (grade === 'G1' || grade === 'G2') return true;
      if (grade === 'G3') return mode !== 'configure';
      return false;
    case 'routine':
      if (grade === 'G1' || grade === 'G2' || grade === 'G3') return true;
      return mode === 'read' || mode === 'execute';
  }
}

/**
 * Evaluates a CAP 1.0 control request strictly enforcing safety cluster rules D-1..D-7.
 */
export function evaluateCapRequest(
  req: CapEvaluationRequest,
  trustAnchors: TrustAnchorMap,
): CapDecision {
  if (req.protocol_version !== '1.0') {
    return deny(
      'E_PROTOCOL_VERSION_UNSUPPORTED',
      'critical',
      false,
      `Unsupported CAP protocol_version: ${req.protocol_version}`,
    );
  }

  // Step 1 (D-7c): Financial fund transfers are unconditionally out of CAP 1.0 scope.
  if (req.domain_category === 'fund_transfer') {
    return deny(
      'E_OUT_OF_SCOPE_FUND_TRANSFER',
      'critical',
      false,
      'Financial fund_transfer operations are excluded from CAP 1.0 scope',
    );
  }

  // Step 2 (D-5): Verify cryptographic signature of DriverCapabilityManifest.
  if (!verifyManifestSignature(req.manifest, trustAnchors)) {
    return deny(
      'E_UNTRUSTED_MANIFEST',
      'critical',
      false,
      'DriverCapabilityManifest failed Ed25519 signature or trust anchor verification',
    );
  }

  // Step 3 (D-5 & D-7a/b): Lookup resource & operation; compute monotonic criticality floor.
  const resource = req.manifest.resources.find(
    (r) => r.resource_id === req.resource_id,
  );
  const operation = resource?.operations.find(
    (op) => op.operation_id === req.operation_id,
  );
  if (!resource || !operation) {
    return deny(
      'E_UNKNOWN_OPERATION',
      'critical',
      false,
      `Undeclared resource/operation ${req.resource_id}/${req.operation_id} defaults to critical DENY`,
    );
  }

  if (operation.domain_category === 'fund_transfer') {
    return deny(
      'E_OUT_OF_SCOPE_FUND_TRANSFER',
      'critical',
      false,
      'Manifest-declared fund_transfer operation is excluded from CAP 1.0 scope',
    );
  }

  const floorCriticality = applyIrreversibilityFloor(
    operation.criticality,
    operation.consequence_irreversibility,
  );

  let effectiveCriticality = floorCriticality;
  let escalationClamped = false;

  for (const override of [
    req.grant.criticality_override,
    req.caller_criticality_override,
  ]) {
    if (override !== undefined) {
      if (CRITICALITY_ORDER[override] < CRITICALITY_ORDER[floorCriticality]) {
        escalationClamped = true;
      } else {
        effectiveCriticality = maxCriticality(effectiveCriticality, override);
      }
    }
  }

  // Step 4 (D-3): Human Prime G0 emergency override immediately denies Fay & emits non-blocking safe-state directive.
  const sessionGrade: FayingGrade = req.grant.mandate_binding.session_grade;
  if (req.g0_override === true || sessionGrade === 'G0') {
    const primarySafeState = resource.safe_states?.[0]?.safe_state_id;
    return deny(
      'E_G0_EMERGENCY_OVERRIDE',
      effectiveCriticality,
      escalationClamped,
      'Human Prime G0 emergency takeover active',
      {
        safe_state_directive: primarySafeState
          ? {
              action: 'enter_safe_state',
              safe_state_id: primarySafeState,
              blocks_human_takeover: false,
            }
          : {
              action: 'terminate_and_alert',
              blocks_human_takeover: false,
            },
      },
    );
  }

  // Step 5 (D-1): Validate Faying Mandate freshness, subject/resource/mode match, and Model A/B/C binding rules.
  const mandate = req.grant.mandate_binding;
  if (
    mandate.revoked ||
    mandate.expires_at_epoch_ms <= req.now_epoch_ms ||
    mandate.fay_id !== req.fay_id ||
    mandate.resource_id !== req.resource_id ||
    req.grant.resource_id !== req.resource_id ||
    operation.mode !== req.requested_mode ||
    !req.grant.allowed_modes.includes(req.requested_mode) ||
    !mandate.allowed_modes.includes(req.requested_mode)
  ) {
    return deny(
      'E_MANDATE_INVALID',
      effectiveCriticality,
      escalationClamped,
      'Mandate or grant expired, revoked, or mismatched with subject/resource/mode',
    );
  }

  const isHighOrCritical =
    effectiveCriticality === 'high' || effectiveCriticality === 'critical';

  if (isHighOrCritical) {
    if (
      mandate.binding_model !== 'model_a_plus_b' ||
      !mandate.online_fresh ||
      mandate.model_a_derived_proof_valid !== true
    ) {
      return deny(
        'E_WEAK_MANDATE_BINDING',
        effectiveCriticality,
        escalationClamped,
        'High and critical operations require Model A+B cryptographic session binding and online freshness',
      );
    }
  } else if (mandate.binding_model === 'model_b_online_ref' || mandate.binding_model === 'model_a_plus_b') {
    if (!mandate.online_fresh) {
      return deny(
        'E_MANDATE_INVALID',
        effectiveCriticality,
        escalationClamped,
        'Online Mandate binding model requires online_fresh == true',
      );
    }
  } else if (effectiveCriticality === 'sensitive' && mandate.binding_model === 'model_c_offline_cache') {
    return deny(
      'E_WEAK_MANDATE_BINDING',
      effectiveCriticality,
      escalationClamped,
      'Sensitive operations require online Mandate verification (Model B or Model A+B)',
    );
  }

  // Step 6 (D-2): Grade x Mode x Criticality conservative matrix + grant min_grade check.
  if (
    GRADE_STRENGTH[sessionGrade] < GRADE_STRENGTH[req.grant.min_grade] ||
    !isGradeMatrixAllowed(sessionGrade, req.requested_mode, effectiveCriticality)
  ) {
    return deny(
      'E_GRADE_INSUFFICIENT',
      effectiveCriticality,
      escalationClamped,
      `Session grade ${sessionGrade} and mode ${req.requested_mode} insufficient for ${effectiveCriticality}`,
    );
  }

  // Step 7 (D-6): Parameter-bound explicit Human Prime confirmation gate for ALL high/critical (including G1).
  if (isHighOrCritical) {
    const confirmation = req.human_confirmation;
    const expectedHash = computeParamsSha256(req.params);
    if (
      !confirmation ||
      !HID_CANONICAL_RE.test(confirmation.human_prime_id) ||
      confirmation.expires_at_epoch_ms <= req.now_epoch_ms ||
      confirmation.terminal_attested_disclosure !== true ||
      confirmation.confirmed_params_sha256 !== expectedHash
    ) {
      return deny(
        'E_CONFIRMATION_REQUIRED',
        effectiveCriticality,
        escalationClamped,
        'High and critical operations require unexpired, terminal-attested, parameter-bound Human Prime confirmation',
      );
    }
  }

  return {
    decision: 'ALLOW',
    effective_criticality: effectiveCriticality,
    effective_grade: sessionGrade,
    escalation_clamped: escalationClamped,
  };
}
