/**
 * Control Authority Protocol (CAP) 1.0 Draft TypeScript Schema Definitions
 * Isomorphic with `schemas/cap-1.0.cddl` and `schema/draft/schema.json`.
 */

export type FayingGrade = 'G0' | 'G1' | 'G2' | 'G3' | 'G4';
export type GrantMinGrade = 'G1' | 'G2' | 'G3' | 'G4';
export type AccessMode = 'read' | 'write' | 'execute' | 'configure';
export type Criticality = 'routine' | 'sensitive' | 'high' | 'critical';

export type ConsequenceIrreversibility =
  | 'reversible'
  | 'bounded_compensation'
  | 'irreversible_consequence'
  | 'irreversible_data_or_hardware';

export type DomainCategory =
  | 'device_control'
  | 'os_resource'
  | 'communication'
  | 'storage'
  | 'firmware'
  | 'fund_transfer';

export type MandateBindingModel =
  | 'model_a_plus_b'
  | 'model_b_online_ref'
  | 'model_c_offline_cache';

export type CapErrorCode =
  | 'E_WEAK_MANDATE_BINDING'
  | 'E_GRADE_INSUFFICIENT'
  | 'E_G0_EMERGENCY_OVERRIDE'
  | 'E_UNKNOWN_OPERATION'
  | 'E_UNTRUSTED_MANIFEST'
  | 'E_CONFIRMATION_REQUIRED'
  | 'E_OUT_OF_SCOPE_FUND_TRANSFER'
  | 'E_MANDATE_INVALID'
  | 'E_PROTOCOL_VERSION_UNSUPPORTED'
  | 'E_PROTOCOL';

export interface SafeStateDescriptor {
  safe_state_id: string;
  description?: string;
}

export interface OperationDescriptor {
  operation_id: string;
  mode: AccessMode;
  criticality: Criticality;
  consequence_irreversibility: ConsequenceIrreversibility;
  domain_category?: DomainCategory;
  description?: string;
}

export interface ResourceCapabilityDescriptor {
  resource_id: string;
  safe_states?: SafeStateDescriptor[];
  operations: OperationDescriptor[];
}

export interface DriverCapabilityManifest {
  manifest_id: string;
  driver_id: string;
  version: string;
  issued_at: string;
  signer_key_id: string;
  resources: ResourceCapabilityDescriptor[];
  signature_ed25519?: string;
}

export interface MandateEvidence {
  mandate_id: string;
  fay_id: string;
  resource_id: string;
  allowed_modes: AccessMode[];
  session_grade: FayingGrade;
  binding_model: MandateBindingModel;
  online_fresh: boolean;
  revoked: boolean;
  expires_at_epoch_ms: number;
  model_a_derived_proof_valid?: boolean;
}

export interface CapGrant {
  grant_id: string;
  resource_id: string;
  allowed_modes: AccessMode[];
  min_grade: GrantMinGrade;
  criticality_override?: Criticality;
  mandate_binding: MandateEvidence;
}

export interface HumanConfirmationProof {
  confirmation_id: string;
  human_prime_id: string;
  confirmed_params_sha256: string;
  terminal_attested_disclosure: boolean;
  expires_at_epoch_ms: number;
}

export interface CapEvaluationRequest {
  protocol_version: string;
  request_id: string;
  fay_id: string;
  resource_id: string;
  operation_id: string;
  requested_mode: AccessMode;
  params: Record<string, unknown>;
  domain_category?: DomainCategory;
  caller_criticality_override?: Criticality;
  g0_override?: boolean;
  now_epoch_ms: number;
  manifest: DriverCapabilityManifest;
  grant: CapGrant;
  human_confirmation?: HumanConfirmationProof;
}

export interface G0SafeStateDirective {
  action: 'enter_safe_state' | 'terminate_and_alert';
  safe_state_id?: string;
  blocks_human_takeover: false;
}

export interface CapDecision {
  decision: 'ALLOW' | 'DENY';
  effective_criticality: Criticality;
  effective_grade?: FayingGrade;
  escalation_clamped: boolean;
  error_code?: CapErrorCode;
  diagnostic_code?: number;
  reason?: string;
  safe_state_directive?: G0SafeStateDirective;
}
