import { createHash, createPublicKey, verify } from 'node:crypto';
import type { DriverCapabilityManifest, TrustAnchorMap } from './types';

// RFC 8410 Ed25519 SubjectPublicKeyInfo ASN.1 DER prefix for 32-byte raw public key
const ED25519_SPKI_PREFIX = Buffer.from('302a300506032b6570032100', 'hex');

/**
 * Deterministic RFC 8785-compatible canonical JSON serializer for CAP structures.
 */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return '[' + value.map((item) => canonicalJson(item)).join(',') + ']';
  }
  const record = value as Record<string, unknown>;
  const keys = Object.keys(record)
    .filter((k) => record[k] !== undefined)
    .sort();
  return (
    '{' +
    keys
      .map((k) => JSON.stringify(k) + ':' + canonicalJson(record[k]))
      .join(',') +
    '}'
  );
}

/**
 * Computes canonical lowercase SHA-256 hex digest of an operation `params` object (D-6).
 */
export function computeParamsSha256(params: Record<string, unknown>): string {
  return createHash('sha256')
    .update(canonicalJson(params), 'utf8')
    .digest('hex');
}

/**
 * Verifies the Ed25519 signature of a `DriverCapabilityManifest` against trusted anchors (D-5).
 */
export function verifyManifestSignature(
  manifest: DriverCapabilityManifest,
  trustAnchors: TrustAnchorMap,
): boolean {
  if (!manifest.signature_ed25519 || !/^[0-9a-f]{128}$/i.test(manifest.signature_ed25519)) {
    return false;
  }
  const anchor = trustAnchors[manifest.signer_key_id];
  if (!anchor || anchor.algorithm !== 'Ed25519') {
    return false;
  }
  if (!/^[0-9a-f]{64}$/i.test(anchor.public_key_raw_hex)) {
    return false;
  }

  try {
    const rawPub = Buffer.from(anchor.public_key_raw_hex, 'hex');
    const spkiDer = Buffer.concat([ED25519_SPKI_PREFIX, rawPub]);
    const pubKey = createPublicKey({ key: spkiDer, format: 'der', type: 'spki' });

    const { signature_ed25519: _sig, ...unsignedPayload } = manifest;
    const message = Buffer.from(canonicalJson(unsignedPayload), 'utf8');
    const signature = Buffer.from(manifest.signature_ed25519, 'hex');
    return verify(null, message, pubKey, signature);
  } catch {
    return false;
  }
}
