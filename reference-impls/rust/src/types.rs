use serde::{Deserialize, Serialize};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum FayingGrade {
    G0,
    G1,
    G2,
    G3,
    G4,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GrantMinGrade {
    G1,
    G2,
    G3,
    G4,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AccessMode {
    Read,
    Write,
    Execute,
    Configure,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Criticality {
    Routine = 0,
    Sensitive = 1,
    High = 2,
    Critical = 3,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ConsequenceIrreversibility {
    Reversible,
    BoundedCompensation,
    IrreversibleConsequence,
    IrreversibleDataOrHardware,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum DomainCategory {
    DeviceControl,
    OsResource,
    Communication,
    Storage,
    Firmware,
    FundTransfer,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum MandateBindingModel {
    #[serde(rename = "model_a_plus_b")]
    ModelAPlusB,
    #[serde(rename = "model_b_online_ref")]
    ModelBOnlineRef,
    #[serde(rename = "model_c_offline_cache")]
    ModelCOfflineCache,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum CapErrorCode {
    #[serde(rename = "E_WEAK_MANDATE_BINDING")]
    EWeakMandateBinding,
    #[serde(rename = "E_GRADE_INSUFFICIENT")]
    EGradeInsufficient,
    #[serde(rename = "E_G0_EMERGENCY_OVERRIDE")]
    EG0EmergencyOverride,
    #[serde(rename = "E_UNKNOWN_OPERATION")]
    EUnknownOperation,
    #[serde(rename = "E_UNTRUSTED_MANIFEST")]
    EUntrustedManifest,
    #[serde(rename = "E_CONFIRMATION_REQUIRED")]
    EConfirmationRequired,
    #[serde(rename = "E_OUT_OF_SCOPE_FUND_TRANSFER")]
    EOutOfScopeFundTransfer,
    #[serde(rename = "E_MANDATE_INVALID")]
    EMandateInvalid,
    #[serde(rename = "E_PROTOCOL_VERSION_UNSUPPORTED")]
    EProtocolVersionUnsupported,
    #[serde(rename = "E_PROTOCOL")]
    EProtocol,
}

impl CapErrorCode {
    pub fn diagnostic_code(self) -> u16 {
        match self {
            CapErrorCode::EWeakMandateBinding => 2001,
            CapErrorCode::EGradeInsufficient => 2002,
            CapErrorCode::EG0EmergencyOverride => 2003,
            CapErrorCode::EUnknownOperation => 2004,
            CapErrorCode::EUntrustedManifest => 2005,
            CapErrorCode::EConfirmationRequired => 2006,
            CapErrorCode::EOutOfScopeFundTransfer => 2007,
            CapErrorCode::EMandateInvalid => 2008,
            CapErrorCode::EProtocolVersionUnsupported => 2098,
            CapErrorCode::EProtocol => 2099,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct SafeStateDescriptor {
    pub safe_state_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct OperationDescriptor {
    pub operation_id: String,
    pub mode: AccessMode,
    pub criticality: Criticality,
    pub consequence_irreversibility: ConsequenceIrreversibility,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub domain_category: Option<DomainCategory>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct ResourceCapabilityDescriptor {
    pub resource_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safe_states: Option<Vec<SafeStateDescriptor>>,
    pub operations: Vec<OperationDescriptor>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct DriverCapabilityManifest {
    pub manifest_id: String,
    pub driver_id: String,
    pub version: String,
    pub issued_at: String,
    pub signer_key_id: String,
    pub resources: Vec<ResourceCapabilityDescriptor>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub signature_ed25519: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct MandateEvidence {
    pub mandate_id: String,
    pub fay_id: String,
    pub resource_id: String,
    pub allowed_modes: Vec<AccessMode>,
    pub session_grade: FayingGrade,
    pub binding_model: MandateBindingModel,
    pub online_fresh: bool,
    pub revoked: bool,
    pub expires_at_epoch_ms: u64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub model_a_derived_proof_valid: Option<bool>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CapGrant {
    pub grant_id: String,
    pub resource_id: String,
    pub allowed_modes: Vec<AccessMode>,
    pub min_grade: GrantMinGrade,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub criticality_override: Option<Criticality>,
    pub mandate_binding: MandateEvidence,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct HumanConfirmationProof {
    pub confirmation_id: String,
    pub human_prime_id: String,
    pub confirmed_params_sha256: String,
    pub terminal_attested_disclosure: bool,
    pub expires_at_epoch_ms: u64,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CapEvaluationRequest {
    pub protocol_version: String,
    pub request_id: String,
    pub fay_id: String,
    pub resource_id: String,
    pub operation_id: String,
    pub requested_mode: AccessMode,
    pub params: serde_json::Map<String, serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub domain_category: Option<DomainCategory>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub caller_criticality_override: Option<Criticality>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub g0_override: Option<bool>,
    pub now_epoch_ms: u64,
    pub manifest: DriverCapabilityManifest,
    pub grant: CapGrant,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub human_confirmation: Option<HumanConfirmationProof>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SafeStateAction {
    EnterSafeState,
    TerminateAndAlert,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct G0SafeStateDirective {
    pub action: SafeStateAction,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safe_state_id: Option<String>,
    pub blocks_human_takeover: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DecisionOutcome {
    #[serde(rename = "ALLOW")]
    Allow,
    #[serde(rename = "DENY")]
    Deny,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct CapDecision {
    pub decision: DecisionOutcome,
    pub effective_criticality: Criticality,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub effective_grade: Option<FayingGrade>,
    pub escalation_clamped: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error_code: Option<CapErrorCode>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub diagnostic_code: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub safe_state_directive: Option<G0SafeStateDirective>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TrustAnchorEntry {
    pub algorithm: String,
    pub public_key_raw_hex: String,
}

pub type TrustAnchorMap = BTreeMap<String, TrustAnchorEntry>;
