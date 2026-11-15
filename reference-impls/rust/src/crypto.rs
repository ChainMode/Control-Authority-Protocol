use crate::types::{DriverCapabilityManifest, TrustAnchorMap};
use sha2::{Digest, Sha256, Sha512};

/// Deterministic RFC 8785-compatible canonical JSON serializer for CAP structures.
pub fn canonical_json(value: &serde_json::Value) -> String {
    match value {
        serde_json::Value::Null => "null".to_string(),
        serde_json::Value::Bool(b) => {
            if *b {
                "true".to_string()
            } else {
                "false".to_string()
            }
        }
        serde_json::Value::Number(n) => n.to_string(),
        serde_json::Value::String(s) => {
            serde_json::to_string(s).expect("JSON string serialization cannot fail")
        }
        serde_json::Value::Array(items) => {
            let parts: Vec<String> = items.iter().map(canonical_json).collect();
            format!("[{}]", parts.join(","))
        }
        serde_json::Value::Object(map) => {
            let mut entries: Vec<(&String, &serde_json::Value)> = map.iter().collect();
            entries.sort_by(|(ka, _), (kb, _)| ka.encode_utf16().cmp(kb.encode_utf16()));
            let parts: Vec<String> = entries
                .into_iter()
                .map(|(k, v)| {
                    let key_json =
                        serde_json::to_string(k).expect("JSON key serialization cannot fail");
                    format!("{}:{}", key_json, canonical_json(v))
                })
                .collect();
            format!("{{{}}}", parts.join(","))
        }
    }
}

/// Computes canonical lowercase SHA-256 hex digest of an operation `params` object (D-6).
pub fn compute_params_sha256(params: &serde_json::Map<String, serde_json::Value>) -> String {
    let serialized = canonical_json(&serde_json::Value::Object(params.clone()));
    let digest = Sha256::digest(serialized.as_bytes());
    hex::encode(digest)
}

/// Verifies the RFC 8032 Ed25519 signature of a `DriverCapabilityManifest` against trusted anchors (D-5).
pub fn verify_manifest_signature(
    manifest: &DriverCapabilityManifest,
    trust_anchors: &TrustAnchorMap,
) -> bool {
    let sig_hex = match &manifest.signature_ed25519 {
        Some(s) if s.len() == 128 => s,
        _ => return false,
    };
    let anchor = match trust_anchors.get(&manifest.signer_key_id) {
        Some(a) if a.algorithm == "Ed25519" && a.public_key_raw_hex.len() == 64 => a,
        _ => return false,
    };

    let sig_vec = match hex::decode(sig_hex) {
        Ok(b) if b.len() == 64 => b,
        _ => return false,
    };
    let pk_vec = match hex::decode(&anchor.public_key_raw_hex) {
        Ok(b) if b.len() == 32 => b,
        _ => return false,
    };

    let mut sig_bytes = [0u8; 64];
    sig_bytes.copy_from_slice(&sig_vec);
    let mut pk_bytes = [0u8; 32];
    pk_bytes.copy_from_slice(&pk_vec);

    let mut value = match serde_json::to_value(manifest) {
        Ok(v) => v,
        Err(_) => return false,
    };
    if let serde_json::Value::Object(ref mut obj) = value {
        obj.remove("signature_ed25519");
    } else {
        return false;
    }
    let message = canonical_json(&value);
    ed25519_verify(&pk_bytes, message.as_bytes(), &sig_bytes)
}

// ============================================================================
// Pure-Rust RFC 8032 Ed25519 Verifier over GF(2^255 - 19)
// ============================================================================

type Fe = [i64; 16];

#[derive(Clone, Copy)]
struct ExtPoint {
    x: Fe,
    y: Fe,
    z: Fe,
    t: Fe,
}

const P_BYTES_LE: [u8; 32] = [
    0xed, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff,
    0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x7f,
];

fn fe_zero() -> Fe {
    [0i64; 16]
}

fn fe_from_u16(v: u16) -> Fe {
    let mut out = [0i64; 16];
    out[0] = v as i64;
    out
}

fn fe_add(a: &Fe, b: &Fe) -> Fe {
    let mut o = [0i64; 16];
    for i in 0..16 {
        o[i] = a[i] + b[i];
    }
    o
}

fn fe_sub(a: &Fe, b: &Fe) -> Fe {
    let mut o = [0i64; 16];
    for i in 0..16 {
        o[i] = a[i] - b[i];
    }
    o
}

fn fe_carry(o: &mut Fe) {
    for i in 0..16 {
        o[i] += 1 << 16;
        let c = o[i] >> 16;
        if i < 15 {
            o[i + 1] += c - 1;
        } else {
            o[0] += 38 * (c - 1);
        }
        o[i] -= c << 16;
    }
}

fn fe_mul(a: &Fe, b: &Fe) -> Fe {
    let mut t = [0i64; 31];
    for i in 0..16 {
        for j in 0..16 {
            t[i + j] += a[i] * b[j];
        }
    }
    for i in 0..15 {
        t[i] += 38 * t[i + 16];
    }
    let mut o = [0i64; 16];
    o.copy_from_slice(&t[0..16]);
    fe_carry(&mut o);
    fe_carry(&mut o);
    o
}

fn fe_sq(a: &Fe) -> Fe {
    fe_mul(a, a)
}

fn fe_inv(a: &Fe) -> Fe {
    // a^(p - 2) where p - 2 = 2^255 - 21: all bits 254..=0 are 1 except bits 2 and 4
    let mut acc = fe_from_u16(1);
    for i in (0..=254).rev() {
        acc = fe_sq(&acc);
        if i != 2 && i != 4 {
            acc = fe_mul(&acc, a);
        }
    }
    acc
}

fn fe_pow_p3_8(a: &Fe) -> Fe {
    // a^((p + 3) / 8) where (p + 3) / 8 = 2^252 - 2: bits 251..=1 are 1, bit 0 is 0
    let mut acc = fe_from_u16(1);
    for i in (0..=251).rev() {
        acc = fe_sq(&acc);
        if i >= 1 {
            acc = fe_mul(&acc, a);
        }
    }
    acc
}

fn fe_sqrt_m1() -> Fe {
    // 2^((p - 1) / 4) where (p - 1) / 4 = 2^253 - 5: all bits 252..=0 are 1 except bit 2
    let two = fe_from_u16(2);
    let mut acc = fe_from_u16(1);
    for i in (0..=252).rev() {
        acc = fe_sq(&acc);
        if i != 2 {
            acc = fe_mul(&acc, &two);
        }
    }
    acc
}

fn fe_pack(n: &Fe) -> [u8; 32] {
    let mut t = *n;
    fe_carry(&mut t);
    fe_carry(&mut t);
    fe_carry(&mut t);

    let mut m = [0i64; 16];
    for _ in 0..2 {
        m[0] = t[0] - 0xffed;
        for i in 1..15 {
            m[i] = t[i] - 0xffff - ((m[i - 1] >> 16) & 1);
            m[i - 1] &= 0xffff;
        }
        m[15] = t[15] - 0x7fff - ((m[14] >> 16) & 1);
        let b = (m[15] >> 16) & 1;
        m[14] &= 0xffff;
        m[15] &= 0x7fff;
        for i in 0..16 {
            t[i] = if b == 0 { m[i] } else { t[i] };
        }
    }

    let mut out = [0u8; 32];
    for i in 0..16 {
        out[2 * i] = (t[i] & 0xff) as u8;
        out[2 * i + 1] = ((t[i] >> 8) & 0xff) as u8;
    }
    out
}

fn fe_unpack_canonical(bytes: &[u8; 32]) -> Option<Fe> {
    let mut y_bytes = *bytes;
    y_bytes[31] &= 0x7f;

    // Strict check: y < p (compare from most significant byte down to 0)
    let mut less = false;
    for i in (0..32).rev() {
        if y_bytes[i] < P_BYTES_LE[i] {
            less = true;
            break;
        }
        if y_bytes[i] > P_BYTES_LE[i] {
            return None;
        }
    }
    if !less {
        return None;
    }

    let mut o = [0i64; 16];
    for i in 0..16 {
        o[i] = (y_bytes[2 * i] as i64) | ((y_bytes[2 * i + 1] as i64) << 8);
    }
    Some(o)
}

fn curve_d() -> Fe {
    // d = -121665 / 121666 mod p (121665 = 0x1db41, 121666 = 0x1db42)
    let mut num = fe_zero();
    num[0] = 0xdb41;
    num[1] = 0x0001;
    let neg_num = fe_sub(&fe_zero(), &num);

    let mut den = fe_zero();
    den[0] = 0xdb42;
    den[1] = 0x0001;
    fe_mul(&neg_num, &fe_inv(&den))
}

fn recover_point(bytes: &[u8; 32]) -> Option<ExtPoint> {
    let y = fe_unpack_canonical(bytes)?;
    let x_sign = (bytes[31] >> 7) & 1;

    let one = fe_from_u16(1);
    let zero = fe_zero();
    let d = curve_d();

    let y2 = fe_sq(&y);
    let u = fe_sub(&y2, &one);
    let v = fe_add(&fe_mul(&d, &y2), &one);

    let w = fe_mul(&u, &fe_inv(&v));
    let mut x = fe_pow_p3_8(&w);

    let vx2 = fe_mul(&v, &fe_sq(&x));
    let u_packed = fe_pack(&u);
    let neg_u_packed = fe_pack(&fe_sub(&zero, &u));
    let vx2_packed = fe_pack(&vx2);

    if vx2_packed != u_packed {
        if vx2_packed == neg_u_packed {
            x = fe_mul(&x, &fe_sqrt_m1());
        } else {
            return None;
        }
    }

    let x_packed = fe_pack(&x);
    if x_packed == [0u8; 32] && x_sign == 1 {
        return None;
    }
    if (x_packed[0] & 1) != x_sign {
        x = fe_sub(&zero, &x);
    }

    Some(ExtPoint {
        x,
        y,
        z: one,
        t: fe_mul(&x, &y),
    })
}

fn point_neutral() -> ExtPoint {
    ExtPoint {
        x: fe_zero(),
        y: fe_from_u16(1),
        z: fe_from_u16(1),
        t: fe_zero(),
    }
}

fn base_point() -> ExtPoint {
    // B_y = 4 / 5 mod p, B_x positive (even)
    let by = fe_mul(&fe_from_u16(4), &fe_inv(&fe_from_u16(5)));
    let by_bytes = fe_pack(&by);
    recover_point(&by_bytes).expect("Ed25519 base point is on curve")
}

fn point_add(p: &ExtPoint, q: &ExtPoint, d2: &Fe) -> ExtPoint {
    // RFC 8032 Section 5.1.4 complete extended twisted Edwards addition
    let a = fe_mul(&fe_sub(&p.y, &p.x), &fe_sub(&q.y, &q.x));
    let b = fe_mul(&fe_add(&p.y, &p.x), &fe_add(&q.y, &q.x));
    let c = fe_mul(&fe_mul(&p.t, d2), &q.t);
    let d_val = fe_mul(&fe_add(&p.z, &p.z), &q.z);
    let e = fe_sub(&b, &a);
    let f = fe_sub(&d_val, &c);
    let g = fe_add(&d_val, &c);
    let h = fe_add(&b, &a);
    ExtPoint {
        x: fe_mul(&e, &f),
        y: fe_mul(&g, &h),
        t: fe_mul(&e, &h),
        z: fe_mul(&f, &g),
    }
}

fn scalar_mul_le(point: &ExtPoint, scalar_le: &[u8], d2: &Fe) -> ExtPoint {
    let mut acc = point_neutral();
    let mut cur = *point;
    for &byte in scalar_le {
        for bit in 0..8 {
            if ((byte >> bit) & 1) == 1 {
                acc = point_add(&acc, &cur, d2);
            }
            cur = point_add(&cur, &cur, d2);
        }
    }
    acc
}

fn mul8(point: &ExtPoint, d2: &Fe) -> ExtPoint {
    let p2 = point_add(point, point, d2);
    let p4 = point_add(&p2, &p2, d2);
    point_add(&p4, &p4, d2)
}

fn point_eq(p: &ExtPoint, q: &ExtPoint) -> bool {
    let xz_left = fe_pack(&fe_mul(&p.x, &q.z));
    let xz_right = fe_pack(&fe_mul(&q.x, &p.z));
    let yz_left = fe_pack(&fe_mul(&p.y, &q.z));
    let yz_right = fe_pack(&fe_mul(&q.y, &p.z));
    xz_left == xz_right && yz_left == yz_right
}

fn scalar_is_canonical(s: &[u8; 32]) -> bool {
    // L = 2^252 + 27742317777372353535851937790883648493
    const L_LO: u128 = 27_742_317_777_372_353_535_851_937_790_883_648_493_u128;
    const L_HI: u128 = 1u128 << 124;

    let mut lo = [0u8; 16];
    let mut hi = [0u8; 16];
    lo.copy_from_slice(&s[0..16]);
    hi.copy_from_slice(&s[16..32]);
    let s_lo = u128::from_le_bytes(lo);
    let s_hi = u128::from_le_bytes(hi);
    (s_hi, s_lo) < (L_HI, L_LO)
}

fn ed25519_verify(public_key: &[u8; 32], message: &[u8], signature: &[u8; 64]) -> bool {
    let mut r_bytes = [0u8; 32];
    let mut s_bytes = [0u8; 32];
    r_bytes.copy_from_slice(&signature[0..32]);
    s_bytes.copy_from_slice(&signature[32..64]);

    if !scalar_is_canonical(&s_bytes) {
        return false;
    }

    let a_point = match recover_point(public_key) {
        Some(p) => p,
        None => return false,
    };
    let r_point = match recover_point(&r_bytes) {
        Some(p) => p,
        None => return false,
    };

    let mut hasher = Sha512::new();
    hasher.update(r_bytes);
    hasher.update(public_key);
    hasher.update(message);
    let k_digest = hasher.finalize();

    let d = curve_d();
    let d2 = fe_add(&d, &d);

    let sb = scalar_mul_le(&base_point(), &s_bytes, &d2);
    let lhs = mul8(&sb, &d2);

    // Since mul8(&a_point) has prime order dividing L, [k]([8]A) == [k mod L]([8]A).
    let a8 = mul8(&a_point, &d2);
    let ka8 = scalar_mul_le(&a8, &k_digest, &d2);
    let r8 = mul8(&r_point, &d2);
    let rhs = point_add(&r8, &ka8, &d2);

    point_eq(&lhs, &rhs)
}
