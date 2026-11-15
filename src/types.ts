export * from '../schema/2025-10-25/schema';

import type { CapErrorCode } from '../schema/2025-10-25/schema';

export interface TrustAnchorEntry {
  algorithm: 'Ed25519';
  public_key_raw_hex: string;
}

export type TrustAnchorMap = Record<string, TrustAnchorEntry>;

export const DIAGNOSTIC_CODES: Record<CapErrorCode, number> = {
  E_WEAK_MANDATE_BINDING: 2001,
  E_GRADE_INSUFFICIENT: 2002,
  E_G0_EMERGENCY_OVERRIDE: 2003,
  E_UNKNOWN_OPERATION: 2004,
  E_UNTRUSTED_MANIFEST: 2005,
  E_CONFIRMATION_REQUIRED: 2006,
  E_OUT_OF_SCOPE_FUND_TRANSFER: 2007,
  E_MANDATE_INVALID: 2008,
  E_PROTOCOL_VERSION_UNSUPPORTED: 2098,
  E_PROTOCOL: 2099,
};

/**
 * Normalizes legacy error aliases (`E_INVALID_MESSAGE`) to canonical `E_PROTOCOL`.
 */
export function normalizeProtocolErrorCode(code: string): CapErrorCode {
  if (code === 'E_INVALID_MESSAGE') {
    return 'E_PROTOCOL';
  }
  if (code in DIAGNOSTIC_CODES) {
    return code as CapErrorCode;
  }
  return 'E_PROTOCOL';
}
