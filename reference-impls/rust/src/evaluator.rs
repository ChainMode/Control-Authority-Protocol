use crate::crypto::{compute_params_sha256, verify_manifest_signature};
use crate::types::{
    AccessMode, CapDecision, CapErrorCode, CapEvaluationRequest, ConsequenceIrreversibility,
    Criticality, DecisionOutcome, DomainCategory, FayingGrade, G0SafeStateDirective,
    GrantMinGrade, MandateBindingModel, SafeStateAction, TrustAnchorMap,
};

fn grade_strength(grade: FayingGrade) -> u8 {
    match grade {
        FayingGrade::G0 => 5,
        FayingGrade::G1 => 4,
        FayingGrade::G2 => 3,
        FayingGrade::G3 => 2,
        FayingGrade::G4 => 1,
    }
}

fn min_grade_strength(grade: GrantMinGrade) -> u8 {
    match grade {
        GrantMinGrade::G1 => 4,
        GrantMinGrade::G2 => 3,
        GrantMinGrade::G3 => 2,
        GrantMinGrade::G4 => 1,
    }
}

fn apply_irreversibility_floor(
    base: Criticality,
    irreversibility: ConsequenceIrreversibility,
) -> Criticality {
    match irreversibility {
        ConsequenceIrreversibility::IrreversibleDataOrHardware => Criticality::Critical,
        ConsequenceIrreversibility::IrreversibleConsequence => base.max(Criticality::High),
        ConsequenceIrreversibility::Reversible
        | ConsequenceIrreversibility::BoundedCompensation => base,
    }
}

fn is_canonical_hid(id: &str) -> bool {
    if !id.starts_with("hid_") {
        return false;
    }
    let body = &id[4..];
    body.len() >= 16
        && body
            .bytes()
            .all(|b| b.is_ascii_lowercase() || (b'2'..=b'7').contains(&b))
}

fn is_grade_matrix_allowed(
    grade: FayingGrade,
    mode: AccessMode,
    criticality: Criticality,
) -> bool {
    match criticality {
        Criticality::Critical => grade == FayingGrade::G1,
        Criticality::High => matches!(grade, FayingGrade::G1 | FayingGrade::G2),
        Criticality::Sensitive => match grade {
            FayingGrade::G1 | FayingGrade::G2 => true,
            FayingGrade::G3 => mode != AccessMode::Configure,
            _ => false,
        },
        Criticality::Routine => match grade {
            FayingGrade::G1 | FayingGrade::G2 | FayingGrade::G3 => true,
            FayingGrade::G4 => matches!(mode, AccessMode::Read | AccessMode::Execute),
            FayingGrade::G0 => false,
        },
    }
}

fn deny(
    code: CapErrorCode,
    effective_criticality: Criticality,
    escalation_clamped: bool,
    reason: impl Into<String>,
    safe_state_directive: Option<G0SafeStateDirective>,
) -> CapDecision {
    CapDecision {
        decision: DecisionOutcome::Deny,
        effective_criticality,
        effective_grade: None,
        escalation_clamped,
        error_code: Some(code),
        diagnostic_code: Some(code.diagnostic_code()),
        reason: Some(reason.into()),
        safe_state_directive,
    }
}

/// Normalizes legacy error aliases (`E_INVALID_MESSAGE`) to canonical `E_PROTOCOL`.
pub fn normalize_protocol_error_code(code: &str) -> CapErrorCode {
    match code {
        "E_WEAK_MANDATE_BINDING" => CapErrorCode::EWeakMandateBinding,
        "E_GRADE_INSUFFICIENT" => CapErrorCode::EGradeInsufficient,
        "E_G0_EMERGENCY_OVERRIDE" => CapErrorCode::EG0EmergencyOverride,
        "E_UNKNOWN_OPERATION" => CapErrorCode::EUnknownOperation,
        "E_UNTRUSTED_MANIFEST" => CapErrorCode::EUntrustedManifest,
        "E_CONFIRMATION_REQUIRED" => CapErrorCode::EConfirmationRequired,
        "E_OUT_OF_SCOPE_FUND_TRANSFER" => CapErrorCode::EOutOfScopeFundTransfer,
        "E_MANDATE_INVALID" => CapErrorCode::EMandateInvalid,
        "E_PROTOCOL_VERSION_UNSUPPORTED" => CapErrorCode::EProtocolVersionUnsupported,
        "E_INVALID_MESSAGE" | "E_PROTOCOL" | _ => CapErrorCode::EProtocol,
    }
}

/// Evaluates a CAP 1.0 control request strictly enforcing safety rules D-1..D-7.
pub fn evaluate_cap_request(
    req: &CapEvaluationRequest,
    trust_anchors: &TrustAnchorMap,
) -> CapDecision {
    if req.protocol_version != "1.0" {
        return deny(
            CapErrorCode::EProtocolVersionUnsupported,
            Criticality::Critical,
            false,
            format!("Unsupported CAP protocol_version: {}", req.protocol_version),
            None,
        );
    }

    // Step 1 (D-7c): Financial fund transfers are unconditionally out of CAP 1.0 scope.
    if req.domain_category == Some(DomainCategory::FundTransfer) {
        return deny(
            CapErrorCode::EOutOfScopeFundTransfer,
            Criticality::Critical,
            false,
            "Financial fund_transfer operations are excluded from CAP 1.0 scope",
            None,
        );
    }

    // Step 2 (D-5): Verify cryptographic signature of DriverCapabilityManifest.
    if !verify_manifest_signature(&req.manifest, trust_anchors) {
        return deny(
            CapErrorCode::EUntrustedManifest,
            Criticality::Critical,
            false,
            "DriverCapabilityManifest failed Ed25519 signature or trust anchor verification",
            None,
        );
    }

    // Step 3 (D-5 & D-7a/b): Lookup resource & operation; compute monotonic criticality floor.
    let resource = req
        .manifest
        .resources
        .iter()
        .find(|r| r.resource_id == req.resource_id);
    let operation = resource.and_then(|r| {
        r.operations
            .iter()
            .find(|op| op.operation_id == req.operation_id)
    });

    let (resource, operation) = match (resource, operation) {
        (Some(r), Some(op)) => (r, op),
        _ => {
            return deny(
                CapErrorCode::EUnknownOperation,
                Criticality::Critical,
                false,
                format!(
                    "Undeclared resource/operation {}/{} defaults to critical DENY",
                    req.resource_id, req.operation_id
                ),
                None,
            );
        }
    };

    if operation.domain_category == Some(DomainCategory::FundTransfer) {
        return deny(
            CapErrorCode::EOutOfScopeFundTransfer,
            Criticality::Critical,
            false,
            "Manifest-declared fund_transfer operation is excluded from CAP 1.0 scope",
            None,
        );
    }

    let floor_criticality = apply_irreversibility_floor(
        operation.criticality,
        operation.consequence_irreversibility,
    );

    let mut effective_criticality = floor_criticality;
    let mut escalation_clamped = false;

    for override_val in [
        req.grant.criticality_override,
        req.caller_criticality_override,
    ]
    .into_iter()
    .flatten()
    {
        if override_val < floor_criticality {
            escalation_clamped = true;
        } else {
            effective_criticality = effective_criticality.max(override_val);
        }
    }

    // Step 4 (D-3): Human Prime G0 emergency override immediately denies Fay & emits non-blocking safe-state directive.
    let session_grade = req.grant.mandate_binding.session_grade;
    if req.g0_override == Some(true) || session_grade == FayingGrade::G0 {
        let primary_safe_state = resource
            .safe_states
            .as_ref()
            .and_then(|states| states.first())
            .map(|s| s.safe_state_id.clone());

        let directive = match primary_safe_state {
            Some(safe_state_id) => G0SafeStateDirective {
                action: SafeStateAction::EnterSafeState,
                safe_state_id: Some(safe_state_id),
                blocks_human_takeover: false,
            },
            None => G0SafeStateDirective {
                action: SafeStateAction::TerminateAndAlert,
                safe_state_id: None,
                blocks_human_takeover: false,
            },
        };

        return deny(
            CapErrorCode::EG0EmergencyOverride,
            effective_criticality,
            escalation_clamped,
            "Human Prime G0 emergency takeover active",
            Some(directive),
        );
    }

    // Step 5 (D-1): Validate Faying Mandate freshness, subject/resource/mode match, and Model A/B/C binding rules.
    let mandate = &req.grant.mandate_binding;
    if mandate.revoked
        || mandate.expires_at_epoch_ms <= req.now_epoch_ms
        || mandate.fay_id != req.fay_id
        || mandate.resource_id != req.resource_id
        || req.grant.resource_id != req.resource_id
        || operation.mode != req.requested_mode
        || !req.grant.allowed_modes.contains(&req.requested_mode)
        || !mandate.allowed_modes.contains(&req.requested_mode)
    {
        return deny(
            CapErrorCode::EMandateInvalid,
            effective_criticality,
            escalation_clamped,
            "Mandate or grant expired, revoked, or mismatched with subject/resource/mode",
            None,
        );
    }

    let is_high_or_critical = matches!(
        effective_criticality,
        Criticality::High | Criticality::Critical
    );

    if is_high_or_critical {
        if mandate.binding_model != MandateBindingModel::ModelAPlusB
            || !mandate.online_fresh
            || mandate.model_a_derived_proof_valid != Some(true)
        {
            return deny(
                CapErrorCode::EWeakMandateBinding,
                effective_criticality,
                escalation_clamped,
                "High and critical operations require Model A+B cryptographic session binding and online freshness",
                None,
            );
        }
    } else if matches!(
        mandate.binding_model,
        MandateBindingModel::ModelBOnlineRef | MandateBindingModel::ModelAPlusB
    ) {
        if !mandate.online_fresh {
            return deny(
                CapErrorCode::EMandateInvalid,
                effective_criticality,
                escalation_clamped,
                "Online Mandate binding model requires online_fresh == true",
                None,
            );
        }
    } else if effective_criticality == Criticality::Sensitive
        && mandate.binding_model == MandateBindingModel::ModelCOfflineCache
    {
        return deny(
            CapErrorCode::EWeakMandateBinding,
            effective_criticality,
            escalation_clamped,
            "Sensitive operations require online Mandate verification (Model B or Model A+B)",
            None,
        );
    }

    // Step 6 (D-2): Grade x Mode x Criticality conservative matrix + grant min_grade check.
    if grade_strength(session_grade) < min_grade_strength(req.grant.min_grade)
        || !is_grade_matrix_allowed(session_grade, req.requested_mode, effective_criticality)
    {
        return deny(
            CapErrorCode::EGradeInsufficient,
            effective_criticality,
            escalation_clamped,
            format!(
                "Session grade {:?} and mode {:?} insufficient for {:?}",
                session_grade, req.requested_mode, effective_criticality
            ),
            None,
        );
    }

    // Step 7 (D-6): Parameter-bound explicit Human Prime confirmation gate for ALL high/critical (including G1).
    if is_high_or_critical {
        let expected_hash = compute_params_sha256(&req.params);
        let confirmation_valid = match &req.human_confirmation {
            Some(c) => {
                is_canonical_hid(&c.human_prime_id)
                    && c.expires_at_epoch_ms > req.now_epoch_ms
                    && c.terminal_attested_disclosure
                    && c.confirmed_params_sha256 == expected_hash
            }
            None => false,
        };
        if !confirmation_valid {
            return deny(
                CapErrorCode::EConfirmationRequired,
                effective_criticality,
                escalation_clamped,
                "High and critical operations require unexpired, terminal-attested, parameter-bound Human Prime confirmation",
                None,
            );
        }
    }

    CapDecision {
        decision: DecisionOutcome::Allow,
        effective_criticality,
        effective_grade: Some(session_grade),
        escalation_clamped,
        error_code: None,
        diagnostic_code: None,
        reason: None,
        safe_state_directive: None,
    }
}
