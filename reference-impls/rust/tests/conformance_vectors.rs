use cap_reference_rust::types::{
    AccessMode, CapErrorCode, CapEvaluationRequest, CapGrant, Criticality, DecisionOutcome,
    DomainCategory, DriverCapabilityManifest, FayingGrade, G0SafeStateDirective,
    HumanConfirmationProof, TrustAnchorMap,
};
use cap_reference_rust::{
    canonical_json, compute_params_sha256, evaluate_cap_request, normalize_protocol_error_code,
};
use serde::Deserialize;
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Deserialize)]
struct RequestOverrides {
    request_id: String,
    resource_id: String,
    operation_id: String,
    requested_mode: AccessMode,
    params: serde_json::Map<String, serde_json::Value>,
    domain_category: Option<DomainCategory>,
    caller_criticality_override: Option<Criticality>,
    g0_override: Option<bool>,
    grant: CapGrant,
    human_confirmation: Option<HumanConfirmationProof>,
}

#[derive(Debug, Deserialize)]
struct ExpectedOutcome {
    decision: DecisionOutcome,
    effective_criticality: Criticality,
    effective_grade: Option<FayingGrade>,
    escalation_clamped: bool,
    error_code: Option<CapErrorCode>,
    diagnostic_code: Option<u16>,
    safe_state_directive: Option<G0SafeStateDirective>,
}

#[derive(Debug, Deserialize)]
struct VectorCase {
    id: String,
    rule_refs: Vec<String>,
    use_reference_manifest: bool,
    manifest_tamper_signature: Option<String>,
    request_overrides: RequestOverrides,
    expected: ExpectedOutcome,
}

#[derive(Debug, Deserialize)]
struct SemanticVectorSuite {
    suite: String,
    normative: bool,
    trust_anchors: TrustAnchorMap,
    reference_manifest: DriverCapabilityManifest,
    vectors: Vec<VectorCase>,
}

fn load_suite() -> SemanticVectorSuite {
    let mut path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    path.push("../../vectors/semantic/d1-d7-conformance.json");
    let raw = fs::read_to_string(&path)
        .unwrap_or_else(|e| panic!("failed to read {}: {}", path.display(), e));
    serde_json::from_str(&raw)
        .unwrap_or_else(|e| panic!("failed to parse {}: {}", path.display(), e))
}

#[test]
fn verifies_all_14_d1_to_d7_conformance_vectors() {
    let suite = load_suite();
    assert_eq!(suite.suite, "cap-1.0-semantic-d1-d7");
    assert!(suite.normative);
    assert_eq!(suite.vectors.len(), 14);

    for vec_case in &suite.vectors {
        let mut manifest = suite.reference_manifest.clone();
        if !vec_case.use_reference_manifest {
            manifest.signature_ed25519 = vec_case.manifest_tamper_signature.clone();
        }

        let ov = &vec_case.request_overrides;
        let req = CapEvaluationRequest {
            protocol_version: "1.0".to_string(),
            request_id: ov.request_id.clone(),
            fay_id: "ifay_aaaaaaaabbbbbbbbccccccccdddddddd".to_string(),
            resource_id: ov.resource_id.clone(),
            operation_id: ov.operation_id.clone(),
            requested_mode: ov.requested_mode,
            params: ov.params.clone(),
            domain_category: ov.domain_category,
            caller_criticality_override: ov.caller_criticality_override,
            g0_override: ov.g0_override,
            now_epoch_ms: 1_800_000_000_000,
            manifest,
            grant: ov.grant.clone(),
            human_confirmation: ov.human_confirmation.clone(),
        };

        let actual = evaluate_cap_request(&req, &suite.trust_anchors);
        assert_eq!(
            actual.decision, vec_case.expected.decision,
            "vector {} ({:?}) decision mismatch: {:?}",
            vec_case.id, vec_case.rule_refs, actual
        );
        assert_eq!(
            actual.effective_criticality, vec_case.expected.effective_criticality,
            "vector {} effective_criticality mismatch",
            vec_case.id
        );
        assert_eq!(
            actual.escalation_clamped, vec_case.expected.escalation_clamped,
            "vector {} escalation_clamped mismatch",
            vec_case.id
        );
        if let Some(expected_grade) = vec_case.expected.effective_grade {
            assert_eq!(
                actual.effective_grade,
                Some(expected_grade),
                "vector {} effective_grade mismatch",
                vec_case.id
            );
        }
        if let Some(expected_err) = vec_case.expected.error_code {
            assert_eq!(
                actual.error_code,
                Some(expected_err),
                "vector {} error_code mismatch",
                vec_case.id
            );
        }
        if let Some(expected_diag) = vec_case.expected.diagnostic_code {
            assert_eq!(
                actual.diagnostic_code,
                Some(expected_diag),
                "vector {} diagnostic_code mismatch",
                vec_case.id
            );
        }
        if let Some(ref expected_ssd) = vec_case.expected.safe_state_directive {
            assert_eq!(
                actual.safe_state_directive.as_ref(),
                Some(expected_ssd),
                "vector {} safe_state_directive mismatch",
                vec_case.id
            );
            assert!(
                !actual
                    .safe_state_directive
                    .as_ref()
                    .unwrap()
                    .blocks_human_takeover,
                "vector {} safe_state_directive must never block Human Prime takeover",
                vec_case.id
            );
        }
    }
}

#[test]
fn rejects_unsupported_protocol_version_and_normalizes_error_aliases() {
    let suite = load_suite();
    let ov = &suite.vectors[0].request_overrides;
    let req = CapEvaluationRequest {
        protocol_version: "2.0".to_string(),
        request_id: ov.request_id.clone(),
        fay_id: "ifay_aaaaaaaabbbbbbbbccccccccdddddddd".to_string(),
        resource_id: ov.resource_id.clone(),
        operation_id: ov.operation_id.clone(),
        requested_mode: ov.requested_mode,
        params: ov.params.clone(),
        domain_category: None,
        caller_criticality_override: None,
        g0_override: None,
        now_epoch_ms: 1_800_000_000_000,
        manifest: suite.reference_manifest.clone(),
        grant: ov.grant.clone(),
        human_confirmation: None,
    };

    let res = evaluate_cap_request(&req, &suite.trust_anchors);
    assert_eq!(res.decision, DecisionOutcome::Deny);
    assert_eq!(
        res.error_code,
        Some(CapErrorCode::EProtocolVersionUnsupported)
    );
    assert_eq!(res.diagnostic_code, Some(2098));

    assert_eq!(
        normalize_protocol_error_code("E_INVALID_MESSAGE"),
        CapErrorCode::EProtocol
    );
    assert_eq!(
        normalize_protocol_error_code("E_PROTOCOL_VERSION_UNSUPPORTED"),
        CapErrorCode::EProtocolVersionUnsupported
    );

    let sample = serde_json::json!({ "b": 1, "a": 2 });
    assert_eq!(canonical_json(&sample), "{\"a\":2,\"b\":1}");

    let latch_params = serde_json::json!({ "latch_id": "bay_alpha" });
    assert_eq!(
        compute_params_sha256(latch_params.as_object().unwrap()),
        "0beb72d16aa5320effde0346e45543a268f24473f72140a4374ddfd8e6e8fb8e"
    );
}

#[test]
fn detects_manifest_payload_tampering_under_ed25519_verification() {
    let suite = load_suite();
    let mut tampered_manifest = suite.reference_manifest.clone();
    // Attempt to downgrade flash_esc_firmware criticality in manifest without re-signing
    tampered_manifest.resources[0].operations[3].criticality = Criticality::Routine;

    let ov = &suite.vectors[0].request_overrides;
    let req = CapEvaluationRequest {
        protocol_version: "1.0".to_string(),
        request_id: "req_tamper_manifest".to_string(),
        fay_id: "ifay_aaaaaaaabbbbbbbbccccccccdddddddd".to_string(),
        resource_id: ov.resource_id.clone(),
        operation_id: ov.operation_id.clone(),
        requested_mode: ov.requested_mode,
        params: ov.params.clone(),
        domain_category: None,
        caller_criticality_override: None,
        g0_override: None,
        now_epoch_ms: 1_800_000_000_000,
        manifest: tampered_manifest,
        grant: ov.grant.clone(),
        human_confirmation: None,
    };

    let res = evaluate_cap_request(&req, &suite.trust_anchors);
    assert_eq!(res.decision, DecisionOutcome::Deny);
    assert_eq!(res.error_code, Some(CapErrorCode::EUntrustedManifest));
    assert_eq!(res.diagnostic_code, Some(2005));
}

#[test]
fn enforces_monotonic_escalation_and_g4_mode_restrictions() {
    let suite = load_suite();
    let mut grant = suite.vectors[0].request_overrides.grant.clone();
    // Escalate routine read_telemetry to sensitive via caller override; G4 must deny sensitive
    grant.min_grade = cap_reference_rust::types::GrantMinGrade::G4;
    grant.mandate_binding.session_grade = FayingGrade::G4;

    let req = CapEvaluationRequest {
        protocol_version: "1.0".to_string(),
        request_id: "req_g4_escalated".to_string(),
        fay_id: "ifay_aaaaaaaabbbbbbbbccccccccdddddddd".to_string(),
        resource_id: "res_drone_fc".to_string(),
        operation_id: "read_telemetry".to_string(),
        requested_mode: AccessMode::Read,
        params: serde_json::Map::new(),
        domain_category: None,
        caller_criticality_override: Some(Criticality::Sensitive),
        g0_override: None,
        now_epoch_ms: 1_800_000_000_000,
        manifest: suite.reference_manifest.clone(),
        grant,
        human_confirmation: None,
    };

    let res = evaluate_cap_request(&req, &suite.trust_anchors);
    assert_eq!(res.decision, DecisionOutcome::Deny);
    assert_eq!(res.effective_criticality, Criticality::Sensitive);
    assert!(!res.escalation_clamped);
    assert_eq!(res.error_code, Some(CapErrorCode::EGradeInsufficient));
    assert_eq!(res.diagnostic_code, Some(2002));
}

