---
title: "Capítulo 4: Confirmación de alto riesgo de Human Prime y estado seguro"
description: Compuerta de confirmación de Human Prime vinculada a parámetros en CAP 1.0, directivas de estado seguro ante toma G0, catálogo de códigos de error y criterios de conformidad
status: Final
date: 2025-10-25
version: "1.0"
edition: 2025-10-25
editors:
  - iFay Protocol Working Group
---

# Capítulo 4: Confirmación de alto riesgo de Human Prime y estado seguro

## 4.1 Compuerta de confirmación explícita de `Human Prime` vinculada a parámetros (`HumanConfirmationProof`)

En toda operación cuya `effective_criticality` sea **`high`** o **`critical`** (**incluidas aquellas ejecutadas dentro de una sesión de presencia en tiempo real `G1`**), el Evaluador CAP **DEBE** (**MUST**) validar `req.human_confirmation` (`HumanConfirmationProof`). Las implementaciones **NO DEBEN** (**SHALL NOT**) eximir la confirmación por operación en aras de la comodidad de automatización ni del historial previo del agente:

1. **Sintaxis canónica de identidad**: `human_confirmation.human_prime_id` **DEBE** (**MUST**) coincidir con el patrón canónico de identificador de **Human Prime** `^hid_[a-z2-7]{16,}$`.
2. **Vigencia temporal**: `human_confirmation.expires_at_epoch_ms` **DEBE** (**MUST**) ser estrictamente mayor que `req.now_epoch_ms`.
3. **Divulgación atestiguada por el Host**: `human_confirmation.terminal_attested_disclosure` **DEBE** (**MUST**) ser igual a `true`, acreditando que una interfaz confiable del Host —y no texto autodeclarado por el `Fay`— presentó al **Human Prime** el recurso objetivo, la operación y sus consecuencias irreversibles.
4. **Vinculación canónica SHA-256 de parámetros**: Se calcula el resumen SHA-256 en hexadecimal en minúsculas (64 caracteres) sobre la serialización JSON canónica en UTF-8 (véase §3.1) de `req.params`; `human_confirmation.confirmed_params_sha256` **DEBE** (**MUST**) coincidir carácter por carácter con dicho resumen.

Si `human_confirmation` está ausente o incumple cualquiera de las verificaciones anteriores (por ejemplo, ante una manipulación de parámetros posterior a la confirmación), el Evaluador **DEBE** (**MUST**) devolver de inmediato `decision = "DENY"`, `error_code = "E_CONFIRMATION_REQUIRED"` y `diagnostic_code = 2006`.

---

## 4.2 Toma de control de emergencia `G0` y directivas no bloqueantes de estado seguro

El **Human Prime** conserva prioridad incondicional para recuperar el control del Host en cualquier instante. Siempre que `req.g0_override == true` o `req.grant.mandate_binding.session_grade == "G0"`:

1. **Denegación preemptiva inmediata**: Antes de comprobar el vencimiento del mandato o la matriz de grados, el Evaluador CAP **DEBE** (**MUST**) denegar la solicitud del `Fay` con `decision = "DENY"`, `error_code = "E_G0_EMERGENCY_OVERRIDE"` y `diagnostic_code = 2003`.
2. **Directiva determinista de estado seguro (`G0SafeStateDirective`)**:
   - Si la lista `ResourceCapabilityDescriptor.safe_states` del recurso objetivo no está vacía, el Evaluador **DEBE** (**MUST**) seleccionar `safe_states[0].safe_state_id` y emitir:
     `{ "action": "enter_safe_state", "safe_state_id": "<safe_states[0].safe_state_id>", "blocks_human_takeover": false }`;
   - Si el recurso objetivo no declara `safe_states` (o declara una lista vacía), el Evaluador **DEBE** (**MUST**) emitir:
     `{ "action": "terminate_and_alert", "blocks_human_takeover": false }`, ordenando al Host abortar de inmediato las acciones en curso del agente y alertar al **Human Prime**.
3. **Invariante de cero bloqueo**: `safe_state_directive.blocks_human_takeover` **DEBE** (**MUST**) valer siempre `false`. Las transiciones a estado seguro o rutinas de limpieza del Host **NO DEBEN** (**SHALL NOT**) bloquear, excluir ni retrasar la toma de control física o interactiva directa por parte del **Human Prime**.

---

## 4.3 Códigos canónicos de error y códigos numéricos de diagnóstico

Las respuestas de cable de CAP 1.0 emplean códigos de error estables en mayúsculas con guiones bajos (`CapErrorCode`) emparejados biunívocamente con códigos numéricos de diagnóstico (`2001`–`2099`):

| Código canónico de error (`error_code`) | Código de diagnóstico (`diagnostic_code`) | Condición de disparo y semántica normativa |
|-----------------------------------------|-------------------------------------------|--------------------------------------------|
| `E_WEAK_MANDATE_BINDING` | `2001` | Solicitud `high`/`critical` sin `model_a_plus_b` (o sin prueba derivada válida / vigencia en línea), o solicitud `sensitive` con `model_c_offline_cache` |
| `E_GRADE_INSUFFICIENT` | `2002` | El grado de sesión es inferior a `grant.min_grade` o infringe la matriz `FayingGrade × AccessMode × Criticality` |
| `E_G0_EMERGENCY_OVERRIDE` | `2003` | Toma de control de emergencia `G0` del **Human Prime** activa; deniega el control del `Fay` y emite `safe_state_directive` no bloqueante |
| `E_UNKNOWN_OPERATION` | `2004` | `resource_id` u `operation_id` no está declarado en el `DriverCapabilityManifest` verificado |
| `E_UNTRUSTED_MANIFEST` | `2005` | `DriverCapabilityManifest` carece de firma válida, falta el ancla de confianza o falla la verificación Ed25519 |
| `E_CONFIRMATION_REQUIRED` | `2006` | Operación `high`/`critical` sin `HumanConfirmationProof` vigente, atestiguado por el Host y coincidente en SHA-256 de parámetros |
| `E_OUT_OF_SCOPE_FUND_TRANSFER` | `2007` | La solicitud o la operación del manifiesto declara `domain_category == "fund_transfer"`, fuera del alcance de CAP 1.0 |
| `E_MANDATE_INVALID` | `2008` | El mandato está revocado, vencido, carece de frescura en un modelo en línea o presenta discordancia de sujeto, recurso o modo |
| `E_PROTOCOL_VERSION_UNSUPPORTED` | `2098` | `protocol_version` no coincide con la versión admitida de dos segmentos `"1.0"` |
| `E_PROTOCOL` | `2099` | Sobre malformado o error general de protocolo; el alias heredado `E_INVALID_MESSAGE` **DEBE** (**MUST**) normalizarse a `E_PROTOCOL` en la entrada |

---

## 4.4 Criterios de conformidad de la implementación

Toda implementación que declare conformidad con **CAP 1.0 (edición `2025-10-25`)** **DEBE** (**MUST**) satisfacer íntegramente los siguientes requisitos verificables:

1. Implementar la tubería determinista *default-deny* de 8 pasos, el piso monótono de criticidad, la matriz tridimensional de grados, la compuerta de confirmación de **Human Prime** vinculada al SHA-256 de parámetros y la directiva `G0` de estado seguro sin bloqueo especificados en los Capítulos 0–4;
2. Ajustarse estrictamente a las definiciones de datos y transmisión de `schemas/cap-1.0.cddl` y `schemas/cap-1.0.json`;
3. Ejecutar los 14 vectores normativos de conformidad (`V01`–`V14`) de `vectors/semantic/d1-d7-conformance.json` con **100 % de paridad exacta** en `decision`, `effective_criticality`, `effective_grade`, `escalation_clamped`, `error_code`, `diagnostic_code` y `safe_state_directive`.
